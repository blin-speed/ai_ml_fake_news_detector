import csv
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from .api_v1 import router as api_v1_router
from .config import Settings
from .predictor import InputTooShort, Predictor
from .ratelimit import RateLimiter
from .schemas import BatchRequest, BatchResponse, PredictRequest, PredictResponse
from .storage import Storage

logging.basicConfig(level=logging.INFO)
settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not hasattr(app.state, "settings"):
        app.state.settings = settings
    if not hasattr(app.state, "predictor"):
        app.state.predictor = Predictor(app.state.settings)
    if not hasattr(app.state, "storage"):
        app.state.storage = Storage(data_dir=app.state.settings.data_dir)
    if not hasattr(app.state, "ratelimiter"):
        app.state.ratelimiter = RateLimiter(
            client_rate=app.state.settings.rate_limit_per_client,
            ip_rate=app.state.settings.rate_limit_per_ip,
        )
    if app.state.settings.retention_days > 0:
        purged = app.state.storage.purge_old(app.state.settings.retention_days)
        if purged > 0:
            logging.info("Purged %d expired check records on startup.", purged)
    yield


app = FastAPI(title="Fake News Detector API", version="2.0", lifespan=lifespan,
              description="Estimates whether a headline + description resembles unreliable-publisher writing. Not a fact-checker.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET", "POST", "DELETE"], allow_headers=["*"])


@app.middleware("http")
async def limit_api_request_size(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > 32 * 1024:
                    return Response(
                        content='{"detail":"Payload too large (max 32 KB)."}',
                        status_code=413,
                        media_type="application/json",
                    )
            except ValueError:
                pass
    return await call_next(request)


def _predictor(request: Request) -> Predictor:
    return request.app.state.predictor


@app.get("/health")
def health(request: Request):
    p = _predictor(request)
    return {"status": "ok", "models": p.model_names, "model_version": p.version, "warnings": p.warnings}


@app.get("/model-info")
def model_info(request: Request):
    p = _predictor(request)
    info = {"model_version": p.version, "models": p.model_names, "config": p.cfg,
            "thresholds": {"likely_fake_at_or_above": settings.fake_threshold, "likely_real_at_or_below": settings.real_threshold}}
    path = os.path.join(settings.model_dir, "results.csv")
    if os.path.exists(path):
        with open(path) as fh:
            info["evaluation"] = list(csv.DictReader(fh))
    return info


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest, request: Request):
    try:
        return _predictor(request).predict([(req.title, req.description)])[0]
    except InputTooShort as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/predict/batch", response_model=BatchResponse)
def predict_batch(req: BatchRequest, request: Request):
    if len(req.items) > settings.max_batch:
        raise HTTPException(status_code=413, detail=f"Batch too large (max {settings.max_batch}).")
    try:
        return {"results": _predictor(request).predict([(i.title, i.description) for i in req.items])}
    except InputTooShort as e:
        raise HTTPException(status_code=422, detail=str(e))


app.include_router(api_v1_router)

# Mount frontend/dist if it exists (built UI)
_frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if not os.path.exists(_frontend_dist):
    _frontend_dist = os.path.join(os.getcwd(), "frontend", "dist")

if os.path.exists(_frontend_dist) and os.path.isdir(_frontend_dist):
    class SPAStaticFiles(StaticFiles):
        async def get_response(self, path: str, scope):
            try:
                response = await super().get_response(path, scope)
                if response.status_code == 404:
                    return await super().get_response("index.html", scope)
                return response
            except Exception:
                return await super().get_response("index.html", scope)

    app.mount("/", SPAStaticFiles(directory=_frontend_dist, html=True), name="frontend")
