import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import {
  countActiveEntries,
  deleteEntriesByUser,
  deleteEntryById,
  getDbPathForLog,
  getLeaderboardTop,
  insertEntry,
  loadActiveEntries,
  loadHistoryFiltered,
} from "./db.js";
import {
  histogram,
  mean,
  median,
  percentileRank,
  quantile,
  sortedNumbers,
  standardDeviation,
} from "./stats.js";
import type { LeaderboardEntry } from "./types.js";

export type { LeaderboardEntry } from "./types.js";

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
  const entries = loadActiveEntries();
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
  insertEntry(entry);
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
    removed = deleteEntryById(id);
  } else {
    removed = deleteEntriesByUser(user);
  }
  res.json({ removed, remaining: countActiveEntries() });
});

app.get("/leaderboard", (req, res) => {
  const topRows = getLeaderboardTop(10);
  const top = topRows.map((e, i) => ({ rank: i + 1, ...e }));

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

  const list = loadHistoryFiltered({
    user: user || undefined,
    from,
    to,
  });
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
  console.log(`SQLite database: ${getDbPathForLog()}`);
});
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other server on this port or run with a different PORT (e.g. PORT=3002).`,
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
