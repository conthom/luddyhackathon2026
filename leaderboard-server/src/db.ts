import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import type { LeaderboardEntry } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..");

function resolveDbPath(): string {
  const raw = process.env.SQLITE_PATH?.trim();
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }
  return path.join(serverRoot, "data", "leaderboard.db");
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id TEXT PRIMARY KEY NOT NULL,
    user TEXT NOT NULL,
    score REAL NOT NULL,
    submitted_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON leaderboard_entries(user);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON leaderboard_entries(score DESC);

  CREATE TABLE IF NOT EXISTS submission_log (
    id TEXT PRIMARY KEY NOT NULL,
    user TEXT NOT NULL,
    score REAL NOT NULL,
    submitted_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_submission_log_submitted ON submission_log(submitted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_submission_log_user ON submission_log(user);
`);

function rowToEntry(r: { id: string; user: string; score: number; submitted_at: string }): LeaderboardEntry {
  return {
    id: r.id,
    user: r.user,
    score: r.score,
    submittedAt: r.submitted_at,
  };
}

const insertActive = db.prepare(
  `INSERT INTO leaderboard_entries (id, user, score, submitted_at) VALUES (@id, @user, @score, @submitted_at)`,
);
const insertLog = db.prepare(
  `INSERT INTO submission_log (id, user, score, submitted_at) VALUES (@id, @user, @score, @submitted_at)`,
);

export function insertEntry(entry: LeaderboardEntry): void {
  const row = {
    id: entry.id,
    user: entry.user,
    score: entry.score,
    submitted_at: entry.submittedAt,
  };
  const run = db.transaction(() => {
    insertActive.run(row);
    insertLog.run(row);
  });
  run();
}

export function loadActiveEntries(): LeaderboardEntry[] {
  const rows = db
    .prepare(`SELECT id, user, score, submitted_at FROM leaderboard_entries`)
    .all() as { id: string; user: string; score: number; submitted_at: string }[];
  return rows.map(rowToEntry);
}

export function deleteEntryById(id: string): number {
  const r = db.prepare(`DELETE FROM leaderboard_entries WHERE id = ?`).run(id);
  return r.changes;
}

export function deleteEntriesByUser(user: string): number {
  const r = db.prepare(`DELETE FROM leaderboard_entries WHERE user = ?`).run(user);
  return r.changes;
}

export function countActiveEntries(): number {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM leaderboard_entries`).get() as { c: number };
  return row.c;
}

export function getLeaderboardTop(limit: number): LeaderboardEntry[] {
  const rows = db
    .prepare(
      `SELECT id, user, score, submitted_at FROM leaderboard_entries ORDER BY score DESC, submitted_at ASC LIMIT ?`,
    )
    .all(limit) as { id: string; user: string; score: number; submitted_at: string }[];
  return rows.map(rowToEntry);
}

export function loadHistoryFiltered(options: {
  user?: string;
  from?: Date | null;
  to?: Date | null;
}): LeaderboardEntry[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.user) {
    conditions.push(`user = ?`);
    params.push(options.user);
  }
  if (options.from && !Number.isNaN(options.from.getTime())) {
    conditions.push(`submitted_at >= ?`);
    params.push(options.from.toISOString());
  }
  if (options.to && !Number.isNaN(options.to.getTime())) {
    conditions.push(`submitted_at <= ?`);
    params.push(options.to.toISOString());
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT id, user, score, submitted_at FROM submission_log ${where} ORDER BY submitted_at DESC`;

  const rows = db.prepare(sql).all(...params) as { id: string; user: string; score: number; submitted_at: string }[];
  return rows.map(rowToEntry);
}

export function getDbPathForLog(): string {
  return dbPath;
}
