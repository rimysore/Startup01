import { z } from "zod";
import { analyseComments } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { prepareComments } from "@/lib/comment-filter";
import { DEMO_COMMENTS } from "@/lib/demo-ai";

const Comment = z.object({ author: z.string().max(100), text: z.string().max(1000), likes: z.number() });

export const POST = aiRoute("comments", { comments: z.array(Comment).min(1).max(60) }, DEMO_COMMENTS, ({ language, comments }) =>
  analyseComments(language, prepareComments(comments)),
);
