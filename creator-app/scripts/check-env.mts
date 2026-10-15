// Checks production settings before a deploy. Prints which settings are set and well-formed, never their values.
// Usage: npm run check:env            (format checks only)
//        npm run check:env -- --live  (also tries the database, Anthropic, Google and Razorpay)
const live = process.argv.includes("--live");
const env = process.env;
let failed = 0;
const line = (ok: boolean | "warn", name: string, note = "") => {
  if (ok === false) failed++;
  console.log(`${ok === "warn" ? "!" : ok ? "✓" : "✗"} ${name}${note ? ` — ${note}` : ""}`);
};
const has = (k: string) => Boolean(env[k]?.trim());

console.log("Required");
line(has("DATABASE_URL") && /^postgres(ql)?:\/\//.test(env.DATABASE_URL!), "DATABASE_URL", "postgres:// connection string");
line((env.SESSION_SECRET ?? "").length >= 32, "SESSION_SECRET", "at least 32 characters (openssl rand -base64 48)");
line(!has("APP_URL") ? "warn" : /^https:\/\/[^/]+$/.test(env.APP_URL!), "APP_URL", has("APP_URL") ? "https://your-domain, no trailing slash" : "not set: using the address visitors arrive on (fine on Vercel)");
line(/^[^@\s]+@[^@\s]+\.[a-z]+$/i.test(env.NEXT_PUBLIC_CONTACT_EMAIL ?? ""), "NEXT_PUBLIC_CONTACT_EMAIL", "inbox shown on the legal pages");
line(/\.apps\.googleusercontent\.com$/.test(env.GOOGLE_CLIENT_ID ?? ""), "GOOGLE_CLIENT_ID", "ends with .apps.googleusercontent.com");
line(has("GOOGLE_CLIENT_SECRET"), "GOOGLE_CLIENT_SECRET");
line((env.ANTHROPIC_API_KEY ?? "").startsWith("sk-ant-"), "ANTHROPIC_API_KEY", "starts with sk-ant-");
line(Number(env.AI_DAILY_BUDGET_USD) > 0, "AI_DAILY_BUDGET_USD", "daily AI spend cap in USD");

console.log("\nPayments (needed before charging users)");
const rzp = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_PLAN_PRO", "RAZORPAY_PLAN_CREATOR", "RAZORPAY_WEBHOOK_SECRET"];
for (const k of rzp) line(has(k) || "warn", k, has(k) ? "" : "not set: upgrades are disabled");
if (env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")) line("warn", "RAZORPAY_KEY_ID", "test-mode key: no real money is charged");

console.log("\nMust be off in production");
for (const k of ["ALLOW_DEV_LOGIN", "ALLOW_BILLING_SIMULATION", "ALLOW_EMBEDDED_DB"]) line(!has(k), k, has(k) ? "remove it" : "off");
line(has("ADMIN_EMAILS") || "warn", "ADMIN_EMAILS", has("ADMIN_EMAILS") ? "" : "not set: nobody can read /api/admin/costs");

if (live) {
  console.log("\nLive checks");
  const tryIt = async (name: string, fn: () => Promise<string | void>) => {
    try {
      line(true, name, (await fn()) ?? "");
    } catch (err) {
      line(false, name, err instanceof Error ? err.message.slice(0, 160) : String(err));
    }
  };
  if (has("DATABASE_URL")) {
    await tryIt("Database reachable", async () => {
      const { default: postgres } = await import("postgres");
      const sql = postgres(env.DATABASE_URL!, { max: 1, prepare: false });
      const [r] = await sql`select count(*)::int as n from information_schema.tables where table_name = 'users'`;
      await sql.end();
      return r.n ? "tables present" : "connected, but run npm run db:migrate";
    });
  }
  if (has("ANTHROPIC_API_KEY")) {
    await tryIt("Anthropic key accepted", async () => {
      const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
        headers: { "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    });
  }
  if (has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET")) {
    await tryIt("Google client accepted", async () => {
      // A bogus code: Google answers invalid_grant for a valid client, invalid_client for a wrong id/secret.
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!, code: "x", grant_type: "authorization_code", redirect_uri: `${env.APP_URL}/api/auth/google/callback` }),
      });
      const body = await res.text();
      if (/invalid_client|unauthorized_client/.test(body)) throw new Error("client id or secret is wrong");
    });
  }
  if (has("RAZORPAY_KEY_ID") && has("RAZORPAY_KEY_SECRET")) {
    await tryIt("Razorpay keys and plans", async () => {
      const auth = `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
      for (const k of ["RAZORPAY_PLAN_PRO", "RAZORPAY_PLAN_CREATOR"]) {
        if (!has(k)) continue;
        const res = await fetch(`https://api.razorpay.com/v1/plans/${env[k]}`, { headers: { Authorization: auth } });
        if (!res.ok) throw new Error(`${k}: HTTP ${res.status}`);
        const plan = (await res.json()) as { item: { amount: number } };
        const want = k === "RAZORPAY_PLAN_PRO" ? 39_900 : 99_900;
        if (plan.item.amount !== want) throw new Error(`${k} charges ${plan.item.amount / 100} INR, expected ${want / 100}`);
      }
    });
  }
}

console.log(failed ? `\n${failed} problem(s) to fix.` : "\nAll good.");
process.exit(failed ? 1 : 0);
