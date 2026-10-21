import { createHash } from "node:crypto";
import { z } from "zod";
import { aiConfigured, readOfferScreenshot } from "@/lib/ai";
import { runPaidAi } from "@/lib/ai-route";
import { body, guard } from "@/lib/marketplace/http";
import { addToInbox } from "@/lib/marketplace/inbox";

export const maxDuration = 60;

const Shot = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().max(1_200_000).regex(/^[A-Za-z0-9+/]+=*$/),
});

/**
 * Reads a screenshot of an offer (a DM, chat or email) with AI, then adds the text to the inbox. The image is
 * never stored; one credit, refunded if the read fails, and the same limits as every other AI feature.
 */
export async function POST(request: Request) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, Shot);
  if (b.error) return b.error;
  if (!aiConfigured()) return Response.json({ error: "Reading screenshots isn't switched on yet. Paste the text instead." }, { status: 503 });
  const hash = createHash("sha256").update(b.data.data).digest("hex");
  const out = await runPaidAi(g.user, "offerread", { screenshot: hash }, () => readOfferScreenshot(b.data));
  if (!out.ok) return Response.json({ error: out.error }, { status: out.status });
  const r = out.result;
  if (!r.isOffer || r.text.trim().length < 10) return Response.json({ error: "Couldn't find an offer in that screenshot. Try one that shows the whole message." }, { status: 422 });
  const o = await addToInbox(g.user.id, {
    source: "screenshot",
    body: r.text,
    senderName: r.senderName || null,
    senderHandle: r.senderHandle || null,
    senderEmail: r.senderEmail || null,
    senderPhone: r.senderPhone || null,
  });
  return Response.json({ ok: true, id: o.id });
}
