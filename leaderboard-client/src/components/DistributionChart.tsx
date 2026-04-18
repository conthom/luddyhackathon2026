import type { InfoResponse } from "../types";
import "./DistributionChart.css";

type Props = {
  info: InfoResponse | null;
};

function mileBinLabel(b: { start: number; end: number }): string {
  const same = Math.abs(b.end - b.start) < 1e-6;
  if (same) return `${b.start.toFixed(1)}`;
  return `${b.start.toFixed(1)}–${b.end.toFixed(1)}`;
}

export function DistributionChart({ info }: Props) {
  const dist = info?.scoreDistribution;
  if (!dist || dist.bins.length === 0) {
    return <p className="muted">Distribution appears once there are at least two distinct scores.</p>;
  }

  const max = Math.max(...dist.bins.map((b) => b.count), 1);

  return (
    <div className="dist">
      <div className="dist-axis" aria-label="Miles distribution histogram">
        {dist.bins.map((b, i) => (
          <div key={i} className="dist-bin">
            <div className="dist-bar-stack">
              <div
                className="dist-bar"
                style={{ height: `${Math.round((b.count / max) * 100)}%` }}
                title={`${b.count} teams in [${b.start.toFixed(2)}, ${b.end.toFixed(2)}] mi`}
              />
            </div>
            <div className="dist-tick">{b.count}</div>
            <div className="dist-mile-range mono" title={`${b.count} in ${mileBinLabel(b)} mi`}>
              {mileBinLabel(b)} <span className="dist-mile-unit">mi</span>
            </div>
          </div>
        ))}
      </div>
      <div className="dist-x-label">Miles (mi) — each column is a mile range; height is count.</div>
      <div className="dist-caption">
        Histogram of miles ({dist.bins.length} bins) from {dist.min.toFixed(2)} to {dist.max.toFixed(2)}.
      </div>
    </div>
  );
}
