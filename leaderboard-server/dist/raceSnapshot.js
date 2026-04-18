import { createHash } from "node:crypto";
import { progressFromElapsed, RACE_DURATION_MS } from "./raceConstants.js";
import { buildSimulation, milesForTeam } from "./raceSimulation.js";
function rowId(gender, teamName) {
    const h = createHash("sha256").update(`${gender}\0${teamName}`).digest("hex").slice(0, 28);
    return `l5-${h}`;
}
function rowUser(gender, teamName) {
    return `little500:${gender}:${teamName}`;
}
export function buildLittle500SnapshotEntries(teams, elapsedMs, heat) {
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
