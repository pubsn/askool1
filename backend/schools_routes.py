import re
import math
import uuid
import unicodedata
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from database import db
from auth import get_current_user, require_roles
from constants import region_latlng

router = APIRouter(prefix="/api")

now_iso = lambda: datetime.now(timezone.utc).isoformat()
new_id = lambda p: f"{p}_{uuid.uuid4().hex[:16]}"

SCHOOL_TYPES = ["École maternelle", "École primaire", "Collège", "Lycée", "Établissement secondaire",
                "Centre de formation", "Établissement professionnel", "Autre"]
SCHOOL_LEVELS = ["Préscolaire", "Primaire", "Collège", "Lycée", "Formation professionnelle"]
RECRUITING_OPTIONS = ["Recrute actuellement", "Recrutement permanent", "Recrutement de vacataires", "Recrutement administratif"]
SCHOOL_CONTRACTS = ["CDI", "CDD", "Vacataire", "Stage", "Temps partiel", "Temps plein"]
SERVICE_PROPOSAL_TYPES = ["Enseignement", "Remplacement", "Vacation", "Cours de soutien", "Formation", "Administratif", "Autre"]
VISIBILITY = ["public", "after_contact", "private"]
PARENT_SCHOOL_TYPES = ["École privée", "École publique", "Établissement international", "École bilingue", "École confessionnelle", "Centre de formation", "Autre"]
EDUCATION_SYSTEMS = ["Programme sénégalais", "Programme français", "Programme franco-arabe", "Programme anglophone / IB", "Programme bilingue", "Autre"]
FAMILY_SERVICES = ["Cantine", "Transport scolaire", "Internat", "Activités extrascolaires", "Bibliothèque", "Laboratoire", "Salle informatique", "Sport", "Accompagnement pédagogique"]
CONTACT_SUBJECTS = ["Inscription", "Frais scolaires", "Programmes", "Transport", "Cantine", "Rendez-vous", "Autre"]
POST_CATEGORIES = ["Actualité", "Événement", "Inscription", "Vie scolaire", "Résultats", "Information aux parents",
                   "Activité", "Besoin de recrutement", "Annonce"]


async def notify(user_id: str, ntype: str, title: str, body: str, link: str = ""):
    await db.notifications.insert_one({
        "notification_id": new_id("notif"), "user_id": user_id, "type": ntype,
        "title": title, "body": body, "link": link, "read": False, "created_at": now_iso(),
    })


async def optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


def haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin(math.radians(lat2 - lat1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lng2 - lng1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "ecole"


async def unique_slug(name: str, exclude_user: str) -> str:
    base = slugify(name)
    slug, i = base, 2
    while await db.schools.find_one({"slug": slug, "user_id": {"$ne": exclude_user}}):
        slug = f"{base}-{i}"
        i += 1
    return slug


# ================= models =================
class SchoolBody(BaseModel):
    name: str
    commercial_name: str = ""
    school_type: str = ""
    status: str = ""
    founded_year: Optional[int] = None
    students_count: Optional[int] = None
    teachers_count: Optional[int] = None
    levels: List[str] = []
    languages: List[str] = []
    education_system: str = ""
    description: str = ""
    history: str = ""
    mission: str = ""
    values: str = ""
    pedagogy: str = ""
    region: str = ""
    city: str = ""
    district: str = ""
    location: str = ""
    directions: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    hide_exact_location: bool = False
    phone: str = ""
    email: str = ""
    website: str = ""
    whatsapp: str = ""
    socials: dict = {}
    contact_visibility: str = "public"
    subjects: List[str] = []
    programs: str = ""
    methods: str = ""
    school_life: List[str] = []
    infrastructures: List[str] = []
    services: List[str] = []
    gallery: List[dict] = []
    recruiting: List[str] = []
    contract_types: List[str] = []
    logo: Optional[str] = None
    cover: Optional[str] = None
    education_systems: List[str] = []
    registration_fee: str = ""
    tuition_fee: str = ""
    payment_terms: str = ""
    schedule: str = ""
    school_calendar: str = ""
    admission_conditions: str = ""
    min_age: Optional[int] = None
    required_documents: List[str] = []
    registration_periods: str = ""
    available_seats: Optional[int] = None
    enrollment_open: bool = False
    accept_enrollment_requests: bool = False
    faq: List[dict] = []


def public_contact(school: dict, viewer: Optional[dict], has_contact: bool) -> dict:
    vis = school.get("contact_visibility", "public")
    owner = viewer and viewer["user_id"] == school["user_id"]
    admin = viewer and viewer.get("role") == "ADMIN"
    allowed = owner or admin or vis == "public" or (vis == "after_contact" and has_contact)
    keys = ["phone", "email", "whatsapp"]
    out = {k: (school.get(k, "") if allowed else "") for k in keys}
    out["website"] = school.get("website", "")
    out["socials"] = school.get("socials", {})
    out["visibility"] = vis
    out["contact_unlocked"] = bool(allowed)
    return out


async def decorate(school: dict) -> dict:
    school["offers_count"] = await db.job_offers.count_documents({"school_user_id": school["user_id"], "status": "published"})
    school["followers_count"] = await db.school_follows.count_documents({"school_id": school["school_id"]})
    agg = await db.school_reviews.aggregate([{"$match": {"school_id": school["school_id"]}},
                                             {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}]).to_list(1)
    school["rating"] = round(agg[0]["avg"], 1) if agg else 0
    school["reviews_count"] = agg[0]["count"] if agg else 0
    for k in ["phone", "email", "whatsapp"]:
        school.pop(k, None)
    return school


# ================= school management =================
@router.put("/schools/me")
async def upsert_school(body: SchoolBody, user: dict = Depends(require_roles("SCHOOL"))):
    existing = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0})
    data = body.model_dump()
    if data["contact_visibility"] not in VISIBILITY:
        data["contact_visibility"] = "public"
    if data.get("lat") is None or data.get("lng") is None:
        data["lat"], data["lng"] = region_latlng(data.get("region", ""), user["user_id"])
    data.update({"user_id": user["user_id"], "updated_at": now_iso(),
                 "slug": await unique_slug(data["name"], user["user_id"])})
    if existing:
        await db.schools.update_one({"user_id": user["user_id"]}, {"$set": data})
    else:
        data.update({"school_id": new_id("school"), "verification_status": "Non vérifié",
                     "is_verified": False, "subscription_tier": "Découverte", "views": 0, "created_at": now_iso()})
        await db.schools.insert_one(data)
    school = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0})
    await db.job_offers.update_many({"school_user_id": user["user_id"]}, {"$set": {"school_name": school["name"], "school_slug": school["slug"]}})
    return {"school": school}


@router.get("/schools/me")
async def get_my_school(user: dict = Depends(require_roles("SCHOOL"))):
    school = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"school": school}


@router.get("/schools/me/overview")
async def school_overview(user: dict = Depends(require_roles("SCHOOL"))):
    uid = user["user_id"]
    school = await db.schools.find_one({"user_id": uid}, {"_id": 0}) or {}
    convs = await db.conversations.find({"participants": uid}, {"_id": 0, "conversation_id": 1}).to_list(200)
    conv_ids = [c["conversation_id"] for c in convs]
    unread = await db.messages.count_documents({"conversation_id": {"$in": conv_ids}, "sender_user_id": {"$ne": uid}, "read": False}) if conv_ids else 0
    return {
        "profile_views": school.get("views", 0),
        "active_offers": await db.job_offers.count_documents({"school_user_id": uid, "status": "published"}),
        "applications": await db.applications.count_documents({"school_user_id": uid}),
        "proposals": await db.service_proposals.count_documents({"school_user_id": uid}),
        "favorite_candidates": await db.favorites.count_documents({"user_id": uid, "target_type": "educator"}),
        "unread_messages": unread,
        "followers": await db.school_follows.count_documents({"school_id": school.get("school_id")}) if school else 0,
        "verification_status": school.get("verification_status", "Non vérifié"),
    }


@router.get("/schools/meta")
async def schools_meta():
    return {"school_types": SCHOOL_TYPES, "school_levels": SCHOOL_LEVELS, "recruiting": RECRUITING_OPTIONS,
            "contract_types": SCHOOL_CONTRACTS, "proposal_types": SERVICE_PROPOSAL_TYPES, "visibility": VISIBILITY,
            "parent_school_types": PARENT_SCHOOL_TYPES, "education_systems": EDUCATION_SYSTEMS, "family_services": FAMILY_SERVICES,
            "post_categories": POST_CATEGORIES, "contact_subjects": CONTACT_SUBJECTS}


# ================= directory =================
@router.get("/schools")
async def list_schools(q: Optional[str] = None, region: Optional[str] = None, city: Optional[str] = None,
                       district: Optional[str] = None, school_type: Optional[str] = None, level: Optional[str] = None,
                       subject: Optional[str] = None, recruiting: Optional[str] = None, contract_type: Optional[str] = None,
                       verified_only: bool = False, service: Optional[str] = None, language: Optional[str] = None,
                       education_system: Optional[str] = None, has_fees: bool = False, enrollment_open: bool = False,
                       near_lat: Optional[float] = None, near_lng: Optional[float] = None, radius_km: Optional[float] = None,
                       page: int = 1, page_size: int = 12):
    query: dict = {"name": {"$exists": True}}
    if service:
        query["services"] = {"$regex": service, "$options": "i"}
    if language:
        query["languages"] = language
    if education_system:
        query["education_systems"] = education_system
    if has_fees:
        query["tuition_fee"] = {"$nin": ["", None]}
    if enrollment_open:
        query["enrollment_open"] = True
    if q:
        rx = {"$regex": q, "$options": "i"}
        query["$or"] = [{"name": rx}, {"commercial_name": rx}, {"city": rx}, {"district": rx}, {"location": rx},
                        {"region": rx}, {"school_type": rx}, {"subjects": rx}, {"levels": rx}, {"description": rx}]
    if region:
        query["region"] = region
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if school_type:
        query["school_type"] = school_type
    if level:
        query["levels"] = level
    if subject:
        query["subjects"] = subject
    if recruiting:
        query["recruiting"] = recruiting
    if contract_type:
        query["contract_types"] = contract_type
    if verified_only:
        query["is_verified"] = True
    if near_lat is not None and near_lng is not None and radius_km:
        all_docs = await db.schools.find(query, {"_id": 0}).to_list(500)
        near = []
        for d in all_docs:
            if d.get("lat") is None or d.get("lng") is None:
                continue
            dist = haversine_km(near_lat, near_lng, d["lat"], d["lng"])
            if dist <= radius_km:
                d["distance_km"] = round(dist, 1)
                near.append(d)
        near.sort(key=lambda x: x["distance_km"])
        skip = (page - 1) * page_size
        return {"total": len(near), "page": page, "page_size": page_size, "results": [await decorate(d) for d in near[skip:skip + page_size]]}
    total = await db.schools.count_documents(query)
    skip = (page - 1) * page_size
    docs = await db.schools.find(query, {"_id": 0}).sort([("is_verified", -1), ("created_at", -1)]).skip(skip).limit(page_size).to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "results": [await decorate(d) for d in docs]}


@router.get("/schools/recommended")
async def recommended_schools(user: dict = Depends(require_roles("EDUCATOR"))):
    edu = await db.educator_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0}) or {}
    docs = await db.schools.find({"name": {"$exists": True}}, {"_id": 0}).to_list(200)
    out = []
    for s in docs:
        score, reasons = 0, []
        if edu.get("region") and s.get("region") == edu.get("region"):
            score += 30; reasons.append("votre localisation")
        if set(edu.get("subjects", [])) & set(s.get("subjects", [])):
            score += 30; reasons.append("vos matières")
        offers = await db.job_offers.count_documents({"school_user_id": s["user_id"], "status": "published"})
        if offers:
            score += 20; reasons.append("des offres disponibles")
        if s.get("is_verified"):
            score += 10
        if "Recrute actuellement" in s.get("recruiting", []):
            score += 10
        s["match_score"] = min(100, score)
        s["match_reasons"] = reasons
        out.append(await decorate(s))
    out.sort(key=lambda x: x["match_score"], reverse=True)
    return {"results": out[:6]}


@router.get("/schools/favorites/mine")
async def favorite_schools(user: dict = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": user["user_id"], "target_type": "school"}, {"_id": 0}).to_list(200)
    ids = [f["target_id"] for f in favs]
    docs = await db.schools.find({"school_id": {"$in": ids}}, {"_id": 0}).to_list(200)
    return {"results": [await decorate(d) for d in docs]}


@router.get("/schools/following/mine")
async def following_schools(user: dict = Depends(get_current_user)):
    follows = await db.school_follows.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(200)
    ids = [f["school_id"] for f in follows]
    docs = await db.schools.find({"school_id": {"$in": ids}}, {"_id": 0}).to_list(200)
    return {"results": [await decorate(d) for d in docs]}


@router.get("/schools/slug/{slug}")
async def school_by_slug(slug: str, request: Request):
    viewer = await optional_user(request)
    school = await db.schools.find_one({"slug": slug}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="Établissement introuvable")
    if not viewer or viewer["user_id"] != school["user_id"]:
        await db.schools.update_one({"school_id": school["school_id"]}, {"$inc": {"views": 1}})
    has_contact = False
    is_favorite = is_following = False
    if viewer:
        pair = sorted([viewer["user_id"], school["user_id"]])
        has_contact = bool(await db.conversations.find_one({"participants": {"$all": pair, "$size": 2}}))
        is_favorite = bool(await db.favorites.find_one({"user_id": viewer["user_id"], "target_type": "school", "target_id": school["school_id"]}))
        is_following = bool(await db.school_follows.find_one({"user_id": viewer["user_id"], "school_id": school["school_id"]}))
    contact = public_contact(school, viewer, has_contact)
    if school.get("hide_exact_location"):
        school["location"] = ""
        school["directions"] = ""
    school = await decorate(school)
    offers = await db.job_offers.find({"school_user_id": school["user_id"], "status": "published"}, {"_id": 0}).sort("created_at", -1).to_list(50)
    sim_q = {"school_id": {"$ne": school["school_id"]}, "$or": [{"region": school.get("region")}, {"school_type": school.get("school_type")},
                                                                 {"levels": {"$in": school.get("levels", []) or ["-"]}}]}
    similar = await db.schools.find(sim_q, {"_id": 0}).limit(4).to_list(4)
    reviews = await db.school_reviews.find({"school_id": school["school_id"]}, {"_id": 0}).sort("created_at", -1).to_list(30)
    follow_notify = True
    if viewer:
        fo = await db.school_follows.find_one({"user_id": viewer["user_id"], "school_id": school["school_id"]}, {"_id": 0})
        follow_notify = (fo or {}).get("notify", True)
    return {"school": school, "contact": contact, "offers": offers, "similar": [await decorate(s) for s in similar],
            "is_favorite": is_favorite, "is_following": is_following, "follow_notify": follow_notify, "reviews": reviews}


@router.post("/schools/{school_id}/follow")
async def toggle_follow(school_id: str, user: dict = Depends(get_current_user)):
    school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="Établissement introuvable")
    existing = await db.school_follows.find_one({"user_id": user["user_id"], "school_id": school_id})
    if existing:
        await db.school_follows.delete_one({"_id": existing["_id"]})
        return {"following": False}
    await db.school_follows.insert_one({"follow_id": new_id("follow"), "user_id": user["user_id"], "school_id": school_id,
                                        "school_user_id": school["user_id"], "notify": True, "created_at": now_iso()})
    return {"following": True}


class FollowNotifyBody(BaseModel):
    notify: bool


@router.put("/schools/{school_id}/follow/notify")
async def follow_notify(school_id: str, body: FollowNotifyBody, user: dict = Depends(get_current_user)):
    r = await db.school_follows.update_one({"user_id": user["user_id"], "school_id": school_id}, {"$set": {"notify": body.notify}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vous ne suivez pas cette école")
    return {"notify": body.notify}


# ================= service proposals =================
class ProposalBody(BaseModel):
    school_id: str
    service_type: str
    subject: str = ""
    level: str = ""
    availability: str = ""
    experience: str = ""
    message: str
    cv_file_id: Optional[str] = None


@router.post("/proposals")
async def create_proposal(body: ProposalBody, user: dict = Depends(require_roles("EDUCATOR"))):
    school = await db.schools.find_one({"school_id": body.school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="Établissement introuvable")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message requis")
    doc = {"proposal_id": new_id("prop"), **body.model_dump(), "school_user_id": school["user_id"],
           "school_name": school["name"], "school_slug": school.get("slug"),
           "educator_user_id": user["user_id"], "educator_name": user.get("name"),
           "status": "Envoyée", "created_at": now_iso()}
    await db.service_proposals.insert_one(doc)
    context = f"Proposition de services — {body.service_type}" + (f" ({body.subject})" if body.subject else "")
    pair = sorted([user["user_id"], school["user_id"]])
    conv = await db.conversations.find_one({"participants": {"$all": pair, "$size": 2}}, {"_id": 0})
    content = f"[{context}]\n{body.message}"
    if not conv:
        conv = {"conversation_id": new_id("conv"), "participants": pair, "blocks": [], "context": context,
                "last_message": content[:80], "updated_at": now_iso(), "created_at": now_iso()}
        await db.conversations.insert_one(conv)
    else:
        await db.conversations.update_one({"conversation_id": conv["conversation_id"]},
                                          {"$set": {"context": context, "last_message": content[:80], "updated_at": now_iso()}})
    await db.messages.insert_one({"message_id": new_id("msg"), "conversation_id": conv["conversation_id"],
                                  "sender_user_id": user["user_id"], "content": content, "attachment": None,
                                  "read": False, "created_at": now_iso()})
    await notify(school["user_id"], "proposal", "Nouvelle proposition de services",
                 f"{user.get('name')} vous propose ses services ({body.service_type})", "/dashboard/propositions")
    return {"proposal": {k: v for k, v in doc.items() if k != "_id"}, "conversation_id": conv["conversation_id"]}


@router.get("/proposals/mine")
async def my_proposals(user: dict = Depends(require_roles("EDUCATOR"))):
    docs = await db.service_proposals.find({"educator_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"results": docs}


@router.get("/proposals/received")
async def received_proposals(user: dict = Depends(require_roles("SCHOOL"))):
    docs = await db.service_proposals.find({"school_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"results": docs}


class ProposalStatusBody(BaseModel):
    status: str


@router.put("/proposals/{proposal_id}/status")
async def proposal_status(proposal_id: str, body: ProposalStatusBody, user: dict = Depends(require_roles("SCHOOL"))):
    if body.status not in ["Envoyée", "Consultée", "Intéressée", "Refusée"]:
        raise HTTPException(status_code=400, detail="Statut invalide")
    p = await db.service_proposals.find_one({"proposal_id": proposal_id, "school_user_id": user["user_id"]}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Proposition introuvable")
    await db.service_proposals.update_one({"proposal_id": proposal_id}, {"$set": {"status": body.status, "updated_at": now_iso()}})
    await notify(p["educator_user_id"], "proposal_status", "Proposition mise à jour",
                 f"{p['school_name']} : votre proposition est « {body.status} »", "/dashboard/propositions")
    return {"message": "ok"}


# ================= job recommendations =================
def compute_job_match(job: dict, edu: dict) -> tuple:
    score, reasons = 0, []
    if job.get("subject") and job["subject"] in edu.get("subjects", []):
        score += 35; reasons.append("vos matières")
    if job.get("level") and job["level"] in edu.get("levels", []):
        score += 20; reasons.append("vos niveaux")
    if job.get("region") and job["region"] == edu.get("region"):
        score += 20; reasons.append("votre localisation")
    if edu.get("experience_years", 0) >= job.get("experience_required", 0):
        score += 15; reasons.append("votre expérience")
    diplomas = [d.get("title") for d in edu.get("diplomas", [])]
    if not job.get("diploma_required") or job["diploma_required"] in diplomas:
        score += 10; reasons.append("vos diplômes")
    return min(100, score), reasons


@router.get("/recommendations/jobs")
async def recommended_jobs(user: dict = Depends(require_roles("EDUCATOR"))):
    edu = await db.educator_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0}) or {}
    jobs = await db.job_offers.find({"status": "published"}, {"_id": 0}).sort("created_at", -1).to_list(300)
    out = []
    for j in jobs:
        j["match_score"], j["match_reasons"] = compute_job_match(j, edu)
        out.append(j)
    out.sort(key=lambda x: x["match_score"], reverse=True)
    nearby = [j for j in out if edu.get("region") and j.get("region") == edu.get("region")]
    return {"recommended": out[:12], "nearby": nearby[:12], "region": edu.get("region", "")}


# ================= school news posts =================


class PostBody(BaseModel):
    title: str
    content: str
    category: str = "Actualité"
    image: Optional[str] = None
    images: List[str] = []
    video_url: str = ""


@router.post("/schools/me/posts")
async def create_post(body: PostBody, user: dict = Depends(require_roles("SCHOOL"))):
    school = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=400, detail="Créez d'abord votre fiche établissement")
    if not body.title.strip() or not body.content.strip():
        raise HTTPException(status_code=400, detail="Titre et contenu requis")
    if body.category not in POST_CATEGORIES:
        raise HTTPException(status_code=400, detail="Catégorie invalide")
    doc = {"post_id": new_id("post"), "school_id": school["school_id"], "school_user_id": user["user_id"],
           "school_name": school["name"], "school_slug": school.get("slug"), **body.model_dump(),
           "views": 0, "notified": 0, "created_at": now_iso()}
    notified = 0
    async for f in db.school_follows.find({"school_id": school["school_id"]}, {"_id": 0, "user_id": 1, "notify": 1}):
        if f.get("notify", True) is False:
            continue
        u = await db.users.find_one({"user_id": f["user_id"]}, {"_id": 0, "notification_prefs": 1})
        if (u or {}).get("notification_prefs", {}).get("school_news", True) is False:
            continue
        await notify(f["user_id"], "school_post", f"{body.category} — {school['name']}", body.title, f"/ecoles/{school.get('slug')}#actualites")
        notified += 1
    doc["notified"] = notified
    await db.school_posts.insert_one(doc)
    return {"post": {k: v for k, v in doc.items() if k != "_id"}, "notified": notified}


@router.put("/schools/me/posts/{post_id}")
async def update_post(post_id: str, body: PostBody, user: dict = Depends(require_roles("SCHOOL"))):
    if body.category not in POST_CATEGORIES:
        raise HTTPException(status_code=400, detail="Catégorie invalide")
    r = await db.school_posts.update_one({"post_id": post_id, "school_user_id": user["user_id"]},
                                         {"$set": {**body.model_dump(), "updated_at": now_iso()}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Actualité introuvable")
    return {"post": await db.school_posts.find_one({"post_id": post_id}, {"_id": 0})}


@router.get("/schools/me/posts/stats")
async def posts_stats(user: dict = Depends(require_roles("SCHOOL"))):
    school = await db.schools.find_one({"user_id": user["user_id"]}, {"_id": 0, "school_id": 1}) or {}
    posts = await db.school_posts.find({"school_user_id": user["user_id"]}, {"_id": 0, "views": 1, "notified": 1}).to_list(500)
    ids = [p["post_id"] for p in await db.school_posts.find({"school_user_id": user["user_id"]}, {"_id": 0, "post_id": 1}).to_list(500)]
    interactions = await db.post_likes.count_documents({"post_id": {"$in": ids}}) + await db.post_comments.count_documents({"post_id": {"$in": ids}, "is_school": False})
    return {"posts": len(posts), "views": sum(p.get("views", 0) for p in posts), "reached": sum(p.get("notified", 0) for p in posts), "interactions": interactions,
            "followers": await db.school_follows.count_documents({"school_id": school.get("school_id")}) if school else 0}


@router.get("/schools/me/posts")
async def my_posts(user: dict = Depends(require_roles("SCHOOL"))):
    docs = await db.school_posts.find({"school_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"results": await reaction_counts(docs, user)}


@router.delete("/schools/me/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(require_roles("SCHOOL"))):
    r = await db.school_posts.delete_one({"post_id": post_id, "school_user_id": user["user_id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Actualité introuvable")
    return {"message": "Supprimée"}


@router.get("/schools/{school_id}/posts")
async def school_posts(school_id: str, request: Request):
    viewer = await optional_user(request)
    docs = await db.school_posts.find({"school_id": school_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    await db.school_posts.update_many({"school_id": school_id}, {"$inc": {"views": 1}})
    return {"results": await reaction_counts(docs, viewer)}


@router.get("/feed")
async def news_feed(user: dict = Depends(get_current_user), limit: int = 20):
    follows = await db.school_follows.find({"user_id": user["user_id"]}, {"_id": 0, "school_id": 1}).to_list(200)
    ids = [f["school_id"] for f in follows]
    if not ids:
        return {"results": [], "following_count": 0}
    docs = await db.school_posts.find({"school_id": {"$in": ids}}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    logos = {s["school_id"]: s.get("logo") async for s in db.schools.find({"school_id": {"$in": ids}}, {"_id": 0, "school_id": 1, "logo": 1})}
    for d in docs:
        d["school_logo"] = logos.get(d["school_id"])
    return {"results": await reaction_counts(docs, user), "following_count": len(ids)}


# ================= parent: compare / recommendations / reviews / enrollment =================
@router.get("/schools/compare")
async def compare_schools(ids: str):
    id_list = [i for i in ids.split(",") if i][:4]
    docs = await db.schools.find({"school_id": {"$in": id_list}}, {"_id": 0}).to_list(4)
    return {"results": [await decorate(d) for d in docs]}


LEVEL_FROM_CLASS = [("Préscolaire", ["ps", "ms", "gs", "maternelle", "petite", "moyenne", "grande"]),
                    ("Primaire", ["ci", "cp", "ce1", "ce2", "cm1", "cm2", "primaire"]),
                    ("Collège", ["6e", "5e", "4e", "3e", "6ème", "5ème", "4ème", "3ème", "collège", "college"]),
                    ("Lycée", ["2nde", "1ère", "1ere", "tle", "terminale", "seconde", "première", "lycée", "lycee"])]


def level_from_class(cl: str) -> Optional[str]:
    c = (cl or "").lower().strip()
    for lvl, keys in LEVEL_FROM_CLASS:
        if any(k in c for k in keys):
            return lvl
    return None


@router.get("/schools/recommended-for-parent")
async def recommended_for_parent(student_id: Optional[str] = None, user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    prefs = user.get("search_prefs") or {}
    student = None
    if student_id:
        student = await db.students.find_one({"student_id": student_id, "parent_user_id": user["user_id"]}, {"_id": 0})
    level = level_from_class((student or {}).get("class_level", "")) or prefs.get("level")
    region = prefs.get("region") or user.get("city") or ""
    lat, lng = prefs.get("lat"), prefs.get("lng")
    docs = await db.schools.find({"name": {"$exists": True}}, {"_id": 0}).to_list(300)
    out = []
    for s in docs:
        score, reasons = 0, []
        if lat is not None and lng is not None and s.get("lat") is not None:
            d = haversine_km(lat, lng, s["lat"], s["lng"])
            s["distance_km"] = round(d, 1)
            if d <= 5: score += 30; reasons.append(f"située à {round(d, 1)} km")
            elif d <= 15: score += 18; reasons.append(f"à {round(d, 1)} km")
        elif region and (s.get("region", "").lower() == region.lower() or s.get("city", "").lower() == region.lower()):
            score += 25; reasons.append("dans votre zone")
        if level and level in s.get("levels", []):
            score += 30; reasons.append(f"propose le niveau {level}")
        if prefs.get("languages") and set(prefs["languages"]) & set(s.get("languages", [])):
            score += 12; reasons.append("langues souhaitées")
        if prefs.get("services"):
            hits = [x for x in prefs["services"] if any(x.lower() in sv.lower() for sv in s.get("services", []) + s.get("infrastructures", []))]
            if hits: score += min(15, 5 * len(hits)); reasons.append("services : " + ", ".join(hits[:2]))
        if prefs.get("education_system") and prefs["education_system"] in s.get("education_systems", []):
            score += 8; reasons.append("système éducatif")
        if s.get("is_verified"): score += 5
        if s.get("enrollment_open"): score += 5; reasons.append("inscriptions ouvertes")
        s["match_score"] = min(100, score)
        s["match_reasons"] = reasons
        out.append(await decorate(s))
    out.sort(key=lambda x: x["match_score"], reverse=True)
    return {"results": out[:6], "level": level, "student": student}


class SchoolReviewBody(BaseModel):
    school_id: str
    rating: int
    comment: str = ""


@router.post("/schools/reviews")
async def create_school_review(body: SchoolReviewBody, user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER", "EDUCATOR"))):
    school = await db.schools.find_one({"school_id": body.school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="Établissement introuvable")
    if not 1 <= body.rating <= 5:
        raise HTTPException(status_code=400, detail="Note invalide")
    if await db.school_reviews.find_one({"school_id": body.school_id, "author_user_id": user["user_id"]}):
        raise HTTPException(status_code=400, detail="Vous avez déjà évalué cet établissement")
    pair = sorted([user["user_id"], school["user_id"]])
    verified = bool(await db.conversations.find_one({"participants": {"$all": pair, "$size": 2}})) or \
        bool(await db.enrollment_requests.find_one({"school_id": body.school_id, "parent_user_id": user["user_id"]}))
    doc = {"review_id": new_id("srev"), "school_id": body.school_id, "author_user_id": user["user_id"],
           "author_name": user.get("name"), "rating": body.rating, "comment": body.comment.strip(),
           "verified": verified, "status": "Publié", "created_at": now_iso()}
    await db.school_reviews.insert_one(doc)
    await notify(school["user_id"], "school_review", "Nouvel avis sur votre établissement", f"{user.get('name')} a laissé un avis {body.rating}★", f"/ecoles/{school.get('slug')}")
    return {"review": {k: v for k, v in doc.items() if k != "_id"}}


class EnrollmentBody(BaseModel):
    school_id: str
    student_id: Optional[str] = None
    child_name: str = ""
    level: str
    school_year: str
    message: str = ""
    phone: str = ""


ENROLL_STATUSES = ["Envoyée", "Consultée", "En cours", "Acceptée", "Refusée"]


@router.post("/enrollment-requests")
async def create_enrollment(body: EnrollmentBody, user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    school = await db.schools.find_one({"school_id": body.school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="Établissement introuvable")
    if not school.get("accept_enrollment_requests"):
        raise HTTPException(status_code=400, detail="Cet établissement n'accepte pas les demandes d'inscription en ligne")
    child = body.child_name
    if body.student_id:
        st = await db.students.find_one({"student_id": body.student_id, "parent_user_id": user["user_id"]}, {"_id": 0})
        if st:
            child = st["name"]
    doc = {"request_id": new_id("enr"), **body.model_dump(), "child_name": child, "school_user_id": school["user_id"],
           "school_name": school["name"], "school_slug": school.get("slug"), "parent_user_id": user["user_id"],
           "parent_name": user.get("name"), "parent_email": user.get("email"), "status": "Envoyée",
           "timeline": [{"status": "Envoyée", "at": now_iso()}], "created_at": now_iso(), "updated_at": now_iso()}
    await db.enrollment_requests.insert_one(doc)
    await notify(school["user_id"], "enrollment", "Nouvelle demande d'inscription",
                 f"{user.get('name')} — {child} ({body.level}, {body.school_year})", "/dashboard/inscriptions")
    return {"request": {k: v for k, v in doc.items() if k != "_id"}}


@router.get("/enrollment-requests/mine")
async def my_enrollments(user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    docs = await db.enrollment_requests.find({"parent_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"results": docs}


@router.get("/enrollment-requests/received")
async def received_enrollments(user: dict = Depends(require_roles("SCHOOL"))):
    docs = await db.enrollment_requests.find({"school_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(300)
    return {"results": docs}


@router.put("/enrollment-requests/{request_id}/status")
async def enrollment_status(request_id: str, body: ProposalStatusBody, user: dict = Depends(require_roles("SCHOOL"))):
    if body.status not in ENROLL_STATUSES:
        raise HTTPException(status_code=400, detail="Statut invalide")
    r = await db.enrollment_requests.find_one({"request_id": request_id, "school_user_id": user["user_id"]}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    await db.enrollment_requests.update_one({"request_id": request_id}, {"$set": {"status": body.status, "updated_at": now_iso()},
                                                                         "$push": {"timeline": {"status": body.status, "at": now_iso()}}})
    await notify(r["parent_user_id"], "enrollment_status", "Demande d'inscription mise à jour",
                 f"{r['school_name']} : {r['child_name']} — {body.status}", "/dashboard/inscriptions")
    return {"message": "ok"}


# ================= parent profile =================
class ParentProfileBody(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    preferred_language: Optional[str] = None
    search_prefs: Optional[dict] = None
    privacy: Optional[dict] = None
    notification_prefs: Optional[dict] = None
    learner_profile: Optional[dict] = None


@router.put("/users/me/profile")
async def update_my_profile(body: ParentProfileBody, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if "name" in data and not data["name"].strip():
        raise HTTPException(status_code=400, detail="Nom requis")
    data["updated_at"] = now_iso()
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": data})
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return {"user": u}


@router.get("/parent/overview")
async def parent_overview(user: dict = Depends(require_roles("PARENT", "ADULT_LEARNER"))):
    uid = user["user_id"]
    follows = await db.school_follows.find({"user_id": uid}, {"_id": 0, "school_id": 1}).to_list(200)
    ids = [f["school_id"] for f in follows]
    since = user.get("last_feed_seen") or "1970"
    new_posts = await db.school_posts.count_documents({"school_id": {"$in": ids}, "created_at": {"$gt": since}}) if ids else 0
    convs = await db.conversations.find({"participants": uid}, {"_id": 0, "conversation_id": 1}).to_list(200)
    return {"students": await db.students.count_documents({"parent_user_id": uid}),
            "following": len(ids),
            "favorite_schools": await db.favorites.count_documents({"user_id": uid, "target_type": "school"}),
            "favorite_educators": await db.favorites.count_documents({"user_id": uid, "target_type": "educator"}),
            "new_posts": new_posts,
            "pending_requests": await db.enrollment_requests.count_documents({"parent_user_id": uid, "status": {"$in": ["Envoyée", "Consultée", "En cours"]}})
            + await db.tutoring_requests.count_documents({"requester_user_id": uid, "status": "Ouverte"}),
            "conversations": len(convs)}


# ================= post reactions (likes + comments) =================
async def reaction_counts(posts: list, viewer: Optional[dict]):
    ids = [p["post_id"] for p in posts]
    if not ids:
        return posts
    likes = {d["_id"]: d["n"] async for d in db.post_likes.aggregate([{"$match": {"post_id": {"$in": ids}}}, {"$group": {"_id": "$post_id", "n": {"$sum": 1}}}])}
    comments = {d["_id"]: d["n"] async for d in db.post_comments.aggregate([{"$match": {"post_id": {"$in": ids}}}, {"$group": {"_id": "$post_id", "n": {"$sum": 1}}}])}
    mine = set()
    if viewer:
        mine = {d["post_id"] async for d in db.post_likes.find({"post_id": {"$in": ids}, "user_id": viewer["user_id"]}, {"_id": 0, "post_id": 1})}
    for p in posts:
        p["likes_count"] = likes.get(p["post_id"], 0)
        p["comments_count"] = comments.get(p["post_id"], 0)
        p["liked"] = p["post_id"] in mine
    return posts


@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, user: dict = Depends(get_current_user)):
    post = await db.school_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Publication introuvable")
    existing = await db.post_likes.find_one({"post_id": post_id, "user_id": user["user_id"]})
    if existing:
        await db.post_likes.delete_one({"_id": existing["_id"]})
    else:
        await db.post_likes.insert_one({"post_id": post_id, "user_id": user["user_id"], "created_at": now_iso()})
    return {"liked": not existing, "likes_count": await db.post_likes.count_documents({"post_id": post_id})}


class CommentBody(BaseModel):
    content: str


@router.get("/posts/{post_id}/comments")
async def list_comments(post_id: str):
    docs = await db.post_comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"results": docs}


@router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, body: CommentBody, user: dict = Depends(get_current_user)):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Commentaire vide")
    post = await db.school_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Publication introuvable")
    is_school = user["user_id"] == post["school_user_id"]
    doc = {"comment_id": new_id("cmt"), "post_id": post_id, "user_id": user["user_id"], "author_name": post["school_name"] if is_school else user.get("name"),
           "author_avatar": user.get("avatar_url"), "is_school": is_school, "content": body.content.strip()[:1000], "created_at": now_iso()}
    await db.post_comments.insert_one(doc)
    link = f"/ecoles/{post.get('school_slug')}#actualites"
    if is_school:
        others = {c["user_id"] async for c in db.post_comments.find({"post_id": post_id, "is_school": False}, {"_id": 0, "user_id": 1})}
        for uid in others:
            await notify(uid, "post_reply", f"{post['school_name']} a répondu", f"Sur « {post['title']} » : {doc['content'][:80]}", link)
    else:
        await notify(post["school_user_id"], "post_comment", "Nouveau commentaire", f"{user.get('name')} sur « {post['title']} » : {doc['content'][:80]}", "/dashboard/actualites")
    return {"comment": {k: v for k, v in doc.items() if k != "_id"}}


@router.delete("/posts/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: str, comment_id: str, user: dict = Depends(get_current_user)):
    post = await db.school_posts.find_one({"post_id": post_id}, {"_id": 0, "school_user_id": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Publication introuvable")
    q = {"comment_id": comment_id, "post_id": post_id}
    if user["user_id"] != post["school_user_id"] and user.get("role") != "ADMIN":
        q["user_id"] = user["user_id"]
    r = await db.post_comments.delete_one(q)
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Commentaire introuvable")
    return {"message": "Supprimé"}


# ================= learner (ADULT_LEARNER) =================
FORMATION_TYPES = ["Centre de formation", "Établissement professionnel"]
LEARNER_LEVEL_MAP = {"Collège": "Collège", "Lycée": "Lycée", "Formation professionnelle": "Formation professionnelle",
                     "Licence": "Formation professionnelle", "Master": "Formation professionnelle", "Doctorat": "Formation professionnelle", "Autre": None}


@router.get("/learner/overview")
async def learner_overview(user: dict = Depends(require_roles("ADULT_LEARNER", "PARENT"))):
    uid = user["user_id"]
    return {"bookings": await db.bookings.count_documents({"client_user_id": uid}),
            "requests": await db.tutoring_requests.count_documents({"requester_user_id": uid}),
            "favorite_educators": await db.favorites.count_documents({"user_id": uid, "target_type": "educator"}),
            "favorite_schools": await db.favorites.count_documents({"user_id": uid, "target_type": "school"}),
            "following": await db.school_follows.count_documents({"user_id": uid}),
            "searches": await db.zone_alerts.count_documents({"user_id": uid}),
            "enrollments": await db.enrollment_requests.count_documents({"parent_user_id": uid})}


@router.get("/learner/recommendations")
async def learner_recommendations(user: dict = Depends(require_roles("ADULT_LEARNER", "PARENT"))):
    lp = user.get("learner_profile") or {}
    subjects = set(lp.get("subjects", []))
    region = (lp.get("location") or user.get("city") or "").strip()
    level = LEARNER_LEVEL_MAP.get(lp.get("study_level", ""), None)
    edus = await db.educator_profiles.find({"active": True}, {"_id": 0}).to_list(300)
    users = {u["user_id"]: u async for u in db.users.find({"user_id": {"$in": [e["user_id"] for e in edus]}}, {"_id": 0, "user_id": 1, "name": 1, "avatar_url": 1})}
    edu_out = []
    for e in edus:
        score, reasons = 0, []
        common = subjects & set(e.get("subjects", []))
        if common: score += 45; reasons.append(", ".join(list(common)[:2]))
        if level and level in e.get("levels", []): score += 20; reasons.append(f"niveau {level}")
        if region and region.lower() in (e.get("region", "") + " " + e.get("location", "")).lower(): score += 25; reasons.append("près de vous")
        if e.get("is_verified"): score += 5
        if (e.get("rating") or 0) >= 4.5: score += 5
        u = users.get(e["user_id"], {})
        edu_out.append({"user_id": e["user_id"], "name": u.get("name"), "avatar_url": u.get("avatar_url"), "photo": e.get("photo"), "profession": e.get("profession"),
                        "subjects": e.get("subjects", []), "region": e.get("region"), "location": e.get("location"), "hourly_rate": e.get("hourly_rate"),
                        "rating": e.get("rating", 0), "reviews_count": e.get("reviews_count", 0), "is_verified": e.get("is_verified", False),
                        "match_score": min(100, score), "match_reasons": reasons})
    edu_out.sort(key=lambda x: x["match_score"], reverse=True)
    schools = await db.schools.find({"name": {"$exists": True}}, {"_id": 0}).to_list(300)
    sch_out, form_out = [], []
    for s in schools:
        score, reasons = 0, []
        if region and region.lower() in (s.get("region", "") + " " + s.get("city", "")).lower(): score += 30; reasons.append("dans votre zone")
        if level and level in s.get("levels", []): score += 30; reasons.append(f"niveau {level}")
        if subjects & set(s.get("subjects", [])): score += 20; reasons.append("vos matières")
        if lp.get("field") and lp["field"].lower() in (s.get("description", "") + " " + s.get("programs", "")).lower(): score += 15; reasons.append("votre filière")
        if s.get("enrollment_open"): score += 5; reasons.append("inscriptions ouvertes")
        if s.get("is_verified"): score += 5
        s["match_score"] = min(100, score); s["match_reasons"] = reasons
        d = await decorate(s)
        (form_out if s.get("school_type") in FORMATION_TYPES or "Formation professionnelle" in s.get("levels", []) else sch_out).append(d)
    sch_out.sort(key=lambda x: x["match_score"], reverse=True); form_out.sort(key=lambda x: x["match_score"], reverse=True)
    return {"educators": edu_out[:4], "schools": sch_out[:3], "formations": form_out[:3]}


@router.get("/support/contact")
async def support_contact():
    admin = await db.users.find_one({"role": "ADMIN"}, {"_id": 0, "user_id": 1, "name": 1})
    if not admin:
        raise HTTPException(status_code=404, detail="Support indisponible")
    return {"user_id": admin["user_id"], "name": "Support ASKOOL"}
