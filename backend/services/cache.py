"""
Redis cache with transparent in-memory fallback.
Uses a uniform get/set/delete API so callers never need to know which backend
is active.

Two layers of fault tolerance:
  1. Boot-time: if no REDIS_URL is given (or Redis is unreachable at startup),
     the cache starts on the in-memory store.
  2. Runtime (live failover): if Redis was selected at boot but a later call
     fails (mid-flight outage, dropped connection), the cache degrades to the
     in-memory store for the rest of the process instead of raising — so a
     transient Redis outage never surfaces as a 500 to the dashboard.
"""
import time
import json
import redis

_client = None
_use_memory = False
_mem_store: dict = {}  # { key: (value, expires_at_float | None) }


def init_cache(redis_url: str):
    global _client, _use_memory
    if not redis_url:
        _use_memory = True
        return
    try:
        _client = redis.Redis.from_url(redis_url, socket_connect_timeout=2)
        _client.ping()
        _use_memory = False
    except Exception:
        _use_memory = True


def _degrade_to_memory(op: str, exc: Exception):
    """Redis failed on a live request — fail over to the in-memory store for the
    rest of the process so the outage doesn't propagate to callers."""
    global _use_memory
    if not _use_memory:
        print(f"[cache] Redis {op} failed ({exc}) — failing over to in-memory store")
    _use_memory = True


def _mem_get(key: str):
    entry = _mem_store.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if expires_at and time.time() > expires_at:
        del _mem_store[key]
        return None
    return value


def _mem_set(key: str, value, ttl: int):
    expires_at = time.time() + ttl if ttl else None
    _mem_store[key] = (value, expires_at)


def get(key: str):
    if not _use_memory:
        try:
            raw = _client.get(key)
            return json.loads(raw) if raw is not None else None
        except Exception as exc:
            _degrade_to_memory("get", exc)
    return _mem_get(key)


def set(key: str, value, ttl: int = 60):
    if not _use_memory:
        try:
            _client.setex(key, ttl, json.dumps(value))
            return
        except Exception as exc:
            _degrade_to_memory("set", exc)
    _mem_set(key, value, ttl)


def delete(key: str):
    if not _use_memory:
        try:
            _client.delete(key)
            return
        except Exception as exc:
            _degrade_to_memory("delete", exc)
    _mem_store.pop(key, None)
