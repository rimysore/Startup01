export type PlanId = "free" | "pro" | "creator";

/**
 * AI credits each answer costs. Video Doctor runs on a larger model, so it costs more; this keeps every plan's
 * worst-case AI bill below its price. Shared by the server (charging) and the UI (labels).
 */
export const FEATURE_CREDITS = { doctor: 5, titles: 1, comments: 1, chat: 1, thumbnail: 1, image: 1, trends: 1, audience: 1, slang: 1, competitors: 1, breakouts: 1, outreach: 0, report: 0 } as const;

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in paise (₹1 = 100 paise). */
  pricePaise: number;
  /** AI credits per calendar month; see FEATURE_CREDITS for what each answer costs. */
  credits: number;
  points: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    pricePaise: 0,
    credits: 10,
    points: ["10 AI credits / month (2 video diagnoses)", "Channel overview", "Trend Radar preview"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    // Launch price. 100 credits keeps even all-Video-Doctor use (~₹3 each) around break-even; typical use costs ~₹20.
    pricePaise: 9_900,
    credits: 100,
    points: ["100 AI credits / month", `Video Doctor (${FEATURE_CREDITS.doctor} credits each)`, "Title & Thumbnail Studio", "Comment insights", "Ask Mitra"],
  },
  creator: {
    id: "creator",
    name: "Creator+",
    // 250 credits keeps even all-Video-Doctor use around break-even at ₹249.
    pricePaise: 24_900,
    credits: 250,
    points: ["250 AI credits / month", "Everything in Pro", "Priority AI", "Priority support on WhatsApp"],
  },
};

export const PAID_PLANS = [PLANS.pro, PLANS.creator];

export function isPlanId(v: unknown): v is PlanId {
  return v === "free" || v === "pro" || v === "creator";
}

export function planOf(v: string | null | undefined): Plan {
  return isPlanId(v) ? PLANS[v] : PLANS.free;
}

/**
 * Monthly credits for a plan. Server-side, FREE_CREDITS overrides the Free plan's allowance (e.g. 20 for beta
 * testers) without a code change.
 */
export function creditLimit(v: string | null | undefined): number {
  const plan = planOf(v);
  const free = Number(process.env.FREE_CREDITS);
  return plan.id === "free" && free > 0 ? Math.floor(free) : plan.credits;
}

/** Sold by conversation for now (multi-channel and team seats are being built), so it isn't a checkout plan. */
export const AGENCY = {
  name: "Agency",
  pricePaise: 1_99_900,
  points: ["Up to 10 channels", "2,000 AI credits / month, shared", "Team seats", "Client-ready reports"],
};

/**
 * The first FOUNDING_SPOTS creators to connect a YouTube channel get a Founder Pass, for life: the features that
 * run on the small model at low effort (each answer costs us well under ₹1) are free up to FOUNDER_FREE_USES a
 * month, on any plan, without touching their credits. Video Doctor (larger model) and AI images still use credits,
 * so 100 founders cost at most a couple of thousand rupees a month.
 */
export const FOUNDING_SPOTS = 100;
export const FOUNDER_FREE_USES = 50;
export const FOUNDER_FREE_FEATURES = ["titles", "thumbnail", "trends", "audience", "slang", "comments", "chat", "breakouts", "image"] as const;
export type FounderFreeFeature = (typeof FOUNDER_FREE_FEATURES)[number];
export function founderFree(feature: string): feature is FounderFreeFeature {
  return (FOUNDER_FREE_FEATURES as readonly string[]).includes(feature);
}
/** What founders get free, in plain words, for the UI. */
export const FOUNDER_FREE_LABELS = ["Titles", "Thumbnail design", "Trends", "Audience", "Slang", "Comment insights", "Ask Mitra", "Breakout ideas", "AI backgrounds"];
export const FOUNDER_PERKS = [
  "Founding Creator badge with your number (#1–100)",
  `${FOUNDER_FREE_USES} free uses a month, for life: titles, thumbnails, trends, audience, slang, comments, breakout ideas, AI backgrounds and Ask Mitra`,
  "Live dashboard, subscriber celebrations and competitor tracking free for life",
  "First access to brand deals and collabs",
];

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

/** Higher rank wins when a user somehow has more than one live subscription. */
export const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, creator: 2 };
