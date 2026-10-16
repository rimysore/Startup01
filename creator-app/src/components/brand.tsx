/** Brand colours, shared by the mark, the app icons and the share image. */
export const BRAND = { saffron: "#FF8A1F", fuchsia: "#D946EF", violet: "#6C47FF", sun: "#FFD23F" } as const;

/** The white "m" with a taller second hump (growth), drawn as one rounded stroke. */
export const MARK_M = "M12.5 34V27.5a4.25 4.25 0 0 1 8.5 0V34M21 34V19.5a4.25 4.25 0 0 1 8.5 0V34";

/**
 * The Mitra mark: a round badge in a saffron → fuchsia → violet sunrise, a white "m" whose second hump stands
 * taller (your channel growing), and a sun dot that turns it into "mi". Deliberately nothing like a play button.
 */
export function MitraMark({ size = 32, className = "", id = "mitra-mark" }: { size?: number; className?: string; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="6" y1="44" x2="42" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={BRAND.saffron} />
          <stop offset="0.5" stopColor={BRAND.fuchsia} />
          <stop offset="1" stopColor={BRAND.violet} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22.5" fill={`url(#${id}-g)`} />
      <path d={MARK_M} fill="none" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35.5" cy="15" r="3.6" fill={BRAND.sun} />
    </svg>
  );
}
