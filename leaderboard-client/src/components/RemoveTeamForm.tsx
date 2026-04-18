import { FormEvent, useMemo, useState } from "react";
import type { Little500Team } from "../lib/little500Types";
import { filterTeamsByQuery, formatTeamLabel, matchesTeamQuery } from "../lib/teamSearch";
import { TeamCombobox } from "./TeamCombobox";
import "./Forms.css";
import "./RemoveTeamForm.css";

type Props = {
  teams: Little500Team[];
  onRemoveTeam: (displayLabel: string) => Promise<void>;
  disabled?: boolean;
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function RemoveTeamForm({ teams, onRemoveTeam, disabled }: Props) {
  const [input, setInput] = useState("");
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
    if (!input.trim()) {
      setError("Find a team first.");
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
        setError("Several teams match — pick one from the dropdown.");
        return;
      }
    } else {
      const fuzzy = teams.filter((t) => matchesTeamQuery(t, label));
      if (fuzzy.length === 1) label = formatTeamLabel(fuzzy[0]!);
    }

    setPending(true);
    try {
      await onRemoveTeam(label);
      setInput("");
      setPicked(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="remove-stack">
      <form className="remove-team-form" onSubmit={handleSubmit}>
        <TeamCombobox
          teams={teams}
          value={input}
          onChange={onInputChange}
          onPickTeam={setPicked}
          disabled={disabled || pending}
          label="Team to remove"
          placeholder="Partial name — pick from list"
          hint="Submit calls POST /remove for every row with that team key."
        />
        <div className="remove-team-actions">
          <button type="submit" className="btn ghost" disabled={disabled || pending}>
            {pending ? "Calling /remove…" : "Remove team"}
          </button>
        </div>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
