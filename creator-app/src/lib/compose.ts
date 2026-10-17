/**
 * Pro thumbnails: Google's Nano Banana 2.1 (gemini-nano-banana-2.1) takes the creator's own photos and paints a
 * new 16:9 scene with them in it, relit and posed, the look of top Indian and global YouTube thumbnails. The
 * headline is not baked in: our canvas draws it (crisp, editable, every Indian script).
 * Paid Gemini API only (no free tier): $0.0504 per 2K image (2752×1536) plus ~$1.50 per million input tokens.
 * https://ai.google.dev/gemini-api/docs/image-generation · https://ai.google.dev/gemini-api/docs/pricing
 */
import type { InputImage, ThumbnailDesign } from "./ai";

export const COMPOSE_MODEL = "gemini-nano-banana-2.1";
/** GEMINI_BASE_URL only for local tests with a stand-in server. */
const endpoint = () => `${process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com"}/v1beta/interactions`;
/** USD per million tokens (October 2026). Output images are billed as tokens: a 2K image is 1,680. */
const PRICE = { input: 1.5, outputImage: 30, outputText: 7.5 };

export function composeConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export class UnsafeCompose extends Error {}

/**
 * The image instructions, built from Mitra's plan. The creator's photos come first in the request, then any extra
 * photos (place, product). We ask for no writing at all: image models still garble Indian scripts.
 */
export function composePrompt(d: ThumbnailDesign & { look: string }, faces: number, extras: number): string {
  const personSide = d.layout === "subject-left" ? "left" : "right";
  const textSide = personSide === "left" ? "right" : "left";
  return [
    `Create a scroll-stopping YouTube thumbnail photograph, 16:9, in the polished style of top Indian YouTube channels.`,
    `The person is the one in the first ${faces > 1 ? `${faces} photos (the same person)` : "photo"}: keep their face, identity, skin tone, hair and build exactly the same, photorealistic, no beautifying or changing who they are.`,
    `Show them large, from the chest up, on the ${personSide} side of the frame, ${d.look || "with a strong, clear expression"}, looking at the camera.`,
    extras ? `Use the other ${extras === 1 ? "photo" : `${extras} photos`} as real elements of the scene (the place, product or food shown in them).` : "",
    `Scene: ${d.imagePrompt}.`,
    `Lighting and colour: dramatic and cinematic, strong rim light separating the person from the background, rich saturated colours with ${d.palette.glow} and ${d.palette.bgTo} tones, high contrast, very sharp detail, professional colour grading.`,
    `Keep the ${textSide} 45% of the frame free of faces and important objects, a little darker and simpler, because big headline text will be added there later.`,
    `Absolutely no text, letters, numbers, captions, logos, watermarks or signs anywhere in the image.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export interface Composed {
  data: string;
  mimeType: string;
  costUsd: number;
}

export async function composeThumbnail(prompt: string, photos: InputImage[]): Promise<Composed> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: COMPOSE_MODEL,
      input: [{ type: "text", text: prompt }, ...photos.map((p) => ({ type: "image", mime_type: p.mediaType, data: p.data }))],
      response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "16:9", image_size: "2K" },
      // Don't keep the creator's photos on Google's side after answering.
      store: false,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const text = await res.text();
  if (!res.ok) {
    if (/safety|blocked|prohibited|policy/i.test(text)) throw new UnsafeCompose(text.slice(0, 200));
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }
  type Content = { type: string; data?: string; mime_type?: string; text?: string };
  type Res = {
    steps?: { type: string; content?: Content[] }[];
    usage?: { total_input_tokens?: number; total_output_tokens?: number; total_thought_tokens?: number };
  };
  const out = JSON.parse(text) as Res;
  const image = (out.steps ?? [])
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .findLast((c) => c.type === "image" && c.data);
  if (!image?.data) {
    const said = (out.steps ?? []).flatMap((s) => s.content ?? []).find((c) => c.type === "text")?.text ?? "";
    // The model explains in words when it won't draw something.
    if (said) throw new UnsafeCompose(said.slice(0, 200));
    throw new Error("Gemini returned no image");
  }
  const u = out.usage ?? {};
  const costUsd = ((u.total_input_tokens ?? 0) * PRICE.input + (u.total_output_tokens ?? 1680) * PRICE.outputImage + (u.total_thought_tokens ?? 0) * PRICE.outputText) / 1e6;
  return { data: image.data, mimeType: image.mime_type ?? "image/jpeg", costUsd };
}
