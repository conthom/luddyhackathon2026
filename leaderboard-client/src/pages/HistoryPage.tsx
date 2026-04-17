import { FormEvent, useCallback, useEffect, useState } from "react";
import { fetchHistory, fetchPerformance } from "../api";
import { PerformanceStrip } from "../components/PerformanceStrip";
import type { HistoryResponse, PerformanceResponse } from "../types";
import "./Pages.css";

export function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [perf, setPerf] = useState<PerformanceResponse | null>(null);
  const [user, setUser] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [h, p] = await Promise.all([
        fetchHistory({
          user: user.trim() || undefined,
          from: from.trim() || undefined,
          to: to.trim() || undefined,
        }),
        fetchPerformance(),
      ]);
      setData(h);
      setPerf(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [user, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    void load();
  }

  return (
    <>
      <h1 className="page-title">Submission history</h1>
      <p className="page-sub">GET /history — optional query params <code>user</code>, <code>from</code>, <code>to</code> (ISO timestamps).</p>

      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <form className="filter-form" onSubmit={applyFilters}>
          <label className="field">
            <span>User contains</span>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="optional" />
          </label>
          <label className="field">
            <span>From (ISO)</span>
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="2026-04-17T00:00:00.000Z" />
          </label>
          <label className="field">
            <span>To (ISO)</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="2026-04-18T23:59:59.999Z" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary">
              Apply filters
            </button>
          </div>
        </form>
        <PerformanceStrip perf={perf} />
      </section>

      <section className="card">
        <h2 className="card-heading">Log ({data?.entries.length ?? 0} rows)</h2>
        <div className="table-scroll">
          <table className="hist-table">
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th className="num">Score</th>
                <th className="mono">Id</th>
              </tr>
            </thead>
            <tbody>
              {(data?.entries ?? []).map((e) => (
                <tr key={e.id}>
                  <td className="mono">{new Date(e.submittedAt).toLocaleString()}</td>
                  <td>{e.user}</td>
                  <td className="num">{e.score}</td>
                  <td className="mono small">{e.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
