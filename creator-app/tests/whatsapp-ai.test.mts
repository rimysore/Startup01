// Run with: npm test. The AI parts of reports and the WhatsApp bot, against the local Anthropic stand-in.
import { spawn } from "node:child_process";

process.env.PGLITE_DIR = "memory://";
process.env.WHATSAPP_FAKE = "1";
process.env.NEXT_PUBLIC_WHATSAPP_LIVE = "1"; // these tests cover WhatsApp once it is open to creators
process.env.EMAIL_FAKE = "1";
process.env.ANTHROPIC_API_KEY = "sk-ant-test";
process.env.ANTHROPIC_BASE_URL = "http://127.0.0.1:4010";

const mock = spawn(process.execPath, ["tests/mock-anthropic.mjs"], { stdio: ["ignore", "pipe", "inherit"] });
await new Promise<void>((resolve) => {
  mock.stdout!.once("data", () => resolve());
  mock.once("exit", () => {
    console.error("FAIL the Anthropic stand-in couldn't start (is port 4010 already in use?)");
    process.exit(1);
  });
});
const finish = (code: number) => {
  mock.kill();
  process.exit(code);
};
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); finish(1); } console.log("ok", m); };

const { db, schema } = await import("@/db");
const { eq } = await import("drizzle-orm");
const { cached } = await import("@/lib/memo");
const { outbox } = await import("@/lib/whatsapp/api");
const { runDaily } = await import("@/lib/reports/run");
const { handleInbound } = await import("@/lib/whatsapp/bot");
const { usageThisMonth } = await import("@/lib/usage");
type Out = import("@/lib/whatsapp/api").Out;

const NOW = Date.parse("2026-10-19T03:15:00Z"); // Monday 8:45 IST
const iso = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const summary = {
  mode: "live" as const,
  channel: { id: "UC1", title: "Rima Vlogs", handle: "@rima", avatar: null, subscribers: 9_400, totalViews: 1e6, videoCount: 40 },
  daily: Array.from({ length: 14 }, (_, i) => ({ date: new Date(NOW - (14 - i) * 86_400_000).toISOString().slice(0, 10), views: 1000 + i * 50, watchMinutes: 3000, subscribersGained: 10 })),
  videos: [
    { id: "new", title: "Rs 500 street food", publishedAt: iso(48).slice(0, 10), publishedAtIso: iso(48), thumbnail: null, durationSec: 600, views: 900, likes: 60, comments: 9, avgViewPct: 40 },
    { id: "old", title: "Room tour", publishedAt: iso(240).slice(0, 10), publishedAtIso: iso(240), thumbnail: null, durationSec: 600, views: 3000, likes: 90, comments: 5, avgViewPct: 30 },
  ],
};

const d = await db();
await d.insert(schema.users).values([
  { id: "u", email: "u@x.com", name: "Rima Sharma", language: "hinglish", plan: "free" },
  { id: "f", email: "f@x.com", name: "Arun", founderNumber: 3 },
]);
for (const id of ["u", "f"]) {
  await d.insert(schema.youtubeConnections).values({ userId: id, channelId: `UC-${id}`, accessToken: "x", expiresAt: new Date(NOW + 3_600_000) });
  await cached(id, `UC-${id}:summary`, 3_600_000, async () => summary);
  await cached(id, `UC-${id}:early:old`, 3_600_000, async () => 600);
}
await d.insert(schema.whatsappContacts).values([
  { userId: "u", phone: "919800000001" },
  { userId: "f", phone: "919800000002" },
]);

// Reports: AI words, our numbers. Never charged to the creator.
await runDaily({ now: NOW });
const weekly = outbox().find((o) => o.to === "919800000001" && o.out.type === "template" && o.out.name === "mitra_weekly_report")?.out as Extract<Out, { type: "template" }>;
assert(weekly?.params[3] === "140 naye subscribers aaye." && weekly.params[4] === "Pehle 10 second mein result dikhao.", "weekly template carries the AI's top win and fix");
const check = outbox().find((o) => o.to === "919800000001" && o.out.type === "template" && o.out.name === "mitra_video_check")?.out as Extract<Out, { type: "template" }>;
assert(check?.params[2].startsWith("🚀") && check.params[3] === "Ek comment pin karo.", "video check: our pace line + the AI's first action");
assert((await usageThisMonth("u")).credits === 0, "reports cost the creator nothing");
const calls = await d.select().from(schema.aiCalls).where(eq(schema.aiCalls.userId, "u"));
assert(calls.length === 2 && calls.every((c) => c.feature === "report" && c.model === "claude-haiku-5-5"), "report AI calls logged on the small model");

// Full report button: the saved text, with the AI's words and our numbers.
outbox().length = 0;
await handleInbound({ id: "a1", from: "919800000001", name: null, text: "Full report", action: "report", at: NOW }, NOW);
const full = outbox()[0].out as { text: string };
assert(full.text.includes("Badhiya hafta raha!") && full.text.includes("▲") && full.text.includes("Street food part 2"), "full report = AI words + our stats");

// A question costs one credit; the answer is formatted for WhatsApp.
outbox().length = 0;
await handleInbound({ id: "a2", from: "919800000001", name: null, text: "is hafte kya upload karun?", action: null, at: NOW }, NOW);
assert((outbox()[0].out as { text: string }).text.startsWith("• Is hafte 2 Shorts"), "Ask Mitra answers on WhatsApp");
assert((await usageThisMonth("u")).credits === 1, "a question uses 1 credit");

// Titles for a video from the check's button.
outbox().length = 0;
await handleInbound({ id: "a3", from: "919800000001", name: null, text: "New title ideas", action: "titles:new", at: NOW }, NOW);
const titles = (outbox()[0].out as { text: string }).text;
assert(titles.includes("Rs 500 street food") && titles.includes("1. Raat me test kiya") && titles.includes("🎙️"), "titles for the video, with thumbnail text and hook");
assert((await usageThisMonth("u")).credits === 2, "titles use 1 credit");

// A reply that hits max_tokens (Haiku thinks first) is still delivered, not turned into "busy".
await fetch("http://127.0.0.1:4010/__mode", { method: "POST", body: JSON.stringify({ mode: "max_tokens" }) });
outbox().length = 0;
await handleInbound({ id: "a2b", from: "919800000001", name: null, text: "ek lamba sawaal", action: null, at: NOW }, NOW);
await fetch("http://127.0.0.1:4010/__mode", { method: "POST", body: JSON.stringify({ mode: "ok" }) });
assert((outbox()[0].out as { text: string }).text.startsWith("• Is hafte 2 Shorts"), "a long Ask Mitra answer is still delivered");

// Founders: the same request comes from the Founder Pass.
await handleInbound({ id: "a4", from: "919800000002", name: null, text: "next video kya banau?", action: null, at: NOW }, NOW);
const fu = await usageThisMonth("f");
assert(fu.credits === 0 && fu.founderUses === 1, "founders' questions use the Founder Pass, not credits");

// Out of credits: a link to plans, and nothing charged.
await d.update(schema.usage).set({ credits: 10 }).where(eq(schema.usage.userId, "u"));
outbox().length = 0;
await handleInbound({ id: "a5", from: "919800000001", name: null, text: "ek aur sawaal", action: null, at: NOW }, NOW);
assert(outbox()[0].out.type === "link" && (await usageThisMonth("u")).credits === 10, "out of credits: upgrade link, nothing charged");

console.log("all whatsapp AI tests passed");
finish(0);
