import datetime
import json
import logging
import os
import re
import tempfile
import threading
from typing import Any, Generator, Optional

log = logging.getLogger("storage")

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

_storage_lock = threading.Lock()


class InvalidClientIdError(ValueError):
    pass


def validate_client_id(client_id: str) -> str:
    if not client_id or not isinstance(client_id, str) or not UUID_RE.match(client_id.strip()):
        raise InvalidClientIdError(f"Invalid client_id: {client_id!r}. Must be a valid UUID4.")
    return client_id.strip().lower()


class Storage:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.clients_dir = os.path.join(self.data_dir, "clients")
        os.makedirs(self.clients_dir, exist_ok=True)

    def _client_file(self, client_id: str) -> str:
        cid = validate_client_id(client_id)
        return os.path.join(self.clients_dir, f"{cid}.jsonl")

    def append_check(
        self,
        client_id: str,
        check_id: str,
        created_at: str,
        title: str,
        description: str,
        output: dict[str, Any],
        app_version: str = "1.0",
        model_version: str = "v2",
    ) -> dict[str, Any]:
        filepath = self._client_file(client_id)
        record = {
            "type": "check",
            "id": check_id,
            "created_at": created_at,
            "client_id": validate_client_id(client_id),
            "input": {"title": title, "description": description},
            "output": output,
            "app_version": app_version,
            "model_version": model_version,
        }
        line = json.dumps(record, ensure_ascii=False) + "\n"
        with _storage_lock:
            with open(filepath, "a", encoding="utf-8") as f:
                f.write(line)
                f.flush()
                os.fsync(f.fileno())
        return record

    def append_feedback(
        self,
        client_id: str,
        check_id: str,
        created_at: str,
        agrees: bool,
        note: Optional[str] = None,
    ) -> dict[str, Any]:
        filepath = self._client_file(client_id)
        record = {
            "type": "feedback",
            "check_id": check_id,
            "created_at": created_at,
            "agrees": agrees,
        }
        if note:
            record["note"] = note[:500]
        line = json.dumps(record, ensure_ascii=False) + "\n"
        with _storage_lock:
            with open(filepath, "a", encoding="utf-8") as f:
                f.write(line)
                f.flush()
                os.fsync(f.fileno())
        return record

    def read_history(
        self,
        client_id: str,
        limit: int = 50,
        before: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        filepath = self._client_file(client_id)
        if not os.path.exists(filepath):
            return []

        checks: list[dict[str, Any]] = []
        with _storage_lock:
            with open(filepath, "r", encoding="utf-8") as f:
                for raw_line in f:
                    raw_line = raw_line.strip()
                    if not raw_line:
                        continue
                    try:
                        obj = json.loads(raw_line)
                    except Exception:
                        continue
                    if isinstance(obj, dict) and obj.get("type") == "check":
                        checks.append(obj)

        # Newest first
        checks.reverse()

        if before:
            checks = [c for c in checks if c.get("created_at", "") < before]

        return checks[:limit]

    def delete_one(self, client_id: str, check_id: str) -> bool:
        filepath = self._client_file(client_id)
        if not os.path.exists(filepath):
            return False

        with _storage_lock:
            if not os.path.exists(filepath):
                return False
            lines_to_keep: list[str] = []
            found = False
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    clean = line.strip()
                    if not clean:
                        continue
                    try:
                        obj = json.loads(clean)
                    except Exception:
                        lines_to_keep.append(clean)
                        continue
                    if obj.get("type") == "check" and obj.get("id") == check_id:
                        found = True
                        continue
                    if obj.get("type") == "feedback" and obj.get("check_id") == check_id:
                        continue
                    lines_to_keep.append(clean)

            fd, temp_path = tempfile.mkstemp(dir=self.clients_dir, prefix="tmp_del_")
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as tmp:
                    for l in lines_to_keep:
                        tmp.write(l + "\n")
                    tmp.flush()
                    os.fsync(tmp.fileno())
                os.replace(temp_path, filepath)
            except Exception:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                raise
            return found

    def delete_all(self, client_id: str) -> bool:
        filepath = self._client_file(client_id)
        with _storage_lock:
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
        return False

    def export_all(self) -> Generator[str, None, None]:
        with _storage_lock:
            if not os.path.exists(self.clients_dir):
                return
            files = sorted(os.listdir(self.clients_dir))
        for filename in files:
            if not filename.endswith(".jsonl"):
                continue
            path = os.path.join(self.clients_dir, filename)
            with _storage_lock:
                if not os.path.exists(path):
                    continue
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        clean = line.strip()
                        if clean:
                            yield clean

    def purge_old(self, retention_days: int) -> int:
        if retention_days <= 0 or not os.path.exists(self.clients_dir):
            return 0
        cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(
            days=retention_days
        )
        cutoff_iso = cutoff.isoformat()
        purged_count = 0

        with _storage_lock:
            files = [f for f in os.listdir(self.clients_dir) if f.endswith(".jsonl")]
            for filename in files:
                filepath = os.path.join(self.clients_dir, filename)
                lines_to_keep: list[str] = []
                file_changed = False
                with open(filepath, "r", encoding="utf-8") as f:
                    for line in f:
                        clean = line.strip()
                        if not clean:
                            continue
                        try:
                            obj = json.loads(clean)
                            created = obj.get("created_at")
                            if created and created < cutoff_iso:
                                file_changed = True
                                purged_count += 1
                                continue
                        except Exception:
                            pass
                        lines_to_keep.append(clean)

                if file_changed:
                    fd, temp_path = tempfile.mkstemp(
                        dir=self.clients_dir, prefix="tmp_purge_"
                    )
                    try:
                        with os.fdopen(fd, "w", encoding="utf-8") as tmp:
                            for l in lines_to_keep:
                                tmp.write(l + "\n")
                            tmp.flush()
                            os.fsync(tmp.fileno())
                        os.replace(temp_path, filepath)
                    except Exception:
                        if os.path.exists(temp_path):
                            os.remove(temp_path)
        return purged_count
