import axios from "axios";

const http = axios.create({ baseURL: "/api" });

// Inject the Firebase Bearer token on every request when available.
// The token is passed in via setToken() called from AuthContext on sign-in/refresh.
let _token = null;

export function setToken(token) {
  _token = token;
}

http.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

export async function getFavorites() {
  const { data } = await http.get("/favorites");
  return data; // [{ station_id, created_at }, ...]
}

export async function addFavorite(stationId) {
  const { data } = await http.post("/favorites", { station_id: stationId });
  return data;
}

export async function removeFavorite(stationId) {
  await http.delete(`/favorites/${stationId}`);
}
