import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import { aiConfigured, chat, generateTitles } from "../ai";
import { runPaidAi } from "../ai-route";
import type { User } from "../auth";
import { channelContext } from "../channel-context";
import { SITE_URL } from "../company";
import { isLanguageCode, LANGUAGES, languageLabel } from "../languages";
import { creditLimit, FOUNDER_FREE_USES, planOf } from "../plans";
import { buildVideoCheck, buildWeekly, loadSummary } from "../reports/build";
import { latestReport, reportMessages, type Contact } from "../reports/deliver";
import { usageThisMonth } from "../usage";
import { markRead, send, sendAll, type Inbound, type Out } from "./api";
import { MENU_WORDS, START_WORDS, STOP_WORDS, t } from "./strings";

/**
 * Mitra on WhatsApp. Cheap by design: menus, buttons, reports and settings are plain code (no AI); only real
 * questions and idea/title requests use the AI, through the same credits, Founder Pass, limits and logging as
 * the website. Every message is handled once (deduplicated by WhatsApp's message id).
 */

const LINK_CODE = /\b(?:join|mitra)\s*[-:#]?\s*(\d{6})\b/i;
const STATE_MS = 30 * 60_000;

/** WhatsApp formatting: **bold** → *bold*, no markdown headings. */
export function toWhatsApp(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "*$1*")
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/^\s*[-•]\s+/gm, "• ")
    .trim();
}

async function firstTime(id: string): Promise<boolean> {
  const rows = await (await db()).insert(schema.webhookEvents).values({ id: `wa:${id}` }).onConflictDoNothing().returning({ id: schema.webhookEvents.id });
  return rows.length > 0;
}

async function linkByCode(m: Inbound, code: string, now: number): Promise<User | "expired"> {
  const d = await db();
  const [row] = await d
    .select()
    .from(schema.whatsappLinkCodes)
    .where(and(eq(schema.whatsappLinkCodes.code, code), gt(schema.whatsappLinkCodes.expiresAt, new Date(now))));
  if (!row) return "expired";
  // One number per account and one account per number: linking moves the number here.
  await d.delete(schema.whatsappContacts).where(eq(schema.whatsappContacts.phone, m.from));
  await d.delete(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, row.userId));
  await d.insert(schema.whatsappContacts).values({ userId: row.userId, phone: m.from, lastInboundAt: new Date(now) });
  await d.delete(schema.whatsappLinkCodes).where(eq(schema.whatsappLinkCodes.userId, row.userId));
  const [user] = await d.select().from(schema.users).where(eq(schema.users.id, row.userId));
  return user;
}

export function menu(language: string, optedOut: boolean): Out {
  const w = t(language);
  const ids = ["report", "check", "ideas", "titles", "ask", "lang", "plan", "dashboard", optedOut ? "start" : "stop"] as const;
  return {
    type: "list",
    text: w.menuText,
    button: w.menuButton,
    rows: ids.map((id) => ({ id, title: w.rows[id][0], description: id === "lang" ? languageLabel(language) : w.rows[id][1] })),
  };
}

function languageMenu(language: string): Out {
  return {
    type: "list",
    text: t(language).pickLanguage,
    button: "🌐",
    rows: LANGUAGES.map((l) => ({ id: `lang:${l.code}`, title: l.native === l.label ? l.label : `${l.native} · ${l.label}`, description: l.code === language ? "✓" : undefined })),
  };
}

const menuButton = (language: string, text: string, extra: { id: string; title: string }[] = []): Out => ({
  type: "buttons",
  text,
  buttons: [...extra, { id: "menu", title: t(language).btnMenu }],
});

/** Everything that happens after we know who the creator is. Returns the messages to send. */
export async function respond(user: User, contact: Contact, m: Inbound, now = Date.now()): Promise<Out[]> {
  const d = await db();
  const lang = user.language;
  const w = t(lang);
  const text = m.text.trim();
  let action = m.action;
  if (!action) {
    if (MENU_WORDS.test(text)) action = "menu";
    else if (STOP_WORDS.test(text)) action = "stop";
    else if (START_WORDS.test(text)) action = "start";
    else if (/^(report|weekly report|रिपोर्ट)$/i.test(text)) action = "report";
    else if (contact.state?.awaiting === "titles" && contact.state.until > now) action = "titles-topic";
  }
  if (contact.state && action !== "titles-topic") await d.update(schema.whatsappContacts).set({ state: null }).where(eq(schema.whatsappContacts.userId, user.id));

  switch (action?.split(":")[0]) {
    case "menu":
      return [menu(lang, Boolean(contact.optedOutAt))];
    case "stop":
      await d.update(schema.whatsappContacts).set({ optedOutAt: new Date(now) }).where(eq(schema.whatsappContacts.userId, user.id));
      return [menuButton(lang, w.stopped)];
    case "start":
      await d.update(schema.whatsappContacts).set({ optedOutAt: null }).where(eq(schema.whatsappContacts.userId, user.id));
      await d.update(schema.users).set({ notifyWeekly: true, notifyVideoCheck: true }).where(eq(schema.users.id, user.id));
      return [menuButton(lang, w.started)];
    case "lang": {
      const code = action!.split(":")[1];
      if (!code || !isLanguageCode(code)) return [languageMenu(lang)];
      await d.update(schema.users).set({ language: code }).where(eq(schema.users.id, user.id));
      return [{ type: "text", text: t(code).languageSet(languageLabel(code)) }, menu(code, Boolean(contact.optedOutAt))];
    }
    case "plan": {
      const used = await usageThisMonth(user.id);
      const pass = user.founderNumber != null ? w.founderPass(Math.max(0, FOUNDER_FREE_USES - used.founderUses), FOUNDER_FREE_USES) : "";
      return [{ type: "link", text: w.plan(planOf(user.plan).name, used.credits, creditLimit(user.plan), pass), label: w.btnUpgrade, url: `${SITE_URL}/dashboard/billing` }];
    }
    case "dashboard":
      return [{ type: "link", text: w.openDashboard, label: "Mitra", url: `${SITE_URL}/dashboard` }];
    case "ask":
      return [{ type: "text", text: w.askQuestion }];
    case "titles": {
      const videoId = action!.split(":")[1];
      if (!videoId) {
        await d.update(schema.whatsappContacts).set({ state: { awaiting: "titles", until: now + STATE_MS } }).where(eq(schema.whatsappContacts.userId, user.id));
        return [{ type: "text", text: w.askTopic }];
      }
      const loaded = await loadSummary(user.id);
      if (!loaded.ok) return [{ type: "text", text: loaded.reason === "reconnect" ? w.reconnect : w.noChannel }];
      const video = loaded.summary.videos.find((v) => v.id === videoId);
      return titles(user, video?.title ?? text, loaded.summary.channel.title);
    }
    case "titles-topic": {
      await d.update(schema.whatsappContacts).set({ state: null }).where(eq(schema.whatsappContacts.userId, user.id));
      const loaded = await loadSummary(user.id);
      return titles(user, text, loaded.ok ? loaded.summary.channel.title : "");
    }
    case "report": {
      const saved = await latestReport(user.id, "weekly");
      if (saved) return [menuButton(lang, saved, [{ id: "ideas", title: w.btnIdeas }])];
      const loaded = await loadSummary(user.id);
      if (!loaded.ok) return [{ type: "text", text: loaded.reason === "reconnect" ? w.reconnect : w.noChannel }];
      return reportMessages(await buildWeekly(user, loaded.summary, { ideas: w.btnIdeas, menu: w.btnMenu }, now));
    }
    case "check": {
      const videoId = action!.split(":")[1];
      if (videoId) {
        const saved = await latestReport(user.id, "video_check", videoId, 30);
        if (saved) return [menuButton(lang, saved, [{ id: `titles:${videoId}`, title: w.btnTitles }])];
      }
      const loaded = await loadSummary(user.id);
      if (!loaded.ok) return [{ type: "text", text: loaded.reason === "reconnect" ? w.reconnect : w.noChannel }];
      const video = loaded.summary.videos.find((v) => v.id === videoId) ?? loaded.summary.videos[0];
      if (!video) return [menuButton(lang, w.noVideos)];
      return reportMessages(await buildVideoCheck(user, loaded.summary, video, { titles: w.btnTitles, menu: w.btnMenu }, now));
    }
    case "ideas":
      return ask(user, "Give me 3 specific next video ideas for my channel based on what's working, each with a title and one line on why.");
    default:
      return ask(user, text);
  }
}

async function ask(user: User, question: string): Promise<Out[]> {
  const w = t(user.language);
  if (!aiConfigured()) return [{ type: "text", text: w.busy }];
  const loaded = await loadSummary(user.id);
  if (!loaded.ok) return [{ type: "text", text: loaded.reason === "reconnect" ? w.reconnect : w.noChannel }];
  const out = await runPaidAi(user, "chat", { whatsapp: question }, () => chat(user.language, channelContext(loaded.summary), [{ role: "user", content: question.slice(0, 2000) }]));
  if (!out.ok) return failure(user, out);
  return [menuButton(user.language, toWhatsApp(out.result).slice(0, 1024))];
}

async function titles(user: User, topic: string, channel: string): Promise<Out[]> {
  const w = t(user.language);
  if (topic.length < 3) return [{ type: "text", text: w.askTopic }];
  if (!aiConfigured()) return [{ type: "text", text: w.busy }];
  const out = await runPaidAi(user, "titles", { topic, tone: "energetic", channel, language: user.language }, () => generateTitles(user.language, topic, "energetic", channel));
  if (!out.ok) return failure(user, out);
  const r = out.result;
  const body = [`*✍️ ${topic.slice(0, 80)}*`, "", ...r.titles.slice(0, 5).map((x, i) => `${i + 1}. ${x.title}`), "", `🖼️ ${r.thumbnailText.slice(0, 3).join(" · ")}`, "", `🎙️ ${r.hook}`].join("\n");
  return [menuButton(user.language, body.slice(0, 1024))];
}

function failure(user: User, out: { status: number; error: string; upgrade?: boolean }): Out[] {
  const w = t(user.language);
  if (out.upgrade) return [{ type: "link", text: w.outOfCredits, label: w.btnUpgrade, url: `${SITE_URL}/dashboard/billing` }];
  return [{ type: "text", text: out.status === 429 ? out.error : w.busy }];
}

/** Entry point for one incoming message. */
export async function handleInbound(m: Inbound, now = Date.now()): Promise<void> {
  if (!(await firstTime(m.id))) return;
  const d = await db();
  void markRead(m.id);

  const [contact] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.phone, m.from));
  const code = LINK_CODE.exec(m.text)?.[1];
  if (code) {
    const user = await linkByCode(m, code, now);
    if (user === "expired") {
      await send(m.from, { type: "text", text: t(contact ? "hinglish" : "en").linkExpired });
      return;
    }
    const name = user.name?.split(" ")[0] || m.name || "creator";
    await sendAll(m.from, [{ type: "text", text: t(user.language).welcome(name) }, menu(user.language, false)]);
    return;
  }
  if (!contact) {
    await send(m.from, { type: "link", text: t("hinglish").notLinked, label: "Connect WhatsApp", url: `${SITE_URL}/dashboard/whatsapp` });
    return;
  }

  await d.update(schema.whatsappContacts).set({ lastInboundAt: new Date(now) }).where(eq(schema.whatsappContacts.userId, contact.userId));
  const [user] = await d.select().from(schema.users).where(eq(schema.users.id, contact.userId));
  if (!user) return;
  try {
    await sendAll(m.from, await respond(user, contact, m, now));
  } catch (err) {
    console.error("WhatsApp reply failed", err instanceof Error ? err.message : err);
    await send(m.from, { type: "text", text: t(user.language).busy }).catch(() => {});
  }
}
