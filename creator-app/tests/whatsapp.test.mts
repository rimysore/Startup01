// Run with: npm test. Monday report, 48-hour check, delivery routing, idempotency, and the WhatsApp bot.
process.env.PGLITE_DIR = "memory://";
process.env.WHATSAPP_FAKE = "1";
process.env.EMAIL_FAKE = "1";
process.env.WHATSAPP_APP_SECRET = "test-secret";
delete process.env.ANTHROPIC_API_KEY;

const { db, schema } = await import("@/db");
const { eq } = await import("drizzle-orm");
const { cached } = await import("@/lib/memo");
const { hmacHex } = await import("@/lib/crypto");
const F = await import("@/lib/reports/facts");
const { outbox, toPayload, validSignature, parseWebhook, splitText, templateParam } = await import("@/lib/whatsapp/api");
const { mailOutbox } = await import("@/lib/email");
const { claim } = await import("@/lib/reports/deliver");
const { runDaily } = await import("@/lib/reports/run");
const { handleInbound, toWhatsApp, menu } = await import("@/lib/whatsapp/bot");
const { t, BOT_LANGUAGES, MENU_WORDS } = await import("@/lib/whatsapp/strings");
const { languageForPhone } = await import("@/lib/whatsapp/bot");
const { LANGUAGES } = await import("@/lib/languages");
const { TEMPLATES } = await import("@/lib/whatsapp/templates");
const { validPdfLink } = await import("@/lib/reports/link");
const { weeklyPdf, runs } = await import("@/lib/reports/pdf");
type Out = import("@/lib/whatsapp/api").Out;
type Summary = import("@/lib/types").ChannelSummary;

const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

// ---- Pure report maths --------------------------------------------------------------------------------
// Monday 19 Oct 2026, 08:45 IST = 03:15 UTC.
const NOW = Date.parse("2026-10-19T03:15:00Z");
assert(F.isMondayInIndia(NOW) && !F.isMondayInIndia(NOW - 86_400_000), "Monday is judged in India time");
assert(F.weekKey(NOW) === "2026-W43" && F.weekKey(NOW + 6 * 86_400_000) === "2026-W43" && F.weekKey(NOW + 7 * 86_400_000) === "2026-W44", "ISO week key");
assert(F.weekKey(Date.parse("2027-01-01T06:00:00Z")) === "2026-W53", "week key across new year");

const day = (i: number, views: number, subs: number) => ({ date: new Date(NOW - (14 - i) * 86_400_000).toISOString().slice(0, 10), views, watchMinutes: views * 3, subscribersGained: subs });
const iso = (hoursAgo: number) => new Date(NOW - hoursAgo * 3_600_000).toISOString();
const vid = (id: string, hoursAgo: number, views: number, likes = views / 20, avgViewPct: number | null = 45) => ({
  id, title: `Video ${id}`, publishedAt: iso(hoursAgo).slice(0, 10), publishedAtIso: iso(hoursAgo), thumbnail: null, durationSec: 600, views, likes, comments: 5, avgViewPct,
});
const summary: Summary = {
  mode: "live",
  channel: { id: "UC1", title: "Rima Vlogs", handle: "@rima", avatar: null, subscribers: 9_400, totalViews: 1e6, videoCount: 40 },
  daily: Array.from({ length: 14 }, (_, i) => (i < 7 ? day(i, 1000, 10) : day(i, 1500, 20))),
  videos: [vid("new", 48, 900), vid("b", 24 * 6, 3000, 150, 22), vid("c", 24 * 12, 1200), vid("d", 24 * 20, 1100), vid("e", 24 * 30, 900)],
};
const wf = F.weeklyFacts(summary, NOW);
assert(wf.views === 10_500 && Math.round(wf.viewsChange!) === 50 && wf.subscribersGained === 140, "week vs previous week");
assert(wf.uploadsThisWeek === 2 && wf.daysSinceUpload === 2, "uploads this week and days since upload");
assert(wf.star?.title === "Video b" && wf.dropOff?.avgViewPct === 22, "best video and early drop-off found");
assert(wf.nextMilestone?.at === 10_000 && wf.nextMilestone.left === 600, "next milestone");
const plain = F.plainWeekly(wf);
assert(plain.wins.length > 0 && plain.fixes.length > 0, "plain report has wins and fixes without AI");
const text = F.weeklyText(wf, plain);
assert(text.includes("▲50%") && text.includes("600 more to 10K"), `report text has stats and milestone`);

assert(runs("Views 50% बढ़े aur").map((r) => r.indic).join() === "false,true,false", "PDF text splits into script runs");
for (const lang of ["en", "hi", "te", "ta", "ml", "bn", "kn"]) {
  const pdf = await weeklyPdf(wf, { ...plain, headline: lang === "te" ? "ప్రేక్షకులు మంచి వారం" : lang === "ml" ? "നമുക്ക് കാഴ്ചകൾ" : plain.headline }, lang);
  assert(pdf.subarray(0, 5).toString() === "%PDF-" && pdf.length > 5000, `weekly PDF renders in ${lang} (${Math.round(pdf.length / 1024)} KB)`);
  assert((pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length === 1, `${lang} PDF is one page`);
}
assert(F.videosDueForCheck(summary.videos, NOW).map((v) => v.id).join() === "new", "only the ~2-day-old video is due");
assert(F.videosDueForCheck([vid("x", 35, 1)], NOW).length === 0 && F.videosDueForCheck([vid("y", 59, 1)], NOW).length === 1, "36-60h window");
assert(F.median([5, 1, 3]) === 3 && F.median([4, 1, 3, 2]) === 2.5 && F.median([]) === null, "median");
const vf = F.videoFacts(summary.videos[0], summary.videos.slice(1), [400, 500, 600, 0], NOW);
assert(vf.usual === 500 && vf.pace === "ahead" && vf.hours === 48, `pace vs usual first two days (${vf.pace})`);
assert(F.videoFacts(vid("s", 48, 200), [], [500], NOW).pace === "slow" && F.videoFacts(vid("n", 48, 200), [], [], NOW).pace === "new", "slow and new channels");
assert(F.paceLine(vf).startsWith("🚀"), "pace line");

// ---- WhatsApp limits ----------------------------------------------------------------------------------
assert(templateParam("a\nb\t c      d") === "a · b ·  c d", "template params have no newlines or long space runs");
assert(splitText("x".repeat(3000) + "\n\n" + "y".repeat(3000), 3800).length === 2, "long text splits at paragraphs");
const list = toPayload("91", menu("hi", false)) as { interactive: { action: { sections: { rows: { title: string; description?: string }[] }[] } } };
assert(list.interactive.action.sections[0].rows.length <= 10, "menu has at most 10 rows");
for (const lang of ["en", "hinglish", "hi"]) {
  const w = t(lang);
  for (const [title, desc] of Object.values(w.rows)) assert(title.length <= 24 && desc.length <= 72, `${lang} menu row fits: ${title}`);
  for (const b of [w.btnFullReport, w.btnMoreTips, w.btnTitles, w.btnMenu, w.btnIdeas, w.btnUpgrade, w.menuButton]) assert(b.length <= 20, `${lang} button fits: ${b}`);
}
for (const l of LANGUAGES) assert((l.native === l.label ? l.label : `${l.native} · ${l.label}`).length <= 24, `language row fits: ${l.label}`);
assert(toWhatsApp("**Bold** idea\n## Plan\n- one") === "*Bold* idea\n*Plan*\n• one", "markdown becomes WhatsApp formatting");

// ---- Webhook ------------------------------------------------------------------------------------------
const raw = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: "919800000001", profile: { name: "Rima" } }], messages: [{ id: "m1", from: "919800000001", timestamp: "1760000000", type: "text", text: { body: "hi" } }], statuses: [{ id: "s", status: "failed", recipient_id: "91", errors: [{ code: 131047, title: "Re-engagement" }] }] } }] }] });
assert(validSignature(raw, `sha256=${hmacHex("test-secret", raw)}`) && !validSignature(raw, "sha256=00") && !validSignature(raw, null), "webhook signature checked");
const parsed = parseWebhook(JSON.parse(raw));
assert(parsed.messages[0].text === "hi" && parsed.messages[0].name === "Rima" && parsed.failures[0].error.includes("131047"), "webhook parsed");

// ---- Delivery, idempotency and the daily run ---------------------------------------------------------
const d = await db();
await d.insert(schema.users).values([
  { id: "wa", email: "wa@x.com", name: "Rima Sharma", language: "hinglish" },
  { id: "mail", email: "mail@x.com", name: "Arun" },
  { id: "off", email: "off@x.com", notifyEmail: false },
]);
for (const id of ["wa", "mail", "off"]) {
  await d.insert(schema.youtubeConnections).values({ userId: id, channelId: `UC-${id}`, accessToken: "x", expiresAt: new Date(NOW + 3_600_000) });
  await cached(id, `UC-${id}:summary`, 3_600_000, async () => summary);
  for (const v of summary.videos.slice(1)) await cached(id, `UC-${id}:early:${v.id}`, 3_600_000, async () => 500);
}
await d.insert(schema.whatsappContacts).values({ userId: "wa", phone: "919800000001", lastInboundAt: new Date(NOW - 48 * 3_600_000) });

const first = await claim("wa", "weekly", "W", NOW);
assert(first != null && (await claim("wa", "weekly", "W", NOW)) === null, "a report can only be claimed once");

outbox().length = 0;
mailOutbox().length = 0;
let r = await runDaily({ now: NOW });
const tpl = outbox().filter((o) => o.out.type === "template");
assert(r.users === 3 && tpl.length === 2, `WhatsApp creator gets 2 templates outside the 24h window (got ${tpl.length})`);
const names = tpl.map((o) => (o.out as Extract<Out, { type: "template" }>).name).sort().join();
assert(names === "mitra_video_check,mitra_weekly_report", "weekly report + video check templates");
const weeklyTpl = tpl.find((o) => (o.out as Extract<Out, { type: "template" }>).name === "mitra_weekly_report")!.out as Extract<Out, { type: "template" }>;
assert(weeklyTpl.params[0] === "Rima" && weeklyTpl.params.length === 5 && weeklyTpl.buttons?.join() === "report,stop", "template variables and quick replies");
assert(mailOutbox().length === 2 && mailOutbox().every((m) => m.to === "mail@x.com"), "creator without WhatsApp gets email");
assert(r.sent === 4, `4 reports sent (got ${r.sent})`);
for (const o of tpl) {
  const out = o.out as Extract<Out, { type: "template" }>;
  for (const def of TEMPLATES.filter((x) => x.name === out.name)) {
    const vars = new Set(def.body.match(/\{\{\d+\}\}/g)).size;
    assert(vars === out.params.length && def.example.length === vars && def.buttons.length === (out.buttons?.length ?? 0), `${def.name} (${def.language}) variables and buttons match the code`);
    assert(def.buttons.every((b) => b.length <= 25), `${def.name} (${def.language}) button texts fit`);
  }
}
r = await runDaily({ now: NOW + 3_600_000 });
assert(r.sent === 0 && outbox().length === 2 && mailOutbox().length === 2, "running again the same day sends nothing twice");
const tuesday = await runDaily({ now: NOW + 86_400_000 });
assert(tuesday.sent === 0, "no weekly report on Tuesday, and the video was already checked");

// ---- Bot ----------------------------------------------------------------------------------------------
const msg = (id: string, from: string, text: string, action: string | null = null) => ({ id, from, name: "Rima", text, action, at: NOW });
const last = () => outbox()[outbox().length - 1];
outbox().length = 0;

await handleInbound(msg("b1", "919800000001", "menu"), NOW);
assert(last().out.type === "list" && last().to === "919800000001", "'menu' shows the menu");
await handleInbound(msg("b1", "919800000001", "menu"), NOW);
assert(outbox().length === 1, "the same WhatsApp message is handled once");
const [c1] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, "wa"));
assert(c1.lastInboundAt?.getTime() === NOW, "a message opens the 24-hour window");

await handleInbound(msg("b2", "919800000001", "Full report", "report"), NOW);
const fullReport = outbox().slice(-2);
assert(fullReport[0].out.type === "buttons" && (fullReport[0].out as { text: string }).text.includes("📊"), "'Full report' sends the saved weekly report");
const doc = fullReport[1].out as Extract<Out, { type: "document" }>;
assert(doc.type === "document" && /\/api\/reports\/pdf\?id=\d+&exp=\d+&sig=[0-9a-f]{32}$/.test(doc.link) && doc.filename === "Mitra-weekly-report-2026-W43.pdf", "…followed by its PDF (signed link)");
const u = new URL(doc.link);
assert(validPdfLink(Number(u.searchParams.get("id")), Number(u.searchParams.get("exp")), u.searchParams.get("sig")!, NOW), "the PDF link verifies");
assert(!validPdfLink(Number(u.searchParams.get("id")) + 1, Number(u.searchParams.get("exp")), u.searchParams.get("sig")!, NOW), "…and can't be reused for another report");
assert(!validPdfLink(Number(u.searchParams.get("id")), Number(u.searchParams.get("exp")), u.searchParams.get("sig")!, NOW + 31 * 86_400_000), "…and expires after 30 days");

// A weekly report saved without its numbers (from before PDFs) is rebuilt, so the PDF still comes.
const [savedRow] = await d.select().from(schema.notifications).where(eq(schema.notifications.id, Number(u.searchParams.get("id"))));
await d.update(schema.notifications).set({ payload: { ...savedRow.payload!, data: undefined } }).where(eq(schema.notifications.id, savedRow.id));
await handleInbound(msg("b2-old", "919800000001", "Full report", "report"), NOW);
const rebuilt = outbox().slice(-2);
assert(rebuilt[1].out.type === "document", "a report saved without PDF data is rebuilt and comes with its PDF");

// Inside the window, reports go out as normal messages, not templates.
await d.delete(schema.notifications).where(eq(schema.notifications.userId, "wa"));
outbox().length = 0;
await runDaily({ now: NOW + 60_000 });
assert(outbox().length > 0 && outbox().every((o) => o.out.type !== "template"), "inside the window: full report, no paid template");

await handleInbound(msg("b3", "919800000001", "Language", "lang"), NOW);
assert(last().out.type === "list", "language menu");
await handleInbound(msg("b4", "919800000001", "हिन्दी", "lang:hi"), NOW);
const [u1] = await d.select().from(schema.users).where(eq(schema.users.id, "wa"));
assert(u1.language === "hi" && (last().out as { text: string }).text === t("hi").menuText, "language changes and the menu follows it");

// Every language the website offers has its own bot words, inside WhatsApp's limits.
assert(LANGUAGES.every((l) => BOT_LANGUAGES.includes(l.code)), "the bot speaks every language the website offers");
for (const l of BOT_LANGUAGES) {
  const w = t(l);
  const buttons = [w.btnFullReport, w.btnMoreTips, w.btnTitles, w.btnMenu, w.btnIdeas, w.btnUpgrade, w.menuButton];
  const rows = Object.values(w.rows);
  assert(buttons.every((b) => b.length <= 20) && rows.every(([title, desc]) => title.length <= 24 && desc.length <= 72) && w.footer.length <= 60, `${l}: buttons ≤20, menu rows ≤24/72, footer ≤60`);
}
assert(t("te").menuText !== t("en").menuText && t("ml").welcome("Anu").includes("Anu") && t("hi").plan("Pro", 3, 100, "").includes("प्लान"), "Telugu and Malayalam have their own words; Hindi no longer borrows Hinglish");
assert(["hi!", "Menu", "మెనూ", "வணக்கம்", "നമസ്കാരം"].every((x) => MENU_WORDS.test(x)), "'menu' and hello work in Indian scripts too");
for (const lang of ["te", "ta", "mr", "bn", "kn", "ml"]) {
  const tpl = TEMPLATES.filter((x) => x.language === lang);
  assert(tpl.length === 2 && tpl.every((x) => x.buttons.every((b) => b.length <= 25) && (x.body.match(/\{\{\d\}\}/g) ?? []).length === x.example.length), `${lang}: both templates, buttons ≤25, examples match variables`);
}
await handleInbound(msg("b4te", "919800000001", "తెలుగు", "lang:te"), NOW);
assert((last().out as { text: string }).text === t("te").menuText && (await languageForPhone("919800000001")) === "te", "a Telugu creator gets the Telugu menu");
assert((await languageForPhone("910000000000")) === "en", "unknown numbers are answered in English");
await handleInbound(msg("b4hi", "919800000001", "हिन्दी", "lang:hi"), NOW);

await handleInbound(msg("b5", "919800000001", "Title ideas", "titles"), NOW);
const [c2] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, "wa"));
assert(c2.state?.awaiting === "titles", "title ideas waits for a topic");
await handleInbound(msg("b6", "919800000001", "street food challenge"), NOW);
const [c3] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, "wa"));
assert(c3.state === null && (last().out as { text: string }).text === t("hi").busy, "the topic is used (AI off here, so a polite busy message)");

await handleInbound(msg("b7", "919800000001", "STOP"), NOW);
const [c4] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, "wa"));
assert(c4.optedOutAt != null, "STOP opts out");
await d.delete(schema.notifications).where(eq(schema.notifications.userId, "wa"));
outbox().length = 0;
mailOutbox().length = 0;
await runDaily({ now: NOW + 120_000 });
assert(outbox().length === 0 && mailOutbox().some((m) => m.to === "wa@x.com"), "opted out of WhatsApp: falls back to email (still on)");
await handleInbound(msg("b8", "919800000001", "start"), NOW);
const [c5] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, "wa"));
assert(c5.optedOutAt === null, "START opts back in");

// Linking with a one-time code.
await d.insert(schema.whatsappLinkCodes).values({ code: "482913", userId: "mail", expiresAt: new Date(NOW + 60_000) });
outbox().length = 0;
await handleInbound(msg("l1", "919811111111", "JOIN 482913"), NOW);
const [linked] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, "mail"));
assert(linked?.phone === "919811111111" && outbox().length === 2 && outbox()[1].out.type === "list", "JOIN code links the number, welcomes and shows the menu");
await handleInbound(msg("l2", "919822222222", "JOIN 482913"), NOW);
assert((last().out as { text: string }).text === t("en").linkExpired, "a used code doesn't work twice");
// Guessing codes: 5 wrong tries an hour, then even a right code is ignored.
await d.insert(schema.whatsappLinkCodes).values({ code: "777777", userId: "off", expiresAt: new Date(NOW + 60_000) });
for (let i = 0; i < 5; i++) await handleInbound(msg(`g${i}`, "919844444444", `JOIN 10000${i}`), NOW);
await handleInbound(msg("g5", "919844444444", "JOIN 777777"), NOW);
const [guessed] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, "off"));
assert(!guessed, "after 5 wrong codes, a number can't link for an hour");
await handleInbound(msg("l3", "919833333333", "hello"), NOW);
assert(last().out.type === "link", "unknown numbers get a link to connect");

console.log("all whatsapp tests passed");
process.exit(0);
