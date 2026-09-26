export function TarotCardBack({ className, label = "Face-down tarot card" }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 240 400" className={className} role="img" aria-label={label}>
      <defs>
        <linearGradient id="card-back-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--midnight-800)" />
          <stop offset="100%" stopColor="var(--midnight-950)" />
        </linearGradient>
        <pattern id="card-back-lattice" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M13 0 L26 13 L13 26 L0 13 Z" fill="none" stroke="var(--gold-500)" strokeOpacity="0.16" strokeWidth="1" />
        </pattern>
      </defs>

      <rect x="4" y="4" width="232" height="392" rx="16" fill="url(#card-back-grad)" stroke="var(--gold-500)" strokeOpacity="0.5" strokeWidth="1.5" />
      <rect x="16" y="16" width="208" height="368" rx="10" fill="url(#card-back-lattice)" stroke="var(--gold-500)" strokeOpacity="0.35" />

      <circle cx="120" cy="200" r="48" fill="none" stroke="var(--gold-400)" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="120" cy="200" r="35" fill="none" stroke="var(--gold-400)" strokeOpacity="0.4" strokeWidth="1" />

      <g stroke="var(--gold-300)" strokeOpacity="0.85" strokeWidth="1.5" strokeLinecap="round">
        <line x1="120" y1="156" x2="120" y2="244" />
        <line x1="76" y1="200" x2="164" y2="200" />
        <line x1="91" y1="171" x2="149" y2="229" />
        <line x1="149" y1="171" x2="91" y2="229" />
      </g>
      <circle cx="120" cy="200" r="5" fill="var(--gold-300)" />
    </svg>
  );
}
