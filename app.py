from flask import Flask, request, jsonify
from flask_cors import CORS
from scipy import stats
import numpy as np
import time
from collections import defaultdict
import sqlite3
import statistics
from flask_socketio import SocketIO


app = Flask(__name__)
CORS(app)
socketIO = SocketIO(app, cors_allowed_origin="*") # Might want to update allowed CORS origins list to enhance security

def get_conn():
    conn = sqlite3.connect("leaderboard.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            score REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

def emit_leaderboard():
    conn = get_conn()
    rows = conn.execute(
        "SELECT name, score FROM leaderboard ORDER BY score"
    ).fetchall()
    conn.close()
    socketIO.emit("leaderboard_update", [dict(row) for row in rows])

@app.post("/add")
def add():
    if request.is_json==True: 
        data = request.get_json()
        if not data or "name" not in data or "score" not in data: return {"error": "Bad request"}, 400
         
        conn = get_conn()
        conn.execute("INSERT OR REPLACE INTO leaderboard (name, score) VALUES (?, ?)",
                     (data["name"], data["score"]))
        conn.commit()
        conn.close()
        emit_leaderboard()
        return {"success": "entry added"}, 201
    else: return {"error": "Bad request"}, 400

@app.get("/leaderboard")
def get_leaderboard():
    conn = get_conn()
    rows = conn.execute(
        "SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 10"
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

    

@app.delete("/remove")
def deleteEntry():
    rq = request.get_json()
    if not rq or "name" not in rq: return {"error": "bad request"}, 400
    else: 
        conn = get_conn()
        conn.execute("DELETE FROM leaderboard WHERE name = ?", (rq["name"],))
        conn.commit()
        conn.close()
        return {"success": "entry removed"}, 200
    
@app.get("/info")
def info():
    conn = get_conn()
    scores = [row["score"] for row in conn.execute("SELECT score FROM leaderboard").fetchall()]
    conn.close()
    if not scores:
        return {"error": "no entries yet"}, 400
    meanValue = statistics.mean(scores)
    median = statistics.median(scores)
    q1, q2, q3, q4 = np.quantile(scores, [1, 0.75, .5, 0.25])
    iqr = q3 - q1
    standardDeviation = statistics.stdev(scores)
    skew = stats.skew(scores)
    return jsonify({
        "mean": meanValue,
        "median":median,
        "quartiles":(q4, q3, q2, q1),
        "iqr": iqr,
        "skew": skew,
        "standard deviation": standardDeviation
        })

endpoint_times = defaultdict(list)

@app.before_request
def start_timer():
    request.start_time = time.time()

@app.after_request
def record_time(response):
    duration = time.time() - request.start_time
    endpoint_times[request.endpoint].append(duration)
    return response 

@app.get("/performance")
def performance():
    averages = {
        endpoint: sum(times) / len(times)
        for endpoint, times in endpoint_times.items()
    }
    return jsonify(averages)


app.run()


   