import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

/*
 * "Is this offer real?" Four layers, cheapest first, every finding explained in plain words:
 *   1. scam patterns in the message itself (pay-to-collaborate, buy-first-refund-later, OTP/PIN, task jobs, APKs);
 *   2. who sent it: free email or the brand's own domain, and links that hide where they go;
 *   3. free public records: when the domain was registered (RDAP), whether it can receive email (DNS over HTTPS),
 *      and the brand's official website on Wikidata;
 *   4. Mitra's own records: other creators' reports, and businesses that have paid creators through Mitra.
 * Network lookups are cached for days, time out after a few seconds and never block the answer.
 */

export type Level = "good" | "info" | "warn" | "bad";
export type Signal = { level: Level; text: string; source?: string };
export type Verdict = "looks_ok" | "careful" | "likely_scam" | "unknown";
export type SenderCheck = {
  verdict: Verdict;
  signals: Signal[];
  brand?: { name: string; description: string | null; website: string | null; source: "Wikidata" } | null;
  domain?: { name: string; registered: string | null; mx: boolean | null } | null;
};
export type SenderInput = { text: string; email?: string | null; phone?: string | null; handle?: string | null; brand?: string | null };

/* ---- 1. Patterns in the message (pure) ---- */

const RULES: { re: RegExp; level: Level; text: string; hard?: boolean }[] = [
  {
    re: /\b(registration|joining|onboarding|security|processing|listing|verification|membership)\s*(fee|fees|charge|charges|amount|deposit)\b|\bpay\s+(us|a\s+fee|₹\s?\d|rs\.?\s?\d)[^.]{0,40}\b(join|register|collab|selected|onboard|confirm)/i,
    level: "bad",
    hard: true,
    text: "Asks you to pay to collaborate. Real brands pay creators, never the other way round.",
  },
  {
    re: /\b(buy|order|purchase|pay for)\b[^.]{0,60}\b(refund|reimburse|reimbursed|cash ?back|money back|return the amount)\b/i,
    level: "bad",
    hard: true,
    text: "Asks you to buy something first and promises a refund later. This is a common scam.",
  },
  { re: /\b(otp|upi\s?pin|atm\s?pin|cvv|net\s?banking|bank\s?password|login\s?password)\b/i, level: "bad", hard: true, text: "Asks for an OTP, PIN or banking login. Never share these with anyone." },
  { re: /\b(aadhaa?r|pan\s?card|passport)\b[^.]{0,40}\b(send|share|upload|photo|copy)\b|\b(send|share|upload)\b[^.]{0,30}\b(aadhaa?r|pan\s?card|passport)\b/i, level: "warn", text: "Asks for ID documents. Only share them for a signed, paid contract, never in a first message." },
  {
    re: /\b(part[- ]?time job|work from home|daily (income|earning|payout)|earn ₹?\s?\d[\d,]*\s*(per|\/)\s*(day|task)|(like|follow|rate|review|subscribe)\b[^.]{0,30}\b(task|tasks)\b)/i,
    level: "bad",
    hard: true,
    text: "Reads like a \"task job\" scam (paid likes, ratings or reviews). These end with you paying them.",
  },
  { re: /\.apk\b|\bdownload (our|this|the) app\b[^.]{0,40}\b(to (join|start|receive)|first)\b/i, level: "bad", hard: true, text: "Asks you to install an app to take part. Apps from messages can steal your accounts." },
  { re: /\b(usdt|bitcoin|crypto(currency)?|gift ?cards?|binance)\b/i, level: "bad", text: "Mentions crypto or gift cards for payment. Brands pay by bank transfer or UPI." },
  { re: /\btelegram\b|t\.me\//i, level: "warn", text: "Wants to move the chat to Telegram. Scammers prefer it; keep it on email or WhatsApp with the business." },
  { re: /\b(within|in)\s+\d+\s*(hours?|hrs?|mins?|minutes)\b|\burgent(ly)?\b|\bimmediately\b|\btoday only\b|\blast chance\b|\blimited slots?\b/i, level: "warn", text: "Pushes you to decide fast. Take your time; real offers wait a day." },
  { re: /\b(dear (influencer|creator|blogger|sir\/madam)|hello dear|hi dear)\b/i, level: "info", text: "Generic greeting: probably sent to many creators at once." },
];

const SHORTENERS = /\b(bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|is\.gd|t\.co|shorturl\.at|tiny\.cc|ow\.ly|s\.id|rebrand\.ly|bit\.do)\//i;
const FREE_MAIL = new Set(["gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com", "live.com", "rediffmail.com", "proton.me", "protonmail.com", "icloud.com", "aol.com", "ymail.com", "zoho.com"]);

export function patternSignals(text: string): Signal[] {
  const out: Signal[] = [];
  for (const r of RULES) if (r.re.test(text)) out.push({ level: r.level, text: r.text });
  if (SHORTENERS.test(text)) out.push({ level: "warn", text: "Has a shortened link that hides where it really goes. Don't log in through it." });
  return out;
}

export function extractEmails(text: string): string[] {
  return [...new Set((text.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? []).map((e) => e.toLowerCase()))];
}
export function extractUrls(text: string): string[] {
  return [...new Set(text.match(/\bhttps?:\/\/[^\s<>()"']+/gi) ?? [])];
}
export function domainOf(emailOrUrl: string): string | null {
  const m = emailOrUrl.toLowerCase().match(/@([\w.-]+)$/) ?? emailOrUrl.toLowerCase().match(/^https?:\/\/([^/:?#]+)/);
  if (!m) return null;
  return m[1].replace(/^www\./, "").replace(/\.$/, "");
}
/** example.co.in → example.co.in; mail.example.com → example.com (good enough for registration lookups). */
export function registrable(host: string): string {
  const parts = host.split(".");
  const twoLevel = /^(co|com|net|org|gov|ac|edu|in|firm|gen|ind)$/.test(parts[parts.length - 2] ?? "") && parts.length > 2;
  return parts.slice(twoLevel ? -3 : -2).join(".");
}
export const isFreeMail = (email: string) => FREE_MAIL.has(domainOf(email) ?? "");

/** Keys other creators' reports are stored under: the email, its domain (not free mail), the phone and the handle. */
export function senderKeys(s: { email?: string | null; phone?: string | null; handle?: string | null }): string[] {
  const keys: string[] = [];
  if (s.email) {
    keys.push(`email:${s.email.toLowerCase()}`);
    const dom = domainOf(s.email);
    if (dom && !FREE_MAIL.has(dom)) keys.push(`domain:${registrable(dom)}`);
  }
  const digits = s.phone?.replace(/\D/g, "").slice(-10);
  if (digits && digits.length === 10) keys.push(`phone:${digits}`);
  if (s.handle) keys.push(`handle:${s.handle.toLowerCase().replace(/^@/, "")}`);
  return keys;
}

/** Turns the findings into one verdict. Hard red flags decide it; otherwise warnings make it "careful". */
export function decide(signals: Signal[]): Verdict {
  if (signals.some((s) => s.level === "bad")) return "likely_scam";
  if (signals.some((s) => s.level === "warn")) return "careful";
  if (signals.some((s) => s.level === "good")) return "looks_ok";
  return "unknown";
}

/* ---- 3. Free public lookups (injectable for tests) ---- */

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;
const UA = "MitraOfferCheck/1.0 (+https://trymitraapp.com; mitracontentsupport@gmail.com)";

async function getJson(fetcher: Fetcher, url: string, accept = "application/json"): Promise<unknown | null> {
  try {
    const res = await fetcher(url, { headers: { accept, "user-agent": UA }, signal: AbortSignal.timeout(4000), redirect: "follow" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function cached<T>(key: string, maxAgeMs: number, load: () => Promise<T | null>): Promise<T | null> {
  const d = await db();
  const [hit] = await d
    .select()
    .from(schema.lookupCache)
    .where(and(eq(schema.lookupCache.key, key), gt(schema.lookupCache.fetchedAt, new Date(Date.now() - maxAgeMs))));
  if (hit) return hit.value as T | null;
  const value = await load();
  // Failures aren't cached, so a brief outage doesn't stick for days.
  if (value !== null) {
    await d
      .insert(schema.lookupCache)
      .values({ key, value, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: schema.lookupCache.key, set: { value, fetchedAt: new Date() } });
  }
  return value;
}

const DAY = 86_400_000;

/** When the domain was first registered, from RDAP (the public successor to WHOIS). */
export async function domainRegistered(domain: string, fetcher: Fetcher = fetch): Promise<string | null> {
  const v = await cached(`rdap:${domain}`, 14 * DAY, async () => {
    const j = (await getJson(fetcher, `https://rdap.org/domain/${encodeURIComponent(domain)}`, "application/rdap+json, application/json")) as { events?: { eventAction: string; eventDate: string }[] } | null;
    const date = j?.events?.find((e) => e.eventAction === "registration")?.eventDate;
    return date ? { date } : null;
  });
  return (v as { date: string } | null)?.date ?? null;
}

/** Whether the domain can receive email at all (has MX records), via DNS over HTTPS. */
export async function domainHasMx(domain: string, fetcher: Fetcher = fetch): Promise<boolean | null> {
  const v = await cached(`mx:${domain}`, DAY, async () => {
    const j = (await getJson(fetcher, `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, "application/dns-json")) as { Status?: number; Answer?: { type: number }[] } | null;
    if (!j || typeof j.Status !== "number") return null;
    return { mx: (j.Answer ?? []).some((a) => a.type === 15) };
  });
  return (v as { mx: boolean } | null)?.mx ?? null;
}

/** A brand's Wikidata entry (label, description, official website), if one clearly matches the name. */
export async function brandRecord(name: string, fetcher: Fetcher = fetch): Promise<{ name: string; description: string | null; website: string | null } | null> {
  const q = name.trim().slice(0, 60);
  if (q.length < 3) return null;
  return cached(`wikidata:${q.toLowerCase()}`, 14 * DAY, async () => {
    const search = (await getJson(fetcher, `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&type=item&limit=3&format=json`)) as {
      search?: { id: string; label: string; description?: string }[];
    } | null;
    const hit = search?.search?.find((s) => s.label.toLowerCase() === q.toLowerCase());
    if (!hit) return null;
    const ent = (await getJson(fetcher, `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${hit.id}&props=claims&format=json`)) as {
      entities?: Record<string, { claims?: { P856?: { mainsnak?: { datavalue?: { value?: string } } }[] } }>;
    } | null;
    const website = ent?.entities?.[hit.id]?.claims?.P856?.[0]?.mainsnak?.datavalue?.value ?? null;
    return { name: hit.label, description: hit.description ?? null, website };
  });
}

/* ---- 4. Mitra's own records ---- */

export async function mitraRecords(keys: string[], email?: string | null): Promise<Signal[]> {
  const out: Signal[] = [];
  const d = await db();
  if (keys.length) {
    const rows = await d
      .select({ kind: schema.senderReports.kind, n: sql<number>`count(distinct ${schema.senderReports.userId})::int` })
      .from(schema.senderReports)
      .where(inArray(schema.senderReports.senderKey, keys))
      .groupBy(schema.senderReports.kind);
    const scam = rows.find((r) => r.kind === "scam")?.n ?? 0;
    const ok = rows.find((r) => r.kind === "ok")?.n ?? 0;
    // One report could be a grudge; two different creators agreeing is a pattern.
    if (scam >= 2) out.push({ level: "bad", text: `${scam} creators on Mitra reported this sender as a scam.`, source: "Mitra" });
    if (ok >= 2) out.push({ level: "good", text: `${ok} creators on Mitra said deals with this sender went fine.`, source: "Mitra" });
  }
  if (email) {
    const [row] = await d
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.deals)
      .innerJoin(schema.users, eq(schema.users.id, schema.deals.businessUserId))
      .where(and(eq(schema.users.email, email.toLowerCase()), eq(schema.deals.status, "paid")));
    if ((row?.n ?? 0) > 0) out.push({ level: "good", text: `This business has paid ${row!.n} creator${row!.n > 1 ? "s" : ""} through Mitra.`, source: "Mitra" });
  }
  return out;
}

/* ---- All together ---- */

const ageDays = (iso: string, now: number) => Math.floor((now - new Date(iso).getTime()) / DAY);

export async function checkSender(input: SenderInput, opts: { fetcher?: Fetcher; now?: number; online?: boolean } = {}): Promise<SenderCheck> {
  const fetcher = opts.fetcher ?? fetch;
  const now = opts.now ?? Date.now();
  const online = opts.online ?? true;
  const signals: Signal[] = patternSignals(input.text);
  const email = (input.email ?? extractEmails(input.text)[0] ?? null)?.toLowerCase() ?? null;
  const urls = extractUrls(input.text);

  // 2. Who sent it.
  let senderDomain: string | null = null;
  if (email) {
    if (isFreeMail(email)) signals.push({ level: "info", text: "Sent from a free email address. Small shops often use one; a big brand usually writes from its own domain." });
    else senderDomain = registrable(domainOf(email)!);
  }

  // 3. Public records.
  let domain: SenderCheck["domain"] = null;
  let brand: SenderCheck["brand"] = null;
  if (online) {
    const linkDomains = [...new Set(urls.map((u) => domainOf(u)).filter((h): h is string => Boolean(h) && !SHORTENERS.test(`${h}/`)).map(registrable))].filter((h) => h !== senderDomain).slice(0, 2);
    const [registered, mx, brandRec, ...linkAges] = await Promise.all([
      senderDomain ? domainRegistered(senderDomain, fetcher) : null,
      senderDomain ? domainHasMx(senderDomain, fetcher) : null,
      input.brand ? brandRecord(input.brand, fetcher) : null,
      ...linkDomains.map((h) => domainRegistered(h, fetcher)),
    ]);
    if (senderDomain) {
      domain = { name: senderDomain, registered, mx };
      if (registered) {
        const age = ageDays(registered, now);
        if (age < 90) signals.push({ level: "bad", text: `The sender's domain ${senderDomain} was registered only ${age} days ago.`, source: "RDAP" });
        else if (age < 365) signals.push({ level: "warn", text: `The sender's domain ${senderDomain} is less than a year old.`, source: "RDAP" });
        else signals.push({ level: "good", text: `The sender's domain ${senderDomain} has existed since ${new Date(registered).getFullYear()}.`, source: "RDAP" });
      }
      if (mx === false) signals.push({ level: "warn", text: `${senderDomain} isn't set up to receive email, so replies may go nowhere.`, source: "DNS" });
    }
    linkDomains.forEach((h, i) => {
      const reg = linkAges[i] as string | null;
      if (reg && ageDays(reg, now) < 90) signals.push({ level: "bad", text: `A link in the message goes to ${h}, registered ${ageDays(reg, now)} days ago.`, source: "RDAP" });
    });
    if (brandRec) {
      brand = { ...brandRec, source: "Wikidata" };
      const official = brandRec.website ? registrable(domainOf(brandRec.website) ?? "") : null;
      if (official && senderDomain && official === senderDomain) signals.push({ level: "good", text: `The email comes from ${brandRec.name}'s official domain.`, source: "Wikidata" });
      else if (official && senderDomain && senderDomain.includes(official.split(".")[0])) signals.push({ level: "bad", text: `${brandRec.name}'s official site is ${official}, but this came from ${senderDomain}, a lookalike.`, source: "Wikidata" });
      else if (official && email && isFreeMail(email)) signals.push({ level: "warn", text: `${brandRec.name} has its own domain (${official}) but this came from a free email address. Confirm on their official channels.`, source: "Wikidata" });
    }
  }

  // 4. Mitra's records.
  signals.push(...(await mitraRecords(senderKeys({ email, phone: input.phone, handle: input.handle }), email)));
  return { verdict: decide(signals), signals, brand, domain };
}

/** Records a creator's report on a sender, once per creator per key (a later report replaces an earlier one). */
export async function reportSender(userId: string, keys: string[], kind: "scam" | "ok"): Promise<void> {
  const d = await db();
  for (const senderKey of keys) {
    await d
      .insert(schema.senderReports)
      .values({ userId, senderKey, kind })
      .onConflictDoUpdate({ target: [schema.senderReports.userId, schema.senderReports.senderKey], set: { kind, createdAt: new Date() } });
  }
}
