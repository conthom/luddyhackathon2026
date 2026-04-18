import { useCallback, useEffect, useState } from "react";
import { addEntry, fetchLeaderboard, fetchPerformance, removeEntry } from "../api";
import { AddScoreForm } from "../components/AddScoreForm";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { PerformanceStrip } from "../components/PerformanceStrip";
import { RemoveEntryForm } from "../components/RemoveEntryForm";
import type { LeaderboardResponse, PerformanceResponse } from "../types";
import "./Pages.css";

export function AdminPage() {
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
      <h1 className="page-title">Manage entries</h1>
      <p className="page-sub">
        Add or remove focus areas and scores. Changes show on the main board after the next refresh or poll.
      </p>

      {loadError ? <p className="error">{loadError}</p> : null}

      <section className="card">
        <h2 className="card-heading">Add points</h2>
        <p className="muted">Log progress for a skill, role target, or learning theme.</p>
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
            <h2 className="card-heading">Current top 10</h2>
            <p className="muted">Preview of what the public board shows.</p>
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
        <p className="muted">Remove by row id, or remove every row for a given focus name.</p>
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
