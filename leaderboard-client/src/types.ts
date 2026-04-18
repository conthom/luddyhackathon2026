export type RankedEntry = {
  rank: number;
  id: string;
  user: string;
  score: number;
  submittedAt: string;
};

export type LeaderboardResponse = {
  top: RankedEntry[];
};

export type InfoResponse = {
  count: number;
  mean: number | null;
  median: number | null;
  quartiles: { q1: number | null; q2: number | null; q3: number | null };
  min: number | null;
  max: number | null;
  standardDeviation: number | null;
  percentiles: Record<string, number | null>;
  percentileRanksByUser: Record<string, number>;
  scoreDistribution: {
    min: number;
    max: number;
    bins: { start: number; end: number; count: number }[];
  } | null;
};

export type PerformanceResponse = {
  averageExecutionTimeMs: number;
  sampleCount: number;
  unit: string;
};

export type HistoryResponse = {
  entries: {
    id: string;
    user: string;
    score: number;
    submittedAt: string;
  }[];
};

export type RaceStateResponse = {
  elapsedMs: number;
  heat: "men" | "women" | "all";
};
