"""
Tests for services/mta_feed.py — parsing logic only.
No network calls are made; all tests use inline fixture data.
"""
import pytest
from services.mta_feed import (
    _get_translation,
    _parse_alerts_json,
    _parse_elevator_json,
    _simulated_alerts,
    SUBWAY_LINE_IDS,
    ALERT_TYPE_MAP,
)


# ── _get_translation ──────────────────────────────────────────────

def test_get_translation_returns_english():
    obj = {"translation": [{"language": "en", "text": "Delays on the A line"}]}
    assert _get_translation(obj) == "Delays on the A line"


def test_get_translation_prefers_english_over_other():
    obj = {"translation": [
        {"language": "es", "text": "Retrasos"},
        {"language": "en", "text": "Delays"},
    ]}
    assert _get_translation(obj) == "Delays"


def test_get_translation_fallback_to_first():
    obj = {"translation": [{"language": "es", "text": "Retrasos"}]}
    assert _get_translation(obj) == "Retrasos"


def test_get_translation_empty_object():
    assert _get_translation({}) == ""


def test_get_translation_empty_list():
    assert _get_translation({"translation": []}) == ""


# ── _parse_alerts_json ────────────────────────────────────────────

def test_parse_alerts_all_good_when_no_entities():
    result = _parse_alerts_json({"entity": []})
    assert set(result.keys()) == set(SUBWAY_LINE_IDS)
    for line in SUBWAY_LINE_IDS:
        assert result[line]["severity"] == 0
        assert result[line]["status"] == "Good Service"


def test_parse_alerts_suspension_applied():
    data = {"entity": [{
        "alert": {
            "transit_realtime.mercury_alert": {"alert_type": "Planned - Suspended"},
            "header_text": {"translation": [{"language": "en", "text": "A suspended"}]},
            "description_text": {},
            "informed_entity": [{"route_id": "A"}],
        }
    }]}
    result = _parse_alerts_json(data)
    assert result["A"]["severity"] == 3
    assert result["A"]["status"] == "Suspended"
    assert result["A"]["message"] == "A suspended"


def test_parse_alerts_delay_applied():
    data = {"entity": [{
        "alert": {
            "transit_realtime.mercury_alert": {"alert_type": "Reduced Service"},
            "header_text": {},
            "description_text": {"translation": [{"language": "en", "text": "Reduced service on R"}]},
            "informed_entity": [{"route_id": "R"}],
        }
    }]}
    result = _parse_alerts_json(data)
    assert result["R"]["severity"] == 1
    assert result["R"]["status"] == "Delays"


def test_parse_alerts_no_downgrade():
    """A suspension on line 1 should not be downgraded by a later Reduced Service alert."""
    data = {"entity": [
        {
            "alert": {
                "transit_realtime.mercury_alert": {"alert_type": "Planned - Suspended"},
                "header_text": {}, "description_text": {},
                "informed_entity": [{"route_id": "1"}],
            }
        },
        {
            "alert": {
                "transit_realtime.mercury_alert": {"alert_type": "Reduced Service"},
                "header_text": {}, "description_text": {},
                "informed_entity": [{"route_id": "1"}],
            }
        },
    ]}
    result = _parse_alerts_json(data)
    assert result["1"]["severity"] == 3  # Suspended must not be overwritten


def test_parse_alerts_unknown_route_ignored():
    """Alerts for unknown route IDs should not raise or corrupt results."""
    data = {"entity": [{
        "alert": {
            "transit_realtime.mercury_alert": {"alert_type": "Planned - Suspended"},
            "header_text": {}, "description_text": {},
            "informed_entity": [{"route_id": "UNKNOWN_XYZ"}],
        }
    }]}
    result = _parse_alerts_json(data)
    # All real lines should still be good service
    for line in SUBWAY_LINE_IDS:
        assert result[line]["severity"] == 0


def test_parse_alerts_multiple_lines():
    data = {"entity": [{
        "alert": {
            "transit_realtime.mercury_alert": {"alert_type": "Planned - Part Suspended"},
            "header_text": {}, "description_text": {},
            "informed_entity": [{"route_id": "N"}, {"route_id": "Q"}, {"route_id": "W"}],
        }
    }]}
    result = _parse_alerts_json(data)
    for line in ("N", "Q", "W"):
        assert result[line]["severity"] == 2
    # Lines not in the alert are still good
    assert result["1"]["severity"] == 0


# ── _simulated_alerts ─────────────────────────────────────────────

def test_simulated_alerts_covers_all_lines():
    result = _simulated_alerts()
    assert set(result.keys()) == set(SUBWAY_LINE_IDS)


def test_simulated_alerts_valid_severities():
    result = _simulated_alerts()
    for line, info in result.items():
        assert info["severity"] in (0, 1, 2, 3), f"Bad severity for {line}"
        assert "status" in info
        assert "message" in info
        assert "updatedAt" in info


def test_simulated_alerts_deterministic():
    """Same minute → same result (seed is minute-based)."""
    r1 = _simulated_alerts()
    r2 = _simulated_alerts()
    assert r1 == r2


# ── _parse_elevator_json ──────────────────────────────────────────

def test_parse_elevator_elevator_type():
    data = [{
        "equipment": "EL001",
        "equipmenttype": "EL",
        "station": "Times Sq",
        "linesservedbyelevator": "1 2 3",
        "borough": "MN",
        "serving": "Mezzanine to street",
        "reason": "Maintenance",
        "estimatedreturntoservice": "03/20/2026",
        "ADA": "Y",
    }]
    result = _parse_elevator_json(data)
    assert len(result) == 1
    assert result[0]["type"] == "Elevator"
    assert result[0]["ada"] is True
    assert result[0]["station"] == "Times Sq"
    assert result[0]["eta"] == "03/20/2026"


def test_parse_elevator_escalator_type():
    data = [{
        "equipment": "ES002",
        "equipmenttype": "ES",
        "station": "Union Sq",
        "linesservedbyelevator": "4 5 6",
        "borough": "MN",
        "serving": "Platform",
        "reason": "Repair",
        "estimatedreturntoservice": "",
        "ADA": "N",
    }]
    result = _parse_elevator_json(data)
    assert result[0]["type"] == "Escalator"
    assert result[0]["ada"] is False


def test_parse_elevator_empty_list():
    assert _parse_elevator_json([]) == []


def test_parse_elevator_multiple():
    data = [
        {"equipment": "EL1", "equipmenttype": "EL", "station": "A",
         "linesservedbyelevator": "1", "borough": "MN", "serving": "x",
         "reason": "r", "estimatedreturntoservice": "", "ADA": "N"},
        {"equipment": "EL2", "equipmenttype": "EL", "station": "B",
         "linesservedbyelevator": "2", "borough": "BK", "serving": "y",
         "reason": "r", "estimatedreturntoservice": "", "ADA": "Y"},
    ]
    result = _parse_elevator_json(data)
    assert len(result) == 2
    assert result[1]["ada"] is True


# ── ALERT_TYPE_MAP coverage ───────────────────────────────────────

def test_alert_type_map_all_severities_present():
    severities = {v[0] for v in ALERT_TYPE_MAP.values()}
    assert severities == {0, 1, 2, 3}
