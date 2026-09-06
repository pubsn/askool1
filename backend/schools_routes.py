import re
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
            "contract_types": SCHOOL_CONTRACTS, "proposal_types": SERVICE_PROPOSAL_TYPES, "visibility": VISIBILITY}


# ================= directory =================
@router.get("/schools")
async def list_schools(q: Optional[str] = None, region: Optional[str] = None, city: Optional[str] = None,
                       district: Optional[str] = None, school_type: Optional[str] = None, level: Optional[str] = None,
                       subject: Optional[str] = None, recruiting: Optional[str] = None, contract_type: Optional[str] = None,
                       verified_only: bool = False, page: int = 1, page_size: int = 12):
    query: dict = {"name": {"$exists": True}}
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
    return {"school": school, "contact": contact, "offers": offers, "similar": [await decorate(s) for s in similar],
            "is_favorite": is_favorite, "is_following": is_following}


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
                                        "school_user_id": school["user_id"], "created_at": now_iso()})
    return {"following": True}


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
POST_CATEGORIES = ["Actualité", "Événement", "Besoin de recrutement", "Annonce"]


class PostBody(BaseModel):
    title: str
    content: str
    category: str = "Actualité"
    image: Optional[str] = None


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
           "school_name": school["name"], "school_slug": school.get("slug"), **body.model_dump(), "created_at": now_iso()}
    await db.school_posts.insert_one(doc)
    notified = 0
    async for f in db.school_follows.find({"school_id": school["school_id"]}, {"_id": 0, "user_id": 1}):
        await notify(f["user_id"], "school_post", f"{body.category} — {school['name']}", body.title, f"/ecoles/{school.get('slug')}#actualites")
        notified += 1
    return {"post": {k: v for k, v in doc.items() if k != "_id"}, "notified": notified}


@router.get("/schools/me/posts")
async def my_posts(user: dict = Depends(require_roles("SCHOOL"))):
    docs = await db.school_posts.find({"school_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"results": docs}


@router.delete("/schools/me/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(require_roles("SCHOOL"))):
    r = await db.school_posts.delete_one({"post_id": post_id, "school_user_id": user["user_id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Actualité introuvable")
    return {"message": "Supprimée"}


@router.get("/schools/{school_id}/posts")
async def school_posts(school_id: str):
    docs = await db.school_posts.find({"school_id": school_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"results": docs}
