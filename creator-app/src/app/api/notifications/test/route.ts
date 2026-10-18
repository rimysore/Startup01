import { and, eq, gt, like, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { buildVideoCheck, buildWeekly, loadSummary } from "@/lib/reports/build";
import { deliver, finish, saveOnDemand } from "@/lib/reports/deliver";
import { pdfFilename, pdfLink } from "@/lib/reports/link";
import { t } from "@/lib/whatsapp/strings";
import { z } from "zod";

const Body = z.object({ kind: z.enum(["weekly", "video_check"]).default("weekly") });

/**
 * "Send me a sample now": builds the real report from the creator's channel and delivers it the normal way
 * (with the PDF for weekly reports). Limited to 3 an hour (each may cost a WhatsApp template and a small AI call).
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { kind } = parsed.data;
  const d = await db();
  // Take a slot before building anything (the AI part is on Mitra), so parallel clicks can't skip the limit.
  const slot = `sample:${user.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  await d.insert(schema.webhookEvents).values({ id: slot });
  const [recent] = await d
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.webhookEvents)
    .where(and(like(schema.webhookEvents.id, `sample:${user.id}:%`), gt(schema.webhookEvents.receivedAt, new Date(Date.now() - 3_600_000))));
  if ((recent?.n ?? 0) > 3) {
    await d.delete(schema.webhookEvents).where(eq(schema.webhookEvents.id, slot));
    return Response.json({ error: "That's enough samples for now. Try again in an hour." }, { status: 429 });
  }

  const loaded = await loadSummary(user.id);
  if (!loaded.ok) return Response.json({ error: loaded.reason === "reconnect" ? "Reconnect YouTube first." : "Connect your YouTube channel first." }, { status: 409 });
  const w = t(user.language);
  const video = loaded.summary.videos[0];
  if (kind === "video_check" && !video) return Response.json({ error: "No uploads on your channel yet." }, { status: 409 });
  const report =
    kind === "weekly"
      ? await buildWeekly(user, loaded.summary, { ideas: w.btnIdeas, menu: w.btnMenu })
      : await buildVideoCheck(user, loaded.summary, video, { titles: w.btnTitles, menu: w.btnMenu });
  const now = Date.now();
  const id = await saveOnDemand(user.id, report, now, "sample");
  const pdf = id && report.data ? { link: pdfLink(id, now), filename: pdfFilename(report.key), caption: w.pdfCaption } : undefined;
  const delivery = await deliver(user, report, now, w.footer, pdf);
  if (id) await finish(id, report, delivery);
  return Response.json({ channel: delivery.channel, preview: report.text, pdf: id && report.data ? `/api/reports/pdf?id=${id}` : null, error: delivery.error ?? null });
}
