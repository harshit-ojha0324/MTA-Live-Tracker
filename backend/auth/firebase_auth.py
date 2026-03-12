"""
Firebase token verification middleware.
If GOOGLE_APPLICATION_CREDENTIALS is not set, the decorator is a transparent no-op
that sets g.user_id = "anonymous" — so all endpoints work without Firebase configured.
"""
import os
from functools import wraps
from flask import request, g, abort

_firebase_available = False


def init_firebase():
    global _firebase_available
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    if not creds_path:
        print("[auth] GOOGLE_APPLICATION_CREDENTIALS not set — auth disabled (anonymous mode)")
        return

    try:
        import firebase_admin
        from firebase_admin import credentials
        creds = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(creds)
        _firebase_available = True
        print("[auth] Firebase admin SDK initialized")
    except Exception as exc:
        print(f"[auth] Firebase init failed: {exc} — falling back to anonymous mode")


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not _firebase_available:
            g.user_id = "anonymous"
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            abort(401, "Missing Bearer token")

        token = auth_header[7:]
        try:
            from firebase_admin import auth as fb_auth
            decoded = fb_auth.verify_id_token(token)
            g.user_id = decoded["uid"]
        except Exception:
            abort(401, "Invalid or expired token")

        return f(*args, **kwargs)
    return decorated
