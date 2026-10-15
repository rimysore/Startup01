import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/** Google OAuth tokens for a connected YouTube channel, kept in an encrypted, httpOnly cookie. */
export interface YouTubeTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
}

const COOKIE = "mitra_yt";

function key(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return createHash("sha256").update(secret).digest();
}

function seal(data: YouTubeTokens): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

function unseal(value: string): YouTubeTokens | null {
  try {
    const raw = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const text = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    return JSON.parse(text) as YouTubeTokens;
  } catch {
    return null;
  }
}

export async function readTokens(): Promise<YouTubeTokens | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !process.env.SESSION_SECRET) return null;
  return unseal(value);
}

export async function writeTokens(tokens: YouTubeTokens): Promise<void> {
  (await cookies()).set(COOKIE, seal(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearTokens(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
