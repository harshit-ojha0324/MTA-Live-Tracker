# NYC Transit Hub

A production-grade real-time NYC subway status dashboard and route planner. Built with React, Flask, Socket.IO, Redis, PostgreSQL, and the MTA GTFS-RT API.

---

## Screenshots

### Service Status — Live Alerts
![Service Status with live MTA alerts showing planned work and suspensions](screenshots/service-status-live-alerts.png)

### Service Status — Filter by Issue Type
![Service Status filtered to show only service issues](screenshots/service-status-issues-filter.png)

### Service Status — Good Service Filter
![Service Status filtered to show only lines with good service](screenshots/service-status-good-service-filter.png)

### Transit Map
![Interactive SVG transit map with panning, zooming and station inspection](screenshots/transit-map.png)

### Route Planner
![Route Planner showing Times Sq to Bay Ridge–95 St via B and R trains, 34 min, 16 stops](screenshots/route-planner-result.png)

### Favorites
![Favorites tab empty state](screenshots/favorites-empty-state.png)

---

## Features

- **Live Service Status** — Real-time alerts for all 26 subway lines, grouped by color family, auto-refreshed via WebSocket every 30 seconds
- **Interactive Transit Map** — SVG map of ~60 stations plotted by real GPS coordinates; pan, zoom, click to inspect any station
- **Route Planner** — Dijkstra's shortest-path algorithm on the full subway graph; shows travel time, stop count, transfer points, and colored line indicators
- **Favorites & Alerts** — Save stations; active service alerts surface automatically on saved stations
- **Google Sign-In** — Firebase authentication; favorites persist to PostgreSQL when signed in, localStorage when not

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Socket.IO client, Firebase JS SDK, Axios |
| Backend | Python, Flask, Flask-SocketIO (eventlet) |
| Real-time | Socket.IO WebSocket push |
| Transit data | MTA GTFS-RT / JSON feeds (no API key required) |
| Cache | Redis (in-memory fallback for local dev) |
| Database | PostgreSQL via SQLAlchemy (SQLite fallback for local dev) |
| Auth | Firebase (Google sign-in + Admin SDK token verification) |

---

## Project Structure

```
.
├── src/                        # React frontend
│   ├── components/             # StatusTab, MapTab, RouteTab, FavoritesTab, AuthButton
│   ├── constants/              # SUBWAY_LINES, STATIONS, EDGES data
│   ├── context/                # Firebase auth state (AuthContext)
│   ├── hooks/                  # useServiceStatus (Socket.IO), useFavorites (API + localStorage)
│   ├── lib/                    # dijkstra.js, socket.js singleton, firebase.js init
│   ├── api/                    # Axios wrapper for /api/favorites
│   ├── theme.js                # Shared color tokens
│   └── App.jsx                 # Root component
│
└── backend/                    # Flask API + Socket.IO server
    ├── app.py                  # App factory, Socket.IO handlers, broadcaster startup
    ├── config.py               # Environment-based configuration
    ├── extensions.py           # db, socketio, migrate singletons
    ├── models/                 # SQLAlchemy ORM (Favorite)
    ├── routes/                 # /api/favorites, /api/health, /api/status
    ├── services/
    │   ├── mta_feed.py         # MTA JSON/GTFS-RT fetcher + simulation fallback
    │   ├── broadcaster.py      # Background poll thread → cache → emit
    │   └── cache.py            # Redis with in-memory fallback
    └── auth/
        └── firebase_auth.py    # @require_auth decorator; no-op when unconfigured
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Redis _(optional — falls back to in-memory)_
- PostgreSQL _(optional — falls back to SQLite)_

### 1. Clone the repo

```bash
git clone https://github.com/your-username/nyc-transit-hub.git
cd nyc-transit-hub
```

### 2. Frontend setup

```bash
npm install
cp .env.local .env.local.bak    # .env.local is already scaffolded
```

### 3. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edit with your keys
```

### 4. Run both servers

**Terminal 1 — Flask:**
```bash
cd backend
source venv/bin/activate
python app.py
# Listening on http://localhost:5001
```

**Terminal 2 — Vite dev server:**
```bash
npm run dev
# Open http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to Flask on port 5001, so there are no CORS issues during development.

---

## Environment Variables

### Backend — `backend/.env`

> MTA feeds are publicly accessible — no API key is needed.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_URL` | No | `sqlite:///local.db` | SQLAlchemy connection string. Use `postgresql://user:pass@host/db` in production. |
| `REDIS_URL` | No | — | e.g. `redis://localhost:6379/0`. Without it, an in-memory dict is used. |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | — | Path to Firebase service account JSON. Without it, auth is disabled and all requests pass through as `anonymous`. |
| `SECRET_KEY` | **Yes (prod)** | `dev-secret-please-change` | Flask secret key. Change before deploying. |
| `POLL_INTERVAL` | No | `30` | Seconds between MTA feed polls. |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin. |

### Frontend — `.env.local`

All Firebase variables are optional. Without them, auth is disabled and favorites persist to `localStorage` only.

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

---

## Data Flow

```
MTA JSON/GTFS-RT feeds (public HTTPS, no API key required)
        │  HTTP GET, every 30s
        ▼
services/mta_feed.py     ← parse JSON → extract alerts per line
        │                   (simulation fallback on network error only)
        ▼
services/cache.py        ← Redis SET with TTL (or in-memory dict)
        │
        ▼
services/broadcaster.py  ← socketio.emit("service_update", alerts, namespace="/transit")
        │  WebSocket push to all connected clients
        ▼
hooks/useServiceStatus.js ← socket.on("service_update", handler)
        │
        ▼
StatusTab / MapTab / FavoritesTab   ← re-render with live data
```

On socket connect, the server immediately emits the current cached snapshot — clients don't wait for the next 30-second poll cycle.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Liveness check |
| `GET` | `/api/status` | None | Current service status snapshot (HTTP fallback for non-WebSocket clients) |
| `GET` | `/api/favorites` | Bearer token | List saved stations for the authenticated user |
| `POST` | `/api/favorites` | Bearer token | Body: `{ "station_id": "ts" }` |
| `DELETE` | `/api/favorites/:station_id` | Bearer token | Remove a saved station |

When Firebase is not configured, `@require_auth` is a no-op that sets `user_id = "anonymous"` — all endpoints work without credentials.

---

## Enabling Auth + Persistent Favorites

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** as a sign-in provider under **Authentication → Sign-in method**
3. Add a web app and copy the config values to `.env.local`
4. Download a service account key from **Project Settings → Service Accounts → Generate new private key**
5. Set the path in `backend/.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
   ```
6. Restart both servers

---

## Algorithm Notes

Route planning uses **Dijkstra's algorithm** on an undirected weighted graph. Edge weights represent approximate travel time in minutes. The algorithm runs entirely in the browser — no server round-trip needed.

```
dijkstra(startId, endId) → { path: string[], time: number }
```

The graph is defined in [`src/constants/edges.js`](src/constants/edges.js) (~110 edges across ~60 stations) and [`src/constants/stations.js`](src/constants/stations.js). Both files are plain JS arrays — extending the graph with new stations or lines requires no algorithm changes.

---

## Docker

### Local dev (full stack)

```bash
docker compose up
# Frontend → http://localhost:5173
# Backend  → http://localhost:5001
```

Redis is included automatically. SQLite is used by default — no database setup needed.

### Backend only

```bash
docker build -t nyc-transit-backend ./backend
docker run -p 5001:5001 --env-file backend/.env nyc-transit-backend
```

### Full production image (frontend + backend in one container)

```bash
docker build -t nyc-transit-hub .
docker run -p 5001:5001 \
  -e SECRET_KEY=your-secret \
  -e CORS_ORIGIN=https://your-domain.com \
  nyc-transit-hub
```

---

## Free Deployment

| Service | What to deploy | Notes |
|---|---|---|
| [Fly.io](https://fly.io) | Backend Docker image | Free tier: 3 shared VMs, always on |
| [Render](https://render.com) | Backend Docker image | Free tier: sleeps after 15 min idle |
| [GitHub Pages](https://pages.github.com) | Built frontend (`dist/`) | Free, always on — set `VITE_*` vars at build time |
| [Railway](https://railway.app) | docker-compose | $5/month free credit |

**Recommended free setup:** Fly.io for the Flask backend + GitHub Pages for the static React build.

---

## Production Deployment

**Flask:**
```bash
pip install gunicorn
gunicorn --worker-class eventlet -w 1 app:app --bind 0.0.0.0:5001
```

> Use a single worker. Socket.IO requires sticky sessions or a Redis message queue (`message_queue=REDIS_URL` in `SocketIO()`) for multi-worker deployments.

**nginx config snippet:**
```nginx
location /api {
    proxy_pass http://127.0.0.1:5001;
}
location /socket.io {
    proxy_pass http://127.0.0.1:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
location / {
    root /path/to/dist;
    try_files $uri /index.html;
}
```

**Build frontend:**
```bash
npm run build   # output in dist/
```

---

## License

MIT
