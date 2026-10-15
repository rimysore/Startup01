import { z } from "zod";
import { AiRefusal, aiConfigured } from "./ai";
import { currentUser } from "./auth";
import { isLanguageCode } from "./languages";
import { monthKey, refundCredit, reserveCredit } from "./usage";

const Language = z.string().refine(isLanguageCode).catch("hinglish");

export type DemoReason = "signin" | "nokey";

/**
 * Wraps an AI endpoint: validates the JSON body, serves the sample answer to signed-out visitors (and when no
 * API key is configured), charges signed-in users one monthly credit per call, and refunds it if the call fails.
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

    const user = await currentUser();
    if (!user) return Response.json({ demo: true, demoReason: "signin" satisfies DemoReason, result: demo });
    if (!aiConfigured()) return Response.json({ demo: true, demoReason: "nokey" satisfies DemoReason, result: demo });

    const month = monthKey();
    if (!(await reserveCredit(user))) {
      return Response.json(
        { error: "You've used all your AI credits for this month.", upgrade: true },
        { status: 402 },
      );
    }
    try {
      return Response.json({ demo: false, result: await run(parsed.data as z.infer<z.ZodObject<B>> & { language: string }) });
    } catch (err) {
      await refundCredit(user.id, month);
      if (err instanceof AiRefusal) return Response.json({ error: "Mitra couldn't help with that request." }, { status: 422 });
      console.error(err);
      return Response.json({ error: "Mitra is busy right now. Please try again in a moment." }, { status: 502 });
    }
  };
}
