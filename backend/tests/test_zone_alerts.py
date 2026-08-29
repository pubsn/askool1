"""Zone-alerts feature tests (RBAC + lifecycle)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
PASS = "Askool2026!"


def _login(email):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": PASS})
    assert r.status_code == 200, f"login {email} -> {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def parent():
    return _login("parent@askool.sn")


@pytest.fixture(scope="module")
def educator():
    return _login("awa.ndiaye@askool.sn")


class TestZoneAlertsRBAC:
    def test_educator_cannot_create_alert(self, educator):
        r = educator.post(f"{BASE_URL}/api/zone-alerts", json={"lat": 14.7, "lng": -17.45, "radius_km": 20})
        assert r.status_code == 403, f"expected 403, got {r.status_code} {r.text}"

    def test_anonymous_cannot_create_alert(self):
        r = requests.post(f"{BASE_URL}/api/zone-alerts", json={"lat": 14.7, "lng": -17.45, "radius_km": 20})
        assert r.status_code in (401, 403)


class TestZoneAlertsLifecycle:
    def test_full_lifecycle(self, parent):
        # CREATE
        r = parent.post(f"{BASE_URL}/api/zone-alerts",
                        json={"lat": 14.7, "lng": -17.45, "radius_km": 25, "subject": "Mathématiques", "level": "Lycée"})
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        alert = r.json()["alert"]
        assert alert["radius_km"] == 25
        assert alert["subject"] == "Mathématiques"
        assert alert["user_id"]
        alert_id = alert["alert_id"]

        # LIST - contains it
        r = parent.get(f"{BASE_URL}/api/zone-alerts/mine")
        assert r.status_code == 200
        results = r.json()["results"]
        assert any(a["alert_id"] == alert_id for a in results), "created alert not listed"

        # DELETE (soft, active=false)
        r = parent.delete(f"{BASE_URL}/api/zone-alerts/{alert_id}")
        assert r.status_code == 200

        # LIST - no longer present
        r = parent.get(f"{BASE_URL}/api/zone-alerts/mine")
        assert r.status_code == 200
        assert not any(a["alert_id"] == alert_id for a in r.json()["results"])

    def test_delete_others_alert_404(self, parent, educator):
        # parent creates
        r = parent.post(f"{BASE_URL}/api/zone-alerts", json={"lat": 14.7, "lng": -17.45, "radius_km": 10})
        assert r.status_code == 200
        alert_id = r.json()["alert"]["alert_id"]
        # educator tries to delete -> 404
        r2 = educator.delete(f"{BASE_URL}/api/zone-alerts/{alert_id}")
        assert r2.status_code == 404
        # cleanup
        parent.delete(f"{BASE_URL}/api/zone-alerts/{alert_id}")


class TestZoneAlertNotification:
    """End-to-end: parent creates alert, educator upserts matching profile => notification created."""

    def test_notify_on_matching_educator_upsert(self, parent, educator):
        # Create alert in Dakar 30km, Maths
        r = parent.post(f"{BASE_URL}/api/zone-alerts",
                        json={"lat": 14.6928, "lng": -17.4467, "radius_km": 30, "subject": "Mathématiques"})
        assert r.status_code == 200
        alert_id = r.json()["alert"]["alert_id"]

        # snapshot notif count
        n0 = parent.get(f"{BASE_URL}/api/notifications").json().get("results", [])
        before_ids = {n.get("notification_id") for n in n0}

        # Get educator's current profile to preserve fields
        cur = educator.get(f"{BASE_URL}/api/educators/me").json()
        prof = cur.get("profile") or {}
        # Upsert profile matching zone
        payload = {
            "profession": prof.get("profession") or "Enseignant",
            "bio": prof.get("bio") or "Test",
            "subjects": list(set((prof.get("subjects") or []) + ["Mathématiques"])),
            "levels": prof.get("levels") or ["Lycée"],
            "service_types": prof.get("service_types") or ["À domicile"],
            "regions": prof.get("regions") or ["Dakar"],
            "hourly_rate": prof.get("hourly_rate") or 5000,
            "experience_years": prof.get("experience_years") or 5,
            "lat": 14.7,
            "lng": -17.44,
        }
        r2 = educator.put(f"{BASE_URL}/api/educators/me", json=payload)
        assert r2.status_code in (200, 201), f"{r2.status_code} {r2.text}"

        # Allow async notify to complete
        time.sleep(1.5)
        n1 = parent.get(f"{BASE_URL}/api/notifications").json().get("results", [])
        new = [n for n in n1 if n.get("notification_id") not in before_ids]
        zone_notifs = [n for n in new if n.get("type") == "zone_alert"]
        # Notification may already exist from previous test iteration (educator already in "notified" list).
        # So we accept: either new zone_alert appeared, OR the alert record contains educator in notified list.
        alerts = parent.get(f"{BASE_URL}/api/zone-alerts/mine").json()["results"]
        alert = next((a for a in alerts if a["alert_id"] == alert_id), None)
        assert alert is not None
        already_notified = alert and educator.get(f"{BASE_URL}/api/auth/me").json().get("user_id") in (alert.get("notified") or [])
        assert zone_notifs or already_notified, f"No zone_alert notification and educator not in notified list. new={new}"

        # cleanup
        parent.delete(f"{BASE_URL}/api/zone-alerts/{alert_id}")
