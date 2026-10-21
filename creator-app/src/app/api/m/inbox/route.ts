import { z } from "zod";
import { body, guard } from "@/lib/marketplace/http";
import { addToInbox, inboxCountToday } from "@/lib/marketplace/inbox";

const Paste = z.object({
  body: z.string().trim().min(10).max(6000),
  senderName: z.string().trim().max(120).optional().nullable(),
  senderEmail: z.string().trim().toLowerCase().email().max(200).optional().nullable().or(z.literal("").transform(() => null)),
  senderPhone: z.string().trim().max(20).optional().nullable(),
  senderHandle: z.string().trim().max(80).optional().nullable(),
});

/** Adds a pasted offer to the inbox, checked. */
export async function POST(request: Request) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, Paste);
  if (b.error) return b.error;
  if ((await inboxCountToday(g.user.id, "paste")) >= 100) return Response.json({ error: "That's a lot of offers for one day. Try again tomorrow." }, { status: 429 });
  const o = await addToInbox(g.user.id, { source: "paste", ...b.data });
  return Response.json({ ok: true, id: o.id });
}
