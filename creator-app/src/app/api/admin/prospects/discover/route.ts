import { z } from "zod";
import { db, schema } from "@/db";
import { currentUser, isAdmin } from "@/lib/auth";
import { LANGUAGES } from "@/lib/languages";
import { DAILY_UNITS, discover, estimateUnits, prospectingAuth, unitsUsedToday } from "@/lib/prospects";

const Body = z.object({
  query: z.string().min(2).max(100),
  language: z.enum(["any", ...LANGUAGES.map((l) => l.code)] as [string, ...string[]]),
  minSubs: z.number().int().min(0).max(100_000_000),
  maxSubs: z.number().int().min(1).max(100_000_000),
  days: z.number().int().min(1).max(90),
  pages: z.number().int().min(1).max(3),
});

/** Admins: run one discovery search and save new prospects. Refuses if it would exceed today's quota budget. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!isAdmin(user)) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid search" }, { status: 400 });
  const o = parsed.data;
  if (o.minSubs > o.maxSubs) return Response.json({ error: "Minimum subscribers is above the maximum." }, { status: 400 });

  const used = await unitsUsedToday();
  if (used + estimateUnits(o.pages) > DAILY_UNITS) {
    return Response.json({ error: `Today's prospecting budget is ${DAILY_UNITS} quota units and ${used} are used. Try fewer pages or tomorrow.` }, { status: 429 });
  }
  const auth = await prospectingAuth(user!.id);
  if (!auth) return Response.json({ error: "Set YOUTUBE_API_KEY, or connect your own YouTube account, to search." }, { status: 400 });

  const d = await db();
  const [known, members] = await Promise.all([
    d.select({ id: schema.prospects.channelId }).from(schema.prospects),
    d.select({ id: schema.youtubeConnections.channelId }).from(schema.youtubeConnections),
  ]);
  const exclude = new Set([...known.map((r) => r.id), ...members.map((r) => r.id).filter((id): id is string => !!id)]);

  try {
    const result = await discover(auth, { ...o, language: o.language as never }, exclude);
    const seed = `${o.query} · ${o.language}`;
    const added = result.candidates.length
      ? await d
          .insert(schema.prospects)
          .values(result.candidates.map((c) => ({ ...c, views: String(c.views), lastUploadAt: c.lastUploadAt ? new Date(c.lastUploadAt) : null, seed })))
          .onConflictDoNothing()
          .returning({ id: schema.prospects.id })
      : [];
    await d.insert(schema.prospectRuns).values({ seed: o.query, language: o.language, units: result.units, found: result.found, added: added.length });
    return Response.json({ units: result.units, found: result.found, matched: result.candidates.length, added: added.length });
  } catch (err) {
    console.error("Prospect discovery failed", err);
    // Searches that reached YouTube still spent quota; record a conservative estimate.
    await d.insert(schema.prospectRuns).values({ seed: o.query, language: o.language, units: 100, found: 0, added: 0 });
    return Response.json({ error: err instanceof Error ? err.message.slice(0, 200) : "Search failed" }, { status: 502 });
  }
}
