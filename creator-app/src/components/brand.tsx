import Link from "next/link";

/**
 * The Mitra mark: a speech bubble (a manager who talks to you, in your language) holding a play button
 * (YouTube), with a spark for the growth and AI. Saffron → rose → violet gradient.
 */
export function MitraMark({ size = 32, className = "", id = "mitra-mark" }: { size?: number; className?: string; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF8A1F" />
          <stop offset="0.55" stopColor="#FF3D6E" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <path
        d="M15 3h18a13 13 0 0 1 13 13v11a13 13 0 0 1-13 13H21.5l-8.6 6.2c-1 .7-2.3-.2-2-1.4l1.2-5.4A13 13 0 0 1 2 27V16A13 13 0 0 1 15 3z"
        fill={`url(#${id}-g)`}
      />
      <path d="M19.5 14.6v12.8c0 1.1 1.2 1.8 2.2 1.2l10.4-6.4c.9-.6.9-1.9 0-2.4l-10.4-6.4c-1-.6-2.2.1-2.2 1.2z" fill="#fff" />
      <path d="M38.5 1.5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z" fill="#FFD23F" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/** Mark + lowercase wordmark, linking home. */
export function Logo({ className = "", size = 30 }: { className?: string; size?: number }) {
  return (
    <Link href="/" className={`group flex items-center gap-2 ${className}`} aria-label="Mitra home">
      <MitraMark size={size} className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      <span className="font-display text-[1.6rem] font-extrabold leading-none tracking-[-0.04em]">mitra</span>
    </Link>
  );
}
