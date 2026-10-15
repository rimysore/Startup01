"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribeToLocation(cb: () => void) {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}

/** Reads a query-string value on the client (null during server render). */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    subscribeToLocation,
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}

const STORAGE_EVENT = "mitra-storage";

function subscribeToStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(STORAGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(STORAGE_EVENT, cb);
  };
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** A string preference kept in localStorage. Falls back gracefully when storage is blocked. */
export function useStoredString(key: string, fallback: string): [string, (v: string) => void] {
  const value = useSyncExternalStore(subscribeToStorage, () => readStorage(key) ?? fallback, () => fallback);
  const set = useCallback(
    (v: string) => {
      try {
        localStorage.setItem(key, v);
      } catch {}
      window.dispatchEvent(new Event(STORAGE_EVENT));
    },
    [key],
  );
  return [value, set];
}

function subscribeToTheme(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", cb);
  };
}

/** The theme actually in effect: an explicit choice on <html data-theme>, else the OS setting. */
export function useTheme(): "light" | "dark" | null {
  return useSyncExternalStore(
    subscribeToTheme,
    () => {
      const t = document.documentElement.dataset.theme;
      if (t === "light" || t === "dark") return t;
      return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    },
    () => null,
  );
}
