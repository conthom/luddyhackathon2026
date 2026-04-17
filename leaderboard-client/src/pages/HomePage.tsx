import { useCallback, useEffect, useState } from "react";
import { addEntry, fetchLeaderboard, fetchPerformance, removeEntry } from "../api";
import { AddScoreForm } from "../components/AddScoreForm";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { PerformanceStrip } from "../components/PerformanceStrip";
import { RemoveEntryForm } from "../components/RemoveEntryForm";
import type { LeaderboardResponse, PerformanceResponse } from "../types";

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

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">
        Submit scores to the REST API and inspect the live top 10. Server routes match the hackathon OpenAPI (
        <code>/add</code>, <code>/remove</code>, <code>/leaderboard</code>, <code>/info</code>,{" "}
        <code>/performance</code>, <code>/history</code>).
      </p>

      {loadError ? <p className="error">{loadError}</p> : null}

      <section className="card">
        <h2 className="card-heading">Add score</h2>
        <p className="muted">POST /add — body: <code>{"{ user, score }"}</code></p>
        <AddScoreForm
          onSubmit={async (user, score) => {
            await addEntry(user, score);
            await refresh();
          }}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-heading">Top 10 leaderboard</h2>
            <p className="muted">GET /leaderboard — also available as HTML via <code>?format=html</code>.</p>
          </div>
          <button type="button" className="btn ghost" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        <LeaderboardTable rows={board?.top ?? []} />
        <PerformanceStrip perf={perf} />
      </section>

      <section className="card">
        <h2 className="card-heading">Remove entries</h2>
        <p className="muted">POST /remove — body: <code>{"{ id }"}</code> or <code>{"{ user }"}</code> (all rows for that user).</p>
        <RemoveEntryForm
          onRemoveById={async (id) => {
            await removeEntry({ id });
            await refresh();
          }}
          onRemoveByUser={async (user) => {
            await removeEntry({ user });
            await refresh();
          }}
        />
      </section>
    </>
  );
}
