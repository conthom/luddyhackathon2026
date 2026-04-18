type Props = { className?: string; accent?: string };

/** Simple side-view bike for each team row (no external asset). */
export function BikeGlyph({ className, accent = "var(--accent)" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 40"
      width="48"
      height="30"
      aria-hidden
      focusable="false"
    >
      <circle cx="14" cy="28" r="9" fill="none" stroke={accent} strokeWidth="2.5" />
      <circle cx="50" cy="28" r="9" fill="none" stroke={accent} strokeWidth="2.5" />
      <path
        d="M14 28 L26 12 L40 12 L50 28 M26 12 L22 28 M40 12 L34 20 L22 28"
        fill="none"
        stroke={accent}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34" cy="20" r="3" fill={accent} opacity="0.35" />
    </svg>
  );
}
