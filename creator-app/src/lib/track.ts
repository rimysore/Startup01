"use client";

import type { EventName } from "./beta-event-names";

const ANON_KEY = "mitra-anon";
const SOURCE_KEY = "mitra-source";
export const ANALYTICS_KEY = "mitra-analytics";
const SESSION_KEY = "mitra-last-session";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function anonId(): string | null {
  let id = read(ANON_KEY);
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
    write(ANON_KEY, id);
  }
  return /^[a-z0-9]{8,40}$/.test(id) ? id : null;
}

/** Saves first-touch source once: utm_source (or ?ref=), else the referring site, else "direct". */
export function rememberSource() {
  if (read(SOURCE_KEY)) return;
  const q = new URLSearchParams(window.location.search);
  let referrer: string | null = null;
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : "";
    referrer = host && host !== window.location.hostname ? host : null;
  } catch {}
  write(SOURCE_KEY, (q.get("utm_source") ?? q.get("ref") ?? referrer ?? "direct").slice(0, 100));
}

export function analyticsOn(): boolean {
  return read(ANALYTICS_KEY) !== "off";
}

/** Sends an anonymous-by-default beta event. Never throws; does nothing when the creator switched stats off. */
export function track(name: EventName, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !analyticsOn()) return;
  const body = JSON.stringify({ name, props, anonId: anonId(), source: read(SOURCE_KEY) });
  fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}

/** One session_start per browser per day: what the retention numbers count. */
export function trackDailySession() {
  const today = new Date().toISOString().slice(0, 10);
  if (read(SESSION_KEY) === today) return;
  write(SESSION_KEY, today);
  track("session_start");
}
