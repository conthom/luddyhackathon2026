import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { Little500Team } from "../lib/little500Types";
import { filterTeamsByQuery, formatTeamLabel } from "../lib/teamSearch";
import "./TeamCombobox.css";

type Props = {
  teams: Little500Team[];
  value: string;
  onChange: (next: string) => void;
  onPickTeam: (t: Little500Team) => void;
  disabled?: boolean;
  placeholder?: string;
  label: string;
  hint?: string;
};

const MAX = 15;

export function TeamCombobox({
  teams,
  value,
  onChange,
  onPickTeam,
  disabled,
  placeholder,
  label,
  hint = "Type part of a team name — pick from the list to confirm.",
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);

  const matches = filterTeamsByQuery(teams, value, MAX);

  const close = useCallback(() => {
    setOpen(false);
    setHi(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open, close]);

  useEffect(() => {
    setHi(0);
  }, [value]);

  function pick(t: Little500Team) {
    onChange(formatTeamLabel(t));
    onPickTeam(t);
    close();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && matches.length) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && matches.length > 0) {
      e.preventDefault();
      pick(matches[hi]!);
    }
  }

  const showList = open && value.trim().length > 0;

  return (
    <div className="team-combo" ref={wrapRef}>
      <label className="field">
        <span>{label}</span>
        <input
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (value.trim()) setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
      </label>
      {hint ? <p className="team-combo-hint">{hint}</p> : null}
      {showList ? (
        <ul id={listId} className="team-combo-list" role="listbox">
          {matches.length === 0 ? (
            <li className="team-combo-empty">No spreadsheet match — you can still enter Men · … or Women · … manually.</li>
          ) : (
            matches.map((t, i) => (
              <li key={`${t.gender}-${t.teamName}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={i === hi}
                  className={`team-combo-item${i === hi ? " highlighted" : ""}`}
                  onMouseEnter={() => setHi(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(t)}
                >
                  {formatTeamLabel(t)}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
