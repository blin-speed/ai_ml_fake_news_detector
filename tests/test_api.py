import concurrent.futures
import json
import os
import shutil
import tempfile
import uuid
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.explain import compute_highlights
from app.storage import Storage

MODEL_DIR = os.getenv("MODEL_DIR", "models_v2")
have_models = os.path.exists(os.path.join(MODEL_DIR, "config.json"))
needs_models = pytest.mark.skipif(not have_models, reason="no artifacts in MODEL_DIR")

VALID_CLIENT_A = "11111111-1111-4111-8111-111111111111"
VALID_CLIENT_B = "22222222-2222-4222-8222-222222222222"
GOOD_PAYLOAD = {
    "title": "Senate reaches bipartisan deal on federal infrastructure funding",
    "description": "Lawmakers announced an agreement on Wednesday providing new spending for bridges, roads, and broadband.",
}


@pytest.fixture(scope="module")
def app_and_client():
    from app.main import app
    temp_dir = tempfile.mkdtemp(prefix="test_fakenews_data_")
    app.state.settings = Settings(data_dir=temp_dir, admin_token="secret-admin-123")
    app.state.storage = Storage(data_dir=temp_dir)

    with TestClient(app) as c:
        yield c, temp_dir

    shutil.rmtree(temp_dir, ignore_errors=True)


def test_missing_or_malformed_client_id(app_and_client):
    c, _ = app_and_client
    # Missing header
    r = c.post("/api/check", json=GOOD_PAYLOAD)
    assert r.status_code == 422 or r.status_code == 400

    # Malformed header (path traversal attempt)
    r = c.post("/api/check", json=GOOD_PAYLOAD, headers={"X-Client-Id": "../../../etc/passwd"})
    assert r.status_code == 400

    # Invalid UUID format
    r = c.get("/api/history", headers={"X-Client-Id": "not-a-uuid"})
    assert r.status_code == 400


@needs_models
def test_check_creates_jsonl_record_and_returns_highlights(app_and_client):
    c, temp_dir = app_and_client
    r = c.post("/api/check", json=GOOD_PAYLOAD, headers={"X-Client-Id": VALID_CLIENT_A})
    assert r.status_code == 200
    data = r.json()

    assert "id" in data
    assert "created_at" in data
    assert "highlights" in data
    assert "questionable" in data["highlights"]
    assert "reliable" in data["highlights"]

    # Check bounds on highlights
    assert len(data["highlights"]["questionable"]) <= 6
    assert len(data["highlights"]["reliable"]) <= 6
    for item in data["highlights"]["questionable"] + data["highlights"]["reliable"]:
        assert 0.0 <= item["weight"] <= 1.0
        assert isinstance(item["term"], str)

    # Verify storage file
    client_file = os.path.join(temp_dir, "clients", f"{VALID_CLIENT_A}.jsonl")
    assert os.path.exists(client_file)
    with open(client_file, "r", encoding="utf-8") as f:
        lines = [json.loads(line) for line in f if line.strip()]
    assert len(lines) == 1
    rec = lines[0]
    assert rec["type"] == "check"
    assert rec["id"] == data["id"]
    assert rec["input"]["title"] == GOOD_PAYLOAD["title"]
    assert "highlights" in rec["output"]


@needs_models
def test_history_newest_first_and_client_isolation(app_and_client):
    c, _ = app_and_client
    # Post second item for client A
    payload2 = {
        "title": "Local astronomy club discovers new comet in morning sky",
        "description": "Amateur stargazers used backyard telescopes to track the bright object before dawn.",
    }
    r2 = c.post("/api/check", json=payload2, headers={"X-Client-Id": VALID_CLIENT_A})
    assert r2.status_code == 200
    id2 = r2.json()["id"]

    # Client A should see 2 checks, newest first
    hist_a = c.get("/api/history", headers={"X-Client-Id": VALID_CLIENT_A}).json()["checks"]
    assert len(hist_a) == 2
    assert hist_a[0]["id"] == id2

    # Client B should see 0 checks (isolated)
    hist_b = c.get("/api/history", headers={"X-Client-Id": VALID_CLIENT_B}).json()["checks"]
    assert len(hist_b) == 0


@needs_models
def test_delete_one_and_delete_all(app_and_client):
    c, temp_dir = app_and_client
    # Create client with 2 checks
    cid = str(uuid.uuid4())
    r1 = c.post("/api/check", json=GOOD_PAYLOAD, headers={"X-Client-Id": cid})
    r2 = c.post("/api/check", json=GOOD_PAYLOAD, headers={"X-Client-Id": cid})
    id1 = r1.json()["id"]
    id2 = r2.json()["id"]

    # Also add feedback on id1
    c.post("/api/feedback", json={"check_id": id1, "agrees": True, "note": "Looks accurate"}, headers={"X-Client-Id": cid})

    # Delete check 1
    del_r = c.delete(f"/api/history/{id1}", headers={"X-Client-Id": cid})
    assert del_r.status_code == 204

    # Now history only contains id2
    hist = c.get("/api/history", headers={"X-Client-Id": cid}).json()["checks"]
    assert len(hist) == 1
    assert hist[0]["id"] == id2

    # File should not contain id1's feedback either
    client_file = os.path.join(temp_dir, "clients", f"{cid}.jsonl")
    with open(client_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert id1 not in content

    # Delete all
    del_all = c.delete("/api/history", headers={"X-Client-Id": cid})
    assert del_all.status_code == 204
    assert not os.path.exists(client_file)
    hist_empty = c.get("/api/history", headers={"X-Client-Id": cid}).json()["checks"]
    assert len(hist_empty) == 0


def test_concurrent_appends_leave_valid_json(app_and_client):
    _, temp_dir = app_and_client
    storage = Storage(data_dir=temp_dir)
    cid = str(uuid.uuid4())

    def worker(i: int):
        storage.append_check(
            client_id=cid,
            check_id=f"chk-{i}",
            created_at=f"2026-09-30T10:00:{i:02d}Z",
            title=f"Concurrent title {i}",
            description=f"Concurrent description {i}",
            output={"test": i},
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(worker, i) for i in range(20)]
        for f in concurrent.futures.as_completed(futures):
            f.result()

    client_file = os.path.join(temp_dir, "clients", f"{cid}.jsonl")
    assert os.path.exists(client_file)
    with open(client_file, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    assert len(lines) == 20
    for line in lines:
        parsed = json.loads(line)
        assert parsed["type"] == "check"
        assert parsed["client_id"] == cid


@needs_models
def test_rate_limiting(app_and_client):
    c, _ = app_and_client
    from app.main import app
    from app.ratelimit import RateLimiter

    # Set limiter with small client capacity of 2
    app.state.ratelimiter = RateLimiter(client_rate=2, ip_rate=60)
    cid = str(uuid.uuid4())

    r1 = c.post("/api/check", json=GOOD_PAYLOAD, headers={"X-Client-Id": cid})
    assert r1.status_code == 200
    r2 = c.post("/api/check", json=GOOD_PAYLOAD, headers={"X-Client-Id": cid})
    assert r2.status_code == 200

    # 3rd request should exceed client rate limit
    r3 = c.post("/api/check", json=GOOD_PAYLOAD, headers={"X-Client-Id": cid})
    assert r3.status_code == 429
    assert "Retry-After" in r3.headers


@needs_models
def test_about_endpoint(app_and_client):
    c, _ = app_and_client
    r = c.get("/api/about")
    assert r.status_code == 200
    data = r.json()
    assert "readers" in data
    assert "thresholds" in data
    assert "model_version" in data
    if data["holdout_accuracy_pct"] is not None:
        low, high = data["holdout_accuracy_pct"]
        assert low <= high


def test_admin_export_disabled_and_enabled(app_and_client):
    c, temp_dir = app_and_client
    from app.main import app

    # Enabled with correct token
    app.state.settings = Settings(data_dir=temp_dir, admin_token="secret-admin-123")
    r = c.get("/api/admin/export", headers={"X-Admin-Token": "secret-admin-123"})
    assert r.status_code == 200

    # Wrong token
    r_bad = c.get("/api/admin/export", headers={"X-Admin-Token": "wrong-token"})
    assert r_bad.status_code == 401

    # Disabled if unset
    app.state.settings = Settings(data_dir=temp_dir, admin_token=None)
    r_unset = c.get("/api/admin/export", headers={"X-Admin-Token": "secret-admin-123"})
    assert r_unset.status_code == 404


def test_explain_empty_and_graceful():
    res = compute_highlights(None, None, "")
    assert res == {"questionable": [], "reliable": []}
