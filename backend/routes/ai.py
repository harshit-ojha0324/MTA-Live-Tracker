"""Gemini-powered AI transit assistant endpoint."""
import os
import logging
from flask import Blueprint, request, jsonify
from google import genai
from google.genai import types

log = logging.getLogger(__name__)

from services import broadcaster

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")

_SYSTEM_PROMPT = """\
You are a helpful NYC subway assistant embedded in the NYC Transit Hub app.
You have access to real-time MTA service status injected below — treat it as ground truth.

Live MTA status (as of this request):
{status_summary}

Guidelines:
- Answer concisely in 2-4 sentences.
- When the user asks about delays or service, ground your answer in the live data above.
- For route advice, clearly name any transfers required.
- If a line shows severity 1 = Delays, 2 = Service Change / Planned Work, 3 = Suspended.
- If asked something outside NYC transit, politely redirect to transit topics.
"""


def _build_status_summary(alerts: dict) -> str:
    good, affected = [], []
    for line_id, info in sorted(alerts.items()):
        sev = info.get("severity", 0)
        status = info.get("status", "Good Service")
        message = info.get("message", "")
        if sev == 0:
            good.append(line_id)
        else:
            affected.append(f"  {line_id} train: {status} (severity {sev}/3) — {message}")

    parts = []
    if affected:
        parts.append("Lines with active issues:\n" + "\n".join(affected))
    if good:
        parts.append("Lines running normally: " + ", ".join(good))
    return "\n\n".join(parts) if parts else "All lines reporting Good Service."


@ai_bp.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not user_message:
        return jsonify({"error": "message is required"}), 400

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return jsonify({"error": "AI assistant not configured — set GEMINI_API_KEY"}), 503

    try:
        alerts = broadcaster.get_cached_alerts()
        system_prompt = _SYSTEM_PROMPT.format(status_summary=_build_status_summary(alerts))

        client = genai.Client(api_key=api_key)

        # Convert last 8 messages (4 turns) to SDK Content objects
        chat_history = []
        for msg in history[-8:]:
            role = "user" if msg.get("role") == "user" else "model"
            text = (msg.get("text") or "").strip()
            if text:
                chat_history.append(
                    types.Content(role=role, parts=[types.Part(text=text)])
                )

        chat_session = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            ),
            history=chat_history,
        )
        response = chat_session.send_message(user_message)
        return jsonify({"reply": response.text})

    except Exception as exc:
        log.exception("[ai] Gemini error: %s", exc)
        return jsonify({"error": "AI assistant encountered an error. Please try again."}), 500
