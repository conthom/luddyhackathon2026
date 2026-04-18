import { useCallback, useEffect, useState } from "react";
import { addEntry, fetchLeaderboard, fetchPerformance, postRaceReset, removeEntry } from "../api";
import { AddTeamForm } from "../components/AddTeamForm";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { PerformanceStrip } from "../components/PerformanceStrip";
import { RemoveTeamForm } from "../components/RemoveTeamForm";
import { parseTeamNameToDbUser } from "../lib/displayTeamUser";
import { loadLittle5002025Teams } from "../lib/loadLittle5002025";
import type { Little500Team } from "../lib/little500Types";
import type { LeaderboardResponse, PerformanceResponse } from "../types";
import "./Pages.css";

export function AdminPage() {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [perf, setPerf] = useState<PerformanceResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Little500Team[]>([]);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [resetPending, setResetPending] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const [b, p] = await Promise.all([fetchLeaderboard(), fetchPerformance()]);
      setBoard(b);
      setPerf(p);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const reloadTeams = useCallback(() => {
    setTeamsError(null);
    return loadLittle5002025Teams()
      .then((rows) => {
        setTeams(rows);
      })
      .catch((e: unknown) => {
        setTeamsError(e instanceof Error ? e.message : "Could not load team list");
      });
  }, []);

  useEffect(() => {
    void reloadTeams();
  }, [reloadTeams]);

  return (
    <>
      <h1 className="page-title">Manage entries</h1>
      <p className="page-sub">
        Add or remove teams via REST (<span className="mono">POST /add</span>, <span className="mono">POST /remove</span>
        ). Search matches partial names against the 2025 spreadsheet; pick from the dropdown to confirm. The race page
        keeps Little 500 rows in sync with the timeline.
      </p>

      {loadError ? <p className="error">{loadError}</p> : null}
      {teamsError ? <p className="error">{teamsError}</p> : null}

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-heading">Reset from spreadsheet</h2>
            <p className="muted">
              Calls <span className="mono">POST /race/reset</span>: reloads the workbook, sets race time to the flag
              (2:15:00), keeps the current heat, then <strong>clears the whole active leaderboard</strong> and inserts
              only 2025 sheet teams (removes test / guest rows). History log is unchanged.
            </p>
          </div>
          <button
            type="button"
            className="btn primary"
            disabled={resetPending}
            onClick={() => {
              setResetMessage(null);
              setResetPending(true);
              void postRaceReset()
                .then(() => reloadTeams())
                .then(() => refresh())
                .then(() => {
                  setResetMessage("Spreadsheet snapshot applied. Race page will match after refresh.");
                })
                .catch((e: unknown) => {
                  setResetMessage(e instanceof Error ? e.message : "Reset failed");
                })
                .finally(() => setResetPending(false));
            }}
          >
            {resetPending ? "Resetting…" : "Reset to spreadsheet"}
          </button>
        </div>
        {resetMessage ? (
          <p className={resetMessage.startsWith("Spreadsheet") ? "muted" : "error"}>{resetMessage}</p>
        ) : null}
      </section>

      <section className="card">
        <h2 className="card-heading">Add team</h2>
        <p className="muted">Search, pick a team, enter miles, then add (maps to Men · … / Women · … for the API).</p>
        <AddTeamForm
          teams={teams}
          onAddTeam={async (displayLabel, miles) => {
            await addEntry(parseTeamNameToDbUser(displayLabel), miles);
            await refresh();
          }}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-heading">Current top 10</h2>
            <p className="muted">From GET /leaderboard</p>
          </div>
          <button type="button" className="btn ghost" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        <LeaderboardTable rows={board?.top ?? []} />
        <PerformanceStrip perf={perf} />
      </section>

      <section className="card">
        <h2 className="card-heading">Remove team</h2>
        <p className="muted">Search and remove all rows for that team (same key as add / race sync).</p>
        <RemoveTeamForm
          teams={teams}
          onRemoveTeam={async (displayLabel) => {
            await removeEntry({ user: parseTeamNameToDbUser(displayLabel) });
            await refresh();
          }}
        />
      </section>
    </>
  );
}
