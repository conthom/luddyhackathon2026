import type { InfoResponse } from "../types";
import "./StatsGrid.css";

type Props = {
  info: InfoResponse | null;
};

function fmt(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function StatsGrid({ info }: Props) {
  if (!info) {
    return <p className="muted">Loading statistics…</p>;
  }
  if (info.count === 0) {
    return <p className="muted">No data yet. Add scores to see mean, quartiles, and distribution.</p>;
  }

  const p = info.percentiles;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Count</div>
        <div className="stat-value">{info.count}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Mean</div>
        <div className="stat-value">{fmt(info.mean)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Median</div>
        <div className="stat-value">{fmt(info.median)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Std dev</div>
        <div className="stat-value">{fmt(info.standardDeviation)}</div>
      </div>
      <div className="stat-card wide">
        <div className="stat-label">Quartiles (Q1 / Q2 / Q3)</div>
        <div className="stat-value small">
          {fmt(info.quartiles.q1)} · {fmt(info.quartiles.q2)} · {fmt(info.quartiles.q3)}
        </div>
      </div>
      <div className="stat-card wide">
        <div className="stat-label">Percentiles (p10–p90)</div>
        <div className="stat-value small">
          {fmt(p?.p10)} · {fmt(p?.p25)} · {fmt(p?.p50)} · {fmt(p?.p75)} · {fmt(p?.p90)}
        </div>
      </div>
      <div className="stat-card wide">
        <div className="stat-label">Min / max</div>
        <div className="stat-value small">
          {fmt(info.min)} … {fmt(info.max)}
        </div>
      </div>
    </div>
  );
}
