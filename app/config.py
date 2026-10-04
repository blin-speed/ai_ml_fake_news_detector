"""Environment-driven settings. Nothing here needs to change for a default local run."""
import os
from dataclasses import dataclass, field


def _list(name: str, default: str) -> list[str]:
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    model_dir: str = os.getenv("MODEL_DIR", "models_v2")
    enable_lstm: bool = os.getenv("ENABLE_LSTM", "1") == "1"      # 0 = classical models only (no TensorFlow needed)
    fake_threshold: float = float(os.getenv("FAKE_THRESHOLD", "0.65"))   # ensemble P(fake) >= this -> likely_fake
    real_threshold: float = float(os.getenv("REAL_THRESHOLD", "0.35"))   # ensemble P(fake) <= this -> likely_real
    max_batch: int = int(os.getenv("MAX_BATCH", "32"))
    cors_origins: list[str] = field(default_factory=lambda: _list(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"))
    data_dir: str = os.getenv("DATA_DIR", "data")
    admin_token: str | None = os.getenv("ADMIN_TOKEN", None)
    retention_days: int = int(os.getenv("RETENTION_DAYS", "0"))
    rate_limit_per_client: int = int(os.getenv("RATE_LIMIT_PER_CLIENT", "20"))
    rate_limit_per_ip: int = int(os.getenv("RATE_LIMIT_PER_IP", "60"))
    app_version: str = "1.0"
