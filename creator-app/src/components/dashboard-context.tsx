"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ChannelSummary } from "@/lib/types";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";
import { useStoredString } from "./hooks";

export { useQueryParam } from "./hooks";

interface Status {
  googleConfigured: boolean;
  aiConfigured: boolean;
  connected: boolean;
}

interface DashboardState {
  summary: (ChannelSummary & { error?: string }) | null;
  status: Status | null;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  reload: () => void;
}

const Ctx = createContext<DashboardState | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<DashboardState["summary"]>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [stored, setLanguage] = useStoredString("mitra-language", "hinglish");
  const language: LanguageCode = isLanguageCode(stored) ? stored : "hinglish";
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let live = true;
    fetch("/api/channel")
      .then((r) => r.json())
      .then((s) => live && setSummary(s))
      .catch(() => live && setSummary(null));
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => live && setStatus(s))
      .catch(() => live && setStatus(null));
    return () => {
      live = false;
    };
  }, [version]);

  return <Ctx.Provider value={{ summary, status, language, setLanguage, reload }}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDashboard must be used inside DashboardProvider");
  return v;
}

export interface AiResponse<T> {
  demo?: boolean;
  result?: T;
  error?: string;
}

export async function postAi<T>(path: string, body: unknown): Promise<AiResponse<T>> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await res.json()) as AiResponse<T>;
  } catch {
    return { error: "Network error — check your connection and try again." };
  }
}
