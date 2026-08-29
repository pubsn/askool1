"""Tests for the new Educator 'Opportunités' features:
- GET /api/tutoring-requests/open (EDUCATOR only)
- POST /api/tutoring-requests (PARENT / ADULT_LEARNER)
- 403 for non-educators on /tutoring-requests/open
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://askool-edu.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EDU = {"email": "awa.ndiaye@askool.sn", "password": "Askool2026!"}
PARENT = {"email": "parent@askool.sn", "password": "Askool2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"Login failed for {creds['email']}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def edu_session():
    return _login(EDU)


@pytest.fixture(scope="module")
def parent_session():
    return _login(PARENT)


# Parent can create a tutoring request
def test_parent_creates_tutoring_request(parent_session):
    payload = {
        "subject": "Mathématiques",
        "level": "Terminale",
        "region": "Dakar",
        "mode": "En ligne",
        "budget": 8000,
        "frequency": "2x/semaine",
        "objective": "TEST_ Préparation Bac",
    }
    r = parent_session.post(f"{API}/tutoring-requests", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    req = r.json().get("request")
    assert req and req.get("request_id")
    assert req["subject"] == "Mathématiques"
    assert req["status"] == "Ouverte"


# Educator can list open tutoring requests
def test_educator_lists_open_requests(edu_session):
    r = edu_session.get(f"{API}/tutoring-requests/open", timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "results" in body
    results = body["results"]
    assert isinstance(results, list)
    assert len(results) >= 1, "Expected at least one open tutoring request"
    first = results[0]
    assert "requester_name" in first and isinstance(first["requester_name"], str)
    assert "match_score" in first and isinstance(first["match_score"], int)
    assert first.get("status") == "Ouverte"
    # ensure no mongo _id leak
    assert "_id" not in first


# Parent must NOT access /tutoring-requests/open (403)
def test_parent_forbidden_on_open(parent_session):
    r = parent_session.get(f"{API}/tutoring-requests/open", timeout=30)
    assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"


# Educator can send a message to a requester (used by Opportunités contact dialog)
def test_educator_sends_message_to_requester(edu_session):
    # find an open request
    r = edu_session.get(f"{API}/tutoring-requests/open", timeout=30)
    assert r.status_code == 200
    results = r.json().get("results", [])
    assert results, "No open requests to message"
    recipient = results[0]["requester_user_id"]
    resp = edu_session.post(
        f"{API}/messages",
        json={"recipient_user_id": recipient, "content": "TEST_ Bonjour, je peux vous accompagner."},
        timeout=30,
    )
    assert resp.status_code in (200, 201), f"POST /messages failed: {resp.status_code} {resp.text}"
