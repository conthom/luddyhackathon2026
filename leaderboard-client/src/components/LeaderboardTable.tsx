import { LayoutGroup, motion } from "framer-motion";
import { displayTeamUser } from "../lib/displayTeamUser";
import type { RankedEntry } from "../types";
import "./LeaderboardTable.css";

type Props = {
  rows: RankedEntry[];
  emptyMessage?: string;
};

const spring = { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.85 };

export function LeaderboardTable({
  rows,
  emptyMessage = "No entries yet — use the race page or Admin to add miles.",
}: Props) {
  return (
    <div className="lb-wrap">
      <div className="lb-grid lb-head" role="row">
        <div role="columnheader">Rank</div>
        <div role="columnheader">Team</div>
        <div role="columnheader" className="num">
          Miles
        </div>
        <div role="columnheader">Updated</div>
      </div>
      <LayoutGroup id="leaderboard">
        <div className="lb-rows" role="rowgroup">
          {rows.length === 0 ? (
            <div className="lb-grid lb-empty-row" role="row">
              <p className="lb-empty-msg">{emptyMessage}</p>
            </div>
          ) : (
            rows.map((r) => (
              <motion.div
                key={r.id}
                className="lb-grid lb-row"
                layout
                role="row"
                transition={spring}
              >
                <div className="lb-cell" role="cell">
                  <motion.span layout="position" className="rank-pill" transition={spring}>
                    {r.rank}
                  </motion.span>
                </div>
                <div className="lb-cell lb-focus" role="cell">
                  <motion.span layout="position" transition={spring}>
                    {displayTeamUser(r.user)}
                  </motion.span>
                </div>
                <div className="lb-cell num score" role="cell">
                  <motion.span layout="position" transition={spring}>
                    {typeof r.score === "number" ? r.score.toFixed(2) : r.score}
                  </motion.span>
                </div>
                <div className="lb-cell mono" role="cell">
                  <motion.span layout="position" transition={spring}>
                    {new Date(r.submittedAt).toLocaleString()}
                  </motion.span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </LayoutGroup>
    </div>
  );
}
