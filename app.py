from flask import Flask, Request, jsonify
from flask_cors import CORS
from scipy import stats
import numpy as np
import time
from collections import defaultdict
import sqlite3


app = Flask(__name__)
CORS(app)


def get_conn():
    conn = sqlite3.connect("leaderboard.db")
    conn.row


@app.post("/add")
def add():
    if Request.is_json==True: 
        data = Request.get_json()
        if not data or "name" not in data or "score" not in data: return {"error": "Bad request"}, 400
        else: 
            leaderboard.append({"name": data["name"], "score": data["score"]})
            return {"success": "entry added"}, 201
    else: return {"error": "Bad request"}, 400

@app.get("/leaderboard")
def get_leaderboard():
    sorted_board = sorted(leaderboard, key=lambda x: x["score"], reverse=True)
    return jsonify(sorted_board[:10])

@app.delete("/remove")
def deleteEntry():
    rq = Request.get_json()
    if not rq or "name" not in rq: return {"error": "bad request"}, 400
    else: 
        entry = next((e for e in leaderboard if e["name"] == rq["name"]), None)
        if not entry:
            return {"error": "entry not found"}, 404
        leaderboard.remove(entry)
        return {"success": "entry removed"}, 201
    
@app.get("/info")
def info():
    if not leaderboard:
        return {"error": "no entries yet"}, 400
    scores = [i["score"] for i in leaderboard]
    meanValue = stats.mean(scores)
    median = stats.median(scores)
    q4, q3, q2, q1 = np.quantile(scores, [1, 0.75, .5, 0.25])
    iqr = q3 - q1
    return jsonify({
        "means": meanValue,
        "median":median,
        "quartiles":(q4, q3, q2, q1),
        "iqr": iqr
        })

endpoint_times = defaultdict(list)

@app.before_request
def start_timer():
    Request.start_time = time.time()

@app.after_request
def record_time(response):
    duration = time.time() - Request.start_time
    endpoint_times[Request.endpoint].append(duration)
    return response 

@app.get("/performance")
def performance():
    averages = {
        endpoint: sum(times) / len(times)
        for endpoint, times in endpoint_times.items()
    }
    return jsonify(averages)



   