import { totalMilesForGender } from "./raceConstants.js";
function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
}
function smoothstep01(t) {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
}
export function combinedFinalRank(team) {
    return (team.place - 1) * 2 + (team.gender === "F" ? 1 : 0) + 1;
}
export function filterHeat(teams, heat) {
    if (heat === "men")
        return teams.filter((t) => t.gender === "M");
    if (heat === "women")
        return teams.filter((t) => t.gender === "F");
    return teams;
}
function finalRankFor(team, heat) {
    if (heat === "all")
        return combinedFinalRank(team);
    return team.place;
}
function endTrackFor(rank, n) {
    if (n <= 1)
        return 1;
    return (n - rank) / (n - 1);
}
export function buildSimulation(teams, heat) {
    const subset = filterHeat(teams, heat);
    const n = subset.length;
    return subset.map((t) => {
        const finalRank = finalRankFor(t, heat);
        const startTrack = (hashString(`${t.teamName}|${t.gender}`) % 10000) / 10000;
        const endTrack = endTrackFor(finalRank, n);
        return { ...t, finalRank, startTrack, endTrack };
    });
}
export function trackPositionAt(sim, progress01) {
    const u = smoothstep01(progress01);
    return sim.startTrack * (1 - u) + sim.endTrack * u;
}
export function milesForTeam(sim, progress01) {
    const total = totalMilesForGender(sim.gender);
    const p = Math.min(1, Math.max(0, progress01));
    const pos = trackPositionAt(sim, p);
    const miles = total * p * (0.75 + 0.25 * pos);
    return Math.round(miles * 1000) / 1000;
}
export function currentOrder(sim, progress01) {
    const scored = sim.map((s) => ({
        s,
        pos: trackPositionAt(s, progress01),
    }));
    scored.sort((a, b) => b.pos - a.pos);
    return scored.map((x) => x.s);
}
