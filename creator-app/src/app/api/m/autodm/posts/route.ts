import { connection } from "next/server";
import { recentPosts } from "@/lib/marketplace/autodm";
import { guard } from "@/lib/marketplace/http";

/** The creator's recent Instagram posts, to choose which one an Auto-DM watches. */
export async function GET() {
  // Per request, never prerendered: the answer depends on who is signed in.
  await connection();
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  try {
    const posts = await recentPosts(g.user.id);
    if (!posts) return Response.json({ error: "Connect Instagram again.", connect: true }, { status: 409 });
    return Response.json({ posts }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Instagram posts failed", err);
    return Response.json({ error: "Instagram didn't answer." }, { status: 502 });
  }
}
