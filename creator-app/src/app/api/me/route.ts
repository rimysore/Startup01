import { aiConfigured } from "@/lib/ai";
import { currentUser, devLoginEnabled, isAdmin } from "@/lib/auth";
import { liveSubscription, simulateBillingEnabled } from "@/lib/billing";
import { creditLimit, planOf } from "@/lib/plans";
import { razorpayConfigured } from "@/lib/razorpay";
import { creditsUsed, monthKey } from "@/lib/usage";
import { googleConfigured, youtubeConnection } from "@/lib/youtube";

export async function GET() {
  const config = {
    google: googleConfigured(),
    ai: aiConfigured(),
    billing: razorpayConfigured(),
    devLogin: devLoginEnabled(),
    simulateBilling: simulateBillingEnabled(),
  };
  const user = await currentUser();
  if (!user) return Response.json({ user: null, config });

  const [used, yt, sub] = await Promise.all([creditsUsed(user.id), youtubeConnection(user.id), liveSubscription(user.id)]);
  const plan = planOf(user.plan);
  return Response.json({
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    plan: { id: plan.id, name: plan.name, renewsAt: user.planRenewsAt },
    subscription: sub ? { status: sub.status, cancelAtCycleEnd: Boolean(sub.cancelAtCycleEnd), currentEnd: sub.currentEnd } : null,
    usage: { month: monthKey(), used, limit: creditLimit(plan.id) },
    admin: isAdmin(user),
    youtube: yt ? { channelTitle: yt.channelTitle, needsReconnect: Boolean(yt.needsReconnectAt) } : null,
    config,
  });
}
