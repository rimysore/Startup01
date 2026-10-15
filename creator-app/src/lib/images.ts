/**
 * Background images for thumbnails from FLUX.1 [schnell] on fal.ai: about $0.003 per image, 2-4 seconds.
 * Text is never baked into the image; the canvas draws it so Indian scripts render correctly.
 * https://fal.ai/models/fal-ai/flux-1/schnell
 */
export const IMAGE_MODEL = "flux-1-schnell";
/** USD per generated 1024x576 image (fal bills $0.003 per megapixel, rounded up). */
export const IMAGE_COST_USD = 0.003;

export function imageGenerationConfigured(): boolean {
  return Boolean(process.env.FAL_KEY);
}

export class UnsafeImage extends Error {}

export async function generateBackground(prompt: string, seed?: number): Promise<{ body: ReadableStream<Uint8Array>; contentType: string; seed: number }> {
  const res = await fetch("https://fal.run/fal-ai/flux-1/schnell", {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `${prompt}. YouTube thumbnail background, vivid colours, high contrast, cinematic lighting, sharp detail. No text, no letters, no logos, no watermark.`,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
      output_format: "jpeg",
      ...(seed !== undefined ? { seed } : {}),
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
