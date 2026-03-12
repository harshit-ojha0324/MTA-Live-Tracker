from flask import Blueprint, jsonify, request, g
from extensions import db
from models import Favorite
from auth.firebase_auth import require_auth
from sqlalchemy.exc import IntegrityError

favorites_bp = Blueprint("favorites", __name__, url_prefix="/api/favorites")


@favorites_bp.get("")
@require_auth
def get_favorites():
    favs = Favorite.query.filter_by(user_id=g.user_id).order_by(Favorite.created_at).all()
    return jsonify([f.to_dict() for f in favs])


@favorites_bp.post("")
@require_auth
def add_favorite():
    data = request.get_json(silent=True) or {}
    station_id = data.get("station_id", "").strip()
    if not station_id:
        return jsonify({"error": "station_id required"}), 400

    fav = Favorite(user_id=g.user_id, station_id=station_id)
    db.session.add(fav)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()  # already exists — treat as success

    return jsonify(fav.to_dict()), 201


@favorites_bp.delete("/<station_id>")
@require_auth
def remove_favorite(station_id: str):
    Favorite.query.filter_by(user_id=g.user_id, station_id=station_id).delete()
    db.session.commit()
    return "", 204
