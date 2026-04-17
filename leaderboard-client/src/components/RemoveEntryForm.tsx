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
      setError("Paste an entry id.");
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
      setError("Enter a user name to remove all of their rows.");
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
          <span>Remove by id</span>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="uuid from API / table"
            disabled={disabled || pending}
          />
        </label>
        <button type="submit" className="btn ghost" disabled={disabled || pending}>
          Remove
        </button>
      </form>
      <form className="form-inline" onSubmit={byUser}>
        <label className="field grow">
          <span>Remove all for user</span>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="exact user name"
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
