import { z } from "zod";
import { designThumbnail, type InputImage } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_THUMBNAIL } from "@/lib/demo-ai";

/** Images arrive already shrunk by the browser (≤768px JPEG, ~60-150 KB); this cap stops anything bigger. */
const Image = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().max(400_000).regex(/^[A-Za-z0-9+/]+=*$/),
});

/**
 * Small public thumbnails (320×180) of viral videos on the same topic, as style references for the AI. Fetched
 * fresh for this one request and never stored. Missing ones are skipped.
 */
async function referenceThumbnails(ids: string[]): Promise<InputImage[]> {
  const out = await Promise.all(
    ids.map(async (id): Promise<InputImage | null> => {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (!res?.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length > 1000 && buf.length < 200_000 ? { mediaType: "image/jpeg", data: buf.toString("base64") } : null;
    }),
  );
  return out.filter((x): x is InputImage => x != null);
}

export const POST = aiRoute(
  "thumbnail",
  {
    title: z.string().min(3).max(500),
    text: z.string().max(80),
    images: z.array(Image).max(3),
    references: z.array(z.string().regex(/^[\w-]{11}$/)).max(3).optional(),
  },
  DEMO_THUMBNAIL,
  async ({ language, title, text, images, references = [] }) => designThumbnail(language, title, text, images, await referenceThumbnails(references)),
);
