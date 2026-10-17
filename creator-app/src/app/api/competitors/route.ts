import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { channelMetrics } from "@/lib/competitors";
import { demoCompetitors } from "@/lib/demo";
import { cached } from "@/lib/memo";
import { fetchChannelSnapshot, parseChannelInput, resolveChannel, youtubeConnection, youtubeTokens, type ChannelSnapshot } from "@/lib/youtube";
import { RECONNECT_MESSAGE } from "@/lib/youtube-data";

const MAX_COMPETITORS = 5;
const SNAPSHOT_MS = 6 * 3_600_000; // public stats move slowly; 3 quota units per channel per refresh

const withMetrics = (s: ChannelSnapshot) => ({ ...s, metrics: channelMetrics(s) });

/** Your channel and saved competitors, each with its latest 15 uploads and comparable metrics. */
export async function GET() {
  const user = await currentUser();
  const yt = user ? await youtubeConnection(user.id) : null;
  if (!user || !yt?.channelId || yt.needsReconnectAt) {
    const d = demoCompetitors();
    return Response.json({ mode: "demo", me: withMetrics(d.me), rivals: d.rivals.map(withMetrics), ...(yt?.needsReconnectAt ? { error: RECONNECT_MESSAGE } : {}) });
  }
  const rows = await (await db()).select().from(schema.competitors).where(eq(schema.competitors.userId, user.id)).orderBy(schema.competitors.addedAt);
  const load = (channelId: string) =>
    cached(user.id, `snapshot:${channelId}`, SNAPSHOT_MS, async () => {
      const tokens = await youtubeTokens(user.id);
      if (!tokens) throw new Error("YouTube access is no longer valid");
      return fetchChannelSnapshot(tokens, channelId);
    }).then((r) => withMetrics(r.value));
  try {
    const [me, ...rivals] = await Promise.all([load(yt.channelId), ...rows.map((r) => load(r.channelId).catch(() => null))]);
    return Response.json({
      mode: "live",
      me,
      rivals: rivals.map((r, i) => r ?? { ...rows[i], id: rows[i].channelId, missing: true }),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Couldn't load channel data right now." }, { status: 502 });
  }
}

/** Adds a competitor by @handle or channel URL. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const yt = await youtubeConnection(user.id);
  const tokens = yt && !yt.needsReconnectAt ? await youtubeTokens(user.id).catch(() => null) : null;
  if (!tokens) return Response.json({ error: "Connect YouTube first, then add competitors." }, { status: 400 });
  const body = (await request.json().catch(() => null)) as { input?: unknown } | null;
  const ref = typeof body?.input === "string" ? parseChannelInput(body.input.slice(0, 200)) : null;
  if (!ref) return Response.json({ error: "Paste a channel link or @handle, like youtube.com/@mkbhd or @mkbhd." }, { status: 400 });
  const d = await db();
  const [{ n }] = await d.select({ n: count() }).from(schema.competitors).where(eq(schema.competitors.userId, user.id));
  if (n >= MAX_COMPETITORS) return Response.json({ error: `You can compare up to ${MAX_COMPETITORS} channels. Remove one first.` }, { status: 400 });
  const ch = await resolveChannel(tokens, ref).catch(() => null);
  if (!ch) return Response.json({ error: "Couldn't find that channel on YouTube." }, { status: 404 });
  if (ch.id === yt?.channelId) return Response.json({ error: "That's your own channel." }, { status: 400 });
  await d.insert(schema.competitors).values({ userId: user.id, channelId: ch.id, title: ch.title, handle: ch.handle, avatar: ch.avatar }).onConflictDoNothing();
  return Response.json({ ok: true, channel: ch });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = new URL(request.url).searchParams.get("id") ?? "";
  await (await db()).delete(schema.competitors).where(and(eq(schema.competitors.userId, user.id), eq(schema.competitors.channelId, id)));
  return Response.json({ ok: true });
}
