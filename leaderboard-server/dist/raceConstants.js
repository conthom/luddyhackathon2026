export const RACE_DURATION_MS = 2 * 60 * 60 * 1000 + 15 * 60 * 1000;
export const MILES_MEN = 50;
export const MILES_WOMEN = 25;
export function totalMilesForGender(g) {
    return g === "M" ? MILES_MEN : MILES_WOMEN;
}
export function clampRaceTime(ms) {
    return Math.min(Math.max(0, ms), RACE_DURATION_MS);
}
export function progressFromElapsed(elapsedMs) {
    if (RACE_DURATION_MS <= 0)
        return 0;
    return clampRaceTime(elapsedMs) / RACE_DURATION_MS;
}
