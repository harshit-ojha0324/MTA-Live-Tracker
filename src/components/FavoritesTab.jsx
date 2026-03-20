import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { STATIONS } from "../constants/stations";
import { T } from "../theme";
import LineBadge from "./LineBadge";
import StatusDot from "./StatusDot";

const STATUS_CONFIG = {
  good:  { color: T.success, bg: T.successBg, label: "Good Service",    pulse: false },
  delay: { color: T.warning, bg: T.warningBg, label: "Delays Reported", pulse: true  },
  bad:   { color: T.danger,  bg: T.dangerBg,  label: "Service Issues",  pulse: false },
};

function getStationStatus(station, serviceStatus) {
  const alerts = station.lines
    .map(l => ({ line: l, ...(serviceStatus[l] ?? {}) }))
    .filter(a => (a.severity ?? 0) > 0);
  if (alerts.length === 0) return "good";
  if (alerts.some(a => a.severity >= 3)) return "bad";
  return "delay";
}

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none",
        background: on ? T.accent : T.border,
        cursor: "pointer", position: "relative", flexShrink: 0,
        transition: "background 0.2s", padding: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3,
        left: on ? 23 : 3,
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
      }} />
    </button>
  );
}

export default function FavoritesTab({ favorites, toggleFavorite, serviceStatus }) {
  const { user, signInWithGoogle, signOut } = useAuth() ?? {};
  const [search, setSearch]   = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [notifs, setNotifs]   = useState({ delays: true, suspensions: true, maintenance: false });

  const favStations   = STATIONS.filter(s => favorites.includes(s.id));
  const searchResults = search.trim().length > 1
    ? STATIONS.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) &&
        !favorites.includes(s.id)
      ).slice(0, 6)
    : [];

  function savePrefs() {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  return (
    <div style={{ padding: "0 24px 48px", display: "flex", gap: 32, alignItems: "flex-start" }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Profile card */}
        <div style={{
          background: T.surface, border: `1px solid ${T.borderLight}`,
          borderRadius: 12, padding: 20,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {user?.photoURL ? (
            <img
              src={user.photoURL} alt="Profile"
              style={{ width: 68, height: 68, borderRadius: "50%", border: `3px solid ${T.bgAlt}`, objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: T.accentBg, border: `3px solid ${T.bgAlt}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, color: T.accent, fontWeight: 700,
            }}>
              {user ? (user.displayName?.[0]?.toUpperCase() ?? "U") : "☆"}
            </div>
          )}

          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>
              {user ? (user.displayName ?? "Commuter") : "Guest"}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
              {user ? "Daily Commuter" : "Not signed in"}
            </div>
          </div>

          {user ? (
            <button onClick={signOut} style={{
              background: "transparent", border: `1px solid ${T.borderLight}`,
              borderRadius: 20, padding: "7px 14px",
              fontSize: 12, color: T.textDim, cursor: "pointer", fontWeight: 600,
              width: "100%",
            }}>Sign Out</button>
          ) : (
            <button onClick={signInWithGoogle} style={{
              background: T.accent, border: "none", borderRadius: 20,
              padding: "8px 14px", fontSize: 12, color: "#fff",
              cursor: "pointer", fontWeight: 700, width: "100%",
            }}>Sign in with Google</button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { icon: "★", label: "Favorites", active: true },
            { icon: "⚙", label: "Settings",  active: false },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 8,
              background: item.active ? T.accentBg : "transparent",
              color: item.active ? T.accent : T.textDim,
              fontSize: 14, fontWeight: item.active ? 700 : 500,
              cursor: "pointer",
            }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", gap: 36, minWidth: 0 }}>

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: -0.5, margin: 0 }}>Your Hub</h2>
            <p style={{ color: T.textMuted, margin: "4px 0 0", fontSize: 14 }}>
              Real-time updates for your most used connections.
            </p>
          </div>

          {/* Station search */}
          <div style={{ position: "relative", minWidth: 260 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Add New Favorite..."
              style={{
                width: "100%", boxSizing: "border-box",
                background: T.bgAlt, border: `1px solid ${T.borderLight}`,
                borderRadius: 12, padding: "10px 16px",
                fontSize: 14, color: T.text, outline: "none",
              }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                background: T.surface, border: `1px solid ${T.borderLight}`,
                borderRadius: 10, zIndex: 20,
                boxShadow: "0 6px 20px rgba(0,0,0,0.09)",
                overflow: "hidden",
              }}>
                {searchResults.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { toggleFavorite(s.id); setSearch(""); }}
                    style={{
                      padding: "10px 16px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, color: T.text,
                      borderBottom: `1px solid ${T.borderLight}`,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {s.lines.slice(0, 5).map(l => <LineBadge key={l} line={l} size={16} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Favorites grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}>
          {favStations.map(station => {
            const statusKey = getStationStatus(station, serviceStatus);
            const cfg       = STATUS_CONFIG[statusKey];
            const alerts    = station.lines
              .map(l => ({ line: l, ...(serviceStatus[l] ?? {}) }))
              .filter(a => (a.severity ?? 0) > 0);

            return (
              <div key={station.id} style={{
                background: T.surface,
                border: `1px solid ${T.borderLight}`,
                borderRadius: 12, padding: 22,
                minHeight: 140,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "box-shadow 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.07)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{station.name}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                      {station.lines.map(l => <LineBadge key={l} line={l} size={22} />)}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(station.id)}
                    title="Remove from favorites"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: T.accent, padding: 4, lineHeight: 1 }}
                  >★</button>
                </div>

                <div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    marginTop: 14, padding: "5px 12px",
                    background: cfg.bg, borderRadius: 20,
                    fontSize: 12, fontWeight: 700, color: cfg.color,
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", background: cfg.color,
                      display: "inline-block",
                      animation: cfg.pulse ? "pulse 2s infinite" : "none",
                    }} />
                    {cfg.label}
                  </div>

                  {alerts.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {alerts.slice(0, 2).map(a => (
                        <div key={a.line} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                          <LineBadge line={a.line} size={15} />
                          <StatusDot severity={a.severity} />
                          <span style={{
                            fontSize: 11, color: T.textDim,
                            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {a.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add new station card — same min-height as other cards */}
          <div
            onClick={() => document.querySelector('[placeholder="Add New Favorite..."]')?.focus()}
            style={{
              border: `2px dashed ${T.borderLight}`,
              borderRadius: 12, padding: 22,
              minHeight: 140,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: T.textMuted, gap: 8,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderLight; e.currentTarget.style.color = T.textMuted; }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Save New Station</span>
          </div>
        </div>

        {favStations.length === 0 && (
          <p style={{ textAlign: "center", color: T.textMuted, fontSize: 13, margin: "-20px 0 0" }}>
            Search above or click stations on the Map tab to save them here.
          </p>
        )}

        {/* ── NOTIFICATION PREFERENCES ── */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.borderLight}`,
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{ padding: "24px 28px", borderBottom: `1px solid ${T.borderLight}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0, letterSpacing: -0.3 }}>
              Notification Preferences
            </h2>
            <p style={{ color: T.textMuted, margin: "4px 0 0", fontSize: 13 }}>
              Manage how and when we alert you about service changes.
            </p>
          </div>

          {[
            { key: "delays",       icon: "🔔", iconBg: T.accentBg,   title: "Live Delay Alerts",              desc: "Alert me when my favorite lines have delays" },
            { key: "suspensions",  icon: "⚠️",  iconBg: T.dangerBg,   title: "Emergency Service Suspensions",  desc: "Critical alerts for city-wide transit issues" },
            { key: "maintenance",  icon: "📅", iconBg: T.plannedBg,  title: "Planned Maintenance",            desc: "Weekly digests of upcoming weekend construction" },
          ].map((item, i, arr) => (
            <div key={item.key} style={{
              padding: "18px 28px",
              borderBottom: i < arr.length - 1 ? `1px solid ${T.borderLight}` : "none",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ padding: 10, borderRadius: 10, background: item.iconBg, fontSize: 16, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
              <Toggle on={notifs[item.key]} onToggle={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key] }))} />
            </div>
          ))}

          <div style={{ padding: "18px 28px", background: T.bgAlt, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={savePrefs} style={{
              background: "linear-gradient(135deg, #002675 0%, #0039a6 100%)",
              color: "#fff", border: "none", borderRadius: 20,
              padding: "10px 28px", fontSize: 13, fontWeight: 800,
              cursor: "pointer", letterSpacing: 0.2,
              transition: "opacity 0.15s",
            }}>
              {savedMsg ? "Saved ✓" : "Save Preferences"}
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}
