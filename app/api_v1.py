import csv
import datetime
import os
import secrets
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Header, HTTPException, Query, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .config import Settings
from .explain import compute_highlights
from .predictor import InputTooShort, Predictor
from .preprocess import build_content
from .ratelimit import RateLimiter
from .schemas import PredictRequest, PredictResponse
from .storage import InvalidClientIdError, Storage, validate_client_id

router = APIRouter(prefix="/api", tags=["api"])


class FeedbackRequest(BaseModel):
    check_id: str = Field(..., min_length=1)
    agrees: bool
    note: Optional[str] = Field(None, max_length=500)


def _get_client_id(x_client_id: Optional[str] = Header(None, alias="X-Client-Id")) -> str:
    if not x_client_id:
        raise HTTPException(status_code=400, detail="Missing required X-Client-Id header.")
    try:
        return validate_client_id(x_client_id)
    except InvalidClientIdError as e:
        raise HTTPException(status_code=400, detail=str(e))


def _get_storage(request: Request) -> Storage:
    if not hasattr(request.app.state, "storage"):
        settings: Settings = getattr(request.app.state, "settings", Settings())
        request.app.state.storage = Storage(data_dir=settings.data_dir)
    return request.app.state.storage


def _get_ratelimiter(request: Request) -> RateLimiter:
    if not hasattr(request.app.state, "ratelimiter"):
        settings: Settings = getattr(request.app.state, "settings", Settings())
        request.app.state.ratelimiter = RateLimiter(
            client_rate=settings.rate_limit_per_client,
            ip_rate=settings.rate_limit_per_ip,
        )
    return request.app.state.ratelimiter


def _get_predictor(request: Request) -> Predictor:
    return request.app.state.predictor


def _get_settings(request: Request) -> Settings:
    return getattr(request.app.state, "settings", Settings())


@router.post("/check")
async def check_news(
    req: PredictRequest,
    request: Request,
    client_id: str = Header(..., alias="X-Client-Id"),
):
    cid = _get_client_id(client_id)

    # Rate limiting
    ip = request.client.host if request.client else "127.0.0.1"
    limiter = _get_ratelimiter(request)
    allowed, retry_after = limiter.check(client_id=cid, ip_address=ip)
    if not allowed:
        return Response(
            content='{"detail":"Rate limit exceeded. Please wait before submitting another check."}',
            status_code=429,
            media_type="application/json",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    predictor = _get_predictor(request)
    settings = _get_settings(request)
    storage = _get_storage(request)

    try:
        results = predictor.predict([(req.title, req.description)])
        pred = results[0]
    except InputTooShort as e:
        raise HTTPException(status_code=422, detail=str(e))

    content, _ = build_content(req.title, req.description)
    highlights = compute_highlights(predictor.tfidf, predictor.lr, content)

    check_id = str(uuid.uuid4())
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    created_at = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    output_record = {
        **pred,
        "highlights": highlights,
    }

    # Store full output minus id and created_at
    storage.append_check(
        client_id=cid,
        check_id=check_id,
        created_at=created_at,
        title=req.title,
        description=req.description,
        output=output_record,
        app_version=settings.app_version,
        model_version=predictor.version,
    )

    return {
        **pred,
        "id": check_id,
        "created_at": created_at,
        "highlights": highlights,
    }


@router.get("/history")
async def get_history(
    request: Request,
    client_id: str = Header(..., alias="X-Client-Id"),
    limit: int = Query(50, ge=1, le=100),
    before: Optional[str] = Query(None),
):
    cid = _get_client_id(client_id)
    storage = _get_storage(request)
    checks = storage.read_history(client_id=cid, limit=limit, before=before)
    return {"checks": checks}


@router.delete("/history/{check_id}")
async def delete_history_item(
    check_id: str,
    request: Request,
    client_id: str = Header(..., alias="X-Client-Id"),
):
    cid = _get_client_id(client_id)
    storage = _get_storage(request)
    storage.delete_one(client_id=cid, check_id=check_id)
    return Response(status_code=204)


@router.delete("/history")
async def delete_all_history(
    request: Request,
    client_id: str = Header(..., alias="X-Client-Id"),
):
    cid = _get_client_id(client_id)
    storage = _get_storage(request)
    storage.delete_all(client_id=cid)
    return Response(status_code=204)


@router.post("/feedback")
async def post_feedback(
    fb: FeedbackRequest,
    request: Request,
    client_id: str = Header(..., alias="X-Client-Id"),
):
    cid = _get_client_id(client_id)
    storage = _get_storage(request)
    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    storage.append_feedback(
        client_id=cid,
        check_id=fb.check_id,
        created_at=now_utc,
        agrees=fb.agrees,
        note=fb.note,
    )
    return {"status": "ok"}


@router.get("/about")
async def get_about(request: Request):
    predictor = _get_predictor(request)
    settings = _get_settings(request)

    holdout_range = None
    csv_path = os.path.join(settings.model_dir, "results.csv")
    if os.path.exists(csv_path):
        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                holdout_accuracies = []
                for row in reader:
                    if row.get("Split", "").strip() == "External Holdout":
                        val_str = row.get("Accuracy (%)", "").strip()
                        if val_str:
                            holdout_accuracies.append(float(val_str))
                if holdout_accuracies:
                    holdout_range = [min(holdout_accuracies), max(holdout_accuracies)]
        except Exception:
            holdout_range = None

    return {
        "holdout_accuracy_pct": holdout_range,
        "readers": predictor.model_names,
        "model_version": predictor.version,
        "thresholds": {
            "likely_fake_at_or_above": settings.fake_threshold,
            "likely_real_at_or_below": settings.real_threshold,
        },
    }


@router.get("/admin/export")
async def admin_export(
    request: Request,
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
):
    settings = _get_settings(request)
    if not settings.admin_token:
        raise HTTPException(status_code=404, detail="Admin export is disabled.")

    if not x_admin_token or not secrets.compare_digest(x_admin_token, settings.admin_token):
        raise HTTPException(status_code=401, detail="Invalid admin token.")

    storage = _get_storage(request)

    def iter_lines():
        for line in storage.export_all():
            yield line + "\n"

    return StreamingResponse(iter_lines(), media_type="application/x-ndjson")
