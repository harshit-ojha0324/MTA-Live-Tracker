from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_migrate import Migrate

db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*", async_mode="eventlet", logger=False, engineio_logger=False)
migrate = Migrate()
