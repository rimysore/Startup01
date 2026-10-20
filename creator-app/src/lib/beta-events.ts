import { db, schema } from "@/db";

/** Stores one beta event (see schema.betaEvents). Never throws into the caller's flow if used with .catch(). */
export async function recordEvent(e: { userId?: string | null; anonId?: string | null; name: string; props?: Record<string, unknown>; source?: string | null }): Promise<void> {
  await (await db())
    .insert(schema.betaEvents)
    .values({ userId: e.userId ?? null, anonId: e.anonId ?? null, name: e.name, props: e.props ?? {}, source: e.source ?? null });
}
