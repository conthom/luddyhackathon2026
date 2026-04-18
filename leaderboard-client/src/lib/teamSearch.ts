import type { Little500Team } from "./little500Types";

export function formatTeamLabel(t: Little500Team): string {
  return `${t.gender === "M" ? "Men" : "Women"} · ${t.teamName}`;
}

export function teamKey(t: Little500Team): string {
  return `${t.gender}:${t.teamName}`;
}

/** Case-insensitive: full label substring, or every query word appears in team name or label. */
export function matchesTeamQuery(t: Little500Team, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return false;
  const label = formatTeamLabel(t).toLowerCase();
  if (label.includes(q)) return true;
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return false;
  const name = t.teamName.toLowerCase();
  return parts.every((p) => name.includes(p) || label.includes(p));
}

export function filterTeamsByQuery(teams: Little500Team[], raw: string, limit = 15): Little500Team[] {
  const q = raw.trim();
  if (!q) return [];
  return teams.filter((t) => matchesTeamQuery(t, q)).slice(0, limit);
}
