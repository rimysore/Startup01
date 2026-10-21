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
 * Mitra's fee on deals Mitra brought (never on deals a creator finds), paid by the business on top of the
 * creator's fee, so creators keep 100% of what they agree to. Shown to both sides before anyone accepts.
 * docs/BUSINESS_MODEL.md explains the choice.
 */
export const MITRA_FEE_PCT = 10;
export const FEE_PAID_BY: "business" | "creator" = "business";
/** During the Bengaluru pilot the fee is shown but not charged. */
export const FEE_WAIVED_IN_PILOT = true;

/** Goals a business can start a brief from; free text is allowed too. */
export const GOALS = ["footfall", "orders", "launch", "event", "awareness"] as const;
