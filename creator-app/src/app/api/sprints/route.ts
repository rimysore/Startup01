import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";
import { recordEvent } from "@/lib/beta-events";

const Body = z.object({
  videoId: z.string().min(1).max(40),
  videoTitle: z.string().max(300),
  fixes: z.array(z.string().max(400)).max(12),
  baselinePct: z.number().min(0).max(100).nullable(),
  language: z.string().max(20).optional(),
});

/** The creator's Retention Sprints, newest first. */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const rows = await (await db()).select().from(schema.sprints).where(eq(schema.sprints.userId, user.id)).orderBy(desc(schema.sprints.createdAt));
  return Response.json({
    sprints: rows.map((r) => ({
      videoId: r.videoId,
      videoTitle: r.videoTitle,
      fixes: r.fixes,
      baselinePct: r.baselinePct == null ? null : r.baselinePct / 10,
      createdAt: r.createdAt,
    })),
  });
}

/** "I'll apply these fixes": starts (or restarts) a sprint from a Video Doctor diagnosis. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { videoId, videoTitle, fixes, baselinePct, language } = parsed.data;
  const values = {
    userId: user.id,
    videoId,
    videoTitle,
    fixes,
    baselinePct: baselinePct == null ? null : Math.round(baselinePct * 10),
    language: language ?? null,
    createdAt: new Date(),
  };
  await (await db())
    .insert(schema.sprints)
    .values(values)
    .onConflictDoUpdate({ target: [schema.sprints.userId, schema.sprints.videoId], set: { fixes, baselinePct: values.baselinePct, language: values.language, createdAt: values.createdAt } });
  await recordEvent({ userId: user.id, name: "fix_committed", props: { fixes: fixes.length, language: language ?? null } }).catch(() => {});
  return Response.json({ ok: true });
}
