import { eq } from "drizzle-orm";
import { after } from "next/server";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";
import { COMPANY } from "@/lib/company";
import { emailConfigured, sendMail } from "@/lib/email";
import { answerLabel, InterviewBody, QUESTION_IDS } from "@/lib/interview";

/** The signed-in creator's interview answers, if they gave any. */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  const [row] = await (await db()).select().from(schema.creatorInterviews).where(eq(schema.creatorInterviews.userId, user.id));
  return Response.json({ answers: row?.answers ?? null });
}

/** Saves (or replaces) the creator's answers and tells the founders, so a "yes, call me" gets a quick reply. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  const parsed = InterviewBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please check your answers and try again." }, { status: 400 });
  const answers = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length))) as Record<string, string | string[]>;
  if (!Object.keys(answers).length) return Response.json({ error: "Answer at least one question." }, { status: 400 });
  const now = new Date();
  await (await db())
    .insert(schema.creatorInterviews)
    .values({ userId: user.id, answers, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: schema.creatorInterviews.userId, set: { answers, updatedAt: now } });

  if (emailConfigured()) {
    after(async () => {
      const lines = QUESTION_IDS.filter((id) => answers[id] != null).map((id) => {
        const v = answers[id];
        return `${id}: ${(Array.isArray(v) ? v : [v]).map((x) => answerLabel(id, x)).join(", ")}`;
      });
      if (answers.other) lines.push(`other: ${answers.other}`);
      if (answers.phone) lines.push(`phone: ${answers.phone}`);
      await sendMail({
        to: COMPANY.supportEmail,
        subject: `${answers.call === "yes" ? "Call me: " : ""}creator interview from ${user.name ?? user.email}`,
        text: `${user.name ?? ""} <${user.email}> answered the Mitra interview.\n\n${lines.join("\n")}`,
        replyTo: user.email,
        internal: true,
      }).catch((err) => console.error("Interview email failed", err));
    });
  }
  return Response.json({ ok: true });
}
