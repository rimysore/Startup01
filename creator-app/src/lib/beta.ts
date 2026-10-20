/**
 * The beta: Video Doctor plus Title & Thumbnail Studio, in Hindi and Kannada, free, with no prices shown.
 * Plan and reasoning: docs/BETA.md. Set NEXT_PUBLIC_BETA=0 to switch all of this off without a code change.
 */
import type { LanguageCode } from "./languages";

export const BETA = process.env.NEXT_PUBLIC_BETA !== "0";

/** Languages creators can choose during the beta, so each gets native-speaker review before more ship. */
export const BETA_LANGUAGES: readonly LanguageCode[] = ["hi", "kn"];

/** The language a creator lands on when theirs isn't offered in the beta. */
export const BETA_DEFAULT_LANGUAGE: LanguageCode = "hi";

export function offeredLanguage(code: string): boolean {
  return !BETA || (BETA_LANGUAGES as readonly string[]).includes(code);
}

/**
 * Dashboard pages on hold during the beta. Their pages send people to Video Doctor and their AI features answer
 * 404 (admins can still open everything, to keep testing).
 */
export const PAUSED_PAGES = ["/dashboard/audience", "/dashboard/comments", "/dashboard/ideas", "/dashboard/trends", "/dashboard/competitors", "/dashboard/whatsapp"];

/** AI features that are on hold during the beta. Video Doctor, titles and thumbnails stay on. */
export const PAUSED_AI = ["chat", "comments", "trends", "audience", "slang", "competitors", "breakouts"] as const;

export function aiPaused(feature: string): boolean {
  return BETA && (PAUSED_AI as readonly string[]).includes(feature);
}

/**
 * Monthly AI credits for Free accounts during the beta. Credits aren't shown to creators; this is only the safety
 * cap (about 20 Video Doctor runs, under ₹70 of AI at worst), on top of the daily budget. FREE_CREDITS overrides it.
 */
export const BETA_FREE_CREDITS = 100;

/** Below this many views YouTube's retention curve is too thin to diagnose drop-offs, so Video Doctor gives an early read. */
export const LOW_DATA_VIEWS = 300;

/** Uploads measured after a creator commits to Video Doctor's fixes. */
export const SPRINT_UPLOADS = 4;
