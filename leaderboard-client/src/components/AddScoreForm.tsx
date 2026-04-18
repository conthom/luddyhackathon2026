import { FormEvent, useState } from "react";
import "./Forms.css";

type Props = {
  onSubmit: (user: string, score: number) => Promise<void>;
  disabled?: boolean;
};

export function AddScoreForm({ onSubmit, disabled }: Props) {
  const [user, setUser] = useState("");
  const [score, setScore] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Number(score);
    if (!user.trim() || !Number.isFinite(n)) {
      setError("Enter a display name and a numeric score.");
      return;
    }
    setPending(true);
    try {
      await onSubmit(user.trim(), n);
      setScore("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Focus area</span>
        <input
          name="user"
          autoComplete="off"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="e.g. System design, Python, public speaking"
          disabled={disabled || pending}
        />
      </label>
      <label className="field">
        <span>Points</span>
        <input
          name="score"
          inputMode="decimal"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="0"
          disabled={disabled || pending}
        />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={disabled || pending}>
          {pending ? "Saving…" : "Add entry"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
