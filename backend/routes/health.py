from flask import Blueprint, jsonify
from services import broadcaster

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@health_bp.get("/status")
def current_status():
    """HTTP snapshot of current service status (for non-WebSocket clients)."""
    return jsonify(broadcaster.get_cached_alerts())


@health_bp.get("/elevators")
def elevator_outages():
    """HTTP snapshot of current elevator/escalator outages."""
    return jsonify(broadcaster.get_cached_elevators())
