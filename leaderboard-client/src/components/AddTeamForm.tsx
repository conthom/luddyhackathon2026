import { FormEvent, useMemo, useState } from "react";
import type { Little500Team } from "../lib/little500Types";
import { filterTeamsByQuery, formatTeamLabel, matchesTeamQuery } from "../lib/teamSearch";
import { TeamCombobox } from "./TeamCombobox";
import "./Forms.css";
import "./AddTeamForm.css";

type Props = {
  teams: Little500Team[];
  onAddTeam: (displayLabel: string, miles: number) => Promise<void>;
  disabled?: boolean;
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function AddTeamForm({ teams, onAddTeam, disabled }: Props) {
  const [input, setInput] = useState("");
  const [miles, setMiles] = useState("");
  const [picked, setPicked] = useState<Little500Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const matches = useMemo(() => filterTeamsByQuery(teams, input, 50), [teams, input]);

  function onInputChange(next: string) {
    setInput(next);
    if (picked && norm(formatTeamLabel(picked)) !== norm(next)) {
      setPicked(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Number(miles);
    if (!input.trim() || !Number.isFinite(n)) {
      setError("Choose or type a team and enter miles.");
      return;
    }

    let label = input.trim();

    if (picked && norm(formatTeamLabel(picked)) === norm(label)) {
      label = formatTeamLabel(picked);
    } else if (matches.length === 1) {
      label = formatTeamLabel(matches[0]!);
    } else if (matches.length > 1) {
      const exact = matches.find((t) => norm(formatTeamLabel(t)) === norm(label));
      if (exact) label = formatTeamLabel(exact);
      else {
        setError("Several teams match — click one in the dropdown to confirm.");
        return;
      }
    } else {
      const fuzzy = teams.filter((t) => matchesTeamQuery(t, label));
      if (fuzzy.length === 1) label = formatTeamLabel(fuzzy[0]!);
    }

    setPending(true);
    try {
      await onAddTeam(label, n);
      setMiles("");
      setInput("");
      setPicked(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="add-team-form" onSubmit={handleSubmit}>
      <TeamCombobox
        teams={teams}
        value={input}
        onChange={onInputChange}
        onPickTeam={setPicked}
        disabled={disabled || pending}
        label="Team"
        placeholder="e.g. cut, black key, theta"
        hint="Suggestions from the 2025 sheet. Submit calls POST /add with miles as score."
      />
      <div className="add-team-actions">
        <label className="field miles-field">
          <span>Miles</span>
          <input
            name="miles"
            inputMode="decimal"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            placeholder="0"
            disabled={disabled || pending}
          />
        </label>
        <button type="submit" className="btn primary" disabled={disabled || pending}>
          {pending ? "Calling /add…" : "Add team"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
