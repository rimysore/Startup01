"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

/** Who the landing page is talking to. The hero switch sets it; the hero, the art and the join form follow. */
export type Audience = "creator" | "business";

let current: Audience = "creator";
const listeners = new Set<() => void>();

function emit(next: Audience) {
  current = next;
  listeners.forEach((l) => l());
}

/** Switches audience, morphing the hero with a view transition where the browser supports one. */
export function setAudience(next: Audience) {
  if (next === current) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !reduced) doc.startViewTransition(() => flushSync(() => emit(next)));
  else emit(next);
}

export function useAudience(): Audience {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => "creator",
  );
}
