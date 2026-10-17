import { cookies } from "next/headers";
import { decrypt, encrypt, randomToken, safeEqual } from "./crypto";

const COOKIE = "mitra_oauth";

export interface OAuthIntent {
  intent: "login" | "youtube";
  next: string;
}

/** Stores a one-time state value (plus what the sign-in is for) in a short-lived encrypted cookie. */
export async function beginOAuth(intent: OAuthIntent): Promise<string> {
  const state = randomToken(16);
  (await cookies()).set(COOKIE, encrypt(JSON.stringify({ state, ...intent })), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return state;
}

/** Returns the intent if `state` matches the cookie; always clears the cookie. */
export async function finishOAuth(state: string | null): Promise<OAuthIntent | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  jar.delete(COOKIE);
  if (!raw || !state) return null;
  const text = decrypt(raw);
  if (!text) return null;
  const saved = JSON.parse(text) as OAuthIntent & { state: string };
  return safeEqual(saved.state, state) ? { intent: saved.intent, next: saved.next } : null;
}
