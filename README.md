# 🏆 Luddy Hackathon — Leaderboard API

A real-time leaderboard backend built with Flask and SQLite, featuring live WebSocket updates, descriptive statistics, and predictive standings based on lap history. A Vite frontend displays the live leaderboard.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python · Flask · Flask-SocketIO · SQLite |
| Frontend | Vite |
| Stats | NumPy · SciPy |

---

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+ (for the frontend)

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Install backend dependencies

```bash
pip install flask flask-cors flask-socketio scipy numpy
```

### 3. Start the backend

```bash
# macOS / Linux
python3 app.py

# Windows
python app.py
```

The API will be available at `http://localhost:5000`. A `leaderboard.db` SQLite file will be created automatically on first run.

### 4. Start the frontend

```bash
cd frontend   # or wherever your Vite project lives
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default) and connects to the backend via WebSocket to display live leaderboard updates.

---

## API Reference

### `POST /add`
Add a new entry to the leaderboard.

**Request body:**
```json
{ "name": "Team Rocket", "score": 42.5 }
```

**Responses:**
- `201` — Entry added successfully
- `400` — Missing/invalid fields or non-JSON body

---

### `DELETE /remove`
Remove all entries for a given team name.

**Request body:**
```json
{ "name": "Team Rocket" }
```

**Responses:**
- `200` — Entry removed
- `400` — Missing `name` field

---

### `GET /leaderboard`
Returns the top 10 entries, one per unique name (highest score only), sorted descending.

**Response:**
```json
[
  { "name": "Team Rocket", "score": 42.5, "time": 1713456789.123 },
  ...
]
```

---

### `GET /info`
Aggregate statistics across all recorded scores.

**Response:**
```json
{
  "mean": 38.6,
  "median": 38.0,
  "quartiles": [35.1, 38.0, 41.2, 50.0],
  "iqr": 6.1,
  "skew": 0.32,
  "standardDeviation": 4.87
}
```

- `400` if no entries exist yet

---

### `GET /performance`
Average observed server-side execution time per endpoint (in seconds), since the server started.

**Response:**
```json
{
  "add": 0.00312,
  "get_leaderboard": 0.00187
}
```

---

### `DELETE /reset`
Clears all leaderboard entries.

**Response:**
```json
{ "success": "leaderboard cleared" }
```

---

### `GET /predictions`
Predicts final standings based on each team's lap history and a recency trend.

- **Trend** = average of last 3 laps − overall average (negative = improving)
- **Predicted score** = `avg + 0.5 × trend`
- Results sorted ascending (lowest predicted score = winner)
- The predicted winner has `"predicted_winner": true`

**Response:**
```json
[
  {
    "team": "Team Rocket",
    "avg_lap_time": 38.452,
    "trend": -1.234,
    "predicted_score": 37.835,
    "laps_recorded": 5,
    "laps_by_time_recorded": [40.1, 39.5, 38.2, 37.9, 37.6],
    "predicted_winner": true
  }
]
```

- `400` if no entries exist yet

---

## WebSocket Events

The backend emits real-time updates via [Flask-SocketIO](https://flask-socketio.readthedocs.io/).

| Event | Trigger | Payload |
|---|---|---|
| `leaderboard_update` | Entry added or removed | Full leaderboard array (all entries, not just top 10) |

Connect from the frontend:
```js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");
socket.on("leaderboard_update", (data) => {
  console.log(data); // array of { name, score, time }
});
```

---

## Project Structure

```
.
├── app.py              # Flask application entry point
├── leaderboard.db      # SQLite database (auto-created)
└── frontend/           # Vite frontend
    ├── src/
    └── package.json
```

---

## Notes

- The database file `leaderboard.db` is created automatically on first run — no migrations needed.
- `/reset` is a hard delete with no confirmation. Use carefully during judging.
- Performance timings reset when the server restarts (stored in memory).
- CORS is open (`*`) for development. Restrict `cors_allowed_origins` in `app.py` before any production deployment.
