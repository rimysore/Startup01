import { after } from "next/server";
import { safeEqual } from "@/lib/crypto";
import { runDaily } from "@/lib/reports/run";

export const maxDuration = 300;

/**
 * Vercel Cron calls this once a day (vercel.json) with "Authorization: Bearer $CRON_SECRET". When there are more
 * creators than fit in one run, it calls itself again with the cursor, so it scales without a queue service.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const result = await runDaily({ cursor, deadline: Date.now() + 240_000 });
  console.log("Daily reports", JSON.stringify(result));

  if (result.more && result.cursor) {
    const next = new URL(url);
    next.searchParams.set("cursor", result.cursor);
    after(() => fetch(next, { headers: { authorization: auth } }).then(() => undefined, (err) => console.error("Couldn't continue daily reports", err)));
  }
  return Response.json(result);
}
