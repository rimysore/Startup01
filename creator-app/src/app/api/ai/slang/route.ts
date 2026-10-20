import { z } from "zod";
import { analyseSlang } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_SLANG } from "@/lib/demo-ai";

export const POST = aiRoute(
  "slang",
  {
    audience: z.string().max(600),
    trending: z.array(z.string().max(200)).max(40),
    comments: z.array(z.string().max(300)).max(60),
  },
  DEMO_SLANG,
  ({ language, audience, trending, comments }) =>
    analyseSlang(
      language,
      audience,
      [`Trending video titles in their language:`, ...trending.map((t) => `- ${t}`), "", "Comments viewers wrote on this channel:", ...(comments.length ? comments.map((c) => `- ${c}`) : ["- (none yet)"])].join("\n"),
    ),
);
