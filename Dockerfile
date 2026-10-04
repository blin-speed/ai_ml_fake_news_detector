# Stage 1: Build React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python runtime service
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TF_CPP_MIN_LOG_LEVEL=2
WORKDIR /srv
ARG REQS=requirements.txt
COPY requirements.txt requirements-lite.txt ./
RUN pip install --no-cache-dir -r ${REQS}
COPY app ./app
COPY --from=frontend-builder /build/dist ./frontend/dist
RUN mkdir -p /srv/data && useradd -m appuser && chown -R appuser /srv
USER appuser
ENV MODEL_DIR=/srv/models_v2 DATA_DIR=/srv/data
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD python -c "import urllib.request as u; u.urlopen('http://127.0.0.1:8000/health')" || exit 1
# One worker per container: in-process storage lock is sufficient, scale with replicas instead
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
