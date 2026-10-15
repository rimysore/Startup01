import { z } from "zod";
import { AiRefusal, aiConfigured } from "./ai";
import { isLanguageCode } from "./languages";

const Language = z.string().refine(isLanguageCode).catch("hinglish");

/**
 * Wraps an AI endpoint: validates the JSON body, serves the demo answer when no API key is configured,
 * and turns failures into a JSON error the UI can show.
 */
export function aiRoute<B extends z.ZodRawShape, R>(
  body: B,
  demo: R,
  run: (input: z.infer<z.ZodObject<B>> & { language: string }) => Promise<R>,
) {
  const schema = z.object({ ...body, language: Language });
  return async (request: Request) => {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
    if (!aiConfigured()) return Response.json({ demo: true, result: demo });
    try {
      return Response.json({ demo: false, result: await run(parsed.data as z.infer<z.ZodObject<B>> & { language: string }) });
    } catch (err) {
      if (err instanceof AiRefusal) return Response.json({ error: "Mitra couldn't help with that request." }, { status: 422 });
      console.error(err);
      return Response.json({ error: "Mitra is busy right now. Please try again in a moment." }, { status: 502 });
    }
  };
}
