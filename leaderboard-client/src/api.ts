import type {
  HistoryResponse,
  InfoResponse,
  LeaderboardResponse,
  PerformanceResponse,
  RaceStateResponse,
} from "./types";

/** Empty in dev (Vite proxy / same origin). Set in Vercel to your Render API origin, e.g. https://your-api.onrender.com */
function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

const API_DOWN_HINT =
  import.meta.env.VITE_API_BASE_URL?.length
    ? `Cannot reach API at ${import.meta.env.VITE_API_BASE_URL}. Check Render is up and CORS.`
    : "Is the API running on port 3001? In another terminal: npm run dev:server (from repo root) or cd leaderboard-server && npm run dev";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    if (res.status >= 500 || res.status === 502 || res.status === 503) {
      throw new Error(`${API_DOWN_HINT} (HTTP ${res.status})`);
    }
    throw new Error(text || res.statusText);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(apiUrl(path), init);
  } catch {
    throw new Error(API_DOWN_HINT);
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await request("/leaderboard", { headers: { Accept: "application/json" } });
  return parseJson(res);
}

export async function fetchInfo(): Promise<InfoResponse> {
  const res = await request("/info");
  return parseJson(res);
}

export async function fetchPerformance(): Promise<PerformanceResponse> {
  const res = await request("/performance");
  return parseJson(res);
}

export async function addEntry(user: string, score: number) {
  const res = await request("/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, score }),
  });
  return parseJson(res);
}

export async function removeEntry(body: { id?: string; user?: string }) {
  const res = await request("/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<{ removed: number; remaining: number }>(res);
}

export async function fetchRaceState(): Promise<RaceStateResponse> {
  const res = await request("/race/state");
  return parseJson(res);
}

export async function postRaceState(body: RaceStateResponse): Promise<RaceStateResponse> {
  const res = await request("/race/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

/** Reload xlsx on server, set race to flag time, resync all Little 500 rows from the spreadsheet. */
export async function postRaceReset(): Promise<RaceStateResponse> {
  const res = await request("/race/reset", { method: "POST" });
  return parseJson(res);
}

export async function fetchHistory(params: { user?: string; from?: string; to?: string }) {
  const q = new URLSearchParams();
  if (params.user) q.set("user", params.user);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const res = await request(`/history?${q.toString()}`);
  return parseJson<HistoryResponse>(res);
}
