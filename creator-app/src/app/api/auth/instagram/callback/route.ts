import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { finishOAuth } from "@/lib/oauth-state";
import { instagramExchange, instagramSnapshot, saveInstagramConnection, syncInstagram } from "@/lib/marketplace/social";

/** Back from Instagram: keep a long-lived token (encrypted), save the verified numbers and fill in the profile. */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const back = (q: string) => NextResponse.redirect(new URL(`/m/kit?ig=${q}#verify`, origin));
  const intent = await finishOAuth(searchParams.get("state"));
  if (!intent || intent.intent !== "instagram") return back("state");
  const code = searchParams.get("code");
  if (searchParams.get("error") || !code) return back("denied");
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/m/kit", origin));
  try {
    const t = await instagramExchange(code, origin);
    const snap = await instagramSnapshot(t.token);
    if (snap.profile.account_type && !["BUSINESS", "MEDIA_CREATOR", "CREATOR"].includes(snap.profile.account_type.toUpperCase())) return back("not_professional");
    await saveInstagramConnection(user.id, { igUserId: t.userId, username: snap.profile.username, token: t.token, expiresAt: t.expiresAt });
    const { filled } = await syncInstagram(user.id, snap, user.name ?? snap.profile.username);
    return back(filled.length ? "filled" : "ok");
  } catch (err) {
    console.error("Instagram connect failed", err);
    return back("failed");
  }
}
