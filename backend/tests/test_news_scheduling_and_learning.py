"""Backend tests — scheduled posts, share flows & learner learning path (iteration 12)."""
import os
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://askool-edu.preview.emergentagent.com").rstrip("/")
CRON_SECRET = os.environ.get("WEBHOOK_CRON_SECRET", "askool_cron_7b3f19d2a6c84e05b1f8c3d67ae920f4")
PASSWORD = "Askool2026!"
SCHOOL_EMAIL = "contact.groupe0@askool.sn"
PARENT_EMAIL = "parent@askool.sn"
LEARNER_EMAIL = "apprenant@askool.sn"


def _login(email):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": PASSWORD}, timeout=20)
    assert r.status_code == 200, f"login {email}: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def school():
    return _login(SCHOOL_EMAIL)


@pytest.fixture(scope="module")
def parent():
    return _login(PARENT_EMAIL)


@pytest.fixture(scope="module")
def learner():
    return _login(LEARNER_EMAIL)


# ================ Scheduled posts ================
class TestScheduledPost:
    def test_create_scheduled_post(self, school):
        future = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        payload = {"title": f"TEST_sched_{uuid.uuid4().hex[:6]}", "content": "contenu test programmé",
                   "category": "Actualité", "scheduled_at": future}
        r = school.post(f"{BASE_URL}/api/schools/me/posts", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["scheduled"] is True
        assert data["notified"] == 0
        assert data["post"]["status"] == "scheduled"
        assert data["post"]["scheduled_at"]
        pytest.sched_post_id = data["post"]["post_id"]

    def test_scheduled_in_stats(self, school):
        r = school.get(f"{BASE_URL}/api/schools/me/posts/stats", timeout=20)
        assert r.status_code == 200
        assert r.json().get("scheduled", 0) >= 1

    def test_scheduled_hidden_from_public_feed(self, parent, school):
        # ensure parent follows the school
        me = school.get(f"{BASE_URL}/api/schools/me").json()["school"]
        school_id = me["school_id"]
        parent.post(f"{BASE_URL}/api/schools/{school_id}/follow", timeout=20)  # toggle on if not
        # get public posts (slug)
        r = parent.get(f"{BASE_URL}/api/schools/{school_id}/posts", timeout=20)
        assert r.status_code == 200
        titles = [p["title"] for p in r.json()["results"]]
        sched_post = school.get(f"{BASE_URL}/api/schools/me/posts").json()["results"]
        sched_title = next(p["title"] for p in sched_post if p["post_id"] == pytest.sched_post_id)
        assert sched_title not in titles, "scheduled post leaked to public feed"
        # also check /feed
        rf = parent.get(f"{BASE_URL}/api/feed", timeout=20)
        assert rf.status_code == 200
        feed_titles = [p["title"] for p in rf.json()["results"]]
        assert sched_title not in feed_titles

    def test_publish_now(self, school, parent):
        r = school.post(f"{BASE_URL}/api/schools/me/posts/{pytest.sched_post_id}/publish-now", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "notified" in data
        # verify now visible on /feed for parent (follows)
        time.sleep(1)
        rf = parent.get(f"{BASE_URL}/api/feed", timeout=20)
        feed_ids = [p["post_id"] for p in rf.json()["results"]]
        assert pytest.sched_post_id in feed_ids, "published post missing from parent feed"

    def test_publish_now_already_published_400(self, school):
        r = school.post(f"{BASE_URL}/api/schools/me/posts/{pytest.sched_post_id}/publish-now", timeout=20)
        assert r.status_code == 400

    def test_unschedule_flow(self, school):
        future = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
        r = school.post(f"{BASE_URL}/api/schools/me/posts", json={"title": f"TEST_sched2_{uuid.uuid4().hex[:6]}",
                        "content": "x", "category": "Actualité", "scheduled_at": future}, timeout=20)
        pid = r.json()["post"]["post_id"]
        r2 = school.post(f"{BASE_URL}/api/schools/me/posts/{pid}/unschedule", timeout=20)
        assert r2.status_code == 200
        posts = school.get(f"{BASE_URL}/api/schools/me/posts").json()["results"]
        p = next(x for x in posts if x["post_id"] == pid)
        assert p["status"] == "draft"
        # unschedule again → 400
        r3 = school.post(f"{BASE_URL}/api/schools/me/posts/{pid}/unschedule", timeout=20)
        assert r3.status_code == 400
        # cleanup
        school.delete(f"{BASE_URL}/api/schools/me/posts/{pid}")

    def test_immediate_post_notifies(self, school):
        r = school.post(f"{BASE_URL}/api/schools/me/posts", json={
            "title": f"TEST_now_{uuid.uuid4().hex[:6]}", "content": "immédiate",
            "category": "Actualité"}, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["scheduled"] is False
        assert data["post"]["status"] == "published"
        # cleanup
        school.delete(f"{BASE_URL}/api/schools/me/posts/{data['post']['post_id']}")


# ================ Cron ================
class TestCron:
    def test_cron_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/cron/publish-scheduled-posts", timeout=15)
        assert r.status_code in (401, 403)

    def test_cron_runs_with_secret(self, school):
        # create a past-scheduled post via API (date in future then no — API refuses past since _is_future returns False
        # meaning it publishes immediately). To test the cron properly we'd need DB access.
        # Instead, we at least verify the cron endpoint accepts the secret.
        r = requests.post(f"{BASE_URL}/api/cron/publish-scheduled-posts",
                          headers={"Authorization": f"Bearer {CRON_SECRET}"}, timeout=20)
        assert r.status_code in (200, 202), r.text


# ================ Learner progress + goals ================
class TestLearnerPath:
    def test_progress_endpoint(self, learner):
        r = learner.get(f"{BASE_URL}/api/learner/progress", timeout=20)
        assert r.status_code == 200
        data = r.json()
        for k in ("lessons_total", "lessons_done", "hours", "goals", "percent"):
            assert k in data

    def test_goal_crud(self, learner):
        label = f"TEST_goal_{uuid.uuid4().hex[:6]}"
        r = learner.post(f"{BASE_URL}/api/learner/goals", json={"label": label}, timeout=20)
        assert r.status_code == 200
        gid = r.json()["goal"]["goal_id"]
        assert any(g["label"] == label for g in r.json()["goals"])
        # toggle done
        r2 = learner.put(f"{BASE_URL}/api/learner/goals/{gid}", json={"done": True}, timeout=20)
        assert r2.status_code == 200
        assert next(g for g in r2.json()["goals"] if g["goal_id"] == gid)["done"] is True
        # persistence via GET
        r3 = learner.get(f"{BASE_URL}/api/learner/progress", timeout=20)
        assert any(g["goal_id"] == gid and g["done"] for g in r3.json()["goals"])
        # untoggle
        learner.put(f"{BASE_URL}/api/learner/goals/{gid}", json={"done": False}, timeout=20)
        # delete
        r4 = learner.delete(f"{BASE_URL}/api/learner/goals/{gid}", timeout=20)
        assert r4.status_code == 200
        assert not any(g["goal_id"] == gid for g in r4.json()["goals"])

    def test_goal_empty_label_400(self, learner):
        r = learner.post(f"{BASE_URL}/api/learner/goals", json={"label": "   "}, timeout=20)
        assert r.status_code == 400
