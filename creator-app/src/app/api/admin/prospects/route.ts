import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { currentUser, isAdmin } from "@/lib/auth";
import { foundingSpotsLeft } from "@/lib/founders";
import { DAILY_UNITS, STATUSES, unitsUsedToday } from "@/lib/prospects";

const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

/** Admins: all prospects (best first), today's quota use and founding spots left. */
export async function GET(request: Request) {
  if (!isAdmin(await currentUser())) return notFound();
  const status = new URL(request.url).searchParams.get("status");
  const d = await db();
  const rows = await d
    .select()
    .from(schema.prospects)
    .where(status && (STATUSES as readonly string[]).includes(status) ? eq(schema.prospects.status, status) : undefined)
    .orderBy(desc(schema.prospects.score), desc(schema.prospects.createdAt))
    .limit(500);
  const [used, spotsLeft] = await Promise.all([unitsUsedToday(), foundingSpotsLeft().catch(() => null)]);
  return Response.json({ prospects: rows, quota: { used, limit: DAILY_UNITS }, spotsLeft });
}

const Patch = z.object({
  ids: z.array(z.number().int()).min(1).max(500),
  status: z.enum(STATUSES).optional(),
  notes: z.string().max(1000).optional(),
  subject: z.string().max(200).optional(),
  opener: z.string().max(1000).optional(),
});

/** Admins: change status/notes/message for one or more prospects. */
export async function PATCH(request: Request) {
  if (!isAdmin(await currentUser())) return notFound();
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { ids, ...set } = parsed.data;
  await (await db())
    .update(schema.prospects)
    .set({ ...set, updatedAt: new Date(), ...(set.status === "contacted" ? { contactedAt: new Date() } : {}) })
    .where(inArray(schema.prospects.id, ids));
  return Response.json({ ok: true });
}
