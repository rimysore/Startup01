/**
 * Background images for thumbnails. Two providers, first one set up wins:
 *   1. Cloudflare Workers AI (CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_TOKEN):
 *      - FLUX.2 [klein] 4B at full HD (1920×1088): about 310 "neurons" an image, so ~30 a day fit in the free
 *        10,000-neuron daily allowance; past that ~$0.0034 (₹0.30) each on the $5/month Workers paid plan.
 *      - falls back to FLUX.1 [schnell] (1024×1024, ~58 neurons) if klein fails.
 *      https://developers.cloudflare.com/workers-ai/platform/pricing/
 *   2. fal.ai (FAL_KEY): FLUX.1 [schnell], about $0.003 each. https://fal.ai/models/fal-ai/flux-1/schnell
 * Text is never baked into the image; the canvas draws it so Indian scripts render correctly.
 */
export const IMAGE_MODEL = "flux-2-klein-4b";

type Provider = "cloudflare" | "fal";

export function imageProvider(): Provider | null {
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_AI_TOKEN) return "cloudflare";
  if (process.env.FAL_KEY) return "fal";
  return null;
}

export function imageGenerationConfigured(): boolean {
  return imageProvider() != null;
}

/** USD per image, for the cost log. Cloudflare's free daily allowance makes most images cost us nothing. */
export function imageCostUsd(): number {
  return imageProvider() === "fal" ? 0.003 : 0.0034;
}

export class UnsafeImage extends Error {}

const STYLE = "YouTube thumbnail background, vivid colours, high contrast, cinematic lighting, sharp detail, empty space for big text. No text, no letters, no logos, no watermark.";

export interface GeneratedImage {
  body: BodyInit;
  contentType: string;
  seed: number;
}

export async function generateBackground(prompt: string, seed = Math.floor(Math.random() * 2 ** 31)): Promise<GeneratedImage> {
  const full = `${prompt}. ${STYLE}`;
  if (imageProvider() !== "cloudflare") return fal(full, seed);
  try {
    return await cloudflareHD(full, seed);
  } catch (err) {
    if (err instanceof UnsafeImage) throw err;
    console.error("Full-HD image failed, falling back to FLUX.1 schnell:", err instanceof Error ? err.message : err);
    return cloudflare(full, seed);
  }
}

const cfUrl = (model: string) => `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/${model}`;

async function cfResult(res: Response, seed: number): Promise<GeneratedImage> {
  const text = await res.text();
  if (!res.ok) {
    // Cloudflare refuses unsafe prompts with an error rather than a flag.
    if (/nsfw|safety|flagged/i.test(text)) throw new UnsafeImage("Prompt refused by the safety filter");
    throw new Error(`Cloudflare AI ${res.status}: ${text.slice(0, 300)}`);
  }
  const out = JSON.parse(text) as { result?: { image?: string }; success?: boolean };
  const b64 = out.result?.image;
  if (!b64) throw new Error("Cloudflare AI returned no image");
  return { body: new Uint8Array(Buffer.from(b64, "base64")), contentType: "image/jpeg", seed };
}

/** FLUX.2 [klein] 4B, 16:9 at full HD. This model takes multipart form data, not JSON. */
async function cloudflareHD(prompt: string, seed: number): Promise<GeneratedImage> {
  const form = new FormData();
  form.set("prompt", prompt.slice(0, 2048));
  form.set("width", "1920");
  form.set("height", "1088"); // dimensions must be multiples of 16; the canvas crops to 1080
  form.set("seed", String(seed));
  const res = await fetch(cfUrl("flux-2-klein-4b"), {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_AI_TOKEN}` },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  return cfResult(res, seed);
}

async function cloudflare(prompt: string, seed: number): Promise<GeneratedImage> {
  const res = await fetch(cfUrl("flux-1-schnell"), {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_AI_TOKEN}`, "Content-Type": "application/json" },
    // 4 steps is schnell's sweet spot: quality close to 8 at half the cost. Cloudflare's schema rejects any other
    // field (a "seed" is a 400), and each call already gives a different image.
    body: JSON.stringify({ prompt: prompt.slice(0, 2048), steps: 4 }),
    signal: AbortSignal.timeout(45_000),
  });
  return cfResult(res, seed);
}

async function fal(prompt: string, seed: number): Promise<GeneratedImage> {
  const res = await fetch("https://fal.run/fal-ai/flux-1/schnell", {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
      output_format: "jpeg",
      seed,
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const out = (await res.json()) as { images?: { url: string; content_type?: string }[]; has_nsfw_concepts?: boolean[]; seed: number };
  if (out.has_nsfw_concepts?.[0]) throw new UnsafeImage("Image flagged by the safety checker");
  const url = out.images?.[0]?.url;
  if (!url) throw new Error("fal returned no image");
  const img = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!img.ok || !img.body) throw new Error(`Couldn't download the generated image: ${img.status}`);
  return { body: img.body, contentType: out.images![0].content_type ?? "image/jpeg", seed: out.seed };
}
