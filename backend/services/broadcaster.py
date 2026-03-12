"""
Background daemon thread: polls MTA feeds → caches results → broadcasts via Socket.IO.

Events emitted on namespace /transit:
  service_update  — dict keyed by line letter with status info
  elevator_update — list of current elevator/escalator outages
"""
import time
from . import cache, mta_feed

_poll_interval = 30

# Elevator outages change much less often — poll every 5 minutes
_ELEVATOR_POLL_INTERVAL = 300


def init_broadcaster(poll_interval: int):
    global _poll_interval
    _poll_interval = poll_interval


def start(socketio):
    socketio.start_background_task(_poll_loop, socketio)


def _poll_loop(socketio):
    last_elevator_poll = 0

    while True:
        now = time.time()

        # ── Service alerts (every poll_interval seconds) ──
        try:
            alerts = mta_feed.fetch_alerts()
            cache.set("service_alerts", alerts, ttl=_poll_interval + 5)
            socketio.emit("service_update", alerts, namespace="/transit")
        except Exception as exc:
            print(f"[broadcaster] alerts error: {exc}")

        # ── Elevator outages (every 5 minutes) ──
        if now - last_elevator_poll >= _ELEVATOR_POLL_INTERVAL:
            try:
                outages = mta_feed.fetch_elevator_outages()
                cache.set("elevator_outages", outages, ttl=_ELEVATOR_POLL_INTERVAL + 30)
                socketio.emit("elevator_update", outages, namespace="/transit")
                last_elevator_poll = now
            except Exception as exc:
                print(f"[broadcaster] elevator error: {exc}")

        time.sleep(_poll_interval)


def get_cached_alerts() -> dict:
    """Current service alerts snapshot (warms cache synchronously if cold)."""
    cached = cache.get("service_alerts")
    if cached:
        return cached
    alerts = mta_feed.fetch_alerts()
    cache.set("service_alerts", alerts, ttl=_poll_interval + 5)
    return alerts


def get_cached_elevators() -> list:
    """Current elevator outages snapshot."""
    cached = cache.get("elevator_outages")
    if cached is not None:
        return cached
    outages = mta_feed.fetch_elevator_outages()
    cache.set("elevator_outages", outages, ttl=_ELEVATOR_POLL_INTERVAL + 30)
    return outages
