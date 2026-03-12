import { STATIONS } from "../constants/stations";
import { T } from "../theme";
import LineBadge from "./LineBadge";
import StatusDot from "./StatusDot";

export default function FavoritesTab({ favorites, toggleFavorite, serviceStatus }) {
  const favStations = STATIONS.filter(s => favorites.includes(s.id));

  if (favStations.length === 0) {
    return (
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          padding: 48, textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, color: T.textMuted }}>☆</div>
          <div style={{ fontSize: 15, color: T.textDim, fontWeight: 700 }}>No saved stations yet</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>
            Click "Save" on any station from the Map tab
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 32px", display: "flex", flexDirection: "column", gap: 4 }}>
      {favStations.map(station => {
        const alerts = station.lines
          .map(l => ({ line: l, ...(serviceStatus[l] ?? {}) }))
          .filter(a => (a.severity ?? 0) > 0);

        return (
          <div key={station.id} style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderLeft: `5px solid ${alerts.length > 0 ? T.warning : T.success}`,
            padding: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, color: T.text, fontWeight: 700 }}>{station.name}</div>
                <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                  {station.lines.map(l => <LineBadge key={l} line={l} size={24} />)}
                </div>
              </div>
              <button onClick={() => toggleFavorite(station.id)} style={{
                padding: "7px 14px",
                border: `2px solid ${T.danger}`,
                borderRadius: 2,
                background: "transparent",
                color: T.danger, fontSize: 12, cursor: "pointer", fontWeight: 700,
              }}>Remove</button>
            </div>

            {alerts.length > 0 && (
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: T.warningBg, borderLeft: `4px solid ${T.warning}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.warning, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
                  Active Alerts
                </div>
                {alerts.map(a => (
                  <div key={a.line} style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5 }}>
                    <LineBadge line={a.line} size={18} />
                    <StatusDot severity={a.severity} />
                    <span style={{ fontSize: 13, color: T.textDim }}>{a.status}: {a.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
