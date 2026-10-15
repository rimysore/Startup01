import { z } from "zod";
import { chat } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_CHAT_REPLY } from "@/lib/demo-ai";

const Message = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) });

export const POST = aiRoute(
  { context: z.string().max(8000), messages: z.array(Message).min(1).max(40) },
  DEMO_CHAT_REPLY,
  ({ language, context, messages }) => chat(language, context, messages),
);
