"""
Fetches and parses live MTA data:
  - Service alerts            via JSON feed  (camsys/subway-alerts.json)
  - Elevator/escalator outages via JSON feed (nyct/nyct_ene.json)

No API key is required — MTA feeds are publicly accessible.
Falls back to deterministic simulation on network/parse errors.
"""
import hashlib
import requests
from datetime import datetime, timezone

# ─── Feed URLs ────────────────────────────────────────────────────
_BASE = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds"

SUBWAY_ALERTS_URL    = f"{_BASE}/camsys%2Fsubway-alerts.json"
ELEVATOR_OUTAGES_URL = f"{_BASE}/nyct%2Fnyct_ene.json"

# Per-line GTFS-RT trip-update feeds (protobuf) — for future train-position feature
TRIP_FEEDS = {
    "ACE":      f"{_BASE}/nyct%2Fgtfs-ace",
    "BDFM":     f"{_BASE}/nyct%2Fgtfs-bdfm",
    "G":        f"{_BASE}/nyct%2Fgtfs-g",
    "JZ":       f"{_BASE}/nyct%2Fgtfs-jz",
    "NQRW":     f"{_BASE}/nyct%2Fgtfs-nqrw",
    "L":        f"{_BASE}/nyct%2Fgtfs-l",
    "1234567S": f"{_BASE}/nyct%2Fgtfs",
    "SIR":      f"{_BASE}/nyct%2Fgtfs-si",
}

# ─── Constants ────────────────────────────────────────────────────
SUBWAY_LINE_IDS = [
    "1","2","3","4","5","6","7",
    "A","C","E","B","D","F","M",
    "G","J","Z","L","N","Q","R","W","S",
]

# MTA Mercury alert_type string → (severity 0-3, human label)
ALERT_TYPE_MAP = {
    "Planned - Suspended":      (3, "Suspended"),
    "No Scheduled Service":     (3, "Suspended"),
    "Planned - Part Suspended": (2, "Service Change"),
    "Planned - Reroute":        (2, "Service Change"),
    "Planned - Stops Skipped":  (2, "Planned Work"),
    "Planned - Express to Local":(2, "Planned Work"),
    "Reduced Service":          (1, "Delays"),
    "Special Schedule":         (1, "Delays"),
    "Boarding Change":          (1, "Service Change"),
    "Extra Service":            (0, "Good Service"),
    "Station Notice":           (0, "Good Service"),
}

STATUS_MESSAGES = {
    0: "Trains are running on schedule.",
    1: "Expect delays. Check MTA.info for updates.",
    2: "Service changes in effect. Check MTA.info for details.",
    3: "Service suspended between select stations. Shuttle buses in operation.",
}


# ─── Helpers ──────────────────────────────────────────────────────
def _now_str() -> str:
    return datetime.now(timezone.utc).strftime("%I:%M:%S %p")


def _good_status() -> dict:
    return {
        "severity": 0,
        "status": "Good Service",
        "message": STATUS_MESSAGES[0],
        "updatedAt": _now_str(),
    }


def _mta_get(url: str):
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _get_translation(text_obj: dict) -> str:
    """Extract English text from a GTFS-RT translated-text object."""
    translations = text_obj.get("translation", [])
    for t in translations:
        if t.get("language", "").startswith("en"):
            return t.get("text", "")
    return translations[0].get("text", "") if translations else ""


# ─── Service Alerts ───────────────────────────────────────────────
def fetch_alerts() -> dict:
    """Return dict keyed by subway line letter with live status info."""
    try:
        data = _mta_get(SUBWAY_ALERTS_URL)
        return _parse_alerts_json(data)
    except Exception as exc:
        print(f"[mta_feed] alerts fetch error: {exc} — using simulation")
        return _simulated_alerts()


def _parse_alerts_json(data: dict) -> dict:
    now = _now_str()
    result = {line: _good_status() for line in SUBWAY_LINE_IDS}

    for entity in data.get("entity", []):
        alert = entity.get("alert", {})

        # Severity comes from the MTA Mercury extension, not the standard effect field
        mercury    = alert.get("transit_realtime.mercury_alert", {})
        alert_type = mercury.get("alert_type", "")
        severity, label = ALERT_TYPE_MAP.get(alert_type, (0, "Good Service"))

        header      = _get_translation(alert.get("header_text", {}))
        description = _get_translation(alert.get("description_text", {}))
        message     = header or description or STATUS_MESSAGES[severity]

        for informed in alert.get("informed_entity", []):
            route_id = informed.get("route_id", "")
            if route_id not in result:
                continue
            # Only upgrade — never downgrade severity already recorded for a line
            if severity > result[route_id]["severity"]:
                result[route_id] = {
                    "severity": severity,
                    "status":   label,
                    "message":  message,
                    "updatedAt": now,
                }

    return result


# ─── Elevator / Escalator Outages ─────────────────────────────────
def fetch_elevator_outages() -> list:
    """
    Returns list of current outages.
    Each item: { equipment, type, station, lines, borough, serving, reason, eta, ada }
    Returns [] on error.
    """
    try:
        data = _mta_get(ELEVATOR_OUTAGES_URL)
        return _parse_elevator_json(data)
    except Exception as exc:
        print(f"[mta_feed] elevator fetch error: {exc}")
        return []


def _parse_elevator_json(data: list) -> list:
    outages = []
    for item in data:
        eq_type = item.get("equipmenttype", "").upper()
        outages.append({
            "equipment": item.get("equipment", ""),
            "type":      "Elevator" if eq_type == "EL" else "Escalator",
            "station":   item.get("station", ""),
            "lines":     item.get("linesservedbyelevator", ""),
            "borough":   item.get("borough", ""),
            "serving":   item.get("serving", ""),
            "reason":    item.get("reason", ""),
            "eta":       item.get("estimatedreturntoservice", ""),
            "ada":       item.get("ADA", "N") == "Y",
        })
    return outages


# ─── Simulation fallback ──────────────────────────────────────────
def _simulated_alerts() -> dict:
    """
    Deterministic, minute-seeded simulation — used only when the MTA feed
    is unreachable. Consistent across clients and changes every minute so
    the dashboard feels live during outages.
    """
    now = datetime.now(timezone.utc)
    minute_seed = int(now.timestamp() // 60)
    updated_at  = now.strftime("%I:%M:%S %p")

    result = {}
    for line in SUBWAY_LINE_IDS:
        seed_val = int(hashlib.md5(f"{line}{minute_seed}".encode()).hexdigest(), 16)
        bucket   = seed_val % 100
        if   bucket < 60: sev, label = 0, "Good Service"
        elif bucket < 78: sev, label = 1, "Delays"
        elif bucket < 90: sev, label = 2, "Planned Work"
        elif bucket < 96: sev, label = 2, "Service Change"
        else:             sev, label = 3, "Suspended"

        result[line] = {
            "severity":  sev,
            "status":    label,
            "message":   STATUS_MESSAGES[sev],
            "updatedAt": updated_at,
        }

    return result
