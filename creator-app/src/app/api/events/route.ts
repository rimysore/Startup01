import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { recordEvent } from "@/lib/beta-events";
import { EVENT_NAMES } from "@/lib/beta-event-names";

const Body = z.object({
  name: z.enum(EVENT_NAMES),
  props: z.record(z.string().max(40), z.unknown()).default({}),
  anonId: z.string().regex(/^[a-z0-9]{8,40}$/).nullable().default(null),
  source: z.string().max(100).nullable().default(null),
});

/** Per instance; enough to stop a stuck component or a script from flooding the table. */
const PER_MINUTE = 60;
const recent = new Map<string, number[]>();
function tooMany(key: string): boolean {
  const now = Date.now();
  const times = (recent.get(key) ?? []).filter((t) => now - t < 60_000);
  times.push(now);
  recent.set(key, times);
  return times.length > PER_MINUTE;
}

/**
 * First-party beta events from the browser. Signed-in events are tied to the account (deleted with it); signed-out
 * ones only carry the random browser id. The browser skips this entirely when the creator switched stats off.
 */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 16_000) return Response.json({ error: "Too large" }, { status: 413 });
  let raw: unknown = null;
  try {
    raw = JSON.parse(text);
  } catch {}
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Invalid event" }, { status: 400 });

  const user = await currentUser().catch(() => null);
  const { name, props, anonId, source } = parsed.data;
  if (!user && !anonId) return Response.json({ ok: true });
  if (tooMany(user?.id ?? anonId!)) return Response.json({ error: "Too many events" }, { status: 429 });
  try {
    await recordEvent({ userId: user?.id ?? null, anonId, name, props, source });
  } catch (err) {
    console.error("Beta event failed", err);
    return Response.json({ error: "Couldn't save" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
