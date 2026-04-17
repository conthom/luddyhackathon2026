import type { InfoResponse } from "../types";
import "./DistributionChart.css";

type Props = {
  info: InfoResponse | null;
};

export function DistributionChart({ info }: Props) {
  const dist = info?.scoreDistribution;
  if (!dist || dist.bins.length === 0) {
    return <p className="muted">Distribution appears once there are at least two distinct scores.</p>;
  }

  const max = Math.max(...dist.bins.map((b) => b.count), 1);

  return (
    <div className="dist">
      <div className="dist-axis">
        {dist.bins.map((b, i) => (
          <div key={i} className="dist-bin">
            <div
              className="dist-bar"
              style={{ height: `${Math.round((b.count / max) * 100)}%` }}
              title={`${b.count} in [${b.start.toFixed(2)}, ${b.end.toFixed(2)}]`}
            />
            <div className="dist-tick">{b.count}</div>
          </div>
        ))}
      </div>
      <div className="dist-caption">
        Histogram of scores ({dist.bins.length} bins) from {dist.min.toFixed(2)} to {dist.max.toFixed(2)}.
      </div>
    </div>
  );
}
