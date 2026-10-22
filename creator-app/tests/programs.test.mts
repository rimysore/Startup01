// Run with: npm test. Open programs on the creator's home, interest, the admin list, and launch numbers.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const pr = await import("@/lib/marketplace/programs");
const pilot = await import("@/lib/marketplace/pilot");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

const d = await db();
await d.insert(schema.users).values([{ id: "cr", email: "cr@x.com" }, { id: "cr2", email: "cr2@x.com" }]);
await m.joinMarketplace("cr", { role: "creator", uiLanguage: "kn", terms: true, contact: false });
await m.joinMarketplace("cr2", { role: "creator", uiLanguage: "en", terms: true, contact: false });

const seeded = await pr.programsFor("cr");
assert(seeded.length >= 10, `at least 10 open programs from the start (${seeded.length})`);
assert(seeded[0].kind === "local", "the local (Mitra) entry comes first");
assert(seeded.every((p) => !p.link || p.link.startsWith("https://")), "every link is https");
assert(seeded.some((p) => p.kind === "affiliate") && seeded.some((p) => p.kind === "brand") && seeded.some((p) => p.kind === "platform"), "brand, affiliate and platform programs");

// Interest.
const amazon = seeded.find((p) => p.id === "seed-amazon-associates")!;
assert(await pr.setProgramInterest("cr", amazon.id, true), "creator marks interest");
assert(await pr.setProgramInterest("cr", amazon.id, true), "marking twice is fine");
assert((await pr.programsFor("cr")).find((p) => p.id === amazon.id)!.interested && !(await pr.programsFor("cr2")).find((p) => p.id === amazon.id)!.interested, "interest is per creator");
await pr.setProgramInterest("cr2", amazon.id, true);
assert((await pr.adminPrograms()).find((p) => p.id === amazon.id)!.interested === 2, "admin sees how many are interested");
assert(await pr.setProgramInterest("cr2", amazon.id, false), "take interest back");
assert(!(await pr.setProgramInterest("cr", "nope", true)), "unknown program refused");

// Admin: add a local business, hide, edit, delete.
assert(!pr.ProgramInput.safeParse({ kind: "local", name: "X", summary: "short" }).success, "needs a real name and summary");
assert(!pr.ProgramInput.safeParse({ kind: "local", name: "Ruchi Café", summary: "Paid reels for weekday lunch.", link: "http://x.com" }).success, "links must be https");
const cafe = await pr.createProgram({ kind: "local", name: "Ruchi Dosa Café", summary: "Paid reels for weekday lunch, ₹3,000 + a bonus per customer.", area: "Jayanagar", sortOrder: 1 });
assert((await pr.programsFor("cr"))[0].id === cafe.id, "a new local business shows first");
assert(await pr.updateProgram(cafe.id, { kind: "local", name: "Ruchi Dosa Café", summary: "Paid reels for weekday lunch, ₹3,000 + a bonus per customer.", status: "hidden" }), "hide it");
assert(!(await pr.programsFor("cr")).some((p) => p.id === cafe.id), "hidden programs aren't shown");
assert(!(await pr.setProgramInterest("cr", cafe.id, true)), "can't mark interest in a hidden program");
assert(await pr.deleteProgram(cafe.id) && !(await pr.deleteProgram(cafe.id)), "delete once");

// Launch numbers.
await d.insert(schema.waitlist).values([
  { email: "a@x.com", source: "mkt-creator" },
  { email: "b@x.com", source: "mkt-creator" },
  { email: "c@x.com", source: "mkt-business" },
  { email: "old@x.com", source: "landing" },
]);
const n = await pilot.pilotNumbers();
assert(n.launch.waitlistTotal === 3 && n.launch.waitlistByRole.creator === 2 && n.launch.waitlistByRole.business === 1, "pilot waitlist by role (old beta waitlist left out)");
assert(n.launch.accountsByRole.creator === 2, "accounts by role");
assert(n.launch.creatorsInterested === 1 && n.launch.topPrograms[0].name === "Amazon Associates India", "creators interested and the top programs");
assert(n.weeks[n.weeks.length - 1].waitlist === 3, "this week's waitlist sign-ups");
console.log("all programs tests passed");
