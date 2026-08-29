from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query, UploadFile, File, Header, Response, Request
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import db, client
import auth
from auth import get_current_user, require_roles
from constants import (SUBJECTS, LEVELS, SERVICE_TYPES, REGIONS, LANGUAGES,
                       CONTRACT_TYPES, DIPLOMAS, REGION_COORDS, region_latlng)
from seed_data import seed_demo_data
from storage import put_object, get_object, init_storage, APP_NAME, MIME_TYPES
import jwt as _jwt
from auth import _secret, JWT_ALGORITHM

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="ASKOOL API")
api = APIRouter(prefix="/api")

now_iso = lambda: datetime.now(timezone.utc).isoformat()
new_id = lambda p: f"{p}_{uuid.uuid4().hex[:16]}"

import math


def haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def is_online(last_seen: Optional[str]) -> bool:
    if not last_seen:
        return False
    try:
        dt = datetime.fromisoformat(last_seen)
        return (datetime.now(timezone.utc) - dt).total_seconds() < 120
    except Exception:
        return False


# ================= helpers =================
async def notify(user_id: str, ntype: str, title: str, body: str, link: str = ""):
    await db.notifications.insert_one({
        "notification_id": new_id("notif"), "user_id": user_id, "type": ntype,
        "title": title, "body": body, "link": link, "read": False, "created_at": now_iso(),
    })


async def notify_zone_alerts(edu: dict):
    if edu.get("lat") is None or edu.get("lng") is None:
        return
    alerts = await db.zone_alerts.find({"active": True}, {"_id": 0}).to_list(500)
    for a in alerts:
        if a["user_id"] == edu["user_id"]:
            continue
        if edu["user_id"] in a.get("notified", []):
            continue
        if a.get("subject") and a["subject"] not in edu.get("subjects", []):
            continue
        if a.get("level") and a["level"] not in edu.get("levels", []):
            continue
        dist = haversine_km(a["lat"], a["lng"], edu["lat"], edu["lng"])
        if dist > a.get("radius_km", 15):
            continue
        await notify(a["user_id"], "zone_alert", "Nouvel éducateur dans votre zone",
                     f"{edu.get('name')} ({edu.get('profession', 'Éducateur')}) correspond à votre alerte, à {round(dist, 1)} km.",
                     "/educateurs")
        await db.zone_alerts.update_one({"alert_id": a["alert_id"]}, {"$addToSet": {"notified": edu["user_id"]}})


async def educator_public(user_id: str) -> Optional[dict]:
    prof = await db.educator_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not prof:
        return None
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if u:
        prof["name"] = u.get("name")
        prof["avatar_url"] = prof.get("photo") or u.get("avatar_url")
        prof["is_premium"] = u.get("is_premium", False)
    return prof


# ================= meta =================
@api.get("/")
async def root():
    return {"message": "ASKOOL API", "status": "ok"}


@api.get("/meta")
async def meta():
    return {"subjects": SUBJECTS, "levels": LEVELS, "service_types": SERVICE_TYPES,
            "regions": REGIONS, "languages": LANGUAGES, "contract_types": CONTRACT_TYPES,
            "diplomas": DIPLOMAS}


# ================= educators =================
@api.get("/educators")
async def list_educators(
    subject: Optional[str] = None, level: Optional[str] = None,
    service_type: Optional[str] = None, region: Optional[str] = None,
    min_experience: Optional[int] = None, diploma: Optional[str] = None,
    max_rate: Optional[int] = None, min_rating: Optional[float] = None,
    verified_only: bool = False, q: Optional[str] = None,
    near_lat: Optional[float] = None, near_lng: Optional[float] = None, radius_km: Optional[float] = None,
    sort: str = "relevance", page: int = 1, page_size: int = 12,
):
    query: dict = {"active": True}
    if subject:
        query["subjects"] = subject
    if level:
        query["levels"] = level
    if service_type:
        query["services"] = service_type
    if region:
        query["region"] = region
    if diploma:
        query["diplomas.title"] = diploma
    if min_experience is not None:
        query["experience_years"] = {"$gte": min_experience}
    if max_rate is not None:
        query["hourly_rate"] = {"$lte": max_rate}
    if min_rating is not None:
        query["rating"] = {"$gte": min_rating}
    if verified_only:
        query["is_verified"] = True
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}},
                        {"profession": {"$regex": q, "$options": "i"}},
                        {"bio": {"$regex": q, "$options": "i"}}]

    sort_map = {
        "price": [("hourly_rate", 1)], "price_desc": [("hourly_rate", -1)],
        "experience": [("experience_years", -1)], "rating": [("rating", -1)],
        "availability": [("available_now", -1)],
        "relevance": [("is_premium", -1), ("rating", -1), ("reviews_count", -1)],
    }
    sort_spec = sort_map.get(sort, sort_map["relevance"])
    if near_lat is not None and near_lng is not None and radius_km:
        all_docs = await db.educator_profiles.find(query, {"_id": 0}).sort(sort_spec).to_list(500)
        near = []
        for d in all_docs:
            if d.get("lat") is None or d.get("lng") is None:
                continue
            dist = haversine_km(near_lat, near_lng, d["lat"], d["lng"])
            if dist <= radius_km:
                d["distance_km"] = round(dist, 1)
                near.append(d)
        total = len(near)
        skip = (page - 1) * page_size
        return {"total": total, "page": page, "page_size": page_size, "results": near[skip:skip + page_size]}
    total = await db.educator_profiles.count_documents(query)
    skip = (page - 1) * page_size
    docs = await db.educator_profiles.find(query, {"_id": 0}).sort(sort_spec).skip(skip).limit(page_size).to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "results": docs}


@api.get("/educators/me")
async def get_my_educator_profile(user: dict = Depends(require_roles("EDUCATOR", "ADULT_LEARNER"))):
    prof = await db.educator_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"profile": prof}


class EducatorProfileBody(BaseModel):
    profession: str = ""
    bio: str = ""
    region: str = ""
    location: str = ""
    subjects: List[str] = []
    levels: List[str] = []
    languages: List[str] = []
    specialties: List[str] = []
    services: List[str] = []
    experience_years: int = 0
    hourly_rate: int = 0
    photo: Optional[str] = None
    diplomas: List[dict] = []
    experiences: List[dict] = []
    availability: dict = {}
    available_now: bool = True


@api.put("/educators/me")
async def upsert_my_educator_profile(body: EducatorProfileBody,
                                     user: dict = Depends(require_roles("EDUCATOR", "ADULT_LEARNER"))):
    existing = await db.educator_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    data = body.model_dump()
    lat, lng = region_latlng(data.get("region", ""), user["user_id"])
    data.update({"user_id": user["user_id"], "name": user.get("name"), "active": True,
                 "lat": lat, "lng": lng, "updated_at": now_iso()})
    if existing:
        await db.educator_profiles.update_one({"user_id": user["user_id"]}, {"$set": data})
    else:
        data.update({"profile_id": new_id("edu"), "rating": 0, "reviews_count": 0,
                     "views": 0, "is_verified": False, "verification_status": "Non vérifié",
                     "created_at": now_iso()})
        await db.educator_profiles.insert_one(data)
    prof = await db.educator_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    await notify_zone_alerts(prof)
    return {"profile": prof}


@api.get("/educators/{user_id}")
async def get_educator(user_id: str):
    prof = await educator_public(user_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    await db.educator_profiles.update_one({"user_id": user_id}, {"$inc": {"views": 1}})
    reviews = await db.reviews.find({"educator_user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"profile": prof, "reviews": reviews}


# ================= schools & jobs =================
class SchoolBody(BaseModel):
    name: str
    region: str = ""
    location: str = ""
    description: str = ""
    school_type: str = ""
    logo: Optional[str] = None


@api.put("/schools/me")
async def upsert_school(body: SchoolBody, user: dict = Depends(require_roles("SCHOOL"))):
    existing = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0})
    data = body.model_dump()
    data.update({"user_id": user["user_id"], "updated_at": now_iso()})
    if existing:
        await db.schools.update_one({"user_id": user["user_id"]}, {"$set": data})
    else:
        data.update({"school_id": new_id("school"), "verification_status": "Non vérifié",
                     "is_verified": False, "subscription_tier": "Découverte", "created_at": now_iso()})
        await db.schools.insert_one(data)
    school = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"school": school}


@api.get("/schools/me")
async def get_my_school(user: dict = Depends(require_roles("SCHOOL"))):
    school = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"school": school}


class JobBody(BaseModel):
    title: str
    contract_type: str = ""
    subject: str = ""
    level: str = ""
    region: str = ""
    location: str = ""
    salary: str = ""
    experience_required: int = 0
    diploma_required: str = ""
    description: str = ""
    skills: List[str] = []
    start_date: Optional[str] = None
    deadline: Optional[str] = None
    status: str = "published"


@api.get("/jobs")
async def list_jobs(subject: Optional[str] = None, level: Optional[str] = None,
                    region: Optional[str] = None, contract_type: Optional[str] = None,
                    q: Optional[str] = None, page: int = 1, page_size: int = 12):
    query: dict = {"status": "published"}
    if subject:
        query["subject"] = subject
    if level:
        query["level"] = level
    if region:
        query["region"] = region
    if contract_type:
        query["contract_type"] = contract_type
    if q:
        query["$or"] = [{"title": {"$regex": q, "$options": "i"}},
                        {"description": {"$regex": q, "$options": "i"}},
                        {"school_name": {"$regex": q, "$options": "i"}}]
    total = await db.job_offers.count_documents(query)
    skip = (page - 1) * page_size
    docs = await db.job_offers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "results": docs}


@api.get("/jobs/mine")
async def my_jobs(user: dict = Depends(require_roles("SCHOOL"))):
    docs = await db.job_offers.find({"school_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"results": docs}


@api.get("/jobs/{offer_id}")
async def get_job(offer_id: str):
    job = await db.job_offers.find_one({"offer_id": offer_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    await db.job_offers.update_one({"offer_id": offer_id}, {"$inc": {"views": 1}})
    return {"job": job}


@api.post("/jobs")
async def create_job(body: JobBody, user: dict = Depends(require_roles("SCHOOL"))):
    school = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0})
    data = body.model_dump()
    data.update({"offer_id": new_id("offer"), "school_user_id": user["user_id"],
                 "school_name": (school or {}).get("name", user.get("name")),
                 "school_id": (school or {}).get("school_id"),
                 "region": data.get("region") or (school or {}).get("region", ""),
                 "views": 0, "applications_count": 0, "created_at": now_iso(), "updated_at": now_iso()})
    await db.job_offers.insert_one(data)
    return {"job": {k: v for k, v in data.items() if k != "_id"}}


@api.put("/jobs/{offer_id}")
async def update_job(offer_id: str, body: JobBody, user: dict = Depends(require_roles("SCHOOL"))):
    job = await db.job_offers.find_one({"offer_id": offer_id}, {"_id": 0})
    if not job or job["school_user_id"] != user["user_id"]:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    await db.job_offers.update_one({"offer_id": offer_id},
                                   {"$set": {**body.model_dump(), "updated_at": now_iso()}})
    job = await db.job_offers.find_one({"offer_id": offer_id}, {"_id": 0})
    return {"job": job}


# ================= applications =================
class ApplicationBody(BaseModel):
    offer_id: str
    message: str = ""


@api.post("/applications")
async def apply(body: ApplicationBody, user: dict = Depends(require_roles("EDUCATOR"))):
    job = await db.job_offers.find_one({"offer_id": body.offer_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    if await db.applications.find_one({"offer_id": body.offer_id, "educator_user_id": user["user_id"]}):
        raise HTTPException(status_code=400, detail="Vous avez déjà postulé à cette offre")
    app_id = new_id("app")
    doc = {"application_id": app_id, "offer_id": body.offer_id, "offer_title": job["title"],
           "school_user_id": job["school_user_id"], "school_name": job.get("school_name"),
           "educator_user_id": user["user_id"], "educator_name": user.get("name"),
           "message": body.message, "status": "Envoyée",
           "timeline": [{"status": "Envoyée", "at": now_iso()}], "created_at": now_iso()}
    await db.applications.insert_one(doc)
    await db.job_offers.update_one({"offer_id": body.offer_id}, {"$inc": {"applications_count": 1}})
    await notify(job["school_user_id"], "application", "Nouvelle candidature",
                 f"{user.get('name')} a postulé à « {job['title']} »", "/dashboard/school/applications")
    return {"application": {k: v for k, v in doc.items() if k != "_id"}}


@api.get("/applications/mine")
async def my_applications(user: dict = Depends(require_roles("EDUCATOR"))):
    docs = await db.applications.find({"educator_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"results": docs}


@api.get("/applications/received")
async def received_applications(offer_id: Optional[str] = None, user: dict = Depends(require_roles("SCHOOL"))):
    query = {"school_user_id": user["user_id"]}
    if offer_id:
        query["offer_id"] = offer_id
    docs = await db.applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"results": docs}


class StatusBody(BaseModel):
    status: str


APP_STATUSES = ["Envoyée", "Consultée", "Présélectionnée", "Entretien", "Acceptée", "Refusée"]


@api.put("/applications/{application_id}/status")
async def update_application_status(application_id: str, body: StatusBody,
                                    user: dict = Depends(require_roles("SCHOOL"))):
    if body.status not in APP_STATUSES:
        raise HTTPException(status_code=400, detail="Statut invalide")
    a = await db.applications.find_one({"application_id": application_id}, {"_id": 0})
    if not a or a["school_user_id"] != user["user_id"]:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    await db.applications.update_one({"application_id": application_id},
                                     {"$set": {"status": body.status},
                                      "$push": {"timeline": {"status": body.status, "at": now_iso()}}})
    await notify(a["educator_user_id"], "application_status", "Candidature mise à jour",
                 f"Votre candidature « {a['offer_title']} » : {body.status}", "/dashboard/educator/applications")
    return {"message": "Statut mis à jour"}


# ================= students (parent) =================
class StudentBody(BaseModel):
    name: str
    class_level: str = ""
    subjects: List[str] = []
    location: str = ""
    needs: str = ""
    availability: str = ""


@api.get("/students")
async def list_students(user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    docs = await db.students.find({"parent_user_id": user["user_id"]}, {"_id": 0}).to_list(50)
    return {"results": docs}


@api.post("/students")
async def create_student(body: StudentBody, user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    doc = {"student_id": new_id("student"), "parent_user_id": user["user_id"],
           **body.model_dump(), "created_at": now_iso()}
    await db.students.insert_one(doc)
    return {"student": {k: v for k, v in doc.items() if k != "_id"}}


# ================= tutoring requests + matching =================
class TutoringBody(BaseModel):
    subject: str
    level: str = ""
    objective: str = ""
    frequency: str = ""
    hours: int = 1
    region: str = ""
    location: str = ""
    mode: str = "Présentiel"
    budget: int = 0
    availability: str = ""
    notes: str = ""
    student_id: Optional[str] = None


def compute_match(req: dict, edu: dict) -> tuple:
    score = 0
    reasons = []
    if req.get("subject") and req["subject"] in edu.get("subjects", []):
        score += 35
        reasons.append("votre matière")
    if req.get("level") and req["level"] in edu.get("levels", []):
        score += 25
        reasons.append("votre niveau")
    if req.get("region") and req.get("region") == edu.get("region"):
        score += 15
        reasons.append("votre localisation")
    if req.get("budget") and edu.get("hourly_rate", 0) <= req["budget"]:
        score += 12
        reasons.append("votre budget")
    if edu.get("available_now"):
        score += 8
        reasons.append("vos disponibilités")
    if edu.get("is_verified"):
        score += 5
    rating = edu.get("rating", 0) or 0
    score = min(100, score + int(rating))
    return score, reasons


@api.post("/tutoring-requests")
async def create_tutoring_request(body: TutoringBody, user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    doc = {"request_id": new_id("req"), "requester_user_id": user["user_id"],
           **body.model_dump(), "status": "Ouverte", "created_at": now_iso()}
    await db.tutoring_requests.insert_one(doc)
    return {"request": {k: v for k, v in doc.items() if k != "_id"}}


@api.get("/tutoring-requests/mine")
async def my_tutoring_requests(user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    docs = await db.tutoring_requests.find({"requester_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"results": docs}


@api.get("/tutoring-requests/{request_id}/matches")
async def request_matches(request_id: str, user: dict = Depends(get_current_user)):
    req = await db.tutoring_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    query = {"active": True}
    if req.get("subject"):
        query["subjects"] = req["subject"]
    educators = await db.educator_profiles.find(query, {"_id": 0}).limit(50).to_list(50)
    if not educators:
        educators = await db.educator_profiles.find({"active": True}, {"_id": 0}).limit(50).to_list(50)
    scored = []
    for e in educators:
        score, reasons = compute_match(req, e)
        e["match_score"] = score
        e["match_reasons"] = reasons
        scored.append(e)
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return {"request": req, "results": scored[:12]}


# ================= bookings =================
class BookingBody(BaseModel):
    educator_user_id: str
    date: str
    time: str
    subject: str = ""
    mode: str = "Présentiel"
    note: str = ""


@api.post("/bookings")
async def create_booking(body: BookingBody, user: dict = Depends(get_current_user)):
    edu = await db.educator_profiles.find_one({"user_id": body.educator_user_id}, {"_id": 0})
    if not edu:
        raise HTTPException(status_code=404, detail="Éducateur introuvable")
    doc = {"booking_id": new_id("book"), "educator_user_id": body.educator_user_id,
           "educator_name": edu.get("name"), "client_user_id": user["user_id"],
           "client_name": user.get("name"), "date": body.date, "time": body.time,
           "subject": body.subject, "mode": body.mode, "note": body.note,
           "price": edu.get("hourly_rate", 0), "status": "En attente",
           "payment_status": "non_payé", "created_at": now_iso()}
    await db.bookings.insert_one(doc)
    await notify(body.educator_user_id, "booking", "Nouvelle demande de cours",
                 f"{user.get('name')} souhaite réserver un cours le {body.date} à {body.time}",
                 "/dashboard/educator/bookings")
    return {"booking": {k: v for k, v in doc.items() if k != "_id"}}


@api.get("/bookings/mine")
async def my_bookings(user: dict = Depends(get_current_user)):
    docs = await db.bookings.find({"$or": [{"client_user_id": user["user_id"]},
                                           {"educator_user_id": user["user_id"]}]},
                                  {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"results": docs}


@api.put("/bookings/{booking_id}/status")
async def update_booking(booking_id: str, body: StatusBody, user: dict = Depends(get_current_user)):
    if body.status not in ("En attente", "Confirmé", "Refusé", "Terminé", "Annulé"):
        raise HTTPException(status_code=400, detail="Statut de réservation invalide")
    b = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not b or user["user_id"] not in (b["client_user_id"], b["educator_user_id"]):
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    await db.bookings.update_one({"booking_id": booking_id}, {"$set": {"status": body.status}})
    other = b["client_user_id"] if user["user_id"] == b["educator_user_id"] else b["educator_user_id"]
    await notify(other, "booking_status", "Réservation mise à jour", f"Statut : {body.status}", "")
    return {"message": "Réservation mise à jour"}


# ================= reviews =================
class ReviewBody(BaseModel):
    educator_user_id: str
    rating: int = 5
    comment: str = ""
    punctuality: int = 5
    pedagogy: int = 5
    communication: int = 5
    booking_id: Optional[str] = None


@api.post("/reviews")
async def create_review(body: ReviewBody, user: dict = Depends(get_current_user)):
    if body.educator_user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous auto-évaluer")
    verified = False
    if body.booking_id:
        b = await db.bookings.find_one({"booking_id": body.booking_id, "client_user_id": user["user_id"],
                                        "status": "Terminé"}, {"_id": 0})
        verified = bool(b)
    doc = {"review_id": new_id("rev"), "educator_user_id": body.educator_user_id,
           "author_user_id": user["user_id"], "author_name": user.get("name"),
           "rating": body.rating, "comment": body.comment, "punctuality": body.punctuality,
           "pedagogy": body.pedagogy, "communication": body.communication,
           "verified": verified, "booking_id": body.booking_id, "created_at": now_iso()}
    await db.reviews.insert_one(doc)
    agg = await db.reviews.aggregate([
        {"$match": {"educator_user_id": body.educator_user_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]).to_list(1)
    if agg:
        await db.educator_profiles.update_one({"user_id": body.educator_user_id},
                                              {"$set": {"rating": round(agg[0]["avg"], 1),
                                                        "reviews_count": agg[0]["count"]}})
    await notify(body.educator_user_id, "review", "Nouvel avis", f"Vous avez reçu un avis {body.rating}★", "")
    return {"review": {k: v for k, v in doc.items() if k != "_id"}}


# ================= favorites =================
class FavoriteBody(BaseModel):
    target_type: str
    target_id: str


@api.get("/favorites")
async def list_favorites(user: dict = Depends(get_current_user)):
    docs = await db.favorites.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(200)
    return {"results": docs}


@api.post("/favorites")
async def toggle_favorite(body: FavoriteBody, user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["user_id"], "target_type": body.target_type,
                                            "target_id": body.target_id})
    if existing:
        await db.favorites.delete_one({"_id": existing["_id"]})
        return {"favorited": False}
    await db.favorites.insert_one({"favorite_id": new_id("fav"), "user_id": user["user_id"],
                                   "target_type": body.target_type, "target_id": body.target_id,
                                   "created_at": now_iso()})
    return {"favorited": True}


# ================= zone alerts =================
class ZoneAlertBody(BaseModel):
    lat: float
    lng: float
    radius_km: float = 15
    subject: Optional[str] = None
    level: Optional[str] = None


@api.post("/zone-alerts")
async def create_zone_alert(body: ZoneAlertBody, user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    doc = {"alert_id": new_id("alert"), "user_id": user["user_id"], **body.model_dump(),
           "notified": [], "active": True, "created_at": now_iso()}
    await db.zone_alerts.insert_one(doc)
    return {"alert": {k: v for k, v in doc.items() if k != "_id"}}


@api.get("/zone-alerts/mine")
async def my_zone_alerts(user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    docs = await db.zone_alerts.find({"user_id": user["user_id"], "active": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"results": docs}


@api.delete("/zone-alerts/{alert_id}")
async def delete_zone_alert(alert_id: str, user: dict = Depends(get_current_user)):
    a = await db.zone_alerts.find_one({"alert_id": alert_id}, {"_id": 0})
    if not a or a["user_id"] != user["user_id"]:
        raise HTTPException(status_code=404, detail="Alerte introuvable")
    await db.zone_alerts.update_one({"alert_id": alert_id}, {"$set": {"active": False}})
    return {"message": "Alerte supprimée"}


# ================= messaging =================
class MessageBody(BaseModel):
    recipient_user_id: str
    content: str = ""
    attachment_file_id: Optional[str] = None


def _conv_flags(c: dict, uid: str) -> dict:
    blocks = c.get("blocks", [])
    c["blocked_by_me"] = uid in blocks
    c["blocked_by_other"] = any(b != uid for b in blocks)
    c["is_blocked"] = len(blocks) > 0
    return c


@api.get("/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    docs = await db.conversations.find({"participants": user["user_id"]}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    for c in docs:
        others = [p for p in c["participants"] if p != user["user_id"]]
        if others:
            ou = await db.users.find_one({"user_id": others[0]}, {"_id": 0})
            c["other_name"] = (ou or {}).get("name", "Utilisateur")
            c["other_user_id"] = others[0]
            c["other_avatar"] = (ou or {}).get("avatar_url")
            c["other_last_seen"] = (ou or {}).get("last_seen")
            c["other_online"] = is_online((ou or {}).get("last_seen"))
        _conv_flags(c, user["user_id"])
    return {"results": docs}


@api.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conv or user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    msgs = await db.messages.find({"conversation_id": conversation_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    await db.messages.update_many({"conversation_id": conversation_id, "sender_user_id": {"$ne": user["user_id"]}},
                                  {"$set": {"read": True}})
    conv = _conv_flags(conv, user["user_id"])
    others = [p for p in conv["participants"] if p != user["user_id"]]
    if others:
        ou = await db.users.find_one({"user_id": others[0]}, {"_id": 0})
        conv["other_user_id"] = others[0]
        conv["other_name"] = (ou or {}).get("name", "Utilisateur")
        conv["other_last_seen"] = (ou or {}).get("last_seen")
        conv["other_online"] = is_online((ou or {}).get("last_seen"))
    return {"results": msgs, "conversation": conv}


@api.post("/messages")
async def send_message(body: MessageBody, user: dict = Depends(get_current_user)):
    if not (body.content or "").strip() and not body.attachment_file_id:
        raise HTTPException(status_code=400, detail="Message vide")
    pair = sorted([user["user_id"], body.recipient_user_id])
    conv = await db.conversations.find_one({"participants": {"$all": pair, "$size": 2}}, {"_id": 0})
    if conv and conv.get("blocks"):
        raise HTTPException(status_code=403, detail="Cette conversation est bloquée")

    attachment = None
    if body.attachment_file_id:
        f = await db.files.find_one({"file_id": body.attachment_file_id, "user_id": user["user_id"], "is_deleted": False}, {"_id": 0})
        if not f:
            raise HTTPException(status_code=400, detail="Pièce jointe introuvable")
        attachment = {"file_id": f["file_id"], "name": f["original_filename"], "content_type": f["content_type"]}

    preview = body.content if body.content else ("📎 " + (attachment["name"] if attachment else "Pièce jointe"))
    if not conv:
        conv = {"conversation_id": new_id("conv"), "participants": pair, "blocks": [],
                "last_message": preview, "updated_at": now_iso(), "created_at": now_iso()}
        await db.conversations.insert_one(conv)
    else:
        await db.conversations.update_one({"conversation_id": conv["conversation_id"]},
                                          {"$set": {"last_message": preview, "updated_at": now_iso()}})
    msg = {"message_id": new_id("msg"), "conversation_id": conv["conversation_id"],
           "sender_user_id": user["user_id"], "content": body.content, "attachment": attachment,
           "read": False, "created_at": now_iso()}
    await db.messages.insert_one(msg)
    await notify(body.recipient_user_id, "message", "Nouveau message",
                 f"{user.get('name')} vous a envoyé un message", "/dashboard/messages")
    return {"message": {k: v for k, v in msg.items() if k != "_id"}, "conversation_id": conv["conversation_id"]}


@api.post("/conversations/{conversation_id}/block")
async def block_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conv or user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    await db.conversations.update_one({"conversation_id": conversation_id}, {"$addToSet": {"blocks": user["user_id"]}})
    return {"message": "Conversation bloquée", "is_blocked": True}


@api.post("/conversations/{conversation_id}/unblock")
async def unblock_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conv or user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    await db.conversations.update_one({"conversation_id": conversation_id}, {"$pull": {"blocks": user["user_id"]}})
    return {"message": "Conversation débloquée", "is_blocked": False}


class ReportBody(BaseModel):
    target_user_id: str
    conversation_id: Optional[str] = None
    reason: str


@api.post("/reports")
async def create_report(body: ReportBody, user: dict = Depends(get_current_user)):
    target = await db.users.find_one({"user_id": body.target_user_id}, {"_id": 0})
    doc = {"report_id": new_id("report"), "reporter_user_id": user["user_id"], "reporter_name": user.get("name"),
           "target_user_id": body.target_user_id, "target_name": (target or {}).get("name", ""),
           "conversation_id": body.conversation_id, "reason": body.reason,
           "status": "Ouvert", "created_at": now_iso()}
    await db.reports.insert_one(doc)
    return {"report": {k: v for k, v in doc.items() if k != "_id"}, "message": "Signalement transmis à notre équipe"}


# ================= notifications =================
@api.post("/presence/ping")
async def presence_ping(user: dict = Depends(get_current_user)):
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"last_seen": now_iso()}})
    return {"ok": True}


@api.get("/presence/{target_user_id}")
async def presence_get(target_user_id: str, user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"user_id": target_user_id}, {"_id": 0, "last_seen": 1})
    return {"online": is_online((u or {}).get("last_seen")), "last_seen": (u or {}).get("last_seen")}
@api.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    docs = await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    unread = await db.notifications.count_documents({"user_id": user["user_id"], "read": False})
    return {"results": docs, "unread": unread}


@api.put("/notifications/read")
async def mark_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["user_id"]}, {"$set": {"read": True}})
    return {"message": "ok"}


# ================= verification =================
class VerificationBody(BaseModel):
    documents: List[dict] = []


@api.post("/verifications")
async def submit_verification(body: VerificationBody, user: dict = Depends(get_current_user)):
    # Only accept document references that actually belong to the submitting user
    requested_ids = [d.get("file_id") for d in body.documents if d.get("file_id")]
    owned = set()
    if requested_ids:
        cursor = db.files.find({"file_id": {"$in": requested_ids}, "user_id": user["user_id"], "is_deleted": False}, {"_id": 0, "file_id": 1})
        owned = {f["file_id"] async for f in cursor}
    safe_docs = [d for d in body.documents if d.get("file_id") in owned]
    doc = {"verification_id": new_id("verif"), "user_id": user["user_id"], "user_name": user.get("name"),
           "documents": safe_docs, "status": "En cours de vérification", "created_at": now_iso()}
    await db.verifications.insert_one(doc)
    await db.educator_profiles.update_one({"user_id": user["user_id"]},
                                          {"$set": {"verification_status": "En cours de vérification"}})
    return {"verification": {k: v for k, v in doc.items() if k != "_id"}}


# ================= subscriptions (architecture ready) =================
class SubscriptionBody(BaseModel):
    plan: str
    audience: str = "educator"


@api.get("/plans")
async def get_plans():
    cfg = await db.pricing_config.find_one({"_id": "plans"})
    if not cfg:
        return {"plans": DEFAULT_PLANS}
    return {"plans": cfg["data"]}


@api.post("/subscriptions")
async def subscribe(body: SubscriptionBody, user: dict = Depends(get_current_user)):
    # Architecture prête pour paiement Mobile Money (activation ultérieure)
    doc = {"subscription_id": new_id("sub"), "user_id": user["user_id"], "plan": body.plan,
           "audience": body.audience, "status": "pending_payment", "payment_method": "mobile_money",
           "created_at": now_iso()}
    await db.subscriptions.insert_one(doc)
    if body.plan.lower() in ("premium", "pro"):
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_premium": True}})
    return {"subscription": {k: v for k, v in doc.items() if k != "_id"},
            "message": "Abonnement enregistré. Le paiement Mobile Money sera activé prochainement."}


# ================= admin =================
@api.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_roles("ADMIN"))):
    users_total = await db.users.count_documents({})
    return {
        "users_total": users_total,
        "schools": await db.users.count_documents({"role": "SCHOOL"}),
        "educators": await db.users.count_documents({"role": "EDUCATOR"}),
        "parents": await db.users.count_documents({"role": {"$in": ["PARENT", "ADULT_LEARNER"]}}),
        "jobs": await db.job_offers.count_documents({}),
        "applications": await db.applications.count_documents({}),
        "tutoring_requests": await db.tutoring_requests.count_documents({}),
        "bookings": await db.bookings.count_documents({}),
        "reviews": await db.reviews.count_documents({}),
        "subscriptions": await db.subscriptions.count_documents({}),
        "pending_verifications": await db.verifications.count_documents({"status": "En cours de vérification"}),
        "reports": await db.reports.count_documents({"status": "Ouvert"}),
        "revenue": 0,
    }


@api.get("/admin/users")
async def admin_users(role: Optional[str] = None, user: dict = Depends(require_roles("ADMIN"))):
    query = {}
    if role:
        query["role"] = role
    docs = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return {"results": docs}


@api.get("/admin/verifications")
async def admin_verifications(user: dict = Depends(require_roles("ADMIN"))):
    docs = await db.verifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"results": docs}


@api.put("/admin/verifications/{verification_id}")
async def admin_update_verification(verification_id: str, body: StatusBody,
                                    user: dict = Depends(require_roles("ADMIN"))):
    v = await db.verifications.find_one({"verification_id": verification_id}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Introuvable")
    status = body.status  # Vérifié / Rejeté
    await db.verifications.update_one({"verification_id": verification_id}, {"$set": {"status": status}})
    is_verified = status == "Vérifié"
    await db.educator_profiles.update_one({"user_id": v["user_id"]},
                                          {"$set": {"is_verified": is_verified, "verification_status": status}})
    await notify(v["user_id"], "verification",
                 "Profil vérifié" if is_verified else "Vérification rejetée",
                 "Votre profil a été validé ✓" if is_verified else "Votre demande de vérification a été rejetée", "")
    return {"message": "ok"}


class PlansBody(BaseModel):
    data: dict


@api.put("/admin/plans")
async def admin_update_plans(body: PlansBody, user: dict = Depends(require_roles("ADMIN"))):
    await db.pricing_config.update_one({"_id": "plans"}, {"$set": {"data": body.data}}, upsert=True)
    return {"message": "Tarifs mis à jour"}


@api.get("/admin/reports")
async def admin_reports(user: dict = Depends(require_roles("ADMIN"))):
    docs = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"results": docs}


@api.put("/admin/reports/{report_id}")
async def admin_update_report(report_id: str, body: StatusBody, user: dict = Depends(require_roles("ADMIN"))):
    r = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Introuvable")
    await db.reports.update_one({"report_id": report_id}, {"$set": {"status": body.status}})
    return {"message": "ok"}


# ================= uploads / files =================
MAX_UPLOAD = 8 * 1024 * 1024  # 8 MB


@api.post("/uploads")
async def upload_file(file: UploadFile = File(...), category: str = "photo",
                      visibility: str = "public", user: dict = Depends(get_current_user)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "bin").lower()
    if category == "photo" and ext not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="Photo: formats acceptés jpg, png, webp")
    if category in ("cv", "diploma", "attachment") and ext not in ("pdf", "jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="Document: formats acceptés pdf, jpg, png, webp")
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 8 Mo)")
    # sensitive documents & message attachments are always private
    vis = "private" if category in ("cv", "diploma", "attachment") else (visibility if visibility in ("public", "private") else "public")
    file_id = new_id("file")
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    path = f"{APP_NAME}/uploads/{user['user_id']}/{file_id}.{ext}"
    try:
        result = await asyncio.to_thread(put_object, path, data, content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=502, detail="Échec du téléversement")
    doc = {"file_id": file_id, "user_id": user["user_id"], "storage_path": result["path"],
           "original_filename": file.filename, "content_type": content_type, "size": result.get("size", len(data)),
           "category": category, "visibility": vis, "is_deleted": False, "created_at": now_iso()}
    await db.files.insert_one(doc)
    return {"file": {k: v for k, v in doc.items() if k != "_id"}, "url": f"/api/files/{file_id}"}


@api.get("/uploads/mine")
async def my_uploads(category: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {"user_id": user["user_id"], "is_deleted": False}
    if category:
        q["category"] = category
    docs = await db.files.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"results": docs}


@api.delete("/uploads/{file_id}")
async def delete_upload(file_id: str, user: dict = Depends(get_current_user)):
    rec = await db.files.find_one({"file_id": file_id}, {"_id": 0})
    if not rec or (rec["user_id"] != user["user_id"] and user["role"] != "ADMIN"):
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    await db.files.update_one({"file_id": file_id}, {"$set": {"is_deleted": True}})
    return {"message": "Fichier supprimé"}


def _user_from_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = _jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
        return {"user_id": payload.get("sub")}
    except Exception:
        return None


@api.get("/files/{file_id}")
async def serve_file(file_id: str, request: Request = None, authorization: str = Header(None), auth: str = Query(None)):
    rec = await db.files.find_one({"file_id": file_id, "is_deleted": False}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    if rec["visibility"] == "private":
        token = auth
        if not token and authorization and authorization.startswith("Bearer "):
            token = authorization[7:]
        if not token:
            token = request.cookies.get("access_token") if request else None
        u = _user_from_token(token)
        admin = False
        if u:
            full = await db.users.find_one({"user_id": u["user_id"]}, {"_id": 0})
            admin = full and full.get("role") == "ADMIN"
        allowed = bool(u) and (u["user_id"] == rec["user_id"] or admin)
        # message attachments: any participant of a conversation containing this file may view it
        if not allowed and u and rec.get("category") == "attachment":
            msg = await db.messages.find_one({"attachment.file_id": file_id}, {"_id": 0, "conversation_id": 1})
            if msg:
                conv = await db.conversations.find_one({"conversation_id": msg["conversation_id"]}, {"_id": 0})
                allowed = bool(conv) and u["user_id"] in conv.get("participants", [])
        if not allowed:
            raise HTTPException(status_code=403, detail="Accès refusé à ce document privé")
    try:
        data, ct = await asyncio.to_thread(get_object, rec["storage_path"])
    except Exception as e:
        logger.error(f"Serve file failed: {e}")
        raise HTTPException(status_code=404, detail="Fichier indisponible")
    return Response(content=data, media_type=rec.get("content_type", ct))


# ================= account =================
@api.delete("/account")
async def delete_account(user: dict = Depends(get_current_user)):
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"deleted": True}})
    await db.educator_profiles.update_one({"user_id": user["user_id"]}, {"$set": {"active": False}})
    return {"message": "Compte supprimé"}


DEFAULT_PLANS = {
    "educator": [
        {"name": "Gratuit", "price": "0 FCFA", "features": ["Profil public", "Recevoir des demandes",
                                                            "Postuler aux offres", "Messagerie"]},
        {"name": "Premium", "price": "5 000 FCFA/mois", "highlight": True,
         "features": ["Profil mis en avant", "Meilleure visibilité", "Statistiques avancées",
                      "Badge Premium", "Recommandations personnalisées"]},
    ],
    "school": [
        {"name": "Découverte", "price": "10 000 FCFA/mois",
         "features": ["3 offres actives", "20 candidatures/mois", "Accès CVthèque limité"]},
        {"name": "Pro", "price": "25 000 FCFA/mois", "highlight": True,
         "features": ["15 offres actives", "Candidatures illimitées", "CVthèque complète", "Statistiques"]},
        {"name": "Premium", "price": "50 000 FCFA/mois",
         "features": ["Offres illimitées", "Mise en avant", "Support prioritaire", "Fonctionnalités avancées"]},
    ],
    "family": [
        {"name": "Pass Famille", "price": "3 000 FCFA/mois", "highlight": True,
         "features": ["Plusieurs profils d'élèves", "Comparaison de tuteurs",
                      "Suivi des réservations", "Support prioritaire"]},
    ],
}


app.include_router(auth.router)
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"),
                   "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.educator_profiles.create_index("user_id")
    await db.job_offers.create_index("offer_id")
    await db.password_reset_tokens.create_index("token_hash", unique=True)
    await db.login_attempts.create_index("email")
    await auth.seed_admin()
    await seed_demo_data()
    # backfill lat/lng for educator profiles missing coordinates
    async for p in db.educator_profiles.find({"$or": [{"lat": {"$exists": False}}, {"lat": None}]}, {"_id": 0, "user_id": 1, "region": 1}):
        lat, lng = region_latlng(p.get("region", ""), p["user_id"])
        await db.educator_profiles.update_one({"user_id": p["user_id"]}, {"$set": {"lat": lat, "lng": lng}})
    try:
        await asyncio.to_thread(init_storage)
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    logger.info("ASKOOL API started")


@app.on_event("shutdown")
async def shutdown():
    client.close()
