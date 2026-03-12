# ── Stage 1: Build React frontend ─────────────────────────────────
FROM node:20-slim AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # output → /app/dist


# ── Stage 2: Flask backend serving built frontend ──────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into a folder Flask can serve as static files
COPY --from=frontend-build /app/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 5001

CMD ["python", "app.py"]
