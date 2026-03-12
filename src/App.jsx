import { useState, useCallback } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useServiceStatus } from "./hooks/useServiceStatus";
import { useFavorites } from "./hooks/useFavorites";
import { dijkstra } from "./lib/dijkstra";
import { T } from "./theme";
import AuthButton from "./components/AuthButton";
import StatusTab from "./components/StatusTab";
import MapTab from "./components/MapTab";
import RouteTab from "./components/RouteTab";
import FavoritesTab from "./components/FavoritesTab";

const TABS = [
  { id: "status",    label: "Service Status", icon: "◉" },
  { id: "map",       label: "Transit Map",    icon: "◎" },
  { id: "route",     label: "Route Planner",  icon: "⇢" },
  { id: "favorites", label: "Favorites",      icon: "★" },
];

function Inner() {
  const [tab, setTab]               = useState("status");
  const [routeFrom, setRouteFrom]   = useState("");
  const [routeTo, setRouteTo]       = useState("");
  const [routeResult, setRouteResult] = useState(null);

  const { serviceStatus, elevatorOutages, lastUpdate, connected } = useServiceStatus();
  const { favorites, toggle: toggleFavorite }    = useFavorites();

  const findRoute = useCallback(() => {
    if (!routeFrom || !routeTo || routeFrom === routeTo) return;
    setRouteResult(dijkstra(routeFrom, routeTo));
  }, [routeFrom, routeTo]);

  const routePathStations = routeResult?.path?.length > 1 ? routeResult.path : [];

  return (
    <div style={{
      minHeight: "100vh", background: T.bgAlt, color: T.text,
      fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    }}>
      {/* Header — TFL dark bar */}
      <div style={{ background: T.header, color: T.headerText }}>
        <div style={{ padding: "0 24px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, height: 56 }}>
            {/* Roundel-style logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid #d4351c",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", width: "100%", height: 10,
                  background: "#d4351c", top: "50%", transform: "translateY(-50%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "#fff", fontSize: 7, fontWeight: 900, letterSpacing: 0.5 }}>MTA</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#ffffff", letterSpacing: -0.2 }}>NYC Transit Hub</div>
              <div style={{ fontSize: 11, color: "#a8b2bd" }}>Real-time MTA service status &amp; route planning</div>
            </div>

            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: connected ? "#00703c" : "#b58840",
                display: "inline-block",
                animation: connected ? "pulse 2s infinite" : "none",
              }} />
              <span style={{ fontSize: 11, color: "#a8b2bd", fontWeight: 700, letterSpacing: 0.5 }}>
                {connected ? "LIVE" : "CONNECTING"}
              </span>
            </div>

            <AuthButton />
          </div>
        </div>
      </div>

      {/* Tab bar — white strip */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: "0 24px", maxWidth: 1100, margin: "0 auto", display: "flex" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "14px 18px",
              border: "none",
              borderBottom: `4px solid ${tab === t.id ? T.accent : "transparent"}`,
              background: "transparent",
              color: tab === t.id ? T.accent : T.textDim,
              fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              marginBottom: -1,
            }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              {t.label}
              {t.id === "favorites" && favorites.length > 0 && (
                <span style={{
                  background: T.accent, color: "#fff", fontSize: 10,
                  fontWeight: 700, padding: "2px 7px", borderRadius: 2,
                }}>{favorites.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ paddingTop: 24, maxWidth: 1100, margin: "0 auto" }}>
        {tab === "status" && (
          <StatusTab serviceStatus={serviceStatus} lastUpdate={lastUpdate} connected={connected} />
        )}
        {tab === "map" && (
          <MapTab
            serviceStatus={serviceStatus}
            elevatorOutages={elevatorOutages}
            routePathStations={routePathStations}
            routeFrom={routeFrom} routeTo={routeTo}
            favorites={favorites} toggleFavorite={toggleFavorite}
          />
        )}
        {tab === "route" && (
          <RouteTab
            routeFrom={routeFrom} setRouteFrom={setRouteFrom}
            routeTo={routeTo}     setRouteTo={setRouteTo}
            routeResult={routeResult} findRoute={findRoute}
          />
        )}
        {tab === "favorites" && (
          <FavoritesTab
            favorites={favorites} toggleFavorite={toggleFavorite}
            serviceStatus={serviceStatus}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        select option { background: ${T.bg}; color: ${T.text}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bgAlt}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.textMuted}; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}
