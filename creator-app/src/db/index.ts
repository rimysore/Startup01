import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

/**
 * Production: Postgres via DATABASE_URL. Local development without DATABASE_URL: an embedded
 * Postgres (PGlite) stored in .data/, so the app runs with zero setup. Migrations apply on first use.
 */
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const db = drizzle(postgres(url, { max: 10, prepare: false }), { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return db as unknown as Db;
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_EMBEDDED_DB !== "1") {
    throw new Error("DATABASE_URL is required in production");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite"));
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}

// Survives hot reloads in development, so we don't open a second embedded database on the same files.
const g = globalThis as unknown as { __mitraDb?: Promise<Db> };

export function db(): Promise<Db> {
  g.__mitraDb ??= connect().catch((err) => {
    g.__mitraDb = undefined;
    throw err;
  });
  return g.__mitraDb;
}

export { schema };
