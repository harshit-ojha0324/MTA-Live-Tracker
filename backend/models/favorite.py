from datetime import datetime, timezone
from extensions import db


class Favorite(db.Model):
    __tablename__ = "favorites"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.String(128), nullable=False, index=True)
    station_id = db.Column(db.String(20),  nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("user_id", "station_id", name="uq_user_station"),
    )

    def to_dict(self):
        return {"station_id": self.station_id, "created_at": self.created_at.isoformat()}
