/** Pretty label for DB user (e.g. `little500:M:3PH` → `Men · 3PH`). */
export function displayTeamUser(user) {
    if (!user.startsWith("little500:"))
        return user;
    const rest = user.slice("little500:".length);
    const i = rest.indexOf(":");
    if (i === -1)
        return rest;
    const g = rest.slice(0, i);
    const name = rest.slice(i + 1);
    return `${g === "M" ? "Men" : "Women"} · ${name}`;
}
/** Maps `Men · Team` / `Women · Team` to `little500:M:Team` / `little500:F:Team`. */
export function parseTeamNameToDbUser(input) {
    const t = input.trim();
    const men = /^Men\s*·\s*(.+)$/i.exec(t);
    if (men)
        return `little500:M:${men[1].trim()}`;
    const women = /^Women\s*·\s*(.+)$/i.exec(t);
    if (women)
        return `little500:F:${women[1].trim()}`;
    return t;
}
