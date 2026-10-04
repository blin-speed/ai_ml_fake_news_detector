# Second Opinion — News Reliability Reader

A friendly, measured web application and serving API that gives a **second opinion about writing style, not a fact-check**. Built on top of trained models ("readers") served by FastAPI and a React frontend.

---

## 1. Quick Start (One Command)

```bash
docker compose up --build
```

- Open `http://localhost:8000/` in your browser.
- FastAPI serves both the built React application at `/` and the REST API at `/api`.
- Client check history is persisted in the `./data` volume.

---

## 2. Local Development

### Backend (Python 3.11+)
```bash
# 1. Create and activate venv
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# 2. Install dependencies
pip install -r requirements-dev.txt

# 3. Run backend tests
python -m pytest -q

# 4. Start API server (port 8000)
uvicorn app.main:app --reload --port 8000
```

### Frontend (Node 20+)
```bash
cd frontend
npm install
npm test       # runs Vitest unit tests & copy-deck lint tests
npm run lint   # checks ESLint
npm run dev    # starts Vite dev server with proxy to :8000
```

---

## 3. Product Principles & Honest Constraints

1. **Not a fact-checker:** The tool assesses writing style and phrasing characteristics, not claim accuracy or truth.
2. **Three Readers:**
   - **The Word Counter** (Naive Bayes): Looks at word and word pair frequency.
   - **The Pattern Spotter** (Logistic Regression): Highlights word signals nudging toward reliable or questionable writing.
   - **The Sentence Reader** (Bidirectional LSTM): Reads sequentially to observe grammatical flow and context.
3. **No Jargon:** User-facing interfaces use clear, accessible language as defined in `frontend/src/copy.js`.
4. **Local Browser History:** Past checks are stored anonymously in JSON Lines under `data/clients/<client_id>.jsonl` and can be deleted individually or erased completely at any time.

---

## 4. API Reference

All `/api/*` endpoints require the `X-Client-Id` header (valid UUID4) unless noted. Request bodies have a 32 KB global cap.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/check` | Runs readers, extracts word highlights, logs record to JSONL, and returns enriched verdict. |
| `GET` | `/api/history?limit=50&before=<iso>` | Retrieves past checks for this client, newest first. |
| `DELETE` | `/api/history/{id}` | Deletes one check and its feedback. |
| `DELETE` | `/api/history` | Deletes all saved data for this client. |
| `POST` | `/api/feedback` | Records user feedback (`agrees`: bool, `note`: optional). |
| `GET` | `/api/about` | Reads holdout accuracy range from `results.csv`, reader list, and thresholds. *(No client ID needed)* |
| `GET` | `/api/admin/export` | Streams NDJSON export of all client files. Requires `X-Admin-Token` matching `ADMIN_TOKEN`. |
| `GET` | `/health` | Service health check. |
| `GET` | `/model-info` | Model metadata and evaluation metrics. |
| `POST` | `/predict` | Original single prediction endpoint. |
| `POST` | `/predict/batch` | Original batch prediction endpoint. |

---

## 5. Storage & Worker Concurrency

- Files are written to `data/clients/<client_id>.jsonl`.
- Client IDs are validated with a strict UUID4 regex to prevent path traversal.
- Appends and deletions use process-wide thread locks and atomic `os.replace`.
- **Worker Note:** The container runs with **one worker** (`--workers 1`), making the in-process lock sufficient for safe concurrent writes.

---

## 6. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `MODEL_DIR` | `models_v2` | Folder containing model artifacts. |
| `DATA_DIR` | `data` | Directory for client JSONL stores. |
| `ENABLE_LSTM` | `1` | Set `0` to run classical readers only. |
| `FAKE_THRESHOLD` | `0.65` | Cut-off for questionable verdict. |
| `REAL_THRESHOLD` | `0.35` | Cut-off for reliable verdict. |
| `ADMIN_TOKEN` | *unset* | Secret token for `/api/admin/export`. |
| `RETENTION_DAYS` | `0` | Automatically purge records older than N days on startup (`0` = keep forever). |
| `RATE_LIMIT_PER_CLIENT` | `20` | Checks/min per client ID. |
| `RATE_LIMIT_PER_IP` | `60` | Checks/min per IP. |
