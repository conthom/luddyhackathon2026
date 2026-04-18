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
  getRaceState,
  insertEntry,
  loadActiveEntries,
  loadHistoryFiltered,
  replaceEntireActiveLeaderboard,
  replaceLittle500Entries,
  setRaceState,
} from "./db.js";
import { loadLittle5002025FromDisk } from "./loadLittle5002025.js";
import { clampRaceTime, RACE_DURATION_MS } from "./raceConstants.js";
import { buildLittle500SnapshotEntries } from "./raceSnapshot.js";
import type { Little500Team } from "./little500Types.js";
import {
  histogram,
  mean,
  median,
  percentileRank,
  quantile,
  sortedNumbers,
  standardDeviation,
} from "./stats.js";
import { displayTeamUser, parseTeamNameToDbUser } from "./teamDisplay.js";
import type { LeaderboardEntry } from "./types.js";

export type { LeaderboardEntry } from "./types.js";

function logApi(tag: string, detail?: Record<string, unknown>) {
  const extra = detail && Object.keys(detail).length ? ` ${JSON.stringify(detail)}` : "";
  console.log(`[API] ${tag}${extra}`);
}

let little500Teams: Little500Team[] | null = null;
try {
  little500Teams = loadLittle5002025FromDisk();
  console.log(`Little 500: loaded ${little500Teams.length} teams (2025)`);
} catch (err) {
  console.warn("Little 500 workbook not available — race sync disabled until file is present.", err);
}

function syncRaceSnapshot(): void {
  if (!little500Teams?.length) return;
  const s = getRaceState();
  replaceLittle500Entries(buildLittle500SnapshotEntries(little500Teams, s.elapsedMs, s.heat));
}

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
  const rawUser = typeof req.body?.user === "string" ? req.body.user.trim() : "";
  const score = Number(req.body?.score);
  if (!rawUser || !Number.isFinite(score)) {
    res.status(400).json({ error: "Expected JSON body { user: string, score: number }" });
    return;
  }
  const user = parseTeamNameToDbUser(rawUser);
  const entry: LeaderboardEntry = {
    id: crypto.randomUUID(),
    user,
    score,
    submittedAt: new Date().toISOString(),
  };
  insertEntry(entry);
  logApi("POST /add", { input: rawUser, storedAs: user, label: displayTeamUser(user), score });
  res.status(201).json(entry);
});

app.post("/remove", (req, res) => {
  const id = typeof req.body?.id === "string" ? req.body.id : "";
  const rawUser = typeof req.body?.user === "string" ? req.body.user.trim() : "";
  if (!id && !rawUser) {
    res.status(400).json({ error: "Send { user: string } (Men · … / Women · … or exact key), or { id } for one row" });
    return;
  }
  let removed = 0;
  let detail: Record<string, unknown>;
  if (id) {
    removed = deleteEntryById(id);
    detail = { by: "id", id, removed };
  } else {
    const user = parseTeamNameToDbUser(rawUser);
    removed = deleteEntriesByUser(user);
    detail = {
      by: "user",
      input: rawUser,
      storedAs: user,
      label: displayTeamUser(user),
      removed,
    };
  }
  const remaining = countActiveEntries();
  logApi("POST /remove", { ...detail, remaining });
  res.json({ removed, remaining });
});

app.get("/leaderboard", (req, res) => {
  const topRows = getLeaderboardTop(10);
  const top = topRows.map((e, i) => ({ rank: i + 1, ...e }));

  const asHtml = req.query.format === "html";
  logApi("GET /leaderboard", { format: asHtml ? "html" : "json", rows: top.length });

  if (asHtml) {
    const rows = top
      .map(
        (r) =>
          `<tr><td>${r.rank}</td><td>${escapeHtml(displayTeamUser(r.user))}</td><td>${r.score}</td><td>${escapeHtml(r.submittedAt)}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Top 10</title>
<style>body{font-family:system-ui,sans-serif;margin:2rem;}table{border-collapse:collapse;}th,td{border:1px solid #ccc;padding:.5rem .75rem;}th{background:#f0f0f0;}</style></head><body>
<h1>Leaderboard (top 10)</h1>
<table><thead><tr><th>Rank</th><th>Team</th><th>Miles</th><th>Updated</th></tr></thead><tbody>${rows}</tbody></table>
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
  const info = buildInfo();
  logApi("GET /info", { count: info.count, mean: info.mean, max: info.max });
  res.json(info);
});

app.get("/performance", (_req, res) => {
  const n = timingMs.length;
  const avg = n ? timingMs.reduce((a, b) => a + b, 0) / n : 0;
  const body = {
    averageExecutionTimeMs: avg,
    sampleCount: n,
    unit: "milliseconds",
  };
  logApi("GET /performance", { sampleCount: n, averageExecutionTimeMs: avg });
  res.json(body);
});

app.get("/race/state", (_req, res) => {
  const s = getRaceState();
  logApi("GET /race/state", s);
  res.json(s);
});

app.post("/race/state", (req, res) => {
  const heatRaw = req.body?.heat;
  const elapsedRaw = Number(req.body?.elapsedMs);
  const heatOk = heatRaw === "men" || heatRaw === "women" || heatRaw === "all";
  if (!heatOk || !Number.isFinite(elapsedRaw)) {
    res.status(400).json({ error: "Expected JSON body { elapsedMs: number, heat: 'men' | 'women' | 'all' }" });
    return;
  }
  setRaceState(clampRaceTime(elapsedRaw), heatRaw);
  syncRaceSnapshot();
  const out = getRaceState();
  logApi("POST /race/state", out);
  res.json(out);
});

/**
 * Reload workbook from disk, race clock → flag, replace **entire** active leaderboard with
 * spreadsheet snapshot only (removes guest / test rows that are not in the workbook).
 */
app.post("/race/reset", (_req, res) => {
  try {
    little500Teams = loadLittle5002025FromDisk();
    logApi("POST /race/reset reload", { teams: little500Teams.length });
  } catch (e) {
    console.warn("[API] POST /race/reset workbook reload failed", e);
    if (!little500Teams?.length) {
      res.status(503).json({ error: "little-500-race.xlsx not found or unreadable" });
      return;
    }
  }
  const s = getRaceState();
  setRaceState(RACE_DURATION_MS, s.heat);
  const entries = buildLittle500SnapshotEntries(little500Teams!, RACE_DURATION_MS, s.heat);
  replaceEntireActiveLeaderboard(entries);
  const out = getRaceState();
  logApi("POST /race/reset done", { ...out, teams: little500Teams?.length, rowsWritten: entries.length });
  res.json(out);
});

app.get("/history", (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;
  const rawUser = typeof req.query.user === "string" ? req.query.user.trim() : "";
  const user = rawUser ? parseTeamNameToDbUser(rawUser) : "";

  const list = loadHistoryFiltered({
    user: user || undefined,
    from,
    to,
  });
  logApi("GET /history", {
    userFilter: rawUser || null,
    resolvedUser: user || null,
    from: req.query.from ?? null,
    to: req.query.to ?? null,
    rows: list.length,
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
  try {
    syncRaceSnapshot();
  } catch (e) {
    console.warn("Initial race snapshot failed:", e);
  }
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
