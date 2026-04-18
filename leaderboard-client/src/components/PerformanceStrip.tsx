import type { PerformanceResponse } from "../types";
import "./PerformanceStrip.css";

type Props = {
  perf: PerformanceResponse | null;
};

export function PerformanceStrip({ perf }: Props) {
  if (!perf) return null;
  return (
    <div className="perf" role="status">
      <span className="perf-dot" aria-hidden />
      <span>
        Avg. response time: <strong>{perf.averageExecutionTimeMs.toFixed(3)}</strong> {perf.unit} (
        {perf.sampleCount} samples)
      </span>
    </div>
  );
}
