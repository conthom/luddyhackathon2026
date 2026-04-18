import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLeaderboard, fetchRaceState, postRaceState } from "../api";
import { BikeGlyph } from "../components/BikeGlyph";
import { displayTeamUser } from "../lib/displayTeamUser";
import type { RaceHeat } from "../lib/little500Types";
import type { LeaderboardResponse } from "../types";
import { formatRaceClock, MILES_MEN, MILES_WOMEN, progressFromElapsed, RACE_DURATION_MS } from "../lib/raceConstants";
import "./Pages.css";
import "./RacePage.css";

const ACCENTS = ["#5eead4", "#7dd3fc", "#c4b5fd", "#fda4af", "#fcd34d", "#86efac", "#f9a8d4", "#93c5fd", "#d8b4fe", "#fdba74"];

const POLL_MS = 5000;

export function RacePage() {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [heat, setHeat] = useState<RaceHeat>("men");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [raceHydrated, setRaceHydrated] = useState(false);
  /** Skip one debounced POST right after we applied GET /race/state (already on server). */
  const hydrateFromServer = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetchRaceState()
      .then((s) => {
        if (cancelled) return;
        hydrateFromServer.current = true;
        setElapsedMs(s.elapsedMs);
        setHeat(s.heat);
        setRaceHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setRaceHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshBoard = useCallback(async () => {
    setBoardError(null);
    try {
      const b = await fetchLeaderboard();
      setBoard(b);
    } catch (e) {
      setBoardError(e instanceof Error ? e.message : "Failed to load leaderboard");
    }
  }, []);

  useEffect(() => {
    void refreshBoard();
  }, [refreshBoard]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshBoard();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshBoard]);

  const t = progressFromElapsed(elapsedMs);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setElapsedMs((prev) => {
        const next = prev + dt;
        if (next >= RACE_DURATION_MS) {
          setPlaying(false);
          return RACE_DURATION_MS;
        }
        return next;
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);

  const onScrub = useCallback((value: number) => {
    setElapsedMs(Math.min(RACE_DURATION_MS, Math.max(0, value)));
  }, []);

  useEffect(() => {
    if (!raceHydrated) return;
    if (hydrateFromServer.current) {
      hydrateFromServer.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      void postRaceState({ elapsedMs, heat })
        .then(() => refreshBoard())
        .catch(() => {});
    }, 500);
    return () => window.clearTimeout(id);
  }, [raceHydrated, elapsedMs, heat, refreshBoard]);

  const heatLabel =
    heat === "men" ? "Men's 2025" : heat === "women" ? "Women's 2025" : "Men + Women 2025 (66 teams)";

  const rows = board?.top ?? [];

  return (
    <>
      <h1 className="page-title">Race leaderboard</h1>
      <p className="page-sub">
        Scrub or play the timeline ({formatRaceClock(RACE_DURATION_MS)}). Men {MILES_MEN} mi / women {MILES_WOMEN} mi.
        The top 10 comes from <span className="mono">GET /leaderboard</span> and updates with the replay (server sync)
        and every {POLL_MS / 1000}s so Admin changes show here.
      </p>

      {boardError ? <p className="error">{boardError}</p> : null}
      {!raceHydrated ? <p className="muted">Connecting…</p> : null}

      {raceHydrated ? (
        <>
          <section className="card race-controls">
            <div className="race-heat-row">
              <span className="muted">Heat</span>
              <div className="race-seg" role="tablist" aria-label="Race heat">
                <button type="button" className={heat === "men" ? "seg active" : "seg"} onClick={() => setHeat("men")}>
                  Men (33)
                </button>
                <button
                  type="button"
                  className={heat === "women" ? "seg active" : "seg"}
                  onClick={() => setHeat("women")}
                >
                  Women (33)
                </button>
                <button type="button" className={heat === "all" ? "seg active" : "seg"} onClick={() => setHeat("all")}>
                  Combined (66)
                </button>
              </div>
            </div>

            <div className="race-clock-row">
              <div className="race-clock" aria-live="polite">
                <span className="race-clock-label">Race time</span>
                <span className="race-clock-value mono">{formatRaceClock(elapsedMs)}</span>
                <span className="race-clock-of muted mono">/ {formatRaceClock(RACE_DURATION_MS)}</span>
              </div>
              <button type="button" className="btn primary" onClick={() => setPlaying((p) => !p)}>
                {playing ? "Pause" : "Play"}
              </button>
            </div>

            <label className="race-slider-label">
              <span className="muted">Timeline</span>
              <input
                type="range"
                className="race-slider"
                min={0}
                max={RACE_DURATION_MS}
                step={1000}
                value={elapsedMs}
                onChange={(e) => {
                  setPlaying(false);
                  onScrub(Number(e.target.value));
                }}
              />
            </label>

            <div className="race-track" aria-hidden>
              <div className="race-track-inner" style={{ width: `${t * 100}%` }} />
            </div>
            <p className="muted race-heat-caption">{heatLabel}</p>
          </section>

          <section className="card race-top-card">
            <div className="card-head">
              <div>
                <h2 className="card-heading">Top 10</h2>
                <p className="muted">
                  Same order and miles as the server after each timeline sync. Refreshes every {POLL_MS / 1000}s.
                </p>
              </div>
              <button type="button" className="btn ghost" onClick={() => void refreshBoard()}>
                Refresh
              </button>
            </div>

            <ol className="race-top-list">
              <AnimatePresence initial={false}>
                {rows.map((row, i) => {
                  const accent = ACCENTS[i % ACCENTS.length];
                  return (
                    <motion.li
                      key={row.id}
                      layout="position"
                      className="race-row"
                      initial={{ opacity: 0.85 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.5 }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    >
                      <span className="race-rank mono">{row.rank}</span>
                      <BikeGlyph className="race-bike" accent={accent} />
                      <div className="race-meta">
                        <div className="race-name">{displayTeamUser(row.user)}</div>
                        <div className="race-sub muted">
                          {typeof row.score === "number" ? row.score.toFixed(2) : row.score} mi · updated{" "}
                          {new Date(row.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
            {rows.length === 0 ? <p className="muted">No rows yet — use Admin or the timeline to populate the board.</p> : null}
          </section>
        </>
      ) : null}
    </>
  );
}
