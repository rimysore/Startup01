"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FOUNDER_PERKS, FOUNDING_SPOTS } from "@/lib/plans";

/** Landing banner with the live number of founding spots left. Hidden once they're gone. */
export function FoundingBanner() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/founders")
      .then((r) => r.json() as Promise<{ left: number | null }>)
      .then((d) => setLeft(d.left))
      .catch(() => setLeft(null));
  }, []);
  if (left === 0) return null;
  return (
    <div className="mt-8 max-w-xl rounded-2xl border border-accent/40 bg-accent-soft p-4">
      <p className="text-sm font-semibold text-ink">
        🏅 Founding 100{left != null && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">{left} of {FOUNDING_SPOTS} spots left</span>}
      </p>
      <p className="mt-1 text-sm text-ink-2">The first {FOUNDING_SPOTS} creators to connect their channel keep these for life:</p>
      <ul className="mt-2 grid gap-1 text-sm text-ink-2 sm:grid-cols-2">
        {FOUNDER_PERKS.map((p) => (
          <li key={p}>✓ {p}</li>
        ))}
      </ul>
      <Link href="/dashboard/connections" className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
        Claim a spot: connect YouTube →
      </Link>
    </div>
  );
}

/** "Founding Creator #17" pill for the dashboard hero. */
export function FounderBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ffd23f] to-[#ff8a3d] px-3 py-1.5 text-xs font-bold text-[#1a0f05]" title="One of the first 100 creators on Mitra: perks for life">
      🏅 Founding Creator #{n}
    </span>
  );
}
