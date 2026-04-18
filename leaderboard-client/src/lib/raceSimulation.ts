import { totalMilesForGender } from "./raceConstants";
import type { Little500Team, RaceHeat } from "./little500Types";

export type SimTeam = Little500Team & {
  /** 1 = leader among this heat at the flag */
  finalRank: number;
  startTrack: number;
  endTrack: number;
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Monotonic rank 1…n for combined heat: M1, F1, M2, F2, … */
export function combinedFinalRank(team: Little500Team): number {
  return (team.place - 1) * 2 + (team.gender === "F" ? 1 : 0) + 1;
}

export function filterHeat(teams: Little500Team[], heat: RaceHeat): Little500Team[] {
  if (heat === "men") return teams.filter((t) => t.gender === "M");
  if (heat === "women") return teams.filter((t) => t.gender === "F");
  return teams;
}

function finalRankFor(team: Little500Team, heat: RaceHeat): number {
  if (heat === "all") return combinedFinalRank(team);
  return team.place;
}

function endTrackFor(rank: number, n: number): number {
  if (n <= 1) return 1;
  return (n - rank) / (n - 1);
}

/** Build per-team start/end track positions; higher = closer to finish / better at that instant. */
export function buildSimulation(teams: Little500Team[], heat: RaceHeat): SimTeam[] {
  const subset = filterHeat(teams, heat);
  const n = subset.length;
  const out: SimTeam[] = subset.map((t) => {
    const finalRank = finalRankFor(t, heat);
    const startTrack = (hashString(`${t.teamName}|${t.gender}`) % 10000) / 10000;
    const endTrack = endTrackFor(finalRank, n);
    return { ...t, finalRank, startTrack, endTrack };
  });
  return out;
}

export function trackPositionAt(sim: SimTeam, progress01: number): number {
  const u = smoothstep01(progress01);
  return sim.startTrack * (1 - u) + sim.endTrack * u;
}

/** Miles traveled at this race progress (higher = farther up the track). */
export function milesForTeam(sim: SimTeam, progress01: number): number {
  const total = totalMilesForGender(sim.gender);
  const p = Math.min(1, Math.max(0, progress01));
  const pos = trackPositionAt(sim, p);
  const miles = total * p * (0.75 + 0.25 * pos);
  return Math.round(miles * 1000) / 1000;
}

export function currentOrder(sim: SimTeam[], progress01: number): SimTeam[] {
  const scored = sim.map((s) => ({
    s,
    pos: trackPositionAt(s, progress01),
  }));
  scored.sort((a, b) => b.pos - a.pos);
  return scored.map((x) => x.s);
}
