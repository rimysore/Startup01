import { Suspense } from "react";
import "../landing.css";
import "./m.css";

// Every marketplace page reads the session and may redirect, so it renders on the server per request rather than
// from a prefetched shell (docs: guides/authentication-with-cache-components).
export const instant = false;

/**
 * The marketplace area shares the landing page's quiet, neutral look. Each page renders its own top bar. Every page
 * reads the session, so it renders per request inside this boundary (Cache Components).
 */
export default function MarketLayout({ children }: LayoutProps<"/m">) {
  return (
    <div className="lp mk min-h-screen">
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>{children}</Suspense>
    </div>
  );
}
