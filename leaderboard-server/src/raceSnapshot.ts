import { createHash } from "node:crypto";
import { progressFromElapsed, RACE_DURATION_MS } from "./raceConstants.js";
import type { Little500Team, RaceHeat } from "./little500Types.js";
import { buildSimulation, milesForTeam } from "./raceSimulation.js";
import type { LeaderboardEntry } from "./types.js";

function rowId(gender: string, teamName: string): string {
  const h = createHash("sha256").update(`${gender}\0${teamName}`).digest("hex").slice(0, 28);
  return `l5-${h}`;
}

function rowUser(gender: string, teamName: string): string {
  return `little500:${gender}:${teamName}`;
}

export function buildLittle500SnapshotEntries(
  teams: Little500Team[],
  elapsedMs: number,
  heat: RaceHeat,
): LeaderboardEntry[] {
  const clamped = Math.min(Math.max(0, elapsedMs), RACE_DURATION_MS);
  const p = progressFromElapsed(clamped);
  const sim = buildSimulation(teams, heat);
  const now = new Date().toISOString();
  return sim.map((s) => ({
    id: rowId(s.gender, s.teamName),
    user: rowUser(s.gender, s.teamName),
    score: milesForTeam(s, p),
    submittedAt: now,
  }));
}
