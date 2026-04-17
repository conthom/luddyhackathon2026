import type { RankedEntry } from "../types";
import "./LeaderboardTable.css";

type Props = {
  rows: RankedEntry[];
  emptyMessage?: string;
};

export function LeaderboardTable({ rows, emptyMessage = "No scores yet — add an entry to populate the board." }: Props) {
  return (
    <div className="lb-wrap">
      <table className="lb-table">
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">User</th>
            <th scope="col" className="num">
              Score
            </th>
            <th scope="col">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="lb-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="rank-pill">{r.rank}</span>
                </td>
                <td>{r.user}</td>
                <td className="num score">{r.score}</td>
                <td className="mono">{new Date(r.submittedAt).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
