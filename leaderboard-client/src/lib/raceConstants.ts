/** Official race window for timeline labels and scrubber range. */
export const RACE_DURATION_MS = 2 * 60 * 60 * 1000 + 15 * 60 * 1000; // 2h 15m

/** Full race distance by heat (Little 500). */
export const MILES_MEN = 50;
export const MILES_WOMEN = 25;

export function totalMilesForGender(g: "M" | "F"): number {
  return g === "M" ? MILES_MEN : MILES_WOMEN;
}

export function clampRaceTime(ms: number): number {
  return Math.min(Math.max(0, ms), RACE_DURATION_MS);
}

export function progressFromElapsed(elapsedMs: number): number {
  if (RACE_DURATION_MS <= 0) return 0;
  return clampRaceTime(elapsedMs) / RACE_DURATION_MS;
}

/** Race clock 0:00:00 … 2:15:00 */
export function formatRaceClock(elapsedMs: number): string {
  const ms = clampRaceTime(elapsedMs);
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
