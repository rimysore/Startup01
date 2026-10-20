import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { beginOAuth } from "@/lib/oauth-state";
import { authUrl, googleConfigured, LOGIN_SCOPES } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL(`/login?error=not_configured&next=${encodeURIComponent(next)}`, origin));
  }
  const state = await beginOAuth({ intent: "login", next });
  return NextResponse.redirect(authUrl(origin, state, LOGIN_SCOPES));
}
