import { NextResponse, type NextRequest } from "next/server";
import { currentUser, safeNext } from "@/lib/auth";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { beginOAuth } from "@/lib/oauth-state";
import { authUrl, googleConfigured, YOUTUBE_READONLY, YOUTUBE_SCOPES } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const user = await currentUser();
  // With the marketplace on, creators verify from their media kit; /dashboard is admin-only.
  const home = MARKETPLACE ? "/m/kit" : "/dashboard/connections";
  if (!user) return NextResponse.redirect(new URL(`/login?next=${home}`, origin));
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL(`${home}?error=not_configured${MARKETPLACE ? "#verify" : ""}`, origin));
  }
  // Where to land afterwards: the dashboard by default, or a same-site page that asked (e.g. the media kit).
  const asked = request.nextUrl.searchParams.get("next");
  const state = await beginOAuth({ intent: "youtube", next: asked ? safeNext(asked) : MARKETPLACE ? "/m/kit?verify=1#verify" : "/dashboard?connected=1" });
  // ?only=count (the media kit's Verify): ask only to read the channel's public details and subscriber count,
  // not analytics.
  const scopes = request.nextUrl.searchParams.get("only") === "count" ? [YOUTUBE_READONLY] : YOUTUBE_SCOPES;
  return NextResponse.redirect(authUrl(origin, state, scopes, user.email));
}
