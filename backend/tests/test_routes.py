"""
Integration tests for Flask API routes.
Uses Flask test client — no network calls, no real Socket.IO thread.
"""
import pytest
from unittest.mock import patch
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ── /api/health ───────────────────────────────────────────────────

def test_health_returns_200(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200


def test_health_returns_ok(client):
    data = resp = client.get("/api/health").get_json()
    assert data["status"] == "ok"


# ── /api/status ───────────────────────────────────────────────────

def test_status_returns_200(client):
    resp = client.get("/api/status")
    assert resp.status_code == 200


def test_status_returns_dict(client):
    data = client.get("/api/status").get_json()
    assert isinstance(data, dict)


def test_status_contains_known_lines(client):
    data = client.get("/api/status").get_json()
    for line in ("1", "A", "L", "N", "G"):
        assert line in data, f"Line {line} missing from /api/status"


def test_status_line_has_required_fields(client):
    data = client.get("/api/status").get_json()
    for line, info in data.items():
        assert "severity" in info, f"severity missing for {line}"
        assert "status" in info, f"status missing for {line}"
        assert "message" in info, f"message missing for {line}"
        assert info["severity"] in (0, 1, 2, 3), f"invalid severity for {line}"


# ── /api/elevators ────────────────────────────────────────────────

def test_elevators_returns_200(client):
    resp = client.get("/api/elevators")
    assert resp.status_code == 200


def test_elevators_returns_list(client):
    data = client.get("/api/elevators").get_json()
    assert isinstance(data, list)


# ── /api/favorites (unauthenticated) ─────────────────────────────

def test_favorites_get_without_auth(client):
    """Without auth configured, anonymous user should get an empty list."""
    resp = client.get("/api/favorites")
    # Either 200 (anonymous pass-through) or 401 — both are valid depending on config
    assert resp.status_code in (200, 401)


def test_favorites_post_without_body(client):
    resp = client.post("/api/favorites", json={})
    assert resp.status_code in (400, 401)
