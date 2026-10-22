import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { beginOAuth } from "@/lib/oauth-state";
import { instagramAuthUrl, instagramConfigured } from "@/lib/marketplace/social";

/** Connect Instagram (professional accounts), read-only: profile numbers and recent posts' likes and comments. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/m/kit", origin));
  if (!instagramConfigured()) return NextResponse.redirect(new URL(request.nextUrl.searchParams.get("next") === "/m/autodm" ? "/m/autodm" : "/m/kit?ig=not_configured#verify", origin));
  // Back to the page that asked (the kit or Auto-DM); only Mitra's own creator pages.
  const asked = request.nextUrl.searchParams.get("next");
  const next = asked === "/m/autodm" ? asked : "/m/kit";
  const state = await beginOAuth({ intent: "instagram", next });
  return NextResponse.redirect(instagramAuthUrl(origin, state));
}
