import { NextResponse, type NextRequest } from "next/server";
import { followLink } from "@/lib/marketplace/business";
import { MARKETPLACE } from "@/lib/marketplace/flag";

/** A creator's tracked link: counts the visit, then sends it to the business's https link (or the home page). */
export async function GET(request: NextRequest, ctx: RouteContext<"/r/[code]">) {
  if (!MARKETPLACE) return new Response("Not found", { status: 404 });
  const url = await followLink((await ctx.params).code).catch(() => null);
  return NextResponse.redirect(url ?? new URL("/", request.nextUrl.origin), 302);
}
