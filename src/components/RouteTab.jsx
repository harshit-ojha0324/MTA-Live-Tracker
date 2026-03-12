import { useState, useMemo } from "react";
import { STATIONS } from "../constants/stations";
import { SUBWAY_LINES } from "../constants/lines";
import { getSharedLine } from "../lib/dijkstra";
import { T } from "../theme";
import LineBadge from "./LineBadge";

export default function RouteTab({ routeFrom, setRouteFrom, routeTo, setRouteTo, routeResult, findRoute }) {
  const [searchQ, setSearchQ] = useState("");
  const sorted   = useMemo(() => [...STATIONS].sort((a, b) => a.name.localeCompare(b.name)), []);
  const filtered = searchQ
    ? sorted.filter(s => s.name.toLowerCase().includes(searchQ.toLowerCase()))
    : sorted;

  const swap = () => { const t = routeFrom; setRouteFrom(routeTo); setRouteTo(t); };

  const canFind = routeFrom && routeTo && routeFrom !== routeTo;

  return (
    <div style={{ padding: "0 24px 32px" }}>
      {/* Station selectors */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderTop: `5px solid ${T.accent}`,
        padding: 20, marginBottom: 16,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 12, color: T.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>From</label>
            <select value={routeFrom} onChange={e => setRouteFrom(e.target.value)} style={{
              width: "100%", padding: "10px 12px",
              border: `2px solid ${T.border}`, borderRadius: 2,
              background: T.bg, color: T.text, fontSize: 14, outline: "none",
            }}>
              <option value="">Select station…</option>
              {sorted.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <button onClick={swap} title="Swap" style={{
            width: 38, height: 38, border: `2px solid ${T.border}`, borderRadius: 2,
            background: T.bgAlt, color: T.textDim, fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>⇄</button>

          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 12, color: T.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>To</label>
            <select value={routeTo} onChange={e => setRouteTo(e.target.value)} style={{
              width: "100%", padding: "10px 12px",
              border: `2px solid ${T.border}`, borderRadius: 2,
              background: T.bg, color: T.text, fontSize: 14, outline: "none",
            }}>
              <option value="">Select station…</option>
              {sorted.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <button
            onClick={findRoute}
            disabled={!canFind}
            style={{
              padding: "10px 24px", border: "none", borderRadius: 2,
              background: canFind ? T.success : T.border,
              color: canFind ? "#fff" : T.textMuted,
              fontSize: 14, fontWeight: 700, cursor: canFind ? "pointer" : "default",
              letterSpacing: 0.3,
            }}>
            Find Route
          </button>
        </div>
      </div>

      {/* Route result */}
      {routeResult && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          padding: 20, marginBottom: 16,
        }}>
          {routeResult.path.length === 0 ? (
            <div style={{
              padding: "12px 16px", borderLeft: `5px solid ${T.danger}`,
              background: T.dangerBg, color: T.danger, fontSize: 14, fontWeight: 600,
            }}>No route found between these stations.</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: T.text, fontWeight: 700 }}>Route Found</h3>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.accent, lineHeight: 1 }}>{routeResult.time} min</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>est. travel time</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.text, lineHeight: 1 }}>{routeResult.stops}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>stops</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {routeResult.path.map((sid, i) => {
                  const station  = STATIONS.find(s => s.id === sid);
                  if (!station) return null;
                  const nextSid  = routeResult.path[i + 1];
                  const lineUsed = nextSid ? getSharedLine(sid, nextSid) : null;
                  const isFirst  = i === 0;
                  const isLast   = i === routeResult.path.length - 1;
                  const prevLine = i > 0 ? getSharedLine(routeResult.path[i - 1], sid) : null;
                  const isTransfer = lineUsed && prevLine && lineUsed !== prevLine;
                  return (
                    <div key={sid}>
                      {isTransfer && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 0 8px 14px",
                          borderLeft: `3px solid ${T.border}`, marginLeft: 14,
                          fontSize: 12, fontWeight: 700, color: T.textDim,
                          textTransform: "uppercase", letterSpacing: 0.8,
                        }}>
                          <span>↓ Transfer to</span>
                          <LineBadge line={lineUsed} size={18} />
                        </div>
                      )}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "9px 0",
                        borderLeft: !isLast
                          ? `3px solid ${lineUsed && SUBWAY_LINES[lineUsed] ? SUBWAY_LINES[lineUsed].color : T.border}`
                          : "3px solid transparent",
                        marginLeft: 14, paddingLeft: 16,
                      }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: "50%",
                          background: (isFirst || isLast) ? T.accent : T.bg,
                          border: `2px solid ${(isFirst || isLast) ? T.accent : T.border}`,
                          position: "relative", left: -23.5, flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: 14, marginLeft: -16,
                          color: (isFirst || isLast) ? T.text : T.textDim,
                          fontWeight: (isFirst || isLast) ? 700 : 400,
                        }}>
                          {station.name}
                        </span>
                        {(isFirst || isLast) && (
                          <span style={{
                            fontSize: 10, color: "#fff", fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: 0.8,
                            background: isFirst ? T.success : T.accent,
                            padding: "2px 7px", borderRadius: 2,
                          }}>
                            {isFirst ? "START" : "END"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Station search */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 16 }}>
        <input
          value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="Search stations…"
          style={{
            width: "100%", padding: "10px 12px",
            border: `2px solid ${T.border}`, borderRadius: 2,
            background: T.bg, color: T.text,
            fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box",
          }}
        />
        <div style={{ maxHeight: 240, overflowY: "auto" }}>
          {filtered.slice(0, 20).map(s => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 4px", borderBottom: `1px solid ${T.borderLight}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: T.text }}>{s.name}</span>
                <div style={{ display: "flex", gap: 3 }}>
                  {s.lines.slice(0, 6).map(l => <LineBadge key={l} line={l} size={18} />)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setRouteFrom(s.id)} style={{
                  padding: "4px 9px", border: `1px solid ${routeFrom === s.id ? T.accent : T.border}`,
                  borderRadius: 2,
                  background: routeFrom === s.id ? T.accentBg : "transparent",
                  color: routeFrom === s.id ? T.accent : T.textMuted,
                  fontSize: 10, cursor: "pointer", fontWeight: 700,
                }}>FROM</button>
                <button onClick={() => setRouteTo(s.id)} style={{
                  padding: "4px 9px", border: `1px solid ${routeTo === s.id ? T.accent : T.border}`,
                  borderRadius: 2,
                  background: routeTo === s.id ? T.accentBg : "transparent",
                  color: routeTo === s.id ? T.accent : T.textMuted,
                  fontSize: 10, cursor: "pointer", fontWeight: 700,
                }}>TO</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
