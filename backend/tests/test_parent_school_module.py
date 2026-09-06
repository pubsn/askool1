"""Backend tests for the new Parent<->School module (iteration 10)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://askool-edu.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
PWD = "Askool2026!"


def _login(email: str) -> str:
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": PWD})
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def parent_token():
    return _login("parent@askool.sn")


@pytest.fixture(scope="module")
def school_token():
    return _login("contact.institution1@askool.sn")


@pytest.fixture(scope="module")
def parent_h(parent_token):
    return {"Authorization": f"Bearer {parent_token}"}


@pytest.fixture(scope="module")
def school_h(school_token):
    return {"Authorization": f"Bearer {school_token}"}


@pytest.fixture(scope="module")
def isaint_school():
    r = requests.get(f"{API}/schools/slug/institution-sainte-marie")
    assert r.status_code == 200, r.text
    return r.json()["school"]


# ------------ META ------------
def test_meta_has_new_fields():
    r = requests.get(f"{API}/schools/meta")
    assert r.status_code == 200
    d = r.json()
    for k in ("parent_school_types", "education_systems", "family_services", "post_categories", "contact_subjects"):
        assert k in d and isinstance(d[k], list) and d[k], f"missing {k}"
    assert "Inscription" in d["post_categories"]
    assert "Information aux parents" in d["post_categories"]
    assert len(d["post_categories"]) == 9


# ------------ SCHOOL PUT practical fields (must exist before parent enrolls/reviews) ------------
def test_school_put_practical_fields(school_h):
    # fetch current
    r = requests.get(f"{API}/schools/me", headers=school_h)
    assert r.status_code == 200
    cur = r.json()["school"] or {}
    # preserve required fields, add new practical
    body = {k: cur.get(k, "") for k in [
        "name", "commercial_name", "school_type", "status", "description", "history", "mission",
        "values", "pedagogy", "region", "city", "district", "location", "directions", "phone", "email",
        "website", "whatsapp", "programs", "methods", "registration_periods", "admission_conditions",
        "payment_terms", "schedule", "school_calendar",
    ]}
    body["name"] = cur.get("name") or "Institution Sainte-Marie"
    body.update({
        "levels": cur.get("levels") or ["Collège", "Lycée"],
        "languages": cur.get("languages") or ["Français"],
        "subjects": cur.get("subjects", []),
        "school_life": cur.get("school_life", []),
        "infrastructures": cur.get("infrastructures", []),
        "services": cur.get("services") or ["Cantine", "Transport scolaire"],
        "gallery": cur.get("gallery", []),
        "recruiting": cur.get("recruiting", []),
        "contract_types": cur.get("contract_types", []),
        "logo": cur.get("logo"),
        "cover": cur.get("cover"),
        "socials": cur.get("socials") or {},
        "contact_visibility": cur.get("contact_visibility", "public"),
        "founded_year": cur.get("founded_year"),
        "students_count": cur.get("students_count"),
        "teachers_count": cur.get("teachers_count"),
        "min_age": cur.get("min_age"),
        "available_seats": cur.get("available_seats"),
        "lat": cur.get("lat"), "lng": cur.get("lng"),
        "hide_exact_location": cur.get("hide_exact_location", False),
        "education_system": cur.get("education_system", ""),
        # NEW practical
        "tuition_fee": "300 000 FCFA/an",
        "registration_fee": "50 000 FCFA",
        "faq": [{"q": "Quels sont les horaires ?", "a": "8h-17h du lundi au vendredi"}],
        "required_documents": ["Acte de naissance", "Bulletins précédents"],
        "enrollment_open": True,
        "accept_enrollment_requests": True,
        "education_systems": ["Programme sénégalais"],
    })
    r = requests.put(f"{API}/schools/me", headers=school_h, json=body)
    assert r.status_code == 200, r.text
    slug = r.json()["school"]["slug"]
    # verify via slug
    r2 = requests.get(f"{API}/schools/slug/{slug}")
    s = r2.json()["school"]
    assert s.get("tuition_fee") == "300 000 FCFA/an"
    assert s.get("enrollment_open") is True
    assert s.get("accept_enrollment_requests") is True
    assert s.get("faq") and s["faq"][0]["q"].startswith("Quels")
    assert "Programme sénégalais" in (s.get("education_systems") or [])


# ------------ LIST filters ------------
def test_list_schools_filters():
    r = requests.get(f"{API}/schools", params={"service": "Cantine", "language": "Français", "has_fees": True, "enrollment_open": True})
    assert r.status_code == 200
    d = r.json()
    assert "results" in d
    # rating + reviews_count decorated
    if d["results"]:
        assert "rating" in d["results"][0] and "reviews_count" in d["results"][0]


def test_list_schools_near(isaint_school):
    lat = isaint_school.get("lat"); lng = isaint_school.get("lng")
    if lat is None or lng is None:
        pytest.skip("school missing lat/lng")
    r = requests.get(f"{API}/schools", params={"near_lat": lat, "near_lng": lng, "radius_km": 50})
    assert r.status_code == 200
    res = r.json()["results"]
    assert res and "distance_km" in res[0]
    # sorted ascending
    dists = [x["distance_km"] for x in res]
    assert dists == sorted(dists)


# ------------ COMPARE ------------
def test_compare(isaint_school):
    r = requests.get(f"{API}/schools", params={"page_size": 5})
    ids = [s["school_id"] for s in r.json()["results"]][:2]
    if len(ids) < 2:
        pytest.skip("need >=2 schools")
    r2 = requests.get(f"{API}/schools/compare", params={"ids": ",".join(ids)})
    assert r2.status_code == 200
    assert len(r2.json()["results"]) == 2


# ------------ PARENT profile ------------
def test_parent_profile_update(parent_h):
    body = {
        "city": "Thiès",
        "preferred_language": "Français",
        "search_prefs": {"languages": ["Français"], "services": ["Cantine"]},
        "privacy": {"phone": "private"},
        "notification_prefs": {"school_news": True},
    }
    r = requests.put(f"{API}/users/me/profile", headers=parent_h, json=body)
    assert r.status_code == 200, r.text
    u = r.json()["user"]
    assert u["city"] == "Thiès"
    r2 = requests.get(f"{API}/auth/me", headers=parent_h)
    d = r2.json()
    if "user" in d:
        d = d["user"]
    assert d.get("city") == "Thiès"
    assert d.get("search_prefs", {}).get("services") == ["Cantine"]
    assert d.get("privacy", {}).get("phone") == "private"
    assert d.get("notification_prefs", {}).get("school_news") is True


# ------------ STUDENTS CRUD ------------
@pytest.fixture(scope="module")
def student_id(parent_h):
    body = {"name": "TEST_Enfant", "class_level": "5e", "current_school": "École actuelle",
            "objectives": "Progression math", "preferences": "Français"}
    r = requests.post(f"{API}/students", headers=parent_h, json=body)
    assert r.status_code == 200, r.text
    sid = r.json()["student"]["student_id"]
    yield sid
    requests.delete(f"{API}/students/{sid}", headers=parent_h)


def test_student_update(parent_h, student_id):
    r = requests.put(f"{API}/students/{student_id}", headers=parent_h,
                     json={"name": "TEST_Enfant", "class_level": "5e", "current_school": "X",
                           "objectives": "obj", "preferences": "pref"})
    assert r.status_code == 200


def test_recommendations_for_parent(parent_h, student_id):
    r = requests.get(f"{API}/schools/recommended-for-parent", params={"student_id": student_id}, headers=parent_h)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("level") == "Collège"
    assert isinstance(d["results"], list)
    if d["results"]:
        assert "match_score" in d["results"][0] and "match_reasons" in d["results"][0]


# ------------ PARENT overview ------------
def test_parent_overview(parent_h):
    r = requests.get(f"{API}/parent/overview", headers=parent_h)
    assert r.status_code == 200
    d = r.json()
    for k in ("students", "following", "favorite_schools", "favorite_educators", "new_posts", "pending_requests", "conversations"):
        assert k in d


# ------------ ENROLLMENT REQUESTS ------------
@pytest.fixture(scope="module")
def enrollment_id(parent_h, isaint_school):
    body = {"school_id": isaint_school["school_id"], "level": "6e", "school_year": "2026-2027",
            "child_name": "TEST_Child", "message": "Demande test"}
    r = requests.post(f"{API}/enrollment-requests", headers=parent_h, json=body)
    assert r.status_code == 200, r.text
    return r.json()["request"]["request_id"]


def test_enrollment_mine(parent_h, enrollment_id):
    r = requests.get(f"{API}/enrollment-requests/mine", headers=parent_h)
    assert r.status_code == 200
    ids = [x["request_id"] for x in r.json()["results"]]
    assert enrollment_id in ids


def test_enrollment_received_school(school_h, enrollment_id):
    r = requests.get(f"{API}/enrollment-requests/received", headers=school_h)
    assert r.status_code == 200
    ids = [x["request_id"] for x in r.json()["results"]]
    assert enrollment_id in ids


def test_enrollment_status_update(school_h, parent_h, enrollment_id):
    r = requests.put(f"{API}/enrollment-requests/{enrollment_id}/status", headers=school_h, json={"status": "En cours"})
    assert r.status_code == 200
    # parent notified
    n = requests.get(f"{API}/notifications", headers=parent_h).json()["results"]
    assert any(x.get("type") == "enrollment_status" for x in n)


def test_enrollment_invalid_status(school_h, enrollment_id):
    r = requests.put(f"{API}/enrollment-requests/{enrollment_id}/status", headers=school_h, json={"status": "Bogus"})
    assert r.status_code == 400


# ------------ REVIEWS ------------
def test_school_review_verified(parent_h, isaint_school):
    # remove any existing review from this parent first
    body = {"school_id": isaint_school["school_id"], "rating": 5, "comment": "TEST_Très bien"}
    r = requests.post(f"{API}/schools/reviews", headers=parent_h, json=body)
    # allow either created or already-exists (duplicate) — test both paths
    if r.status_code == 400:
        assert "déjà" in r.text
    else:
        assert r.status_code == 200, r.text
        rev = r.json()["review"]
        assert rev["verified"] is True  # parent has enrollment request
    # duplicate always fails
    r2 = requests.post(f"{API}/schools/reviews", headers=parent_h, json=body)
    assert r2.status_code == 400


def test_slug_shows_reviews(isaint_school):
    r = requests.get(f"{API}/schools/slug/institution-sainte-marie")
    d = r.json()
    assert "reviews" in d and isinstance(d["reviews"], list)
    assert "rating" in d["school"] and "reviews_count" in d["school"]


# ------------ FOLLOW + POSTS NOTIFICATION ------------
def test_follow_notify_toggle_and_posts(parent_h, school_h, isaint_school, parent_token):
    sid = isaint_school["school_id"]
    # ensure following (toggle if not)
    r = requests.get(f"{API}/schools/slug/institution-sainte-marie", headers=parent_h)
    if not r.json().get("is_following"):
        requests.post(f"{API}/schools/{sid}/follow", headers=parent_h)
    # set notify=false
    r = requests.put(f"{API}/schools/{sid}/follow/notify", headers=parent_h, json={"notify": False})
    assert r.status_code == 200
    r2 = requests.get(f"{API}/schools/slug/institution-sainte-marie", headers=parent_h)
    assert r2.json().get("follow_notify") is False

    # count notifications before
    before = len([n for n in requests.get(f"{API}/notifications", headers=parent_h).json()["results"] if n["type"] == "school_post"])

    # SCHOOL posts news (with video)
    body = {"title": "TEST_Post_notify_off", "content": "contenu test",
            "category": "Inscription", "images": [], "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
    r = requests.post(f"{API}/schools/me/posts", headers=school_h, json=body)
    assert r.status_code == 200, r.text
    post = r.json()["post"]
    post_id = post["post_id"]

    after_off = len([n for n in requests.get(f"{API}/notifications", headers=parent_h).json()["results"] if n["type"] == "school_post"])
    assert after_off == before, "parent should NOT be notified when notify=False"

    # set notify=true
    requests.put(f"{API}/schools/{sid}/follow/notify", headers=parent_h, json={"notify": True})
    body2 = dict(body); body2["title"] = "TEST_Post_notify_on"
    r = requests.post(f"{API}/schools/me/posts", headers=school_h, json=body2)
    assert r.status_code == 200
    post2_id = r.json()["post"]["post_id"]
    after_on = len([n for n in requests.get(f"{API}/notifications", headers=parent_h).json()["results"] if n["type"] == "school_post"])
    assert after_on > after_off, "parent should be notified when notify=True"

    # PUT edit
    r = requests.put(f"{API}/schools/me/posts/{post2_id}", headers=school_h,
                     json={**body2, "title": "TEST_Post_edited"})
    assert r.status_code == 200
    assert r.json()["post"]["title"] == "TEST_Post_edited"

    # stats
    r = requests.get(f"{API}/schools/me/posts/stats", headers=school_h)
    d = r.json()
    for k in ("posts", "views", "followers", "reached"):
        assert k in d

    # feed as parent
    r = requests.get(f"{API}/feed", headers=parent_h)
    assert r.status_code == 200


# ------------ NEGATIVE: school with accept_enrollment_requests=False ------------
def test_enrollment_rejected_when_disabled(parent_h, school_h, isaint_school):
    # disable
    cur = requests.get(f"{API}/schools/me", headers=school_h).json()["school"]
    body = {k: cur.get(k) for k in list(cur.keys()) if k not in ("_id", "school_id", "user_id", "created_at",
                                                                  "updated_at", "verification_status", "is_verified",
                                                                  "subscription_tier", "views", "slug")}
    body["accept_enrollment_requests"] = False
    r = requests.put(f"{API}/schools/me", headers=school_h, json=body)
    assert r.status_code == 200
    # attempt enrollment
    r = requests.post(f"{API}/enrollment-requests", headers=parent_h,
                      json={"school_id": isaint_school["school_id"], "level": "6e",
                            "school_year": "2026-2027", "child_name": "TEST_X", "message": "x"})
    assert r.status_code == 400
    # restore
    body["accept_enrollment_requests"] = True
    body["enrollment_open"] = True
    requests.put(f"{API}/schools/me", headers=school_h, json=body)
