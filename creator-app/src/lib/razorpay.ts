import { hmacHex, safeEqual } from "./crypto";
import type { PlanId } from "./plans";

const API = "https://api.razorpay.com/v1";

/** Razorpay plan ids (created once in the Razorpay dashboard) for each paid plan. */
export function razorpayPlanId(plan: PlanId): string | undefined {
  if (plan === "pro") return process.env.RAZORPAY_PLAN_PRO;
  if (plan === "creator") return process.env.RAZORPAY_PLAN_CREATOR;
  return undefined;
}

export function planForRazorpayPlanId(id: string | undefined): PlanId | null {
  if (!id) return null;
  if (id === process.env.RAZORPAY_PLAN_PRO) return "pro";
  if (id === process.env.RAZORPAY_PLAN_CREATOR) return "creator";
  return null;
}

export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET &&
      process.env.RAZORPAY_PLAN_PRO &&
      process.env.RAZORPAY_PLAN_CREATOR,
  );
}

export interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string;
  current_end: number | null; // unix seconds
  ended_at?: number | null;
  notes?: Record<string, string> | [];
  short_url?: string;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Razorpay ${method} ${path} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export function createSubscription(plan: PlanId, userId: string, email: string): Promise<RazorpaySubscription> {
  return call("POST", "/subscriptions", {
    plan_id: razorpayPlanId(plan),
    total_count: 120, // monthly for up to 10 years; customers can cancel any time
    quantity: 1,
    customer_notify: 1,
    notes: { userId, plan, email },
  });
}

export function fetchSubscription(id: string): Promise<RazorpaySubscription> {
  return call("GET", `/subscriptions/${encodeURIComponent(id)}`);
}

/** Cancels at the end of the paid period by default; pass `immediately` to stop it now (e.g. account deletion). */
export function cancelSubscription(id: string, immediately = false): Promise<RazorpaySubscription> {
  return call("POST", `/subscriptions/${encodeURIComponent(id)}/cancel`, { cancel_at_cycle_end: immediately ? 0 : 1 });
}

/** Checkout success: HMAC-SHA256(payment_id + "|" + subscription_id) with the API key secret. */
export function verifyCheckoutSignature(paymentId: string, subscriptionId: string, signature: string): boolean {
  const expected = hmacHex(process.env.RAZORPAY_KEY_SECRET!, `${paymentId}|${subscriptionId}`);
  return safeEqual(expected, signature);
}

/** Webhooks: HMAC-SHA256 of the raw body with the webhook secret, sent as X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  return safeEqual(hmacHex(process.env.RAZORPAY_WEBHOOK_SECRET!, rawBody), signature);
}
