export type PlanId = "free" | "pro" | "creator";

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in paise (₹1 = 100 paise). */
  pricePaise: number;
  /** AI credits per calendar month. Each diagnosis, title set, comment summary or chat reply uses one. */
  credits: number;
  points: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    pricePaise: 0,
    credits: 10,
    points: ["10 AI credits / month", "Channel overview", "Trend Radar preview"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    pricePaise: 39_900,
    credits: 300,
    points: ["300 AI credits / month", "Video Doctor", "Title & Thumbnail Studio", "Comment insights", "Ask Mitra"],
  },
  creator: {
    id: "creator",
    name: "Creator+",
    pricePaise: 99_900,
    credits: 1_000,
    points: ["1,000 AI credits / month", "Everything in Pro", "Priority AI", "WhatsApp weekly reports (soon)"],
  },
};

export const PAID_PLANS = [PLANS.pro, PLANS.creator];

export function isPlanId(v: unknown): v is PlanId {
  return v === "free" || v === "pro" || v === "creator";
}

export function planOf(v: string | null | undefined): Plan {
  return isPlanId(v) ? PLANS[v] : PLANS.free;
}

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

/** Higher rank wins when a user somehow has more than one live subscription. */
export const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, creator: 2 };
