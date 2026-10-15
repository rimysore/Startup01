import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { writeTokens } from "@/lib/session";
import { exchangeCode } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const jar = await cookies();
  const expected = jar.get("mitra_oauth_state")?.value;
  jar.delete("mitra_oauth_state");

  const code = searchParams.get("code");
  if (searchParams.get("error") || !code) {
    return NextResponse.redirect(new URL("/dashboard/connections?error=denied", origin));
  }
  if (!expected || searchParams.get("state") !== expected) {
    return NextResponse.redirect(new URL("/dashboard/connections?error=state", origin));
  }
  try {
    await writeTokens(await exchangeCode(code, origin));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/dashboard/connections?error=exchange", origin));
  }
  return NextResponse.redirect(new URL("/dashboard?connected=1", origin));
}
