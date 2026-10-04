"""Run with real artifacts:  pytest -q      (skips automatically if models_v2/ is empty)."""
import os

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.preprocess import build_content, normalize

MODEL_DIR = os.getenv("MODEL_DIR", "models_v2")
have_models = os.path.exists(os.path.join(MODEL_DIR, "config.json"))
needs_models = pytest.mark.skipif(not have_models, reason="no artifacts in MODEL_DIR")

GOOD = {"title": "Senate reaches bipartisan deal on federal infrastructure funding",
        "description": "Lawmakers announced an agreement on Wednesday providing new spending for bridges, roads, and broadband."}


def test_preprocess_matches_training_normalisation():
    assert normalize("WASHINGTON (Reuters) - The senator said it.", is_desc=True) == "The senator said it."
    assert normalize("the community s reports, they don t care") == "the community's reports, they don't care"
    assert normalize("It ended in history.In Congress") == "It ended in history. In Congress"
    assert "http" not in normalize("see https://x.co/abc now")
    content, meta = build_content("Big news (VIDEO)", "Short text here. " * 60)
    assert "VIDEO" not in content and meta["description_truncated"] is True


@pytest.fixture(scope="module")
def client():
    from app.main import app
    with TestClient(app) as c:
        yield c


@needs_models
def test_health(client):
    r = client.get("/health").json()
    assert r["status"] == "ok" and len(r["models"]) >= 2


@needs_models
def test_predict_contract(client):
    r = client.post("/predict", json=GOOD)
    assert r.status_code == 200
    j = r.json()
    assert j["verdict"] in {"likely_fake", "uncertain", "likely_real"}
    assert 0 <= j["ensemble_fake_probability"] <= 1
    assert j["total_models"] == len(j["models"]) and 0 <= j["fake_votes"] <= j["total_models"]
    assert all(0 <= m["fake_probability"] <= 1 for m in j["models"].values())
    assert "does not verify" in j["disclaimer"]


@needs_models
def test_deterministic_and_batch_matches_single(client):
    a = client.post("/predict", json=GOOD).json()
    b = client.post("/predict", json=GOOD).json()
    assert a == b
    batch = client.post("/predict/batch", json={"items": [GOOD, GOOD]}).json()["results"]
    assert batch[0]["ensemble_fake_probability"] == pytest.approx(a["ensemble_fake_probability"], abs=1e-3)


@needs_models
@pytest.mark.parametrize("payload,code", [
    ({"title": "Hi", "description": ""}, 422),                   # too short after cleaning
    ({"title": "", "description": "x"}, 422),                    # empty title rejected by schema
    ({"description": "no title"}, 422),                          # missing field
    ({"title": "x" * 501, "description": ""}, 422),              # over max length
])
def test_bad_input(client, payload, code):
    assert client.post("/predict", json=payload).status_code == code


@needs_models
def test_batch_limit(client):
    n = Settings().max_batch + 1
    assert client.post("/predict/batch", json={"items": [GOOD] * n}).status_code == 413
