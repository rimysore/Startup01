import { aiConfigured } from "@/lib/ai";
import { readTokens } from "@/lib/session";
import { googleConfigured } from "@/lib/youtube";

export async function GET() {
  const connected = Boolean(await readTokens());
  return Response.json({ googleConfigured: googleConfigured(), aiConfigured: aiConfigured(), connected });
}
