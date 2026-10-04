import json
import logging
import os
import threading
from typing import Optional

import joblib
import numpy as np

from .config import Settings
from .preprocess import build_content

log = logging.getLogger("predictor")

DISCLAIMER = ("This estimates whether the writing resembles content from unreliable publishers. "
              "It does not verify whether the claims are true.")
MIN_WORDS = 3


class InputTooShort(ValueError):
    pass


def _pad_post(seqs: list[list[int]], maxlen: int) -> np.ndarray:
    out = np.zeros((len(seqs), maxlen), dtype="int32")
    for i, s in enumerate(seqs):
        s = s[:maxlen]
        out[i, : len(s)] = s
    return out


class Predictor:
    def __init__(self, settings: Settings):
        self.s = settings
        d = settings.model_dir
        for f in ("tfidf.joblib", "nb.joblib", "lr.joblib", "config.json"):
            if not os.path.exists(os.path.join(d, f)):
                raise FileNotFoundError(f"Missing artifact {f!r} in {d!r}. Copy the models_v2 folder produced by the training notebook.")
        with open(os.path.join(d, "config.json")) as fh:
            self.cfg = json.load(fh)
        self.warnings: list[str] = []
        self._check_versions()

        self.tfidf = joblib.load(os.path.join(d, "tfidf.joblib"))
        self.nb = joblib.load(os.path.join(d, "nb.joblib"))
        self.lr = joblib.load(os.path.join(d, "lr.joblib"))

        self.lstm = self.tokenizer = None
        self._lock = threading.Lock()
        if settings.enable_lstm:
            from tensorflow.keras.models import load_model
            from tensorflow.keras.preprocessing.text import tokenizer_from_json
            self.lstm = load_model(os.path.join(d, "bilstm.keras"), compile=False)
            with open(os.path.join(d, "tokenizer.json")) as fh:
                self.tokenizer = tokenizer_from_json(fh.read())
            self.max_len = int(self.cfg["MAX_LEN"])
        self.version = str(self.cfg.get("version", "v2"))
        self.model_names = ["naive_bayes", "logistic_regression"] + (["bilstm"] if self.lstm is not None else [])
        log.info("Loaded models: %s (warnings: %s)", self.model_names, self.warnings)

    # ---- compatibility guard: pickles / .keras files are version-sensitive ----
    def _check_versions(self):
        rec = self.cfg.get("versions")
        if not rec:
            self.warnings.append("config.json has no 'versions' block - cannot verify library compatibility.")
            return
        import sklearn
        installed = {"sklearn": sklearn.__version__}
        if self.s.enable_lstm:
            import tensorflow as tf
            installed["tensorflow"] = tf.__version__
        for k, v in installed.items():
            if k in rec and rec[k].split(".")[:2] != v.split(".")[:2]:
                self.warnings.append(f"{k} trained with {rec[k]} but serving with {v}.")

    # ---- inference ----
    def _probs(self, contents: list[str]) -> dict[str, np.ndarray]:
        X = self.tfidf.transform(contents)
        out = {"naive_bayes": self.nb.predict_proba(X)[:, 1], "logistic_regression": self.lr.predict_proba(X)[:, 1]}
        if self.lstm is not None:
            seq = _pad_post(self.tokenizer.texts_to_sequences(contents), self.max_len)
            with self._lock:
                out["bilstm"] = np.asarray(self.lstm(seq, training=False)).ravel()
        return out

    def _verdict(self, p: float) -> str:
        if p >= self.s.fake_threshold:
            return "likely_fake"
        if p <= self.s.real_threshold:
            return "likely_real"
        return "uncertain"

    def predict(self, items: list[tuple[str, str]]) -> list[dict]:
        prepared = [build_content(t, d) for t, d in items]
        for content, meta in prepared:
            if meta["word_count"] < MIN_WORDS:
                raise InputTooShort(f"Input must contain at least {MIN_WORDS} words after cleaning.")
        probs = self._probs([c for c, _ in prepared])
        results = []
        for i, (_, meta) in enumerate(prepared):
            per = {k: float(v[i]) for k, v in probs.items()}
            ens = float(np.mean(list(per.values())))
            results.append({
                "verdict": self._verdict(ens),
                "ensemble_fake_probability": round(ens, 4),
                "models": {k: {"fake_probability": round(p, 4), "label": "fake" if p >= 0.5 else "real"} for k, p in per.items()},
                "fake_votes": int(sum(p >= 0.5 for p in per.values())),
                "total_models": len(per),
                "input": meta,
                "model_version": self.version,
                "disclaimer": DISCLAIMER,
            })
        return results
