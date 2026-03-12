import eventlet
eventlet.monkey_patch()

import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import emit

from config import Config
from extensions import db, socketio, migrate
from auth.firebase_auth import init_firebase
from services import cache, broadcaster
from routes.favorites import favorites_bp
from routes.health import health_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensions
    db.init_app(app)
    socketio.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=[Config.CORS_ORIGIN])

    # Blueprints
    app.register_blueprint(favorites_bp)
    app.register_blueprint(health_bp)

    # Auth + cache (safe no-ops if unconfigured)
    init_firebase()
    cache.init_cache(Config.REDIS_URL)
    broadcaster.init_broadcaster(Config.POLL_INTERVAL)

    with app.app_context():
        db.create_all()

    return app


app = create_app()


# ─── Socket.IO namespace ───────────────────────────────────────────
@socketio.on("connect", namespace="/transit")
def on_connect():
    """Push current snapshots immediately so client doesn't wait for next poll."""
    try:
        emit("service_update",  broadcaster.get_cached_alerts())
        emit("elevator_update", broadcaster.get_cached_elevators())
    except Exception as exc:
        print(f"[socket] on_connect error: {exc}")


@socketio.on("disconnect", namespace="/transit")
def on_disconnect():
    pass


# ─── Start broadcaster ────────────────────────────────────────────
broadcaster.start(socketio)


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    socketio.run(app, host="0.0.0.0", port=5001, debug=debug, use_reloader=False)
