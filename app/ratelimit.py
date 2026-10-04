import threading
import time
from typing import Optional, Tuple


class TokenBucket:
    def __init__(self, capacity: float, refill_rate_per_sec: float):
        self.capacity = float(capacity)
        self.refill_rate = float(refill_rate_per_sec)
        self.tokens = float(capacity)
        self.last_update = time.monotonic()

    def consume(self, amount: float = 1.0) -> Tuple[bool, float]:
        now = time.monotonic()
        elapsed = now - self.last_update
        self.last_update = now

        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)

        if self.tokens >= amount:
            self.tokens -= amount
            return True, 0.0

        needed = amount - self.tokens
        retry_after = needed / self.refill_rate if self.refill_rate > 0 else 60.0
        return False, max(1.0, retry_after)


class RateLimiter:
    def __init__(
        self,
        client_rate: int = 20,
        ip_rate: int = 60,
        window_seconds: float = 60.0,
    ):
        self.client_capacity = float(client_rate)
        self.client_rate = float(client_rate) / window_seconds
        self.ip_capacity = float(ip_rate)
        self.ip_rate = float(ip_rate) / window_seconds

        self._client_buckets: dict[str, TokenBucket] = {}
        self._ip_buckets: dict[str, TokenBucket] = {}
        self._lock = threading.Lock()
        self._last_clean = time.monotonic()

    def _cleanup_stale(self, now: float):
        if now - self._last_clean < 300:  # Clean every 5 minutes
            return
        self._last_clean = now
        stale_threshold = 600  # 10 minutes inactive
        self._client_buckets = {
            k: b for k, b in self._client_buckets.items() if (now - b.last_update) < stale_threshold
        }
        self._ip_buckets = {
            k: b for k, b in self._ip_buckets.items() if (now - b.last_update) < stale_threshold
        }

    def check(self, client_id: Optional[str], ip_address: Optional[str]) -> Tuple[bool, float]:
        now = time.monotonic()
        with self._lock:
            self._cleanup_stale(now)

            # Check client bucket first if client_id provided
            if client_id:
                if client_id not in self._client_buckets:
                    self._client_buckets[client_id] = TokenBucket(
                        self.client_capacity, self.client_rate
                    )
                allowed, retry_after = self._client_buckets[client_id].consume(1.0)
                if not allowed:
                    return False, retry_after

            # Check IP bucket
            if ip_address:
                if ip_address not in self._ip_buckets:
                    self._ip_buckets[ip_address] = TokenBucket(self.ip_capacity, self.ip_rate)
                allowed, retry_after = self._ip_buckets[ip_address].consume(1.0)
                if not allowed:
                    return False, retry_after

            return True, 0.0
