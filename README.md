# Little 500 Leaderboard Simulation

Dynamic leaderboard for the IU Little 500: load real 2025 team data from a spreadsheet, simulate **miles at any race time**, and persist scores and race clock with **Express** and **SQLite**.

## Prerequisites

- **Node.js 20+** (22 recommended; matches the Docker image)
- **npm** (workspaces are used at the repo root)

## Quick start (local development)

From the **repository root**:

```bash
npm install
npm run dev
```

This runs two processes:

| Process | URL | Role |
|--------|-----|------|
| **Vite** (React client) | [http://localhost:5173](http://localhost:5173) | UI; proxies API routes to the server |
| **Express** (API) | [http://localhost:3001](http://localhost:3001) | REST API + SQLite |

Open **http://localhost:5173** in a browser. The Vite dev server proxies `/leaderboard`, `/race`, `/add`, `/remove`, `/info`, `/performance`, and `/history` to port **3001**, so you do not need to set `VITE_API_BASE_URL` for local dev.

### Run API or client only

```bash
npm run dev:server   # API only (port 3001)
npm run dev:client   # Vite only (port 5173; API must be up for full behavior)
```

### Production-style build

```bash
npm run build        # builds server (TypeScript) + client (Vite)
npm run start        # runs compiled API from leaderboard-server (set CLIENT_DIST to serve the SPA)
```

## Project layout

```
luddyhackathon2026/          # npm workspaces root
├── leaderboard-client/      # React + Vite (src/, public/)
├── leaderboard-server/      # Express + better-sqlite3 (src/)
├── simulate_race.py         # optional offline race exploration (Python)
└── Dockerfile               # single container: API + static client
```

## How it works (short)

- **Race state** (`elapsedMs`, heat) is stored in SQLite (`race_state`). **`POST /race/state`** updates it and **re-syncs** synthetic Little 500 rows so miles match the clock.
- **Leaderboard** rows live in `leaderboard_entries`; **`POST /add`** also appends to `submission_log` for the activity history.
- Team data comes from **`little-500-race.xlsx`**. The server resolves it via `LITTLE500_XLSX_PATH`, or looks under `leaderboard-server/data/` and `leaderboard-client/public/` (see `loadLittle5002025.ts`).

## Environment variables

### Server (`leaderboard-server`)

| Variable | Default / behavior |
|----------|---------------------|
| `PORT` | `3001` |
| `SQLITE_PATH` | `leaderboard-server/data/leaderboard.db` (path is created if needed) |
| `LITTLE500_XLSX_PATH` | Optional absolute or cwd-relative path to the workbook |
| `CLIENT_DIST` | If set, Express serves the built Vite app from this directory and falls back to `index.html` for client routes |

### Client (build / deploy)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Base URL for the API when the client is **not** served from the same origin (e.g. `https://your-api.onrender.com`). Omit for same-origin or dev proxy. |

## HTTP API (overview)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/race/state` | Current `elapsedMs` and `heat` |
| `POST` | `/race/state` | Body: `{ "elapsedMs": number, "heat": "men" \| "women" \| "all" }` — updates DB and Little 500 snapshot |
| `POST` | `/race/reset` | Reload workbook, set clock to end of race, replace **entire** active leaderboard with sheet snapshot |
| `GET` | `/leaderboard` | Top 10 JSON; `?format=html` for a simple HTML table |
| `POST` | `/add` | Body: `{ "user": string, "score": number }` |
| `POST` | `/remove` | Body: `{ "id": string }` or `{ "user": string }` — active rows only |
| `GET` | `/info` | Aggregate stats over current leaderboard |
| `GET` | `/performance` | Rolling average request time (middleware timing) |
| `GET` | `/history` | Query: `user`, `from`, `to` (ISO) — reads submission log |

## Docker

Build and run (API on **3001**, SQLite persisted under `/data` in the container):

```bash
docker build -t leaderboard-app .
docker run --rm -p 3001:3001 -v little500-data:/data leaderboard-app
```

The image sets `CLIENT_DIST` so **one** port serves both the API and the static client. Open **http://localhost:3001**.

## Tech stack

- **Frontend:** React 19, React Router, Vite, Framer Motion  
- **Backend:** Express, **better-sqlite3** (SQLite in-process), CORS  
- **Data:** XLSX workbook for 2025 teams  

