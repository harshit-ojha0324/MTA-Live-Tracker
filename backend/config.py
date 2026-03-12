import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DB_URL", "sqlite:///local.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    REDIS_URL = os.environ.get("REDIS_URL", "")
    POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "30"))
    CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "http://localhost:5173")
