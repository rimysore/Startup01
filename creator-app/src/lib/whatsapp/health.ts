import { desc, like } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * What the WhatsApp webhook last saw, so an admin can tell "Meta never called us" from "the secret is wrong" from
 * "replies are failing" without opening server logs. Kept as a few marker rows in webhook_events; the detail
 * (a Meta error message, never a phone number) is part of the id.
 */
export type HealthKind = "ok" | "badsig" | "fail";

export async function markHealth(kind: HealthKind, detail = ""): Promise<void> {
  try {
    const d = await db();
    await d.delete(schema.webhookEvents).where(like(schema.webhookEvents.id, `wa-health:${kind}|%`));
    await d.insert(schema.webhookEvents).values({ id: `wa-health:${kind}|${detail.replace(/\d{6,}/g, "…").slice(0, 300)}`, receivedAt: new Date() }).onConflictDoNothing();
  } catch (err) {
    console.error("Couldn't record WhatsApp health", err);
  }
}

export async function readHealth(): Promise<Record<HealthKind, { at: string; detail: string } | null>> {
  const rows = await (await db()).select().from(schema.webhookEvents).where(like(schema.webhookEvents.id, "wa-health:%")).orderBy(desc(schema.webhookEvents.receivedAt));
  const get = (k: HealthKind) => {
    const r = rows.find((x) => x.id.startsWith(`wa-health:${k}|`));
    return r ? { at: r.receivedAt.toISOString(), detail: r.id.slice(`wa-health:${k}|`.length) } : null;
  };
  return { ok: get("ok"), badsig: get("badsig"), fail: get("fail") };
}
