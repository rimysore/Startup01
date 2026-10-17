import { z } from "zod";
import { designThumbnail } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_THUMBNAIL } from "@/lib/demo-ai";
import { referenceThumbnails } from "@/lib/reference-thumbnails";

/** Images arrive already shrunk by the browser (≤768px JPEG, ~60-150 KB); this cap stops anything bigger. */
const Image = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().max(400_000).regex(/^[A-Za-z0-9+/]+=*$/),
});

export const POST = aiRoute(
  "thumbnail",
  {
    title: z.string().min(3).max(500),
    text: z.string().max(80),
    images: z.array(Image).max(5),
    references: z.array(z.string().regex(/^[\w-]{11}$/)).max(3).optional(),
  },
  DEMO_THUMBNAIL,
  async ({ language, title, text, images, references = [] }) => designThumbnail(language, title, text, images, await referenceThumbnails(references)),
);
