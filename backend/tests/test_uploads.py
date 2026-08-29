"""ASKOOL uploads + files access control tests."""
import io
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://askool-edu.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "pubsn01@gmail.com", "password": "Askool2026!"}
EDU = {"email": "awa.ndiaye@askool.sn", "password": "Askool2026!"}
OTHER_EDU = {"email": "mamadou.diallo@askool.sn", "password": "Askool2026!"}

PNG = bytes.fromhex(
    "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
    "890000000D49444154789C63000100000005000102D5A2D7E70000000049454E"
    "44AE426082"
)
PDF = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


def _login(c):
    r = requests.post(f"{API}/auth/login", json=c, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"], r.json()["user"]


def _hdr(t):
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(scope="module")
def edu_tok():
    return _login(EDU)


@pytest.fixture(scope="module")
def other_tok():
    return _login(OTHER_EDU)


@pytest.fixture(scope="module")
def admin_tok():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def uploaded(edu_tok):
    tok, _ = edu_tok
    # public photo
    r = requests.post(f"{API}/uploads?category=photo&visibility=public",
                      headers=_hdr(tok),
                      files={"file": ("test.png", io.BytesIO(PNG), "image/png")}, timeout=60)
    assert r.status_code == 200, r.text
    photo = r.json()["file"]
    # forced-private CV even with visibility=public
    r = requests.post(f"{API}/uploads?category=cv&visibility=public",
                      headers=_hdr(tok),
                      files={"file": ("cv.pdf", io.BytesIO(PDF), "application/pdf")}, timeout=60)
    assert r.status_code == 200, r.text
    cv = r.json()["file"]
    # diploma
    r = requests.post(f"{API}/uploads?category=diploma",
                      headers=_hdr(tok),
                      files={"file": ("dip.pdf", io.BytesIO(PDF), "application/pdf")}, timeout=60)
    assert r.status_code == 200, r.text
    dip = r.json()["file"]
    return {"photo": photo, "cv": cv, "dip": dip}


class TestUploads:
    def test_public_photo(self, uploaded):
        assert uploaded["photo"]["visibility"] == "public"
        assert uploaded["photo"]["category"] == "photo"

    def test_cv_forced_private(self, uploaded):
        assert uploaded["cv"]["visibility"] == "private", "CV must be private regardless of query"

    def test_diploma_private(self, uploaded):
        assert uploaded["dip"]["visibility"] == "private"

    def test_reject_non_image_as_photo(self, edu_tok):
        tok, _ = edu_tok
        r = requests.post(f"{API}/uploads?category=photo",
                          headers=_hdr(tok),
                          files={"file": ("bad.pdf", io.BytesIO(PDF), "application/pdf")}, timeout=60)
        assert r.status_code == 400

    def test_reject_non_doc_as_cv(self, edu_tok):
        tok, _ = edu_tok
        r = requests.post(f"{API}/uploads?category=cv",
                          headers=_hdr(tok),
                          files={"file": ("bad.webp", io.BytesIO(PNG), "image/webp")}, timeout=60)
        assert r.status_code == 400

    def test_uploads_mine_list(self, edu_tok, uploaded):
        tok, _ = edu_tok
        r = requests.get(f"{API}/uploads/mine", headers=_hdr(tok))
        assert r.status_code == 200
        ids = [f["file_id"] for f in r.json()["results"]]
        assert uploaded["photo"]["file_id"] in ids
        assert uploaded["cv"]["file_id"] in ids


class TestFileAccessControl:
    def test_public_no_auth(self, uploaded):
        r = requests.get(f"{API}/files/{uploaded['photo']['file_id']}", timeout=60)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/")

    def test_private_no_auth_forbidden(self, uploaded):
        r = requests.get(f"{API}/files/{uploaded['cv']['file_id']}", timeout=60)
        assert r.status_code == 403

    def test_private_owner_ok(self, uploaded, edu_tok):
        tok, _ = edu_tok
        r = requests.get(f"{API}/files/{uploaded['cv']['file_id']}", headers=_hdr(tok), timeout=60)
        assert r.status_code == 200

    def test_private_other_user_forbidden(self, uploaded, other_tok):
        tok, _ = other_tok
        r = requests.get(f"{API}/files/{uploaded['cv']['file_id']}", headers=_hdr(tok), timeout=60)
        assert r.status_code == 403

    def test_private_admin_ok(self, uploaded, admin_tok):
        tok, _ = admin_tok
        r = requests.get(f"{API}/files/{uploaded['cv']['file_id']}", headers=_hdr(tok), timeout=60)
        assert r.status_code == 200

    def test_private_auth_query_param(self, uploaded, edu_tok):
        tok, _ = edu_tok
        r = requests.get(f"{API}/files/{uploaded['cv']['file_id']}?auth={tok}", timeout=60)
        assert r.status_code == 200


class TestDeleteUpload:
    def test_delete_soft_and_404(self, edu_tok):
        tok, _ = edu_tok
        r = requests.post(f"{API}/uploads?category=photo&visibility=public",
                          headers=_hdr(tok),
                          files={"file": ("del.png", io.BytesIO(PNG), "image/png")}, timeout=60)
        fid = r.json()["file"]["file_id"]
        r0 = requests.get(f"{API}/files/{fid}", timeout=60)
        assert r0.status_code == 200
        rd = requests.delete(f"{API}/uploads/{fid}", headers=_hdr(tok))
        assert rd.status_code == 200
        r2 = requests.get(f"{API}/files/{fid}", timeout=60)
        assert r2.status_code == 404


class TestVerificationWithDocs:
    def test_submit_and_admin_verify(self, edu_tok, admin_tok, uploaded):
        etok, eu = edu_tok
        atok, _ = admin_tok
        docs = [
            {"type": "diploma", "file_id": uploaded["dip"]["file_id"],
             "url": f"/api/files/{uploaded['dip']['file_id']}"},
            {"type": "cv", "file_id": uploaded["cv"]["file_id"],
             "url": f"/api/files/{uploaded['cv']['file_id']}"},
        ]
        r = requests.post(f"{API}/verifications", headers=_hdr(etok),
                          json={"documents": docs}, timeout=30)
        assert r.status_code == 200, r.text
        v = r.json()["verification"]
        assert v["status"] == "En cours de vérification"
        assert len(v["documents"]) == 2
        vid = v["verification_id"]

        ra = requests.get(f"{API}/admin/verifications", headers=_hdr(atok))
        assert ra.status_code == 200
        assert any(x["verification_id"] == vid for x in ra.json()["results"])

        ru = requests.put(f"{API}/admin/verifications/{vid}", headers=_hdr(atok),
                          json={"status": "Vérifié"})
        assert ru.status_code == 200

        rp = requests.get(f"{API}/educators/{eu['user_id']}")
        assert rp.json()["profile"].get("is_verified") is True
