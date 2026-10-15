"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ChannelSummary } from "@/lib/types";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";
import type { PlanId } from "@/lib/plans";
import { useStoredString } from "./hooks";

export { useQueryParam } from "./hooks";

/** Shape of GET /api/me. */
export interface Me {
  user: { id: string; email: string; name: string | null; avatar: string | null } | null;
  plan?: { id: PlanId; name: string; renewsAt: string | null };
  subscription?: { status: string; cancelAtCycleEnd: boolean; currentEnd: string | null } | null;
  usage?: { month: string; used: number; limit: number };
  youtube?: { channelTitle: string | null; needsReconnect?: boolean } | null;
  config: { google: boolean; ai: boolean; billing: boolean; devLogin: boolean; simulateBilling: boolean };
}

interface DashboardState {
  summary: (ChannelSummary & { error?: string }) | null;
  me: Me | null;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  /** Reloads the account and channel data (after sign-in changes, connecting YouTube, upgrading). */
  reload: () => void;
  /** Re-ask YouTube now instead of using the cached copy. */
  refresh: () => void;
  /** Reloads only the account data (e.g. credits after an AI call). */
  refreshMe: () => void;
}

const Ctx = createContext<DashboardState | null>(null);

function getJson<T>(url: string): Promise<T> {
  return fetch(url, { cache: "no-store" }).then((r) => r.json() as Promise<T>);
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<DashboardState["summary"]>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [stored, setLanguage] = useStoredString("mitra-language", "hinglish");
  const language: LanguageCode = isLanguageCode(stored) ? stored : "hinglish";
  const [version, setVersion] = useState(0);
  const [meVersion, setMeVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const force = useRef(false);
  const refresh = useCallback(() => {
    force.current = true;
    setVersion((v) => v + 1);
  }, []);
  const refreshMe = useCallback(() => setMeVersion((v) => v + 1), []);

  useEffect(() => {
    let live = true;
    const url = force.current ? "/api/channel?refresh=1" : "/api/channel";
    force.current = false;
    getJson<ChannelSummary>(url)
      .then((s) => live && setSummary(s))
      .catch(() => live && setSummary(null));
    return () => {
      live = false;
    };
  }, [version]);

  useEffect(() => {
    let live = true;
    getJson<Me>("/api/me")
      .then((m) => live && setMe(m))
      .catch(() => live && setMe(null));
    return () => {
      live = false;
    };
  }, [version, meVersion]);

  return (
    <Ctx.Provider value={{ summary, me, language, setLanguage, reload, refresh, refreshMe }}>{children}</Ctx.Provider>
  );
}

export function useDashboard(): DashboardState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDashboard must be used inside DashboardProvider");
  return v;
}

export interface AiError {
  message: string;
  /** The underlying error; only sent to admins. */
  detail?: string;
  upgrade?: boolean;
  signin?: boolean;
}

export interface AiResponse<T> {
  demo?: boolean;
  demoReason?: "signin" | "nokey";
  result?: T;
  error?: AiError;
}

export async function postAi<T>(path: string, body: unknown): Promise<AiResponse<T>> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = (await res.json()) as { demo?: boolean; demoReason?: "signin" | "nokey"; result?: T; error?: string; detail?: string; upgrade?: boolean };
    if (json.error) return { error: { message: json.error, detail: json.detail, upgrade: json.upgrade, signin: res.status === 401 } };
    return { demo: json.demo, demoReason: json.demoReason, result: json.result };
  } catch {
    return { error: { message: "Network error — check your connection and try again." } };
  }
}
