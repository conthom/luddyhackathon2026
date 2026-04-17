import type { HistoryResponse, InfoResponse, LeaderboardResponse, PerformanceResponse } from "./types";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || res.statusText);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await fetch("/leaderboard", { headers: { Accept: "application/json" } });
  return parseJson(res);
}

export async function fetchInfo(): Promise<InfoResponse> {
  const res = await fetch("/info");
  return parseJson(res);
}

export async function fetchPerformance(): Promise<PerformanceResponse> {
  const res = await fetch("/performance");
  return parseJson(res);
}

export async function addEntry(user: string, score: number) {
  const res = await fetch("/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, score }),
  });
  return parseJson(res);
}

export async function removeEntry(body: { id?: string; user?: string }) {
  const res = await fetch("/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<{ removed: number; remaining: number }>(res);
}

export async function fetchHistory(params: { user?: string; from?: string; to?: string }) {
  const q = new URLSearchParams();
  if (params.user) q.set("user", params.user);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const res = await fetch(`/history?${q.toString()}`);
  return parseJson<HistoryResponse>(res);
}
