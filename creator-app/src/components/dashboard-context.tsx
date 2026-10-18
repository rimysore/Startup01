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
  /** 1-100 for founding creators. */
  founderNumber?: number | null;
  /** The account's language, and whether the creator has picked it yet (first sign-in asks). */
  language?: string;
  languageChosen?: boolean;
  /** Founder Pass free uses this month (founders only). */
  founderPass?: { used: number; limit: number } | null;
  /** In ADMIN_EMAILS: can see AI costs and reset their own credits. */
  admin?: boolean;
  youtube?: { channelTitle: string | null; needsReconnect?: boolean } | null;
  config: { google: boolean; ai: boolean; billing: boolean; devLogin: boolean; simulateBilling: boolean; images?: boolean; compose?: boolean; stockPhotos?: boolean };
}

interface DashboardState {
  summary: (ChannelSummary & { error?: string }) | null;
  /** Set when the creator's channel couldn't be loaded at all (shown instead of the page). */
  summaryError: string | null;
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
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [stored, storeLanguage] = useStoredString("mitra-language", "hinglish");
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
  // Saved on the account too, so the Monday report and WhatsApp replies use the same language. A pick made before
  // the account has loaded waits for it; a save that fails goes back to the account's language instead of
  // pretending, so the screen never shows a language the reports won't use.
  const signedIn = Boolean(me?.user);
  const pending = useRef<LanguageCode | null>(null);
  const saveLanguage = useCallback(
    (l: LanguageCode) => {
      pending.current = l;
      fetch("/api/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: l }) })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
        })
        .catch((err) => {
          console.error("Couldn't save the language", err);
          if (me?.languageChosen && me.language && isLanguageCode(me.language)) storeLanguage(me.language);
        })
        .finally(() => {
          if (pending.current === l) pending.current = null;
          setMeVersion((v) => v + 1);
        });
    },
    [me, storeLanguage],
  );
  const setLanguage = useCallback(
    (l: LanguageCode) => {
      storeLanguage(l);
      if (signedIn) saveLanguage(l);
      else pending.current = l;
    },
    [storeLanguage, signedIn, saveLanguage],
  );
  // The account loaded after a pick: save it now.
  useEffect(() => {
    if (signedIn && pending.current) saveLanguage(pending.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when sign-in state becomes known
  }, [signedIn]);

  useEffect(() => {
    let live = true;
    const url = force.current ? "/api/channel?refresh=1" : "/api/channel";
    force.current = false;
    getJson<ChannelSummary & { unavailable?: boolean; error?: string }>(url)
      .then((s) => {
        if (!live) return;
        setSummaryError(s.unavailable ? (s.error ?? "Couldn't load your channel.") : null);
        setSummary(s.unavailable ? null : s);
      })
      .catch(() => {
        if (!live) return;
        setSummary(null);
        setSummaryError("Couldn't load your channel. Check your connection.");
      });
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

  // The account is the source of truth once a language was picked (it may have been changed on WhatsApp).
  const serverLanguage = me?.languageChosen ? me.language : undefined;
  useEffect(() => {
    if (pending.current) return; // a pick is on its way to the account
    if (serverLanguage && isLanguageCode(serverLanguage) && serverLanguage !== stored) storeLanguage(serverLanguage);
    // Only when the account's value changes, not on every local change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverLanguage]);

  return (
    <Ctx.Provider value={{ summary, summaryError, me, language, setLanguage, reload, refresh, refreshMe }}>{children}</Ctx.Provider>
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
