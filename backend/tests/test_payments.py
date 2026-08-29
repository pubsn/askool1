"""Backend tests for Mobile Money payments (mock) and cron reminders auth."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://askool-edu.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EDU_EMAIL = "awa.ndiaye@askool.sn"
PARENT_EMAIL = "parent@askool.sn"
PASSWORD = "Askool2026!"


def _login(email, password=PASSWORD):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login {email} failed: {r.status_code} {r.text}"
    # token fallback
    tok = r.json().get("access_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def educator():
    return _login(EDU_EMAIL)


@pytest.fixture(scope="module")
def parent():
    return _login(PARENT_EMAIL)


# --- Subscription payment happy path ---
def test_subscription_initiate_and_confirm_sets_premium(educator):
    r = educator.post(f"{API}/payments/initiate", json={
        "purpose": "subscription", "provider": "orange_money",
        "phone": "770000001", "plan": "Premium", "audience": "educator",
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "payment_id" in data
    assert data["amount"] > 0
    assert "instructions" in data
    pid = data["payment_id"]

    c = educator.post(f"{API}/payments/{pid}/confirm", json={"code": "1234"})
    assert c.status_code == 200, c.text
    assert c.json()["status"] == "success"

    me = educator.get(f"{API}/auth/me")
    assert me.status_code == 200
    body = me.json()
    user = body.get("user", body)
    assert user.get("is_premium") is True


# --- Validation errors ---
def test_initiate_unsupported_provider(educator):
    r = educator.post(f"{API}/payments/initiate", json={
        "purpose": "subscription", "provider": "mtn", "phone": "770000001",
        "plan": "Premium", "audience": "educator",
    })
    assert r.status_code == 400


def test_confirm_invalid_code(educator):
    r = educator.post(f"{API}/payments/initiate", json={
        "purpose": "subscription", "provider": "wave", "phone": "770000002",
        "plan": "Premium", "audience": "educator",
    })
    assert r.status_code == 200
    pid = r.json()["payment_id"]
    for bad in ["12", "abcd", "12345"]:
        c = educator.post(f"{API}/payments/{pid}/confirm", json={"code": bad})
        assert c.status_code == 400, f"expected 400 for code {bad}, got {c.status_code}"


# --- payments/mine ---
def test_payments_mine(educator):
    r = educator.get(f"{API}/payments/mine")
    assert r.status_code == 200
    body = r.json()
    assert "results" in body and isinstance(body["results"], list)
    assert len(body["results"]) >= 1


# --- Booking payment flow ---
def test_booking_payment_flow(parent, educator):
    # find educator user_id
    me_edu = educator.get(f"{API}/auth/me").json()
    me_edu = me_edu.get("user", me_edu)
    edu_id = me_edu["user_id"]

    # Try to reuse existing unpaid booking with price>0, else create one
    existing = parent.get(f"{API}/bookings/mine").json().get("results", [])
    booking = next((b for b in existing if b.get("payment_status") != "payé"
                    and (b.get("price") or 0) > 0 and b.get("status") != "Annulé"
                    and b.get("client_user_id") != b.get("educator_user_id")), None)

    if not booking:
        # create a booking via parent
        payload = {
            "educator_user_id": edu_id,
            "date": "2030-01-15",
            "time": "10:00",
            "subject": "Mathématiques",
            "mode": "En ligne",
            "duration_min": 60,
            "price": 5000,
            "message": "TEST_booking payment",
        }
        r = parent.post(f"{API}/bookings", json=payload)
        assert r.status_code in (200, 201), f"booking create failed: {r.status_code} {r.text}"
        booking = r.json().get("booking") or r.json()

    bid = booking["booking_id"]

    ini = parent.post(f"{API}/payments/initiate", json={
        "purpose": "booking", "provider": "wave", "phone": "770000003", "booking_id": bid,
    })
    assert ini.status_code == 200, ini.text
    pid = ini.json()["payment_id"]

    conf = parent.post(f"{API}/payments/{pid}/confirm", json={"code": "4321"})
    assert conf.status_code == 200, conf.text

    # verify booking updated
    after = parent.get(f"{API}/bookings/mine").json()["results"]
    b2 = next(b for b in after if b["booking_id"] == bid)
    assert b2["payment_status"] == "payé"
    assert b2["status"] == "Confirmé"


# --- cron auth ---
def test_cron_lesson_reminders_unauthorized():
    r = requests.post(f"{API}/cron/lesson-reminders", timeout=15)
    assert r.status_code == 401
    r2 = requests.post(f"{API}/cron/lesson-reminders",
                       headers={"Authorization": "Bearer wrong-secret"}, timeout=15)
    assert r2.status_code == 401
