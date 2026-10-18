import { and, asc, eq, gt, isNull, like, lt, or } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "../auth";
import { t } from "../whatsapp/strings";
import { buildVideoCheck, buildWeekly, loadSummary } from "./build";
import { claim, deliver, finish, reachable } from "./deliver";
import { pdfFilename, pdfLink } from "./link";
import { videosDueForCheck, weekKey, weeklyDueInIndia } from "./facts";

/**
 * The daily job (Vercel Cron, ~8:45 IST). For each creator with a connected channel who can be reached:
 *   Mondays: the weekly report;  every day: a check for each video that turned ~2 days old.
 * Creators are processed in id order in pages, a few at a time, until the time budget runs out; the caller
 * continues from `cursor`. Idempotent: every report is claimed in `notifications` first, so re-running (a retry,
 * an overlapping run) never sends anything twice.
 */

export interface RunResult {
  users: number;
  sent: number;
  skipped: number;
  failed: number;
  cursor: string | null;
  more: boolean;
}

const PAGE = 100;
const CONCURRENCY = 4;

async function forUser(user: User, now: number, tally: RunResult): Promise<void> {
  const [contact] = await (await db()).select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, user.id));
  // STOP on WhatsApp means no reports anywhere, not "switch to email".
  if (contact?.optedOutAt) return;
  if (!reachable(user, contact ?? null)) return;

  const weekly = user.notifyWeekly && weeklyDueInIndia(now);
  if (!weekly && !user.notifyVideoCheck) return;

  const loaded = await loadSummary(user.id);
  if (!loaded.ok) return;
  const s = loaded.summary;
  const words = t(user.language);

  const jobs: { kind: "weekly" | "video_check"; key: string; build: () => ReturnType<typeof buildWeekly> }[] = [];
  if (weekly) jobs.push({ kind: "weekly", key: weekKey(now), build: () => buildWeekly(user, s, { ideas: words.btnIdeas, menu: words.btnMenu }, now) });
  if (user.notifyVideoCheck) {
    for (const v of videosDueForCheck(s.videos, now)) {
      jobs.push({ kind: "video_check", key: v.id, build: () => buildVideoCheck(user, s, v, { titles: words.btnTitles, menu: words.btnMenu }, now) });
    }
  }
  for (const job of jobs) {
    const id = await claim(user.id, job.kind, job.key, now);
    if (id == null) continue;
    try {
      const report = await job.build();
      const pdf = report.data ? { link: pdfLink(id, now), filename: pdfFilename(report.key), caption: words.pdfCaption } : undefined;
      const d = await deliver(user, report, now, words.footer, pdf);
      await finish(id, report, d);
      if (d.channel !== "none") tally.sent++;
      else if (d.error) tally.failed++;
      else tally.skipped++;
    } catch (err) {
      tally.failed++;
      await finish(id, null, { channel: "none", status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }
}

export async function runDaily({ now = Date.now(), cursor = null as string | null, deadline = Date.now() + 240_000 } = {}): Promise<RunResult> {
  const tally: RunResult = { users: 0, sent: 0, skipped: 0, failed: 0, cursor, more: false };
  const d = await db();
  // Housekeeping must never stop the reports.
  if (!cursor) await cleanUp(now).catch((err) => console.error("Daily clean-up failed", err));
  for (;;) {
    const page = await d
      .select({ user: schema.users })
      .from(schema.users)
      .innerJoin(schema.youtubeConnections, eq(schema.youtubeConnections.userId, schema.users.id))
      .where(
        and(
          isNull(schema.youtubeConnections.needsReconnectAt),
          or(eq(schema.users.notifyWeekly, true), eq(schema.users.notifyVideoCheck, true)),
          tally.cursor ? gt(schema.users.id, tally.cursor) : undefined,
        ),
      )
      .orderBy(asc(schema.users.id))
      .limit(PAGE);
    if (!page.length) return { ...tally, more: false };

    // A few creators at a time: fast, without bursting YouTube's or WhatsApp's rate limits.
    for (let i = 0; i < page.length; i += CONCURRENCY) {
      if (Date.now() > deadline) return { ...tally, more: true };
      const batch = page.slice(i, i + CONCURRENCY).map((r) => r.user);
      await Promise.all(batch.map((u) => forUser(u, now, tally).catch((err) => console.error(`Daily report for ${u.id} failed`, err))));
      tally.users += batch.length;
      tally.cursor = batch[batch.length - 1].id;
    }
    if (page.length < PAGE) return { ...tally, more: false };
  }
}

/** Housekeeping on the first page of each daily run: reports kept 90 days, expired link codes, old message ids and search counters. */
async function cleanUp(now: number): Promise<void> {
  const d = await db();
  await d.delete(schema.notifications).where(lt(schema.notifications.createdAt, new Date(now - 90 * 86_400_000)));
  await d.delete(schema.whatsappLinkCodes).where(lt(schema.whatsappLinkCodes.expiresAt, new Date(now)));
  await d.delete(schema.webhookEvents).where(and(like(schema.webhookEvents.id, "wa:%"), lt(schema.webhookEvents.receivedAt, new Date(now - 7 * 86_400_000))));
  await d.delete(schema.webhookEvents).where(and(like(schema.webhookEvents.id, "wajoin:%"), lt(schema.webhookEvents.receivedAt, new Date(now - 86_400_000))));
  for (const kind of ["niche:%", "studio:%", "sample:%"]) await d.delete(schema.webhookEvents).where(and(like(schema.webhookEvents.id, kind), lt(schema.webhookEvents.receivedAt, new Date(now - 14 * 86_400_000))));
}
