// Applies database migrations to DATABASE_URL. Runs in the production build (see vercel.json) so serverless
// cold starts never race to migrate. Safe to run repeatedly.
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL not set; skipping migrations (local builds use the embedded database).");
  process.exit(0);
}
// Prefer a direct (non-pooled) URL for DDL when the provider offers one.
const sql = postgres(process.env.DATABASE_URL_UNPOOLED ?? url, { max: 1, prepare: false, onnotice: () => {} });
await migrate(drizzle(sql), { migrationsFolder: path.join(process.cwd(), "drizzle") });
await sql.end();
console.log("Database migrations applied.");
