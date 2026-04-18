import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import type { Little500Team } from "./little500Types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..");

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

export function resolveLittle500WorkbookPath(): string | null {
  const env = process.env.LITTLE500_XLSX_PATH?.trim();
  if (env) {
    return path.isAbsolute(env) ? env : path.resolve(process.cwd(), env);
  }
  const candidates = [
    path.join(serverRoot, "data", "little-500-race.xlsx"),
    path.join(serverRoot, "..", "leaderboard-client", "public", "little-500-race.xlsx"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function loadLittle5002025FromDisk(): Little500Team[] {
  const workbookPath = resolveLittle500WorkbookPath();
  if (!workbookPath) {
    throw new Error("little-500-race.xlsx not found (set LITTLE500_XLSX_PATH or place file under server/data/)");
  }
  const buf = fs.readFileSync(workbookPath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames.includes("Little 500 results") ? "Little 500 results" : wb.SheetNames[0]!;
  const sheet = wb.Sheets[sheetName]!;
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
