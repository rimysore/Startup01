import { z } from "zod";
import { chat } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { assistantContext } from "@/lib/assistant-context";
import { DEMO_CHAT_REPLY } from "@/lib/demo-ai";

const Message = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) });

/** Keeps the most recent messages that fit the budget, starting on a user turn. Older turns cost tokens on every reply. */
function recent(messages: z.infer<typeof Message>[], maxChars = 8000, maxTurns = 12) {
  const kept: typeof messages = [];
  let chars = 0;
  for (const m of [...messages].reverse()) {
    if (kept.length >= maxTurns || chars + m.content.length > maxChars) break;
    kept.unshift(m);
    chars += m.content.length;
  }
  while (kept.length && kept[0].role !== "user") kept.shift();
  return kept;
}

export const POST = aiRoute(
  "chat",
  // The creator's data is gathered here on the server (channel, reports, competitors, plan), not sent by the page.
  { page: z.string().max(60).optional(), messages: z.array(Message).min(1).max(40) },
  DEMO_CHAT_REPLY,
  async ({ language, page, messages }, user) => {
    const turns = recent(messages);
    if (!turns.length) throw new Error("No user message to answer");
    return chat(language, await assistantContext(user, page), turns);
  },
);
