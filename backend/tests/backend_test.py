"""ASKOOL backend API test suite (pytest)."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://askool-edu.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "pubsn01@gmail.com", "password": "Askool2026!"}
DEMO_EDU = {"email": "awa.ndiaye@askool.sn", "password": "Askool2026!"}
DEMO_SCHOOL = {"email": "contact.groupe0@askool.sn", "password": "Askool2026!"}
DEMO_PARENT = {"email": "parent@askool.sn", "password": "Askool2026!"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed for {creds['email']}: {r.status_code} {r.text}"
    d = r.json()
    return d["access_token"], d["user"]


def _hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------------- session-scoped tokens ----------------
@pytest.fixture(scope="session")
def admin_tok():
    tok, _ = _login(ADMIN)
    return tok


@pytest.fixture(scope="session")
def edu_tok():
    tok, u = _login(DEMO_EDU)
    return tok, u


@pytest.fixture(scope="session")
def school_tok():
    tok, u = _login(DEMO_SCHOOL)
    return tok, u


@pytest.fixture(scope="session")
def parent_tok():
    tok, u = _login(DEMO_PARENT)
    return tok, u


# ---------------- meta / public ----------------
class TestPublic:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_meta(self):
        r = requests.get(f"{API}/meta")
        assert r.status_code == 200
        d = r.json()
        for k in ("subjects", "levels", "regions", "service_types", "diplomas"):
            assert k in d and len(d[k]) > 0

    def test_list_educators_seeded(self):
        r = requests.get(f"{API}/educators")
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 1
        assert len(d["results"]) >= 1

    def test_list_educators_filter(self):
        r = requests.get(f"{API}/educators", params={"verified_only": True, "sort": "rating", "page": 1})
        assert r.status_code == 200
        d = r.json()
        for e in d["results"]:
            assert e.get("is_verified") is True

    def test_educator_detail(self):
        r = requests.get(f"{API}/educators")
        first = r.json()["results"][0]
        uid = first["user_id"]
        r2 = requests.get(f"{API}/educators/{uid}")
        assert r2.status_code == 200
        d = r2.json()
        assert d["profile"]["user_id"] == uid
        assert "reviews" in d
        # views increment
        views_before = d["profile"].get("views", 0)
        requests.get(f"{API}/educators/{uid}")
        r3 = requests.get(f"{API}/educators/{uid}")
        assert r3.json()["profile"].get("views", 0) >= views_before + 1

    def test_list_jobs_seeded(self):
        r = requests.get(f"{API}/jobs")
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 1
        assert len(d["results"]) >= 1

    def test_job_detail(self):
        r = requests.get(f"{API}/jobs")
        first = r.json()["results"][0]
        r2 = requests.get(f"{API}/jobs/{first['offer_id']}")
        assert r2.status_code == 200
        assert r2.json()["job"]["offer_id"] == first["offer_id"]

    def test_plans(self):
        r = requests.get(f"{API}/plans")
        assert r.status_code == 200
        p = r.json()["plans"]
        assert "educator" in p and "school" in p


# ---------------- auth ----------------
class TestAuth:
    def test_admin_login(self):
        r = requests.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["role"] == "ADMIN"
        assert u["email"] == ADMIN["email"]

    def test_me(self):
        tok, _ = _login(DEMO_EDU)
        r = requests.get(f"{API}/auth/me", headers=_hdr(tok))
        assert r.status_code == 200
        assert r.json()["user"]["email"] == DEMO_EDU["email"]

    def test_register_educator(self):
        email = f"test.edu.{uuid.uuid4().hex[:8]}@askool.sn"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "name": "Test Edu", "role": "EDUCATOR",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["email"] == email
        assert d["user"]["role"] == "EDUCATOR"
        assert "access_token" in d
        # unique
        r2 = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "name": "dup", "role": "EDUCATOR"})
        assert r2.status_code == 400

    def test_register_parent_and_school(self):
        for role in ("PARENT", "SCHOOL"):
            email = f"test.{role.lower()}.{uuid.uuid4().hex[:8]}@askool.sn"
            r = requests.post(f"{API}/auth/register", json={
                "email": email, "password": "Passw0rd!", "name": f"T {role}", "role": role})
            assert r.status_code == 200, r.text
            assert r.json()["user"]["role"] == role

    def test_forgot_password_generic(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": "nobody@askool.sn"})
        assert r.status_code == 200
        assert "message" in r.json()

    def test_logout(self):
        tok, _ = _login(DEMO_EDU)
        s = requests.Session()
        s.headers.update(_hdr(tok))
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200


# ---------------- RBAC ----------------
class TestRBAC:
    def test_educator_cannot_post_job(self, edu_tok):
        tok, _ = edu_tok
        r = requests.post(f"{API}/jobs", headers=_hdr(tok), json={"title": "X"})
        assert r.status_code == 403

    def test_school_cannot_apply(self, school_tok):
        tok, _ = school_tok
        r = requests.post(f"{API}/applications", headers=_hdr(tok),
                          json={"offer_id": "x", "message": ""})
        assert r.status_code == 403

    def test_non_admin_stats(self, edu_tok):
        tok, _ = edu_tok
        r = requests.get(f"{API}/admin/stats", headers=_hdr(tok))
        assert r.status_code == 403

    def test_unauth_me(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------------- educator flow ----------------
class TestEducatorFlow:
    def test_upsert_educator_profile(self, edu_tok):
        tok, _ = edu_tok
        body = {"profession": "Prof Maths", "bio": "Bio test", "region": "Dakar",
                "subjects": ["Mathématiques"], "levels": ["Lycée"], "hourly_rate": 5000,
                "experience_years": 5, "services": ["Cours à domicile"], "available_now": True}
        r = requests.put(f"{API}/educators/me", headers=_hdr(tok), json=body)
        assert r.status_code == 200, r.text
        assert r.json()["profile"]["profession"] == "Prof Maths"
        r2 = requests.get(f"{API}/educators/me", headers=_hdr(tok))
        assert r2.status_code == 200
        assert r2.json()["profile"]["profession"] == "Prof Maths"

    def test_apply_and_status(self, edu_tok, school_tok):
        etok, eu = edu_tok
        stok, su = school_tok
        # ensure school profile
        requests.put(f"{API}/schools/me", headers=_hdr(stok),
                     json={"name": "Test School", "region": "Dakar"})
        # school creates a job
        r = requests.post(f"{API}/jobs", headers=_hdr(stok), json={
            "title": f"TEST_OFFER_{uuid.uuid4().hex[:6]}", "subject": "Mathématiques",
            "level": "Lycée", "region": "Dakar", "contract_type": "CDD",
            "description": "test", "status": "published"})
        assert r.status_code == 200, r.text
        offer_id = r.json()["job"]["offer_id"]

        # educator applies
        r2 = requests.post(f"{API}/applications", headers=_hdr(etok),
                           json={"offer_id": offer_id, "message": "Bonjour"})
        assert r2.status_code == 200, r2.text
        app_id = r2.json()["application"]["application_id"]

        # duplicate application blocked
        r_dup = requests.post(f"{API}/applications", headers=_hdr(etok),
                              json={"offer_id": offer_id, "message": "again"})
        assert r_dup.status_code == 400

        # educator sees applications
        rm = requests.get(f"{API}/applications/mine", headers=_hdr(etok))
        assert rm.status_code == 200
        assert any(a["application_id"] == app_id for a in rm.json()["results"])

        # school sees received
        rs = requests.get(f"{API}/applications/received", headers=_hdr(stok))
        assert rs.status_code == 200
        assert any(a["application_id"] == app_id for a in rs.json()["results"])

        # update status
        ru = requests.put(f"{API}/applications/{app_id}/status", headers=_hdr(stok),
                         json={"status": "Présélectionnée"})
        assert ru.status_code == 200

        # school mine jobs
        rj = requests.get(f"{API}/jobs/mine", headers=_hdr(stok))
        assert rj.status_code == 200
        assert any(j["offer_id"] == offer_id for j in rj.json()["results"])


# ---------------- parent flow ----------------
class TestParentFlow:
    def test_students_and_tutoring(self, parent_tok):
        tok, _ = parent_tok
        r = requests.post(f"{API}/students", headers=_hdr(tok),
                          json={"name": "TEST_Kid", "class_level": "Terminale", "subjects": ["Mathématiques"]})
        assert r.status_code == 200
        sid = r.json()["student"]["student_id"]
        r2 = requests.get(f"{API}/students", headers=_hdr(tok))
        assert any(s["student_id"] == sid for s in r2.json()["results"])

        rt = requests.post(f"{API}/tutoring-requests", headers=_hdr(tok), json={
            "subject": "Mathématiques", "level": "Terminale", "region": "Dakar",
            "hours": 2, "budget": 6000, "student_id": sid})
        assert rt.status_code == 200
        rid = rt.json()["request"]["request_id"]

        rm = requests.get(f"{API}/tutoring-requests/mine", headers=_hdr(tok))
        assert any(x["request_id"] == rid for x in rm.json()["results"])

        rmt = requests.get(f"{API}/tutoring-requests/{rid}/matches", headers=_hdr(tok))
        assert rmt.status_code == 200
        res = rmt.json()["results"]
        assert len(res) >= 1
        assert "match_score" in res[0] and "match_reasons" in res[0]


# ---------------- bookings, reviews, favorites ----------------
class TestBookingReviewFavorites:
    def test_flow(self, parent_tok):
        tok, _ = parent_tok
        # get an educator id
        eds = requests.get(f"{API}/educators").json()["results"]
        assert eds
        eid = eds[0]["user_id"]

        # booking
        rb = requests.post(f"{API}/bookings", headers=_hdr(tok), json={
            "educator_user_id": eid, "date": "2026-02-01", "time": "10:00",
            "subject": "Mathématiques", "mode": "Présentiel"})
        assert rb.status_code == 200
        bid = rb.json()["booking"]["booking_id"]

        rl = requests.get(f"{API}/bookings/mine", headers=_hdr(tok))
        assert rl.status_code == 200
        assert any(b["booking_id"] == bid for b in rl.json()["results"])

        rs = requests.put(f"{API}/bookings/{bid}/status", headers=_hdr(tok),
                          json={"status": "Confirmé"})
        assert rs.status_code == 200

        # review
        rr = requests.post(f"{API}/reviews", headers=_hdr(tok), json={
            "educator_user_id": eid, "rating": 5, "comment": "TEST_review"})
        assert rr.status_code == 200

        # verify aggregate in profile
        rp = requests.get(f"{API}/educators/{eid}")
        assert rp.json()["profile"].get("reviews_count", 0) >= 1

        # favorite toggle
        rf = requests.post(f"{API}/favorites", headers=_hdr(tok),
                           json={"target_type": "educator", "target_id": eid})
        assert rf.status_code == 200
        first = rf.json()["favorited"]
        rf2 = requests.post(f"{API}/favorites", headers=_hdr(tok),
                            json={"target_type": "educator", "target_id": eid})
        assert rf2.json()["favorited"] != first


# ---------------- messaging + notifications ----------------
class TestMessagingNotifications:
    def test_messaging(self, edu_tok, parent_tok):
        etok, eu = edu_tok
        ptok, pu = parent_tok
        r = requests.post(f"{API}/messages", headers=_hdr(ptok), json={
            "recipient_user_id": eu["user_id"], "content": "Bonjour TEST"})
        assert r.status_code == 200
        conv_id = r.json()["conversation_id"]

        rc = requests.get(f"{API}/conversations", headers=_hdr(ptok))
        assert any(c["conversation_id"] == conv_id for c in rc.json()["results"])

        rm = requests.get(f"{API}/conversations/{conv_id}/messages", headers=_hdr(etok))
        assert rm.status_code == 200
        assert any("Bonjour TEST" in m["content"] for m in rm.json()["results"])

    def test_notifications(self, edu_tok):
        tok, _ = edu_tok
        r = requests.get(f"{API}/notifications", headers=_hdr(tok))
        assert r.status_code == 200
        d = r.json()
        assert "results" in d and "unread" in d
        r2 = requests.put(f"{API}/notifications/read", headers=_hdr(tok))
        assert r2.status_code == 200


# ---------------- verification + admin ----------------
class TestAdminVerification:
    def test_verification_and_admin(self, edu_tok, admin_tok):
        etok, eu = edu_tok
        r = requests.post(f"{API}/verifications", headers=_hdr(etok),
                          json={"documents": [{"type": "diploma", "url": "test"}]})
        assert r.status_code == 200
        vid = r.json()["verification"]["verification_id"]

        # admin views
        ra = requests.get(f"{API}/admin/verifications", headers=_hdr(admin_tok))
        assert ra.status_code == 200
        assert any(v["verification_id"] == vid for v in ra.json()["results"])

        # admin approves
        ru = requests.put(f"{API}/admin/verifications/{vid}", headers=_hdr(admin_tok),
                          json={"status": "Vérifié"})
        assert ru.status_code == 200

        # profile now verified
        rp = requests.get(f"{API}/educators/{eu['user_id']}")
        assert rp.json()["profile"].get("is_verified") is True

    def test_admin_stats_and_users(self, admin_tok):
        r = requests.get(f"{API}/admin/stats", headers=_hdr(admin_tok))
        assert r.status_code == 200
        d = r.json()
        for k in ("users_total", "schools", "educators", "jobs", "applications"):
            assert k in d
        ru = requests.get(f"{API}/admin/users", headers=_hdr(admin_tok))
        assert ru.status_code == 200
        assert len(ru.json()["results"]) >= 1


# ---------------- subscriptions ----------------
class TestSubscriptions:
    def test_subscribe(self, edu_tok):
        tok, _ = edu_tok
        r = requests.post(f"{API}/subscriptions", headers=_hdr(tok),
                          json={"plan": "Premium", "audience": "educator"})
        assert r.status_code == 200
        d = r.json()
        assert d["subscription"]["status"] == "pending_payment"
        assert d["subscription"]["payment_method"] == "mobile_money"
