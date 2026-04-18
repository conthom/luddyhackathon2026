import type { Little500Team } from "./little500Types";

type RawRow = Record<string, unknown>;

function asGender(v: unknown): "M" | "F" | null {
  const s = String(v).trim().toUpperCase();
  if (s === "M" || s === "MALE") return "M";
  if (s === "F" || s === "W" || s === "FEMALE") return "F";
  return null;
}

function asPlace(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Load 2025 results from the workbook under `/little-500-race.xlsx`. */
export async function loadLittle5002025Teams(sheetUrl = "/little-500-race.xlsx"): Promise<Little500Team[]> {
  const XLSX = await import("xlsx");
  const res = await fetch(sheetUrl);
  if (!res.ok) throw new Error(`Could not load race data (${res.status})`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames.includes("Little 500 results")
    ? "Little 500 results"
    : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });

  const teams: Little500Team[] = [];
  for (const row of rows) {
    const year = typeof row.Year === "number" ? row.Year : parseInt(String(row.Year), 10);
    if (year !== 2025) continue;
    const gender = asGender(row.Gender);
    const place = asPlace(row.Place);
    const teamName = String(row["Team Name"] ?? row.Team ?? "").trim();
    if (!gender || place == null || !teamName) continue;
    teams.push({ year: 2025, gender, teamName, place });
  }

  teams.sort((a, b) => {
    if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
    return a.place - b.place;
  });

  return teams;
}
