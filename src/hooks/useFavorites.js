import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/favorites";
import { setToken } from "../api/favorites";

const LS_KEY = "mta_favorites";

function lsGet()         { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } }
function lsSet(ids)      { localStorage.setItem(LS_KEY, JSON.stringify(ids)); }

/**
 * API-backed favorites when signed in, localStorage when not.
 * On sign-in, local favorites are migrated to the server then cleared.
 */
export function useFavorites() {
  const { user, idToken } = useAuth() ?? {};
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(false);

  // Keep axios token in sync with Firebase ID token
  useEffect(() => {
    setToken(idToken ?? null);
  }, [idToken]);

  // Load favorites when auth state changes
  useEffect(() => {
    if (user && idToken) {
      // Signed in → load from API, migrate any localStorage items
      setLoading(true);
      api.getFavorites()
        .then(async (remote) => {
          const remoteIds = remote.map(f => f.station_id);
          const local     = lsGet();
          const toMigrate = local.filter(id => !remoteIds.includes(id));
          for (const id of toMigrate) {
            await api.addFavorite(id).catch(() => {});
          }
          if (toMigrate.length) lsSet([]);
          const final = [...new Set([...remoteIds, ...toMigrate])];
          setFavorites(final);
        })
        .catch(() => setFavorites(lsGet()))
        .finally(() => setLoading(false));
    } else {
      // Not signed in → use localStorage
      setFavorites(lsGet());
    }
  }, [user, idToken]);

  const toggle = useCallback(async (stationId) => {
    const isAdding = !favorites.includes(stationId);

    // Optimistic update
    setFavorites(prev =>
      isAdding ? [...prev, stationId] : prev.filter(id => id !== stationId)
    );

    if (user && idToken) {
      try {
        if (isAdding) await api.addFavorite(stationId);
        else          await api.removeFavorite(stationId);
      } catch {
        // Revert on failure
        setFavorites(prev =>
          isAdding ? prev.filter(id => id !== stationId) : [...prev, stationId]
        );
      }
    } else {
      // Persist to localStorage
      setFavorites(prev => {
        const next = isAdding ? [...prev, stationId] : prev.filter(id => id !== stationId);
        lsSet(next);
        return next;
      });
    }
  }, [favorites, user, idToken]);

  return { favorites, toggle, loading };
}
