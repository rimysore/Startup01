import { connection } from "next/server";
import { foundingSpotsLeft } from "@/lib/founders";
import { FOUNDING_SPOTS } from "@/lib/plans";

/** Public: how many founding-creator spots are left (a real count, shown on the landing page). */
export async function GET() {
  await connection();
  try {
    return Response.json({ left: await foundingSpotsLeft(), total: FOUNDING_SPOTS });
  } catch (err) {
    console.error(err);
    return Response.json({ left: null, total: FOUNDING_SPOTS });
  }
}
