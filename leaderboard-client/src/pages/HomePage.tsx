import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, fetchPerformance } from "../api";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { PerformanceStrip } from "../components/PerformanceStrip";
import type { LeaderboardResponse, PerformanceResponse } from "../types";
import "./Pages.css";

const POLL_MS = 5000;

export function HomePage() {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [perf, setPerf] = useState<PerformanceResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const [b, p] = await Promise.all([fetchLeaderboard(), fetchPerformance()]);
      setBoard(b);
      setPerf(p);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <>
      <h1 className="page-title">Skills growth board</h1>
      <p className="page-sub">
        Track how you rank focus areas over time—useful for career growth planning. Top entries update automatically and
        gently reorder when points change.
      </p>

      {loadError ? <p className="error">{loadError}</p> : null}

      <section className="card">
        <h2 className="card-heading">Top 10</h2>
        <p className="muted">Highest points per focus area. Updates every few seconds while this page is open.</p>
        <LeaderboardTable rows={board?.top ?? []} />
        <PerformanceStrip perf={perf} />
      </section>
    </>
  );
}
