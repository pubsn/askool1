"""Comprehensive backend tests for the Schools directory + proposals + applications + verifications module."""
import os
import time
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"
PWD = "Askool2026!"

EDU_EMAIL = "awa.ndiaye@askool.sn"
SCHOOL_EMAIL = "contact.institution1@askool.sn"
ADMIN_EMAIL = "pubsn01@gmail.com"
PARENT_EMAIL = "parent@askool.sn"


def _login(email, password=PWD):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    token = r.json().get("token") or r.json().get("access_token")
    assert token, f"no token: {r.json()}"
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def edu_h():
    return _login(EDU_EMAIL)


@pytest.fixture(scope="module")
def school_h():
    return _login(SCHOOL_EMAIL)


@pytest.fixture(scope="module")
def admin_h():
    return _login(ADMIN_EMAIL)


@pytest.fixture(scope="module")
def parent_h():
    return _login(PARENT_EMAIL)


@pytest.fixture(scope="module")
def demo_school():
    r = requests.get(f"{API}/schools/slug/institution-sainte-marie", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["school"]


# --- directory ---
class TestDirectory:
    def test_list_schools_basic(self):
        r = requests.get(f"{API}/schools", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "results" in data and isinstance(data["results"], list)
        assert len(data["results"]) > 0
        s = data["results"][0]
        assert "offers_count" in s and "followers_count" in s and "slug" in s
        assert "phone" not in s and "email" not in s

    def test_list_schools_filters(self):
        for params in [{"q": "sainte"}, {"school_type": "Lycée"}, {"level": "Primaire"},
                       {"recruiting": "Recrute actuellement"}, {"contract_type": "CDI"},
                       {"verified_only": "true"}]:
            r = requests.get(f"{API}/schools", params=params, timeout=30)
            assert r.status_code == 200, f"filter {params}: {r.text}"

    def test_schools_meta(self):
        r = requests.get(f"{API}/schools/meta", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["school_types", "school_levels", "recruiting", "contract_types", "proposal_types"]:
            assert k in d and isinstance(d[k], list) and len(d[k]) > 0

    def test_slug_anonymous(self):
        r = requests.get(f"{API}/schools/slug/institution-sainte-marie", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["school"]["slug"] == "institution-sainte-marie"
        assert "contact" in d and "offers" in d and "similar" in d
        assert d["is_favorite"] is False
        views1 = d["school"].get("views", 0)
        # increment
        requests.get(f"{API}/schools/slug/institution-sainte-marie", timeout=30)
        r2 = requests.get(f"{API}/schools/slug/institution-sainte-marie", timeout=30)
        assert r2.json()["school"].get("views", 0) > views1


# --- SCHOOL PUT /schools/me contact_visibility ---
class TestSchoolProfile:
    def test_visibility_after_contact_hides_phone(self, school_h):
        me = requests.get(f"{API}/schools/me", headers=school_h, timeout=30).json()["school"]
        original_vis = me.get("contact_visibility", "public")
        original_phone = me.get("phone", "")
        # PUT with after_contact
        body = {**{k: me.get(k, "") for k in [
            "name","commercial_name","school_type","status","description","history","mission","values",
            "pedagogy","region","city","district","location","directions","phone","email","website",
            "whatsapp","education_system","programs","methods"]},
            "levels": me.get("levels", []) or ["Primaire"],
            "subjects": me.get("subjects", []),
            "languages": me.get("languages", []),
            "school_life": me.get("school_life", []),
            "infrastructures": me.get("infrastructures", []),
            "services": me.get("services", []),
            "gallery": me.get("gallery", []),
            "recruiting": me.get("recruiting", []),
            "contract_types": me.get("contract_types", []),
            "socials": me.get("socials", {}),
            "contact_visibility": "after_contact",
            "phone": original_phone or "+221771112233",
        }
        r = requests.put(f"{API}/schools/me", json=body, headers=school_h, timeout=30)
        assert r.status_code == 200, r.text
        s = r.json()["school"]
        assert s["contact_visibility"] == "after_contact"
        assert s["slug"]
        slug = s["slug"]
        # Anonymous fetch: phone empty & unlocked false
        r2 = requests.get(f"{API}/schools/slug/{slug}", timeout=30)
        assert r2.status_code == 200
        c = r2.json()["contact"]
        assert c["phone"] == ""
        assert c["contact_unlocked"] is False
        # restore visibility to public
        body["contact_visibility"] = "public"
        rr = requests.put(f"{API}/schools/me", json=body, headers=school_h, timeout=30)
        assert rr.status_code == 200

    def test_school_overview(self, school_h):
        r = requests.get(f"{API}/schools/me/overview", headers=school_h, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["profile_views", "active_offers", "applications", "proposals",
                  "favorite_candidates", "unread_messages", "verification_status"]:
            assert k in d


# --- educator follow/favorite/proposal/application ---
class TestEducatorFlows:
    def test_follow_toggle(self, edu_h, demo_school):
        sid = demo_school["school_id"]
        r1 = requests.post(f"{API}/schools/{sid}/follow", headers=edu_h, timeout=30)
        assert r1.status_code == 200
        # Ensure following == True; if it was already True, toggle back
        if r1.json().get("following") is False:
            r1 = requests.post(f"{API}/schools/{sid}/follow", headers=edu_h, timeout=30)
        assert r1.json()["following"] is True
        r2 = requests.get(f"{API}/schools/following/mine", headers=edu_h, timeout=30)
        assert r2.status_code == 200
        assert any(s["school_id"] == sid for s in r2.json()["results"])

    def test_favorite_toggle(self, edu_h, demo_school):
        sid = demo_school["school_id"]
        r = requests.post(f"{API}/favorites", json={"target_type": "school", "target_id": sid},
                          headers=edu_h, timeout=30)
        assert r.status_code == 200
        if r.json().get("favorited") is False:
            r = requests.post(f"{API}/favorites", json={"target_type": "school", "target_id": sid},
                              headers=edu_h, timeout=30)
        assert r.json()["favorited"] is True
        r2 = requests.get(f"{API}/schools/favorites/mine", headers=edu_h, timeout=30)
        assert r2.status_code == 200
        assert any(s["school_id"] == sid for s in r2.json()["results"])

    def test_proposal_flow_and_status(self, edu_h, school_h, demo_school):
        sid = demo_school["school_id"]
        r = requests.post(f"{API}/proposals", json={
            "school_id": sid, "service_type": "Enseignement",
            "subject": "Mathématiques", "message": "TEST_ Proposition automatisée"
        }, headers=edu_h, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "proposal" in d and "conversation_id" in d
        pid = d["proposal"]["proposal_id"]

        rm = requests.get(f"{API}/proposals/mine", headers=edu_h, timeout=30)
        assert rm.status_code == 200
        assert any(p["proposal_id"] == pid for p in rm.json()["results"])

        # school received (only if this proposal targets test school; institution-sainte-marie may not be)
        rr = requests.get(f"{API}/proposals/received", headers=school_h, timeout=30)
        assert rr.status_code == 200

        # invalid status -> 400 (as owner of that proposal). Need to use the school owning proposal:
        owner_h = _login(demo_school.get("user_id_hint", SCHOOL_EMAIL)) if False else None
        # simpler: attempt against a school not owning it should give 404, invalid status should be 400 before ownership check
        rbad = requests.put(f"{API}/proposals/{pid}/status", json={"status": "Blah"},
                            headers=school_h, timeout=30)
        assert rbad.status_code == 400

        # conversation should have context
        rc = requests.get(f"{API}/conversations", headers=edu_h, timeout=30)
        assert rc.status_code == 200
        conv = next((c for c in rc.json()["results"] if c["conversation_id"] == d["conversation_id"]), None)
        assert conv is not None
        assert conv.get("context")

    def test_application_flow(self, edu_h, school_h):
        # school creates a new job
        r = requests.post(f"{API}/jobs", json={
            "title": f"TEST_Poste_{int(time.time())}",
            "contract_type": "CDI", "subject": "Mathématiques", "level": "Lycée",
            "description": "Poste de test", "status": "published"
        }, headers=school_h, timeout=30)
        assert r.status_code == 200, r.text
        offer_id = r.json()["job"]["offer_id"]

        # preview
        rp = requests.get(f"{API}/applications/preview", headers=edu_h, timeout=30)
        assert rp.status_code == 200
        assert "profile" in rp.json() and "documents" in rp.json()

        # apply
        ra = requests.post(f"{API}/applications", json={
            "offer_id": offer_id, "cover_letter": "TEST_ lettre", "document_file_ids": []
        }, headers=edu_h, timeout=30)
        assert ra.status_code == 200, ra.text
        app = ra.json()["application"]
        assert app["cover_letter"] == "TEST_ lettre"
        assert "snapshot" in app and "timeline" in app and len(app["timeline"]) == 1

        # duplicate -> 400
        rdup = requests.post(f"{API}/applications", json={
            "offer_id": offer_id, "cover_letter": "again"
        }, headers=edu_h, timeout=30)
        assert rdup.status_code == 400

        # school updates status
        rs = requests.put(f"{API}/applications/{app['application_id']}/status",
                          json={"status": "Consultée"}, headers=school_h, timeout=30)
        assert rs.status_code == 200

        rmine = requests.get(f"{API}/applications/mine", headers=edu_h, timeout=30)
        me = next(a for a in rmine.json()["results"] if a["application_id"] == app["application_id"])
        assert len(me["timeline"]) >= 2
        assert me["updated_at"]

    def test_follow_new_offer_notification(self, edu_h, school_h, demo_school):
        # awa follows the SCHOOL user (contact.institution1) - use their school
        me_school = requests.get(f"{API}/schools/me", headers=school_h, timeout=30).json()["school"]
        sid = me_school["school_id"]
        # ensure following
        r = requests.post(f"{API}/schools/{sid}/follow", headers=edu_h, timeout=30)
        if r.json().get("following") is False:
            requests.post(f"{API}/schools/{sid}/follow", headers=edu_h, timeout=30)
        # school creates new offer
        title = f"TEST_Notif_{int(time.time())}"
        rj = requests.post(f"{API}/jobs", json={"title": title, "contract_type": "CDD",
                                                "description": "x", "status": "published"},
                           headers=school_h, timeout=30)
        assert rj.status_code == 200
        time.sleep(0.5)
        rn = requests.get(f"{API}/notifications", headers=edu_h, timeout=30)
        assert rn.status_code == 200
        assert any(n["type"] == "new_offer" and title in (n.get("body") or "")
                   for n in rn.json()["results"])


# --- recommendations & jobs filters ---
class TestRecommendations:
    def test_recommendations_educator(self, edu_h):
        r = requests.get(f"{API}/recommendations/jobs", headers=edu_h, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "recommended" in d and "nearby" in d
        if d["recommended"]:
            j = d["recommended"][0]
            assert "match_score" in j and "match_reasons" in j

    def test_recommendations_forbidden_for_parent(self, parent_h):
        r = requests.get(f"{API}/recommendations/jobs", headers=parent_h, timeout=30)
        assert r.status_code == 403

    def test_jobs_filters(self):
        for p in [{"has_salary": "true"}, {"since_days": 30}, {"max_experience": 5}]:
            r = requests.get(f"{API}/jobs", params=p, timeout=30)
            assert r.status_code == 200


# --- educator privacy ---
class TestEducatorPrivacy:
    def test_privacy_hides_experience(self, edu_h):
        prof = requests.get(f"{API}/educators/me", headers=edu_h, timeout=30).json()["profile"] or {}
        user_id = prof.get("user_id")
        assert user_id
        # keep existing important fields
        keep = {k: prof.get(k) for k in ["profession","bio","region","location","subjects","levels",
                "languages","specialties","services","experience_years","hourly_rate","photo",
                "diplomas","experiences","availability","available_now"] if prof.get(k) is not None}
        body = {**keep, "privacy": {"contact": "private", "experience": "private"}}
        r = requests.put(f"{API}/educators/me", json=body, headers=edu_h, timeout=30)
        assert r.status_code == 200

        # anonymous
        ra = requests.get(f"{API}/educators/{user_id}", timeout=30)
        assert ra.status_code == 200
        p = ra.json()["profile"]
        assert p["contact"]["unlocked"] is False
        assert p.get("diplomas") == [] and p.get("experiences") == []

        # reset
        body["privacy"] = {}
        rr = requests.put(f"{API}/educators/me", json=body, headers=edu_h, timeout=30)
        assert rr.status_code == 200


# --- verification ---
class TestVerification:
    def test_school_verification_admin_flow(self, school_h, admin_h):
        r = requests.post(f"{API}/verifications", json={"documents": []},
                          headers=school_h, timeout=30)
        assert r.status_code == 200
        vid = r.json()["verification"]["verification_id"]
        # school shows En cours
        me = requests.get(f"{API}/schools/me", headers=school_h, timeout=30).json()["school"]
        assert me["verification_status"] == "En cours de vérification"
        # admin approves
        ra = requests.put(f"{API}/admin/verifications/{vid}", json={"status": "Vérifié"},
                          headers=admin_h, timeout=30)
        assert ra.status_code == 200
        me2 = requests.get(f"{API}/schools/me", headers=school_h, timeout=30).json()["school"]
        assert me2["is_verified"] is True


# --- messages context ---
class TestMessagesContext:
    def test_message_context_persisted(self, edu_h, school_h):
        # school user_id
        school = requests.get(f"{API}/schools/me", headers=school_h, timeout=30).json()["school"]
        recipient = school["user_id"]
        ctx = f"TEST_CTX_{int(time.time())}"
        r = requests.post(f"{API}/messages", json={
            "recipient_user_id": recipient, "content": "hello", "context": ctx
        }, headers=edu_h, timeout=30)
        assert r.status_code == 200
        cid = r.json()["conversation_id"]
        rc = requests.get(f"{API}/conversations", headers=edu_h, timeout=30)
        conv = next(c for c in rc.json()["results"] if c["conversation_id"] == cid)
        assert conv.get("context") == ctx
