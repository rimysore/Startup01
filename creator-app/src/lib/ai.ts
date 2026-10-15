import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { languageLabel } from "./languages";

const MODEL = "claude-opus-5-5";

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export class AiRefusal extends Error {}

function system(language: string): string {
  return [
    "You are Mitra, a sharp, warm growth manager for YouTube creators in India and other non-English markets.",
    "You give specific, practical advice grounded in the data you are shown. Never invent numbers that aren't in the data.",
    `Write every piece of user-facing text in ${languageLabel(language)}.`,
    language === "hinglish"
      ? "Hinglish means Hindi and English mixed the way creators actually talk, written in Roman script."
      : "Keep common English tech and YouTube terms (CTR, thumbnail, Shorts) as creators normally say them.",
  ].join(" ");
}

async function structured<S extends z.ZodType>(schema: S, language: string, prompt: string): Promise<z.infer<S>> {
  const res = await anthropic().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
    system: system(language),
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new AiRefusal("The model declined this request");
  if (!res.parsed_output) throw new Error(`No structured output (stop_reason: ${res.stop_reason})`);
  return res.parsed_output;
}

// ---- Video Doctor ----------------------------------------------------------

export const DoctorSchema = z.object({
  score: z.number().describe("0-100 health score for this video versus the channel's own norm"),
  verdict: z.string().describe("One punchy sentence summarising why it performed the way it did"),
  whatWorked: z.array(z.string()),
  whatHurt: z.array(z.object({ at: z.string().describe("Timestamp like 0:42"), issue: z.string(), fix: z.string() })),
  nextVideo: z.array(z.string()).describe("Three concrete changes to make in the next upload"),
  titleIdeas: z.array(z.string()).describe("Three alternative titles for this same video"),
});
export type Doctor = z.infer<typeof DoctorSchema>;

export function diagnoseVideo(language: string, context: string): Promise<Doctor> {
  return structured(
    DoctorSchema,
    language,
    `Diagnose this video's performance. Explain retention drops by their timestamps and suggest fixes.\n\n${context}`,
  );
}

// ---- Title & thumbnail studio ---------------------------------------------

export const TitlesSchema = z.object({
  titles: z.array(z.object({ title: z.string(), why: z.string(), strength: z.number().describe("1-10 expected click strength") })),
  thumbnailText: z.array(z.string()).describe("Four options of 2-4 word thumbnail text, in the target language's own script"),
  hook: z.string().describe("A spoken script for the first 15 seconds"),
});
export type Titles = z.infer<typeof TitlesSchema>;

export function generateTitles(language: string, topic: string, tone: string, channel: string): Promise<Titles> {
  return structured(
    TitlesSchema,
    language,
    `Channel: ${channel}\nVideo topic: ${topic}\nTone: ${tone}\n\nWrite five title options (under 70 characters each), thumbnail text options and a 15-second opening hook.`,
  );
}

// ---- Comment insights -------------------------------------------------------

export const CommentsSchema = z.object({
  mood: z.object({ positive: z.number(), neutral: z.number(), negative: z.number() }).describe("Percentages summing to 100"),
  themes: z.array(z.object({ theme: z.string(), share: z.number().describe("Percent of comments"), example: z.string() })),
  questions: z.array(z.string()).describe("Questions viewers are asking that deserve an answer"),
  videoIdeas: z.array(z.string()),
  replies: z.array(z.object({ to: z.string(), reply: z.string() })).describe("Three reply drafts to pin-worthy comments"),
});
export type CommentInsights = z.infer<typeof CommentsSchema>;

export function analyseComments(language: string, comments: string): Promise<CommentInsights> {
  return structured(
    CommentsSchema,
    language,
    `Here are viewer comments (author: text [likes]). Comments may mix scripts and languages. Summarise them.\n\n${comments}`,
  );
}

// ---- Assistant chat ----------------------------------------------------------

export async function chat(
  language: string,
  channelContext: string,
  messages: Anthropic.Beta.BetaMessageParam[],
): Promise<string> {
  const res = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: `${system(language)} Be concise: short paragraphs and bullet points, like a WhatsApp message from a trusted manager.\n\nChannel data:\n${channelContext}`,
    messages,
  });
  if (res.stop_reason === "refusal") throw new AiRefusal("The model declined this request");
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
}
