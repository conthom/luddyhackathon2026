import { useCallback, useEffect, useState } from "react";
import { fetchInfo, fetchPerformance } from "../api";
import { DistributionChart } from "../components/DistributionChart";
import { PerformanceStrip } from "../components/PerformanceStrip";
import { StatsGrid } from "../components/StatsGrid";
import type { InfoResponse, PerformanceResponse } from "../types";
import "./Pages.css";

export function StatsPage() {
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [perf, setPerf] = useState<PerformanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [i, p] = await Promise.all([fetchInfo(), fetchPerformance()]);
      setInfo(i);
      setPerf(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ranks = info?.percentileRanksByUser
    ? Object.entries(info.percentileRanksByUser).sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  return (
    <>
      <h1 className="page-title">Aggregate statistics</h1>
      <p className="page-sub">
        Mean, median, quartiles, spread, percentile bands, score distribution, and how each focus area compares to the
        field (best score vs everyone else).
      </p>

      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <div className="card-head">
          <h2 className="card-heading">Summary</h2>
          <button type="button" className="btn ghost" onClick={() => void load()}>
            Refresh
          </button>
        </div>
        <StatsGrid info={info} />
        <PerformanceStrip perf={perf} />
      </section>

      <section className="card">
        <h2 className="card-heading">Score distribution</h2>
        <DistributionChart info={info} />
      </section>

      {ranks.length > 0 ? (
        <section className="card">
          <h2 className="card-heading">Percentile rank by focus</h2>
          <p className="muted">Share of scores strictly below this user&apos;s best score.</p>
          <div className="rank-grid">
            {ranks.map(([user, pr]) => (
              <div key={user} className="rank-row">
                <span>{user}</span>
                <span className="mono">{(pr * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
