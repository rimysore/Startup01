import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { beginOAuth } from "@/lib/oauth-state";
import { instagramAuthUrl, instagramConfigured } from "@/lib/marketplace/social";

/** Connect Instagram (professional accounts), read-only: profile numbers and recent posts' likes and comments. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/m/kit", origin));
  if (!instagramConfigured()) return NextResponse.redirect(new URL("/m/kit?ig=not_configured#verify", origin));
  const state = await beginOAuth({ intent: "instagram", next: "/m/kit" });
  return NextResponse.redirect(instagramAuthUrl(origin, state));
}
