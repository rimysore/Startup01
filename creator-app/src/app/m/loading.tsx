/** Shown for a moment while a marketplace page reads the session (each one renders per request). */
export default function Loading() {
  return <div className="min-h-screen" aria-busy="true" />;
}
