import { useState, useRef, useEffect } from "react";
import { T } from "../theme";

const EXAMPLE_PROMPTS = [
  "Which lines have delays right now?",
  "Is the A train running normally?",
  "Best way from Times Square to Brooklyn Bridge?",
  "Are there any elevator outages affecting wheelchair users?",
];

function GeminiLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.16333 15.8433 5.46 15.12C3.75667 14.3733 1.93667 14 0 14C1.93667 14 3.75667 13.6383 5.46 12.915C7.16333 12.1683 8.645 11.165 9.905 9.905C11.165 8.645 12.1567 7.16333 12.88 5.46C13.6267 3.75667 14 1.93667 14 0C14 1.93667 14.3617 3.75667 15.085 5.46C15.8317 7.16333 16.835 8.645 18.095 9.905C19.355 11.165 20.8367 12.1683 22.54 12.915C24.2433 13.6383 26.0633 14 28 14C26.0633 14 24.2433 14.3733 22.54 15.12C20.8367 15.8433 19.355 16.835 18.095 18.095C16.835 19.355 15.8317 20.8367 15.085 22.54C14.3617 24.2433 14 26.0633 14 28Z" fill="url(#gemini_gradient)"/>
      <defs>
        <linearGradient id="gemini_gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4"/>
          <stop offset="0.5" stopColor="#9B72CB"/>
          <stop offset="1" stopColor="#D96570"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function AiTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg    = { role: "user", text: trimmed };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
        }),
      });
      const data = await res.json();

      if (res.status === 503) {
        setUnavailable(true);
        setMessages(newHistory);
        return;
      }

      setMessages([...newHistory, {
        role: "assistant",
        text: data.reply || data.error || "Sorry, something went wrong.",
      }]);
    } catch {
      setMessages([...newHistory, {
        role: "assistant",
        text: "Could not reach the AI assistant. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  if (unavailable) {
    return (
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderTop: `5px solid #4285f4`,
          padding: 32, textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            <GeminiLogo />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, color: T.text }}>AI Assistant Not Configured</h3>
          <p style={{ fontSize: 13, color: T.textDim, maxWidth: 420, margin: "0 auto" }}>
            Set a <code style={{ background: T.bgAlt, padding: "1px 5px", borderRadius: 2 }}>GEMINI_API_KEY</code> environment
            variable to enable the AI Transit Assistant.
            Get a free key at{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
               style={{ color: "#4285f4" }}>
              Google AI Studio
            </a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 32px" }}>
      {/* Header */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderTop: "5px solid #4285f4",
        padding: "18px 24px", marginBottom: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>
            AI Transit Assistant
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textDim }}>
            Ask about delays, routes, or service changes — grounded in live MTA data
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#f8f9ff", border: "1px solid #d2e0ff",
          borderRadius: 20, padding: "5px 12px",
        }}>
          <GeminiLogo />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4285f4" }}>Powered by Gemini</span>
        </div>
      </div>

      {/* Chat panel */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
      }}>
        {/* Message area */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto", minHeight: 360, maxHeight: 480 }}>
          {messages.length === 0 ? (
            <div>
              <p style={{ color: T.textDim, fontSize: 13, margin: "0 0 14px" }}>
                Try one of these, or type your own question:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EXAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => send(p)}
                    style={{
                      padding: "8px 14px",
                      border: `1px solid ${T.border}`,
                      borderRadius: 20,
                      background: T.bgAlt,
                      color: T.text,
                      fontSize: 13, cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#4285f4"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 12,
                alignItems: "flex-end",
                gap: 8,
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#f0f4ff", border: "1px solid #d2e0ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <GeminiLogo />
                  </div>
                )}
                <div style={{
                  maxWidth: "72%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user"
                    ? "14px 14px 3px 14px"
                    : "14px 14px 14px 3px",
                  background: msg.role === "user" ? T.accent : T.bgAlt,
                  color: msg.role === "user" ? "#fff" : T.text,
                  fontSize: 14, lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.text}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "#f0f4ff", border: "1px solid #d2e0ff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <GeminiLogo />
              </div>
              <div style={{
                padding: "10px 16px",
                borderRadius: "14px 14px 14px 3px",
                background: T.bgAlt, color: T.textMuted,
                fontSize: 14,
              }}>
                <span style={{ animation: "pulse 1.4s ease-in-out infinite" }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div style={{
          padding: "12px 16px",
          borderTop: `1px solid ${T.border}`,
          display: "flex", gap: 8, alignItems: "flex-end",
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about delays, routes, or service changes…"
            disabled={loading}
            style={{
              flex: 1, padding: "10px 14px",
              border: `2px solid ${T.border}`, borderRadius: 2,
              background: T.bg, color: T.text,
              fontSize: 14, outline: "none",
              opacity: loading ? 0.7 : 1,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              padding: "10px 22px", border: "none", borderRadius: 2,
              background: input.trim() && !loading ? "#4285f4" : T.border,
              color: "#fff",
              fontSize: 14, fontWeight: 700,
              cursor: input.trim() && !loading ? "pointer" : "default",
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: T.textMuted, margin: "10px 0 0", textAlign: "right" }}>
        Responses are AI-generated and grounded in live MTA feed data. Always verify critical travel info at mta.info.
      </p>
    </div>
  );
}
