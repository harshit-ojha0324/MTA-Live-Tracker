"""
Tests for services/cache.py — in-memory fallback only (no Redis required).
"""
import pytest
from services import cache


@pytest.fixture(autouse=True)
def use_memory_cache():
    """Force in-memory cache for all tests (no Redis needed)."""
    cache.init_cache("")  # empty REDIS_URL → in-memory
    yield
    cache._mem_store.clear()


def test_set_and_get():
    cache.set("key1", {"foo": "bar"})
    assert cache.get("key1") == {"foo": "bar"}


def test_get_missing_key_returns_none():
    assert cache.get("nonexistent") is None


def test_overwrite_value():
    cache.set("key2", "first")
    cache.set("key2", "second")
    assert cache.get("key2") == "second"


def test_set_list_value():
    cache.set("elevators", [{"station": "Times Sq"}])
    result = cache.get("elevators")
    assert isinstance(result, list)
    assert result[0]["station"] == "Times Sq"


def test_set_empty_list():
    cache.set("empty", [])
    assert cache.get("empty") == []


def test_multiple_keys_independent():
    cache.set("a", 1)
    cache.set("b", 2)
    assert cache.get("a") == 1
    assert cache.get("b") == 2
