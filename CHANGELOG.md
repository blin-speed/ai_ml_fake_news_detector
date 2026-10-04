# Changelog - Second Opinion

## [1.0.0] - Full Implementation Completed

### Added
- **Phase 1: Backend Foundation**
  - `app/storage.py`: Thread-safe JSONL storage layer with UUID4 client path-traversal validation, atomic deletes, history pagination, and export.
  - `app/ratelimit.py`: In-memory token-bucket rate limiter (20/min per client, 60/min per IP) with automatic stale bucket pruning.
  - `app/api_v1.py`: FastAPI router mounted at `/api` with endpoints:
    - `POST /api/check`: Enriched prediction with highlights, UUID identifier, timestamp, and JSONL persistence.
    - `GET /api/history`: Client check history (newest first).
    - `DELETE /api/history/{id}` & `DELETE /api/history`: Single and bulk history deletion.
    - `POST /api/feedback`: Check helpfulness feedback storage.
    - `GET /api/about`: Model metadata, holdout accuracy range from `results.csv`, readers list, and thresholds.
    - `GET /api/admin/export`: Admin NDJSON dump protected by timing-safe token comparison.
  - `tests/test_api.py`: Comprehensive test suite verifying all new endpoints, storage guarantees, rate limiting, and highlights (18 tests passing).
  - Global 32 KB request body limit on `/api/*` routes.
  - SPA fallback static hosting for `frontend/dist`.

- **Phase 2: Explanations**
  - `app/explain.py`: Highlight extractor using Logistic Regression (Pattern Spotter) TF-IDF coefficients for top unigrams and bigrams with normalized weights (0..1).

- **Phase 3: Frontend Skeleton**
  - Initialized Vite + React 18 frontend with Tailwind CSS and self-hosted `@fontsource/fraunces` and `@fontsource/inter` typography.
  - `frontend/src/copy.js`: Single source of truth copy deck with 0 banned technical words.
  - `frontend/src/api.js`: Browser API client with automatic persistent UUID management and friendly error handling.

- **Phase 4: Check Flow**
  - `frontend/src/components/CheckForm.jsx`: Headline and description inputs with live character counters, 4 verified example chips, Ctrl+Enter keyboard submission, and 422 error mapping.

- **Phase 5: Thinking Moment**
  - `frontend/src/components/ThinkingStage.jsx`: Minimum 2.6s choreographed pacing animation running the network call in parallel, with organic morphing orbs, accessibility announcements (`aria-live`), reduced motion support, and skip toggle.

- **Phase 6: Result Dashboard**
  - `frontend/src/components/VerdictCard.jsx`: Large Fraunces serif verdict heading, SVG semicircle spring gauge with neutral band, live score count-up, and quiet disclaimer line.
  - `frontend/src/components/ReaderCards.jsx`: Individual consensus dots, score progression bars, plain-language sentences, and info popovers for each reader.
  - `frontend/src/components/HighlightsView.jsx`: Safe inline unigram underlines scaling with coefficient weight, and diverging horizontal term signal chart.
  - `frontend/src/components/WritingNotes.jsx`: Stylistic observation chips (ALL-CAPS, exclamations, attribution detection, sentence length).
  - `frontend/src/components/FeedbackSection.jsx`: Helpfulness feedback with optional note sending.
  - Action buttons: "Check another", "Copy summary" with clipboard confirmation.

- **Phase 7: History and About Pages**
  - `frontend/src/routes/History.jsx`: Past check cards with verdict badges, mini lean bars, individual item deletion, and top sparkline trend chart.
  - `frontend/src/routes/HistoryDetail.jsx`: Direct result re-opener without animation.
  - `frontend/src/routes/About.jsx`: Honest limits, dynamic "about 7 in 10" strength calculation from `results.csv`, and privacy details.

- **Phase 8: Polish & Production Delivery**
  - Comprehensive unit test suites in Vitest: copy deck lint test (Rule 5 compliance), verdict mapping, reader fallbacks, writing notes, and highlight matching (17 tests passing).
  - Bundle size optimization: initial load JS ~107 KB gzipped (well under the 200 KB budget).
  - Multi-stage `Dockerfile` (Node 20 builder -> Python 3.11 runtime).
  - `docker-compose.yml` updated with `./data` volume.
  - `.gitignore` and `.env.example` updated.
  - Comprehensive `README.md` documentation.

### Defaults Applied (per Plan Section 9)
- History is scoped per browser using a persistent UUID in `localStorage` sent as `X-Client-Id`.
- History records kept forever by default (`RETENTION_DAYS=0`).
- Model thresholds default to `0.35` (reliable) and `0.65` (questionable).
- English copy only, light paper theme only.
