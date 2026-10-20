import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { writeOutreach } from "@/lib/ai";
import { logCall } from "@/lib/ai-guard";
import { currentUser, isAdmin } from "@/lib/auth";
import { LANGUAGES } from "@/lib/languages";

const Body = z.object({
  ids: z.array(z.number().int()).min(1).max(30),
  language: z.enum(LANGUAGES.map((l) => l.code) as [string, ...string[]]),
});

/** Admins: AI writes a subject and personal opener for each selected prospect (10 per model call). */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!isAdmin(user)) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const d = await db();
  const rows = await d.select().from(schema.prospects).where(inArray(schema.prospects.id, parsed.data.ids));
  let written = 0;
  try {
    for (let i = 0; i < rows.length; i += 10) {
      const batch = rows.slice(i, i + 10);
      const started = Date.now();
      const out = await writeOutreach(
        parsed.data.language,
        batch
          .map(
            (p) =>
              `id ${p.id}: channel "${p.title}" (${p.subscribers} subscribers, ${p.videoCount} videos, language ${p.language ?? "unknown"}); ` +
              `latest video: "${p.latestVideoTitle ?? "?"}"${p.lastUploadAt ? ` (uploaded ${p.lastUploadAt.toISOString().slice(0, 10)})` : ""}; about: ${(p.description ?? "").slice(0, 200).replace(/\s+/g, " ")}`,
          )
          .join("\n"),
      );
      await logCall(user!.id, "outreach", out.usage, Date.now() - started).catch(() => {});
      for (const m of out.result.messages) {
        if (!batch.some((p) => p.id === m.id)) continue;
        await d.update(schema.prospects).set({ subject: m.subject, opener: m.opener, updatedAt: new Date() }).where(inArray(schema.prospects.id, [m.id]));
        written++;
      }
    }
  } catch (err) {
    console.error("Outreach openers failed", err);
    return Response.json({ error: "The AI couldn't write openers right now.", written }, { status: 502 });
  }
  return Response.json({ written });
}
