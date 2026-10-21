/** Brand colours (layer A), shared by the mark, the app icons and the share image. */
export const BRAND = { cobalt: "#4169E1", mint: "#72D9B0", navy: "#101B33", paper: "#F8FAFC" } as const;

/** The mark as a transparent PNG cut from the master artwork. 256px covers every on-screen size up to 128px at 2×. */
export const MARK_SRC = "/brand/mitra-mark-256.png";

/**
 * The Mitra mark: an "M" drawn as a rising wave, cobalt into mint, with a spark at its peak (a channel taking off).
 * `id` is accepted for older call sites and ignored.
 */
export function MitraMark({ size = 32, className = "" }: { size?: number; className?: string; id?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- a tiny static brand asset; next/image adds nothing here
  return <img src={MARK_SRC} width={size} height={size} alt="" aria-hidden className={className} draggable={false} />;
}
