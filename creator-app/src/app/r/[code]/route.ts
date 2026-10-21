import { NextResponse, type NextRequest } from "next/server";
import { followLink } from "@/lib/marketplace/business";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { openCoupon } from "@/lib/marketplace/track";

/**
 * A creator's link. For a tracked post it hands the visitor a coupon (kept in a cookie so reopening shows the same
 * one) and opens it; older deal links just count the visit and go to the business's https link.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/r/[code]">) {
  if (!MARKETPLACE) return new Response("Not found", { status: 404 });
  const code = (await ctx.params).code;
  const cookie = `mc_${code}`.slice(0, 40);
  const coupon = await openCoupon(code, request.cookies.get(cookie)?.value).catch(() => null);
  if (coupon) {
    const res = NextResponse.redirect(new URL(`/c/${coupon.couponId}`, request.nextUrl.origin), 302);
    res.cookies.set(cookie, coupon.couponId, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 30 * 86400, path: "/" });
    return res;
  }
  const url = await followLink(code).catch(() => null);
  return NextResponse.redirect(url ?? new URL("/", request.nextUrl.origin), 302);
}
