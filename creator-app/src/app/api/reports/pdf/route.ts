import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { WeeklyCoach } from "@/lib/ai";
import { currentUser } from "@/lib/auth";
import type { WeeklyFacts } from "@/lib/reports/facts";
import { pdfFilename, validPdfLink } from "@/lib/reports/link";
import { weeklyPdf } from "@/lib/reports/pdf";

export const maxDuration = 30;

/**
 * A weekly report as a PDF.
 *   ?id=…&exp=…&sig=…  signed link (what WhatsApp and emails use; no sign-in needed, expires in 30 days)
 *   ?id=…              the signed-in owner's report
 *   ?latest=1          the signed-in creator's latest weekly report
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const id = Number(q.get("id"));
  const d = await db();
  let where;
  if (q.get("sig")) {
    if (!validPdfLink(id, Number(q.get("exp")), q.get("sig") ?? "")) return new Response("This link has expired. Open Mitra for a fresh report.", { status: 410 });
    where = eq(schema.notifications.id, id);
  } else {
    const user = await currentUser();
    if (!user) return new Response("Sign in to download your report.", { status: 401 });
    where = q.get("latest") ? and(eq(schema.notifications.userId, user.id), eq(schema.notifications.kind, "weekly")) : and(eq(schema.notifications.id, id), eq(schema.notifications.userId, user.id));
  }
  const rows = await d
    .select({ key: schema.notifications.key, payload: schema.notifications.payload, userId: schema.notifications.userId })
    .from(schema.notifications)
    .where(where)
    .orderBy(desc(schema.notifications.createdAt))
    .limit(5);
  const row = rows.find((r) => r.payload?.data);
  if (!row) return new Response("No report yet. Ask for one from WhatsApp & reports.", { status: 404 });
  const [owner] = await d.select({ language: schema.users.language }).from(schema.users).where(eq(schema.users.id, row.userId));
  const { facts, coach } = row.payload!.data as { facts: WeeklyFacts; coach: WeeklyCoach };
  const pdf = await weeklyPdf(facts, coach, owner?.language ?? "en");
  // Weekly rows are keyed by ISO week ("2026-W43"); on-demand ones ("sample:…") are just "latest".
  const name = pdfFilename(row.key.includes(":") ? "latest" : row.key);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${q.get("view") ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
