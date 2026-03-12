"""
Redis cache with transparent in-memory fallback.
Uses a uniform get/set/delete API so callers never need to know which backend is active.
"""
import time
import json
import os
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


def get(key: str):
    if _use_memory:
        entry = _mem_store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if expires_at and time.time() > expires_at:
            del _mem_store[key]
            return None
        return value

    raw = _client.get(key)
    if raw is None:
        return None
    return json.loads(raw)


def set(key: str, value, ttl: int = 60):
    if _use_memory:
        expires_at = time.time() + ttl if ttl else None
        _mem_store[key] = (value, expires_at)
        return

    _client.setex(key, ttl, json.dumps(value))


def delete(key: str):
    if _use_memory:
        _mem_store.pop(key, None)
        return
    _client.delete(key)
