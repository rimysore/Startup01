export type PlanId = "free" | "pro" | "creator";

/**
 * AI credits each answer costs. Video Doctor runs on a larger model, so it costs more; this keeps every plan's
 * worst-case AI bill below its price. Shared by the server (charging) and the UI (labels).
 */
export const FEATURE_CREDITS = { doctor: 3, titles: 1, comments: 1, chat: 1, thumbnail: 1, image: 1, trends: 1, audience: 1, slang: 1, competitors: 1 } as const;

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
    points: ["10 AI credits / month (≈3 video diagnoses)", "Channel overview", "Trend Radar preview"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    pricePaise: 39_900,
    credits: 300,
    points: ["300 AI credits / month", "Video Doctor (3 credits each)", "Title & Thumbnail Studio", "Comment insights", "Ask Mitra"],
  },
  creator: {
    id: "creator",
    name: "Creator+",
    pricePaise: 99_900,
    credits: 750,
    points: ["750 AI credits / month", "Everything in Pro", "Priority AI", "WhatsApp weekly reports (soon)"],
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

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

/** Higher rank wins when a user somehow has more than one live subscription. */
export const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, creator: 2 };
