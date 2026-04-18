import { FormEvent, useState } from "react";
import "./Forms.css";

type Props = {
  onRemoveById: (id: string) => Promise<void>;
  onRemoveByUser: (user: string) => Promise<void>;
  disabled?: boolean;
};

export function RemoveEntryForm({ onRemoveById, onRemoveByUser, disabled }: Props) {
  const [id, setId] = useState("");
  const [user, setUser] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function byId(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!id.trim()) {
      setError("Paste a row id.");
      return;
    }
    setPending(true);
    try {
      await onRemoveById(id.trim());
      setId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  async function byUser(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user.trim()) {
      setError("Enter a focus name to remove all rows for that focus.");
      return;
    }
    setPending(true);
    try {
      await onRemoveByUser(user.trim());
      setUser("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="remove-stack">
      <form className="form-inline" onSubmit={byId}>
        <label className="field grow">
          <span>Remove by row id</span>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Paste id from the leaderboard or log"
            disabled={disabled || pending}
          />
        </label>
        <button type="submit" className="btn ghost" disabled={disabled || pending}>
          Remove
        </button>
      </form>
      <form className="form-inline" onSubmit={byUser}>
        <label className="field grow">
          <span>Remove all for focus</span>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Exact focus area name"
            disabled={disabled || pending}
          />
        </label>
        <button type="submit" className="btn ghost" disabled={disabled || pending}>
          Remove all
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
