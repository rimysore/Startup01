import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { authUrl, googleConfigured } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/dashboard/connections?error=not_configured", origin));
  }
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("mitra_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(authUrl(origin, state));
}
