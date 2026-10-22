import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";

/*
 * Open programs on the creator's home: real brand, affiliate and platform programmes creators can join today, plus
 * local businesses the founders sign up (with the owner's permission). Founders keep the list in the admin.
 */

export type Program = typeof schema.programs.$inferSelect;
export const PROGRAM_KINDS = ["local", "brand", "affiliate", "platform"] as const;

const optText = (max: number) => z.union([z.string().trim().max(max), z.null()]).optional().transform((v) => (v ? v : null));

export const ProgramInput = z.object({
  kind: z.enum(PROGRAM_KINDS),
  name: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(10).max(400),
  eligibility: optText(200),
  area: optText(80),
  link: z
    .union([z.string().trim().max(500).refine((u) => /^https:\/\/[^\s]+$/i.test(u), "Use a link starting with https://"), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(["published", "hidden"]).default("published"),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(100),
});

/** Published programs, local ones first, with whether this creator said they're interested. */
export async function programsFor(userId: string): Promise<(Program & { interested: boolean })[]> {
  const d = await db();
  const [rows, mine] = await Promise.all([
    d.select().from(schema.programs).where(eq(schema.programs.status, "published")).orderBy(asc(schema.programs.sortOrder), asc(schema.programs.name)),
    d.select({ id: schema.programInterests.programId }).from(schema.programInterests).where(eq(schema.programInterests.userId, userId)),
  ]);
  const set = new Set(mine.map((m) => m.id));
  return rows.map((r) => ({ ...r, interested: set.has(r.id) }));
}

export async function setProgramInterest(userId: string, programId: string, interested: boolean): Promise<boolean> {
  const d = await db();
  const [p] = await d.select({ id: schema.programs.id }).from(schema.programs).where(and(eq(schema.programs.id, programId), eq(schema.programs.status, "published")));
  if (!p) return false;
  if (interested) await d.insert(schema.programInterests).values({ userId, programId }).onConflictDoNothing();
  else await d.delete(schema.programInterests).where(and(eq(schema.programInterests.userId, userId), eq(schema.programInterests.programId, programId)));
  return true;
}

/** Admin: every program with how many creators are interested. */
export async function adminPrograms(): Promise<(Program & { interested: number })[]> {
  const d = await db();
  const [rows, counts] = await Promise.all([
    d.select().from(schema.programs).orderBy(asc(schema.programs.sortOrder), asc(schema.programs.name)),
    d.select({ id: schema.programInterests.programId, n: sql<number>`count(*)::int` }).from(schema.programInterests).groupBy(schema.programInterests.programId),
  ]);
  const by = new Map(counts.map((c) => [c.id, c.n]));
  return rows.map((r) => ({ ...r, interested: by.get(r.id) ?? 0 }));
}

export async function createProgram(input: z.input<typeof ProgramInput>): Promise<Program> {
  const p = ProgramInput.parse(input);
  const [row] = await (await db()).insert(schema.programs).values({ id: crypto.randomUUID(), ...p }).returning();
  return row;
}

export async function updateProgram(id: string, input: z.input<typeof ProgramInput>): Promise<boolean> {
  const p = ProgramInput.parse(input);
  const rows = await (await db()).update(schema.programs).set({ ...p, updatedAt: new Date() }).where(eq(schema.programs.id, id)).returning({ id: schema.programs.id });
  return rows.length > 0;
}

export async function deleteProgram(id: string): Promise<boolean> {
  const rows = await (await db()).delete(schema.programs).where(eq(schema.programs.id, id)).returning({ id: schema.programs.id });
  return rows.length > 0;
}
