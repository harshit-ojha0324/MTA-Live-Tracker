import { useState, useCallback, useMemo, useRef } from "react";
import { SUBWAY_LINES } from "../constants/lines";
import { STATIONS } from "../constants/stations";
import { EDGES } from "../constants/edges";
import { getSharedLine } from "../lib/dijkstra";
import { T } from "../theme";
import LineBadge from "./LineBadge";
import StatusDot from "./StatusDot";

export default function MapTab({ serviceStatus, elevatorOutages = [], routePathStations, routeFrom, routeTo, favorites, toggleFavorite }) {
  const [filterLine, setFilterLine]           = useState(null);
  const [mapCenter, setMapCenter]             = useState({ lat: 40.7484, lng: -73.9857 });
  const [mapZoom, setMapZoom]                 = useState(12);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isDragging, setIsDragging]           = useState(false);
  const dragStart = useRef(null);

  const project = useCallback((lat, lng) => {
    const scale = Math.pow(2, mapZoom) * 3;
    return {
      x: (lng - mapCenter.lng) * scale + 400,
      y: (mapCenter.lat - lat) * scale * 1.3 + 300,
    };
  }, [mapCenter, mapZoom]);

  const visibleStations = useMemo(() =>
    STATIONS.filter(s => {
      if (filterLine && !s.lines.includes(filterLine)) return false;
      const { x, y } = project(s.lat, s.lng);
      return x > -50 && x < 850 && y > -50 && y < 650;
    }),
  [filterLine, project]);

  const onMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, center: { ...mapCenter } };
  };
  const onMouseMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    const scale = Math.pow(2, mapZoom) * 3;
    setMapCenter({
      lng: dragStart.current.center.lng - (e.clientX - dragStart.current.x) / scale,
      lat: dragStart.current.center.lat + (e.clientY - dragStart.current.y) / scale / 1.3,
    });
  };
  const onMouseUp   = () => setIsDragging(false);
  const onWheel     = (e) => {
    e.preventDefault();
    setMapZoom(z => Math.max(10, Math.min(16, z + (e.deltaY < 0 ? 0.3 : -0.3))));
  };

  return (
    <div style={{ padding: "0 24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Line filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ color: T.textMuted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Line:</span>
        <button onClick={() => setFilterLine(null)} style={{
          padding: "4px 12px",
          border: `2px solid ${!filterLine ? T.accent : T.border}`,
          borderRadius: 2,
          background: !filterLine ? T.accent : "transparent",
          color: !filterLine ? "#fff" : T.textDim,
          fontSize: 12, cursor: "pointer", fontWeight: !filterLine ? 700 : 400,
        }}>All</button>
        {Object.keys(SUBWAY_LINES).map(l => (
          <button key={l} onClick={() => setFilterLine(filterLine === l ? null : l)} style={{
            padding: 2, background: "none",
            border: filterLine === l ? `2px solid ${T.accent}` : "2px solid transparent",
            borderRadius: "50%", cursor: "pointer", lineHeight: 0,
          }}>
            <LineBadge line={l} size={24} />
          </button>
        ))}
      </div>

      {/* SVG map */}
      <div
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}
        style={{
          width: "100%", height: 500, background: "#0f1f45",
          border: `1px solid ${T.border}`,
          overflow: "hidden", cursor: isDragging ? "grabbing" : "grab",
          position: "relative", userSelect: "none",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 800 600">
          {/* Grid */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`gx${i}`} x1={i*50} y1={0} x2={i*50} y2={600} stroke="#1e3464" strokeWidth={0.4} opacity={0.5} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`gy${i}`} x1={0} y1={i*50} x2={800} y2={i*50} stroke="#1e3464" strokeWidth={0.4} opacity={0.5} />
          ))}

          {/* Edges */}
          {EDGES.map(([a, b], i) => {
            const sA = STATIONS.find(s => s.id === a);
            const sB = STATIONS.find(s => s.id === b);
            if (!sA || !sB) return null;
            if (filterLine && !sA.lines.some(l => sB.lines.includes(l) && l === filterLine)) return null;
            const pA = project(sA.lat, sA.lng);
            const pB = project(sB.lat, sB.lng);
            const idxA = routePathStations.indexOf(a);
            const idxB = routePathStations.indexOf(b);
            const isRoute = idxA !== -1 && idxB !== -1 && Math.abs(idxA - idxB) === 1;
            const sharedLine = getSharedLine(a, b);
            const lineColor  = sharedLine ? SUBWAY_LINES[sharedLine]?.color : "#334155";
            return (
              <line key={`e${i}`} x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
                stroke={isRoute ? "#FFD100" : lineColor ?? "#334155"}
                strokeWidth={isRoute ? 4 : 1.8}
                opacity={isRoute ? 1 : 0.55}
                strokeLinecap="round" />
            );
          })}

          {/* Route glow */}
          {routePathStations.length > 1 && routePathStations.map((sid, i) => {
            if (i === routePathStations.length - 1) return null;
            const sA = STATIONS.find(s => s.id === sid);
            const sB = STATIONS.find(s => s.id === routePathStations[i + 1]);
            if (!sA || !sB) return null;
            const pA = project(sA.lat, sA.lng);
            const pB = project(sB.lat, sB.lng);
            return (
              <line key={`rg${i}`} x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
                stroke="#FFD100" strokeWidth={8} opacity={0.12} strokeLinecap="round" />
            );
          })}

          {/* Station dots */}
          {visibleStations.map(station => {
            const p          = project(station.lat, station.lng);
            const isOnRoute  = routePathStations.includes(station.id);
            const isFav      = favorites.includes(station.id);
            const isSelected = selectedStation?.id === station.id;
            const isEndpoint = station.id === routeFrom || station.id === routeTo;
            const r = isEndpoint ? 7 : isOnRoute ? 5.5 : station.lines.length > 3 ? 5 : 4;
            return (
              <g key={station.id} onClick={() => setSelectedStation(station)} style={{ cursor: "pointer" }}>
                {isSelected && (
                  <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke="#FFD100" strokeWidth={1.5} opacity={0.7}>
                    <animate attributeName="r" values={`${r+3};${r+7};${r+3}`} dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {isFav && <circle cx={p.x} cy={p.y} r={r+3} fill="none" stroke="#FFD100" strokeWidth={1.5} opacity={0.6} />}
                <circle cx={p.x} cy={p.y} r={r}
                  fill={isEndpoint ? "#FFD100" : isOnRoute ? "#fff" : "#1e3464"}
                  stroke={isOnRoute ? "#FFD100" : "#7a9cc9"}
                  strokeWidth={isOnRoute ? 2 : 1.2} />
                {mapZoom > 12 && (
                  <text x={p.x + r + 4} y={p.y + 3.5}
                    fill={isOnRoute ? "#ffffff" : "#a8b2c8"}
                    fontSize={isOnRoute ? 10 : 8.5}
                    fontWeight={isOnRoute ? 700 : 400}
                    fontFamily="Arial, sans-serif">
                    {station.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Zoom buttons */}
        <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 2 }}>
          {[["+", 0.5], ["−", -0.5]].map(([label, delta]) => (
            <button key={label} onClick={() => setMapZoom(z => Math.max(10, Math.min(16, z + delta)))} style={{
              width: 32, height: 32, border: `1px solid #2e4070`,
              background: "#1a2e5c", color: "#ffffff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{label}</button>
          ))}
        </div>

        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(10,20,50,0.85)", padding: "7px 12px",
          fontSize: 11, color: "#a8b2c8", border: "1px solid #2e4070",
        }}>
          Scroll to zoom · Drag to pan · Click stations
        </div>
      </div>

      {/* Station detail panel */}
      {selectedStation && (() => {
        const serviceAlerts = selectedStation.lines
          .map(l => ({ line: l, ...(serviceStatus[l] ?? {}) }))
          .filter(a => (a.severity ?? 0) > 0);

        const stationNameLower = selectedStation.name.toLowerCase();
        const stationElevators = elevatorOutages.filter(o =>
          o.station?.toLowerCase().includes(stationNameLower.split("–")[0].trim()) ||
          stationNameLower.includes(o.station?.toLowerCase() ?? "___")
        );

        return (
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderTop: `5px solid ${T.accent}`,
            padding: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, color: T.text, fontSize: 18, fontWeight: 700 }}>{selectedStation.name}</h3>
                <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                  {selectedStation.lines.map(l => <LineBadge key={l} line={l} size={28} />)}
                </div>

                {serviceAlerts.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {serviceAlerts.map(a => (
                      <div key={a.line} style={{
                        display: "flex", alignItems: "center", gap: 8, marginTop: 6,
                        padding: "8px 12px", background: T.warningBg, borderLeft: `4px solid ${T.warning}`,
                      }}>
                        <LineBadge line={a.line} size={18} />
                        <StatusDot severity={a.severity} />
                        <span style={{ fontSize: 13, color: T.textDim }}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {stationElevators.length > 0 && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px",
                    background: T.dangerBg, borderLeft: `4px solid ${T.danger}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.danger, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                      Elevator / Escalator Outages
                    </div>
                    {stationElevators.map((o, i) => (
                      <div key={i} style={{ fontSize: 13, color: T.textDim, marginTop: i > 0 ? 8 : 0 }}>
                        <span style={{
                          display: "inline-block", fontSize: 10, fontWeight: 700,
                          padding: "2px 7px", borderRadius: 2, marginRight: 8,
                          background: o.type === "Elevator" ? T.danger : T.warning,
                          color: "#fff",
                        }}>{o.type}</span>
                        <span>{o.serving}</span>
                        {o.ada && <span style={{ marginLeft: 8, fontSize: 11, color: T.accent, fontWeight: 700 }}>♿ ADA</span>}
                        {o.eta && (
                          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                            Est. return: {o.eta}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                <button onClick={() => toggleFavorite(selectedStation.id)} style={{
                  padding: "7px 14px", fontSize: 13, cursor: "pointer", borderRadius: 2,
                  border: `2px solid ${favorites.includes(selectedStation.id) ? T.warning : T.border}`,
                  background: favorites.includes(selectedStation.id) ? T.warningBg : "transparent",
                  color: favorites.includes(selectedStation.id) ? T.warning : T.textDim,
                  fontWeight: favorites.includes(selectedStation.id) ? 700 : 400,
                }}>
                  {favorites.includes(selectedStation.id) ? "★ Saved" : "☆ Save"}
                </button>
                <button onClick={() => setSelectedStation(null)} style={{
                  padding: "7px 12px", fontSize: 16, cursor: "pointer", borderRadius: 2,
                  border: `1px solid ${T.border}`, background: "transparent", color: T.textDim,
                }}>✕</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
