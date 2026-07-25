# NYC Transit Hub

**Live:** https://nyc-transit-hub-608863015021.us-central1.run.app

A production-grade real-time NYC subway status dashboard, route planner, and AI transit assistant. Built with React, Flask, Socket.IO, Redis, PostgreSQL, and the Gemini API — deployed on Google Cloud Run.

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
- **AI Transit Assistant** — Gemini 2.5 Flash-powered chat interface; every response is grounded in the live MTA alert feed injected as context
- **Favorites & Alerts** — Save stations; active service alerts surface automatically on saved stations
- **Google Sign-In** — Firebase authentication; favorites persist to PostgreSQL when signed in, localStorage when not

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Socket.IO client, Firebase JS SDK, Axios |
| Backend | Python, Flask, Flask-SocketIO (eventlet) |
| AI | Gemini 2.5 Flash via Google Generative AI SDK |
| Real-time | Socket.IO WebSocket push |
| Transit data | MTA GTFS-RT / JSON feeds (no API key required) |
| Cache | Redis (in-memory fallback when `REDIS_URL` is unset — including the current Cloud Run deploy) |
| Database | PostgreSQL via SQLAlchemy (SQLite fallback for local dev) |
| Auth | Firebase (Google sign-in + Admin SDK token verification) |
| Frontend tests | Vitest |
| Backend tests | pytest + pytest-cov |
| CI | GitHub Actions |
| Deployment | Docker, Docker Compose, Google Cloud Run (via Cloud Build) |

---

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions: lint + test + build on every push/PR
├── cloudbuild.yaml             # Google Cloud Build + Cloud Run deployment
├── src/                        # React frontend
│   ├── components/
│   │   ├── StatusTab.jsx       # Live service status grouped by line color
│   │   ├── MapTab.jsx          # Interactive SVG transit map
│   │   ├── RouteTab.jsx        # Dijkstra route planner UI
│   │   ├── FavoritesTab.jsx    # Saved stations with live alert overlay
│   │   ├── AiTab.jsx           # Gemini AI transit assistant chat UI
│   │   └── AuthButton.jsx      # Google sign-in button
│   ├── constants/              # SUBWAY_LINES, STATIONS, EDGES data
│   ├── context/                # Firebase auth state (AuthContext)
│   ├── hooks/                  # useServiceStatus (Socket.IO), useFavorites (API + localStorage)
│   ├── lib/
│   │   ├── dijkstra.js         # Shortest-path algorithm
│   │   ├── dijkstra.test.js    # Vitest suite (15 tests)
│   │   ├── socket.js           # Socket.IO singleton
│   │   └── firebase.js         # Firebase init
│   ├── api/                    # Axios wrapper for /api/favorites
│   ├── theme.js                # Shared color tokens
│   └── App.jsx                 # Root component + tab router
│
└── backend/                    # Flask API + Socket.IO server
    ├── app.py                  # App factory, Socket.IO handlers, broadcaster startup
    ├── config.py               # Environment-based configuration
    ├── extensions.py           # db, socketio, migrate singletons
    ├── pytest.ini              # pytest config
    ├── requirements.txt        # Production dependencies
    ├── requirements-dev.txt    # + pytest, pytest-cov
    ├── models/                 # SQLAlchemy ORM (Favorite)
    ├── routes/
    │   ├── ai.py               # POST /api/ai/chat — Gemini chat with live MTA context
    │   ├── favorites.py        # GET/POST/DELETE /api/favorites
    │   └── health.py           # GET /api/health, /api/status, /api/elevators
    ├── services/
    │   ├── mta_feed.py         # MTA JSON/GTFS-RT fetcher + simulation fallback
    │   ├── broadcaster.py      # Background poll thread → cache → emit
    │   └── cache.py            # Redis with in-memory fallback
    ├── auth/
    │   └── firebase_auth.py    # @require_auth decorator; no-op when unconfigured
    └── tests/
        ├── test_mta_feed.py    # Parsing logic, severity rules, elevator parsing (19 tests)
        ├── test_cache.py       # In-memory cache set / get / overwrite / clear (6 tests)
        └── test_routes.py      # Flask route integration tests (12 tests)
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
git clone https://github.com/harshit-ojha0324/MTA-Live-Tracker.git
cd MTA-Live-Tracker
```

### 2. Frontend setup

```bash
npm install
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

> MTA feeds are publicly accessible — no API key is needed for core features.

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | No | — | Enables the AI Transit Assistant. Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey). |
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

### Real-time service updates

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

### AI assistant

```
User message (AiTab.jsx)
        │  POST /api/ai/chat
        ▼
routes/ai.py
        │  reads current alert cache
        ▼
Gemini 2.5 Flash  ← system prompt includes live MTA status as context
        │
        ▼
AI response grounded in real-time data
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Liveness check |
| `GET` | `/api/status` | None | Current service status snapshot (HTTP fallback for non-WebSocket clients) |
| `GET` | `/api/elevators` | None | Current elevator/escalator outages |
| `POST` | `/api/ai/chat` | None | Body: `{ "message": "...", "history": [...] }` — Gemini response grounded in live MTA data |
| `GET` | `/api/favorites` | Bearer token | List saved stations for the authenticated user |
| `POST` | `/api/favorites` | Bearer token | Body: `{ "station_id": "ts" }` |
| `DELETE` | `/api/favorites/:station_id` | Bearer token | Remove a saved station |

When Firebase is not configured, `@require_auth` is a no-op that sets `user_id = "anonymous"` — all endpoints work without credentials.

---

## AI Transit Assistant

The **Ask AI** tab provides a Gemini 2.5 Flash-powered chat interface for natural language transit queries. Before each request, the backend fetches the current service alert cache and injects it as structured context into the Gemini system prompt — so responses are grounded in live MTA data, not static training knowledge.

Example queries:
- _"Which lines have delays right now?"_
- _"Best way from Times Square to Brooklyn Bridge?"_
- _"Are there elevator outages on the A/C/E?"_

To enable it, set `GEMINI_API_KEY` in `backend/.env`. Without it, the tab shows a configuration prompt; all other features remain fully functional.

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
dijkstra(startId, endId) → { path: string[], time: number, stops: number }
```

`stops` is the sum of real subway stops traversed along the chosen path — each edge carries a 4th element representing how many actual stops it spans (since the graph collapses many intermediate stops into single edges for ~60 major stations).

The graph is defined in [`src/constants/edges.js`](src/constants/edges.js) (~120 edges across 63 stations) and [`src/constants/stations.js`](src/constants/stations.js). Both files are plain JS arrays — extending the graph with new stations or lines requires no algorithm changes.

---

## Testing

### Backend (pytest)

```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt
pytest
```

| Suite | Coverage |
|---|---|
| `test_mta_feed.py` | Translation parsing, alert severity, no-downgrade rule, elevator parsing, simulation fallback |
| `test_cache.py` | In-memory cache set / get / overwrite / clear (no Redis required) |
| `test_routes.py` | `/api/health`, `/api/status`, `/api/elevators`, `/api/favorites` via Flask test client |

### Frontend (Vitest)

```bash
npm run test:run      # single run
npm test              # watch mode
```

| Suite | Coverage |
|---|---|
| `dijkstra.test.js` | Adjacent routes, multi-hop paths, time symmetry, isolated stations reachable, stop counts, invalid IDs, `getSharedLine` |

### CI (GitHub Actions)

Every push and pull request to `main` runs the full pipeline automatically:

1. **Backend job** — `pip install` → `pytest --cov`
2. **Frontend job** — `npm ci` → `eslint` → `vitest run` → `vite build`

---

## Docker

### Local dev (full stack)

```bash
docker compose up
# Frontend → http://localhost:3000
# Backend  → http://localhost:5001
```

Redis is included automatically. SQLite is used by default — no database setup needed.

To enable the AI assistant in Docker, add `GEMINI_API_KEY` to a `.env` file at the project root:

```env
GEMINI_API_KEY=your-key-here
```

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
  -e GEMINI_API_KEY=your-key \
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

## Google Cloud Run Deployment

Deploy the full stack to Cloud Run with a single command.

### Prerequisites

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
```

### One-time secrets setup

```bash
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
echo -n "YOUR_FLASK_SECRET"   | gcloud secrets create flask-secret-key --data-file=-
echo -n "YOUR_DATABASE_URL"   | gcloud secrets create db-url --data-file=-
```

### Deploy

```bash
gcloud builds submit --config cloudbuild.yaml .
```

Secrets are injected at runtime via Secret Manager — no keys in environment variables or YAML files. The service scales from 0 to 10 instances automatically.

---

## Production Deployment (nginx / VPS)

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
