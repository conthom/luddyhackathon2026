import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import {
  histogram,
  mean,
  median,
  percentileRank,
  quantile,
  sortedNumbers,
  standardDeviation,
} from "./stats.js";

export type LeaderboardEntry = {
  id: string;
  user: string;
  score: number;
  submittedAt: string;
};

const entries: LeaderboardEntry[] = [];
const history: LeaderboardEntry[] = [];

const timingMs: number[] = [];
const MAX_TIMING_SAMPLES = 5000;

function recordTiming(ms: number) {
  timingMs.push(ms);
  if (timingMs.length > MAX_TIMING_SAMPLES) {
    timingMs.splice(0, timingMs.length - MAX_TIMING_SAMPLES);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    recordTiming(performance.now() - start);
  });
  next();
});

function buildInfo() {
  const scores = entries.map((e) => e.score);
  const sorted = sortedNumbers(scores);
  const m = mean(scores);
  const med = median(sorted);
  const q1 = quantile(sorted, 0.25);
  const q2 = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const stdev = m !== null ? standardDeviation(scores, m) : null;

  const percentiles = {
    p10: quantile(sorted, 0.1),
    p25: q1,
    p50: q2,
    p75: q3,
    p90: quantile(sorted, 0.9),
  };

  const dist = histogram(sorted, Math.min(10, Math.max(1, sorted.length)));

  const uniqueUsers = [...new Set(entries.map((e) => e.user))];
  const percentileRanksByUser: Record<string, number> = {};
  for (const u of uniqueUsers) {
    const userBest = Math.max(...entries.filter((e) => e.user === u).map((e) => e.score));
    percentileRanksByUser[u] = percentileRank(sorted, userBest);
  }

  return {
    count: scores.length,
    mean: m,
    median: med,
    quartiles: { q1, q2, q3 },
    min: sorted.length ? sorted[0]! : null,
    max: sorted.length ? sorted[sorted.length - 1]! : null,
    standardDeviation: stdev,
    percentiles,
    percentileRanksByUser,
    scoreDistribution: dist,
  };
}

app.post("/add", (req, res) => {
  const user = typeof req.body?.user === "string" ? req.body.user.trim() : "";
  const score = Number(req.body?.score);
  if (!user || !Number.isFinite(score)) {
    res.status(400).json({ error: "Expected JSON body { user: string, score: number }" });
    return;
  }
  const entry: LeaderboardEntry = {
    id: crypto.randomUUID(),
    user,
    score,
    submittedAt: new Date().toISOString(),
  };
  entries.push(entry);
  history.push(entry);
  res.status(201).json(entry);
});

app.post("/remove", (req, res) => {
  const id = typeof req.body?.id === "string" ? req.body.id : "";
  const user = typeof req.body?.user === "string" ? req.body.user.trim() : "";
  if (!id && !user) {
    res.status(400).json({ error: "Send { id } or { user } to remove entries" });
    return;
  }
  let removed = 0;
  if (id) {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i]!.id === id) {
        entries.splice(i, 1);
        removed++;
        break;
      }
    }
  } else {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i]!.user === user) {
        entries.splice(i, 1);
        removed++;
      }
    }
  }
  res.json({ removed, remaining: entries.length });
});

app.get("/leaderboard", (req, res) => {
  const top = [...entries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((e, i) => ({ rank: i + 1, ...e }));

  const asHtml = req.query.format === "html";

  if (asHtml) {
    const rows = top
      .map(
        (r) =>
          `<tr><td>${r.rank}</td><td>${escapeHtml(r.user)}</td><td>${r.score}</td><td>${escapeHtml(r.submittedAt)}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Top 10</title>
<style>body{font-family:system-ui,sans-serif;margin:2rem;}table{border-collapse:collapse;}th,td{border:1px solid #ccc;padding:.5rem .75rem;}th{background:#f0f0f0;}</style></head><body>
<h1>Leaderboard (top 10)</h1>
<table><thead><tr><th>Rank</th><th>User</th><th>Score</th><th>Submitted</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
    res.type("html").send(html);
    return;
  }

  res.json({ top });
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.get("/info", (_req, res) => {
  res.json(buildInfo());
});

app.get("/performance", (_req, res) => {
  const n = timingMs.length;
  const avg = n ? timingMs.reduce((a, b) => a + b, 0) / n : 0;
  res.json({
    averageExecutionTimeMs: avg,
    sampleCount: n,
    unit: "milliseconds",
  });
});

app.get("/history", (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;
  const user = typeof req.query.user === "string" ? req.query.user.trim() : "";

  let list = [...history];
  if (user) {
    list = list.filter((h) => h.user === user);
  }
  if (from && !Number.isNaN(from.getTime())) {
    list = list.filter((h) => new Date(h.submittedAt) >= from);
  }
  if (to && !Number.isNaN(to.getTime())) {
    list = list.filter((h) => new Date(h.submittedAt) <= to);
  }
  list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  res.json({ entries: list });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = process.env.CLIENT_DIST;
if (clientDist) {
  const root = path.isAbsolute(clientDist) ? clientDist : path.join(__dirname, "..", "..", clientDist);
  app.use(express.static(root));
  app.get("*", (req, res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }
    res.sendFile(path.join(root, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 3001;
const server = app.listen(PORT, () => {
  console.log(`Leaderboard API listening on http://localhost:${PORT}`);
});
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other server on this port or run with a different PORT (e.g. PORT=3002).`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
