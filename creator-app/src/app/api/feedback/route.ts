import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { COMPANY } from "@/lib/company";
import { emailConfigured, sendMail } from "@/lib/email";
import { planOf } from "@/lib/plans";
import { youtubeConnection } from "@/lib/youtube";

const Body = z.object({
  kind: z.enum(["bug", "idea", "question"]),
  message: z.string().trim().min(3).max(4000),
  page: z.string().max(200).optional(),
});

const KIND = { bug: "Problem", idea: "Idea", question: "Question" } as const;

/** Per instance; enough to stop a stuck button or a script from flooding the support inbox. */
const PER_HOUR = 6;
const recent = new Map<string, number[]>();
function tooMany(userId: string): boolean {
  const now = Date.now();
  const times = (recent.get(userId) ?? []).filter((t) => now - t < 3_600_000);
  recent.set(userId, [...times, now]);
  return times.length >= PER_HOUR;
}

/**
 * "Help & feedback" from inside the app: goes to the support inbox with what we need to help (account, plan,
 * channel, page, browser), and replies go straight back to the creator.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Write a few words about it first." }, { status: 400 });
  if (!emailConfigured()) return Response.json({ error: "unavailable", email: COMPANY.supportEmail }, { status: 503 });
  if (tooMany(user.id)) return Response.json({ error: "Thanks! We've got your messages. Give us a little time to reply." }, { status: 429 });

  const { kind, message, page } = parsed.data;
  const yt = await youtubeConnection(user.id).catch(() => null);
  const agent = (request.headers.get("user-agent") ?? "").slice(0, 200);
  const details = [
    `*From:* ${user.name ?? "—"} <${user.email}>`,
    `*Account:* ${user.id} · ${planOf(user.plan).name} plan · language ${user.language}`,
    `*Channel:* ${yt?.channelTitle ?? "not connected"}${yt?.needsReconnectAt ? " (needs reconnect)" : ""}`,
    `*Page:* ${page ?? "—"}`,
    `*Browser:* ${agent || "—"}`,
    `*Sent:* ${new Date().toISOString()}`,
  ].join("\n");
  try {
    await sendMail({
      to: COMPANY.supportEmail,
      replyTo: user.email,
      internal: true,
      subject: `[Mitra ${KIND[kind].toLowerCase()}] ${message.split("\n")[0].slice(0, 60)}`,
      text: `*${KIND[kind]}*\n\n${message}\n\n${details}`,
    });
  } catch (err) {
    console.error("Feedback email failed", err);
    return Response.json({ error: "unavailable", email: COMPANY.supportEmail }, { status: 503 });
  }
  return Response.json({ ok: true });
}
