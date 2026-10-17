import { aiConfigured } from "@/lib/ai";
import { currentUser, devLoginEnabled, isAdmin } from "@/lib/auth";
import { liveSubscription, simulateBillingEnabled } from "@/lib/billing";
import { creditLimit, FOUNDER_FREE_USES, planOf } from "@/lib/plans";
import { razorpayConfigured } from "@/lib/razorpay";
import { monthKey, usageThisMonth } from "@/lib/usage";
import { composeConfigured } from "@/lib/compose";
import { imageGenerationConfigured } from "@/lib/images";
import { googleConfigured, youtubeConnection } from "@/lib/youtube";

export async function GET() {
  const config = {
    google: googleConfigured(),
    ai: aiConfigured(),
    billing: razorpayConfigured(),
    devLogin: devLoginEnabled(),
    simulateBilling: simulateBillingEnabled(),
    images: imageGenerationConfigured(),
    compose: composeConfigured() && aiConfigured(),
    stockPhotos: Boolean(process.env.PEXELS_API_KEY),
  };
  const user = await currentUser();
  if (!user) return Response.json({ user: null, config });

  const [used, yt, sub] = await Promise.all([usageThisMonth(user.id), youtubeConnection(user.id), liveSubscription(user.id)]);
  const plan = planOf(user.plan);
  return Response.json({
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    plan: { id: plan.id, name: plan.name, renewsAt: user.planRenewsAt },
    subscription: sub ? { status: sub.status, cancelAtCycleEnd: Boolean(sub.cancelAtCycleEnd), currentEnd: sub.currentEnd } : null,
    usage: { month: monthKey(), used: used.credits, limit: creditLimit(plan.id) },
    founderNumber: user.founderNumber,
    language: user.language,
    languageChosen: user.languageSetAt != null,
    founderPass: user.founderNumber != null ? { used: used.founderUses, limit: FOUNDER_FREE_USES } : null,
    admin: isAdmin(user),
    youtube: yt ? { channelTitle: yt.channelTitle, needsReconnect: Boolean(yt.needsReconnectAt) } : null,
    config,
  });
}
