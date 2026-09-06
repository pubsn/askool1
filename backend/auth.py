import os
import uuid
import hashlib
import secrets
import bcrypt
import jwt
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Response, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, EmailStr

from database import db
from email_service import send_password_reset_email, send_verification_email

JWT_ALGORITHM = "HS256"
ROLES = ["ADMIN", "SCHOOL", "EDUCATOR", "PARENT", "ADULT_LEARNER"]

router = APIRouter(prefix="/api/auth")


# ---------- password ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ---------- jwt ----------
def _secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, ver: int = 0) -> str:
    payload = {"sub": user_id, "email": email, "ver": ver,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str, ver: int = 0) -> str:
    payload = {"sub": user_id, "ver": ver,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def _set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def _public_user(u: dict) -> dict:
    return {
        "user_id": u["user_id"], "email": u["email"], "name": u.get("name", ""),
        "role": u.get("role"), "roles": u.get("roles", [u.get("role")]),
        "avatar_url": u.get("avatar_url"), "email_verified": u.get("email_verified", False),
        "is_premium": u.get("is_premium", False), "phone": u.get("phone"),
        "created_at": u.get("created_at"), "city": u.get("city", ""), "preferred_language": u.get("preferred_language", ""),
        "search_prefs": u.get("search_prefs", {}), "privacy": u.get("privacy", {}), "notification_prefs": u.get("notification_prefs", {}), "learner_profile": u.get("learner_profile", {}),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Type de jeton invalide")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        if payload.get("ver", 0) != user.get("token_version", 0):
            raise HTTPException(status_code=401, detail="Session expirée")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Jeton expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Jeton invalide")


def require_roles(*allowed):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        role = user.get("role")
        if allowed and role not in allowed and role != "ADMIN":
            raise HTTPException(status_code=403, detail="Accès refusé pour votre rôle")
        return user
    return checker


# ---------- schemas ----------
class RegisterBody(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "EDUCATOR"
    phone: str | None = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ForgotBody(BaseModel):
    email: EmailStr


class ResetBody(BaseModel):
    token: str
    password: str


# ---------- brute force ----------
async def _locked_out(ip: str, email: str) -> bool:
    since = datetime.now(timezone.utc) - timedelta(minutes=15)
    count = await db.login_attempts.count_documents({
        "identifier": f"{ip}:{email}",
        "created_at": {"$gt": since.isoformat()},
    })
    return count >= 5


# ---------- endpoints ----------
@router.post("/register")
async def register(body: RegisterBody, response: Response, background_tasks: BackgroundTasks):
    email = body.email.lower().strip()
    role = body.role if body.role in ROLES else "EDUCATOR"
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    user_id = f"user_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc).isoformat()
    user = {
        "user_id": user_id, "email": email, "password_hash": hash_password(body.password),
        "name": body.name, "role": role, "roles": [role], "phone": body.phone,
        "avatar_url": None, "email_verified": False, "is_premium": False,
        "token_version": 0, "created_at": now, "deleted": False,
    }
    await db.users.insert_one(user)

    # email verification token
    vtoken = secrets.token_urlsafe(32)
    await db.email_verification_tokens.insert_one({
        "token_hash": hashlib.sha256(vtoken.encode()).hexdigest(),
        "user_id": user_id, "email": email,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)),
        "used": False,
    })
    background_tasks.add_task(send_verification_email, email, vtoken, body.name)

    access = create_access_token(user_id, email, 0)
    refresh = create_refresh_token(user_id, 0)
    _set_auth_cookies(response, access, refresh)
    return {"user": _public_user(user), "access_token": access}


@router.post("/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    if await _locked_out(ip, email):
        raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez dans 15 minutes.")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.insert_one({
            "identifier": f"{ip}:{email}", "email": email,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    await db.login_attempts.delete_many({"email": email})
    ver = user.get("token_version", 0)
    access = create_access_token(user["user_id"], email, ver)
    refresh = create_refresh_token(user["user_id"], ver)
    _set_auth_cookies(response, access, refresh)
    return {"user": _public_user(user), "access_token": access}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Déconnecté"}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": _public_user(user)}


@router.post("/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Pas de jeton de rafraîchissement")
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Type invalide")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user or payload.get("ver", 0) != user.get("token_version", 0):
            raise HTTPException(status_code=401, detail="Session expirée")
        ver = user.get("token_version", 0)
        access = create_access_token(user["user_id"], user["email"], ver)
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        return {"user": _public_user(user), "access_token": access}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Jeton invalide")


@router.post("/forgot-password")
async def forgot_password(body: ForgotBody, background_tasks: BackgroundTasks):
    email = body.email.lower().strip()
    generic = {"message": "Si cet email est enregistré, un lien de réinitialisation a été envoyé."}
    now = datetime.now(timezone.utc)
    await db.password_reset_requests.insert_one({"email": email, "created_at": now.isoformat()})
    since = now - timedelta(minutes=15)
    recent = await db.password_reset_requests.count_documents({"email": email, "created_at": {"$gt": since.isoformat()}})
    if recent > 5:
        return generic
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return generic
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token_hash": hashlib.sha256(token.encode()).hexdigest(),
        "user_id": user["user_id"], "email": email,
        "expires_at": (now + timedelta(hours=1)), "used": False,
    })
    background_tasks.add_task(send_password_reset_email, user["email"], token)
    return generic


@router.post("/reset-password")
async def reset_password(body: ResetBody):
    h = hashlib.sha256(body.token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    doc = await db.password_reset_tokens.find_one_and_update(
        {"token_hash": h, "used": False, "expires_at": {"$gt": now}},
        {"$set": {"used": True}},
    )
    if not doc:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré")
    await db.users.update_one(
        {"user_id": doc["user_id"]},
        {"$set": {"password_hash": hash_password(body.password)}, "$inc": {"token_version": 1}},
    )
    await db.password_reset_tokens.delete_many({"user_id": doc["user_id"], "used": False})
    await db.login_attempts.delete_many({"email": doc["email"]})
    return {"message": "Mot de passe mis à jour. Vous pouvez vous connecter."}


@router.post("/verify-email")
async def verify_email(body: dict):
    token = (body or {}).get("token", "")
    h = hashlib.sha256(token.encode()).hexdigest()
    doc = await db.email_verification_tokens.find_one_and_update(
        {"token_hash": h, "used": False, "expires_at": {"$gt": datetime.now(timezone.utc)}},
        {"$set": {"used": True}},
    )
    if not doc:
        raise HTTPException(status_code=400, detail="Lien de vérification invalide ou expiré")
    await db.users.update_one({"user_id": doc["user_id"]}, {"$set": {"email_verified": True}})
    return {"message": "Email vérifié avec succès"}


# ---------- google oauth (Emergent) ----------
class SessionBody(BaseModel):
    session_id: str
    role: str | None = None


@router.post("/session")
async def google_session(body: SessionBody, response: Response):
    async with httpx.AsyncClient(timeout=30) as clientx:
        resp = await clientx.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Session Google invalide")
    data = resp.json()
    email = data["email"].lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:16]}"
        role = body.role if body.role in ROLES else "EDUCATOR"
        user = {
            "user_id": user_id, "email": email, "password_hash": None,
            "name": data.get("name", ""), "role": role, "roles": [role], "phone": None,
            "avatar_url": data.get("picture"), "email_verified": True, "is_premium": False,
            "token_version": 0, "created_at": datetime.now(timezone.utc).isoformat(), "deleted": False,
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({"user_id": user["user_id"]},
                                  {"$set": {"avatar_url": user.get("avatar_url") or data.get("picture"),
                                            "email_verified": True}})
    ver = user.get("token_version", 0)
    access = create_access_token(user["user_id"], email, ver)
    refresh = create_refresh_token(user["user_id"], ver)
    _set_auth_cookies(response, access, refresh)
    return {"user": _public_user(user), "access_token": access}


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower().strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    if not admin_email:
        return
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:16]}", "email": admin_email,
            "password_hash": hash_password(admin_password), "name": "Administrateur ASKOOL",
            "role": "ADMIN", "roles": ["ADMIN"], "phone": None, "avatar_url": None,
            "email_verified": True, "is_premium": True, "token_version": 0,
            "created_at": datetime.now(timezone.utc).isoformat(), "deleted": False,
        })
    elif not verify_password(admin_password, existing.get("password_hash") or ""):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password), "role": "ADMIN"}})
