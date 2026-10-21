/**
 * The marketplace (phase 1) ships behind a flag so the live beta keeps working unchanged. On by default in local
 * development; in production and previews set NEXT_PUBLIC_MARKETPLACE=1 to switch it on (0 forces it off).
 */
export const MARKETPLACE =
  process.env.NEXT_PUBLIC_MARKETPLACE === "1" || (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_MARKETPLACE !== "0");

export const ROLES = ["creator", "business", "brand", "agency"] as const;
export type Role = (typeof ROLES)[number];
export const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);

/** Sides that post briefs and pay creators. */
export const isBusinessSide = (role: Role) => role !== "creator";

export const UI_LANGS = ["en", "kn"] as const;
export type UiLang = (typeof UI_LANGS)[number];
export const isUiLang = (v: unknown): v is UiLang => UI_LANGS.includes(v as UiLang);

export const PLATFORMS = ["instagram", "youtube", "facebook", "sharechat", "moj", "josh"] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  sharechat: "ShareChat",
  moj: "Moj",
  josh: "Josh",
};

export const NICHES = ["food", "lifestyle", "fashion", "beauty", "fitness", "tech", "travel", "comedy", "education", "family", "devotional", "local"] as const;
export const DELIVERABLES = ["reel", "story", "post", "short", "video"] as const;
export type Deliverable = (typeof DELIVERABLES)[number];

export const DEAL_STATUSES = ["offered", "negotiating", "agreed", "posted", "paid", "declined", "cancelled"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];
export const OPEN_STATUSES: readonly DealStatus[] = ["offered", "negotiating", "agreed", "posted"];

/** Wording version recorded with each consent, so a change of wording is visible in the log. */
export const CONSENT_VERSION = "2026-10-21";

/**
 * Businesses pay for the platform, not a cut of deals (docs/BUSINESS_MODEL.md). `null` means unlimited. Matches are
 * invites to creators Mitra matched, per calendar month. Nothing is enforced or charged during the pilot.
 */
export const PLANS = {
  free: { priceInr: 0, trackedPerMonth: 2, matchesPerMonth: 0 },
  local: { priceInr: 499, trackedPerMonth: null, matchesPerMonth: 3 },
  growth: { priceInr: 1499, trackedPerMonth: null, matchesPerMonth: null },
} as const satisfies Record<string, { priceInr: number; trackedPerMonth: number | null; matchesPerMonth: number | null }>;
export type PlanId = keyof typeof PLANS;
export const isPlanId = (v: unknown): v is PlanId => typeof v === "string" && v in PLANS;
export const PLANS_ENFORCED = false;
/** Customers counted in a month on the free plan before Mitra suggests upgrading (results first, then the ask). */
export const UPGRADE_NUDGE_CUSTOMERS = 10;

/** Goals a business can start a brief from; free text is allowed too. */
export const GOALS = ["footfall", "orders", "launch", "event", "awareness"] as const;
