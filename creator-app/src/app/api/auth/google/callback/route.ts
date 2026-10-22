import { NextResponse, type NextRequest } from "next/server";
import { currentUser, startSession, upsertUser } from "@/lib/auth";
import { BETA } from "@/lib/beta";
import { recordEvent } from "@/lib/beta-events";
import { claimFounderSpot } from "@/lib/founders";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { finishOAuth } from "@/lib/oauth-state";
import { exchangeCode, fetchSummary, googleProfile, saveYouTubeConnection } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const intent = await finishOAuth(searchParams.get("state"));
  const fail = (path: string, error: string) => NextResponse.redirect(new URL(`${path}?error=${error}`, origin));

  if (!intent) return fail("/login", "state");
  const failPath = intent.intent === "login" ? "/login" : intent.next.startsWith("/m") || MARKETPLACE ? "/m/kit" : "/dashboard/connections";
  const code = searchParams.get("code");
  if (searchParams.get("error") || !code) return fail(failPath, "denied");

  try {
    const tokens = await exchangeCode(code, origin);

    if (intent.intent === "login") {
      const profile = await googleProfile(tokens);
      if (!profile.emailVerified) return fail("/login", "unverified");
      const user = await upsertUser({ email: profile.email, name: profile.name, avatar: profile.picture });
      await startSession(user.id);
      return NextResponse.redirect(new URL(intent.next, origin));
    }

    const user = await currentUser();
    if (!user) return fail("/login", "session");
    let channel: { id: string; title: string } | undefined;
    try {
      const summary = await fetchSummary(tokens);
      channel = { id: summary.channel.id, title: summary.channel.title };
    } catch (err) {
      console.error(err);
      return fail(failPath, "no_channel");
    }
    await saveYouTubeConnection(user.id, tokens, channel);
    // The Founder Pass ("free for life") isn't offered during the beta; founders who already hold one keep it.
    const founder = BETA ? null : await claimFounderSpot(user.id, channel.id).catch((err: unknown) => (console.error("Founder spot failed", err), null));
    await recordEvent({ userId: user.id, name: "channel_connected", props: {} }).catch(() => {});
    const next = new URL(intent.next, origin);
    if (founder) next.searchParams.set("founder", String(founder));
    return NextResponse.redirect(next);
  } catch (err) {
    console.error(err);
    return fail(failPath, "exchange");
  }
}
