import { useState, useMemo } from "react";
import { SUBWAY_LINES } from "../constants/lines";
import { T } from "../theme";
import LineBadge from "./LineBadge";
import StatusDot from "./StatusDot";

export default function StatusTab({ serviceStatus, lastUpdate, connected }) {
  const [filter, setFilter] = useState("all");

  const groups = useMemo(() => {
    const g = {};
    Object.entries(SUBWAY_LINES).forEach(([line, info]) => {
      if (!g[info.group]) g[info.group] = [];
      g[info.group].push({ line, ...info, ...(serviceStatus[line] ?? {}) });
    });
    return g;
  }, [serviceStatus]);

  const filteredGroups = Object.entries(groups).filter(([, lines]) => {
    if (filter === "issues") return lines.some(l => (l.severity ?? 0) > 0);
    if (filter === "good")   return lines.every(l => (l.severity ?? 0) === 0);
    return true;
  });

  const counts = useMemo(() => {
    const vals = Object.values(serviceStatus);
    return {
      good:    vals.filter(s => s.severity === 0).length,
      delays:  vals.filter(s => s.severity === 1).length,
      planned: vals.filter(s => s.severity === 2).length,
      suspend: vals.filter(s => s.severity === 3).length,
    };
  }, [serviceStatus]);

  const noData = Object.keys(serviceStatus).length === 0;

  return (
    <div style={{ padding: "0 24px 32px" }}>
      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ color: T.textMuted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Show:</span>
        {["all", "issues", "good"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px",
            border: `2px solid ${filter === f ? T.accent : T.border}`,
            borderRadius: 2,
            background: filter === f ? T.accent : T.surface,
            color: filter === f ? "#fff" : T.textDim,
            fontSize: 13, cursor: "pointer", fontWeight: filter === f ? 700 : 400,
          }}>
            {f === "all" ? "All Lines" : f === "issues" ? "Service Issues" : "Good Service"}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: connected ? T.success : T.warning, fontWeight: 600 }}>
          {connected
            ? lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : "Connecting…"
            : "Reconnecting…"}
        </span>
      </div>

      {/* Loading state */}
      {noData && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          padding: 40, textAlign: "center", color: T.textMuted, fontSize: 14,
        }}>
          Connecting to live feed…
        </div>
      )}

      {/* Summary cards */}
      {!noData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Good Service", count: counts.good,    color: T.success, bg: T.successBg },
            { label: "Delays",       count: counts.delays,  color: T.warning, bg: T.warningBg },
            { label: "Planned Work", count: counts.planned, color: T.planned, bg: T.plannedBg },
            { label: "Suspended",    count: counts.suspend, color: T.danger,  bg: T.dangerBg  },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{
              background: T.surface,
              borderTop: `5px solid ${color}`,
              border: `1px solid ${T.border}`,
              borderTopWidth: 5,
              padding: "14px 16px",
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 12, color: T.textDim, fontWeight: 400, marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Line groups */}
      {!noData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {filteredGroups.map(([group, lines]) => {
            const maxSev = Math.max(...lines.map(l => l.severity ?? 0));
            const borderColor =
              maxSev === 3 ? T.danger :
              maxSev === 2 ? T.planned :
              maxSev === 1 ? T.warning :
              T.success;
            return (
              <div key={group} style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderLeft: `5px solid ${borderColor}`,
                padding: "14px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {lines.map(l => <LineBadge key={l.line} line={l.line} size={28} />)}
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <StatusDot severity={maxSev} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{lines[0]?.status ?? "—"}</span>
                    </div>
                    <div style={{ fontSize: 13, color: T.textDim, marginTop: 3 }}>{lines[0]?.message ?? ""}</div>
                  </div>
                  <span style={{ fontSize: 12, color: T.textMuted }}>{lines[0]?.updatedAt ?? ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
