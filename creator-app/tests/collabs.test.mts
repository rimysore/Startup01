// Run with: npm test. Businesses listed for creators (ranked to the profile), interest, and creators for a business.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const b = await import("@/lib/marketplace/business");
const c = await import("@/lib/marketplace/collabs");
const so = await import("@/lib/marketplace/social");
const assert = (cond: unknown, msg: string) => { if (!cond) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

const d = await db();
const user = async (id: string, role: "creator" | "business" | "brand") => {
  await d.insert(schema.users).values({ id, email: `${id}@x.com` });
  await m.joinMarketplace(id, { role, uiLanguage: "en", terms: true, contact: false });
};
assert(c.nichesForCategory("South Indian café").includes("food") && c.nichesForCategory("Unisex salon").includes("beauty") && c.nichesForCategory("CrossFit gym").includes("fitness"), "business categories map to creator niches");
assert(c.nichesForCategory(null).length === 0, "no category, no niche");

await user("sita", "creator");
await m.saveKit("sita", m.KitInput.parse({ displayName: "Sita Rao", niches: ["food", "lifestyle"], languages: ["kn"], area: "Jayanagar", openToOffers: true, isPublic: true }));
assert((await c.businessesFor("sita")).length === 0, "no businesses yet");

await user("cafe", "business");
await m.saveBusiness("cafe", m.BusinessInput.parse({ name: "Ruchi Dosa Café", category: "South Indian café", area: "Jayanagar", website: "https://ruchi.example", instagram: "@ruchidosa", budgetMinInr: 5000 }));
await user("gym", "business");
await m.saveBusiness("gym", m.BusinessInput.parse({ name: "Iron Gym", category: "Gym", area: "Whitefield" }));
await user("salon", "business");
await m.saveBusiness("salon", m.BusinessInput.parse({ name: "Glow Salon", category: "Salon", area: "Indiranagar", listed: false }));
await user("brand", "brand");
await m.saveBusiness("brand", m.BusinessInput.parse({ name: "Namma Coffee Co", category: "Coffee brand", area: "Bengaluru" }));
await b.createBrief("brand", b.BriefInput.parse({ goal: "Launch our filter coffee", niches: ["food"], languages: ["kn"], deliverables: ["reel"], budgetInr: 20000 }));

const list = await c.businessesFor("sita");
assert(list.length === 3 && !list.some((x) => x.userId === "salon"), "every listed business shows up; unlisted ones don't");
assert(list[0].userId === "cafe" && list[0].reasons.includes("In Jayanagar, your area") && list[0].reasons.includes("Fits your food content"), "same area + matching niche ranks first, with reasons");
const brand = list.find((x) => x.userId === "brand")!;
assert(brand.reasons.includes("Looking for creators now") && brand.reasons.includes("Brand") && brand.openBriefs === 1, "open briefs and brands are called out");
assert(list[list.length - 1].userId === "gym", "no fit ranks last");
assert(list.every((x) => x.isNew), "new businesses are marked new");
assert(!("budgetMinInr" in list[0]) && !("whatsapp" in list[0]), "budget and contacts are never shown");

// Interest.
assert(await c.setBusinessInterest("sita", "cafe", true), "creator says interested");
assert(!(await c.setBusinessInterest("sita", "salon", true)), "can't be interested in an unlisted business");
assert((await c.businessesFor("sita")).find((x) => x.userId === "cafe")!.interested, "interest shows on the card");
await so.saveVerifiedHandle("sita", "instagram", { handle: "sita.eats", followers: 18400, avgViews: null, stats: { posts: 300, recent: [] }, avatarUrl: null, profileUrl: "https://www.instagram.com/sita.eats/", verifiedBy: "instagram_connection" });
const fans = await c.interestedCreators("cafe");
assert(fans.length === 1 && fans[0].name === "Sita Rao" && fans[0].kit?.startsWith("/kit/") && fans[0].reasons.some((r) => r.includes("18.4K on Instagram (verified)")), "the business sees who's interested, with the kit and verified reach");
assert(fans[0].reasons.includes("Based in Jayanagar") && fans[0].reasons.includes("Makes food content"), "with why they fit");
await c.setBusinessInterest("sita", "cafe", false);
assert((await c.interestedCreators("cafe")).length === 0, "interest can be taken back");

// Creators for a business.
await user("far", "creator");
await m.saveKit("far", m.KitInput.parse({ displayName: "Far Away", niches: ["tech"], languages: ["en"], area: "Whitefield", openToOffers: true }));
await user("shy", "creator");
await m.saveKit("shy", m.KitInput.parse({ displayName: "Not Looking", niches: ["food"], languages: ["kn"], area: "Jayanagar", openToOffers: false }));
const fits = await c.creatorsFor("cafe");
assert(fits.length === 1 && fits[0].userId === "sita", "only opted-in creators who fit (area or niche) are suggested");
assert((await c.creatorsFor("gym")).some((x) => x.userId === "far") === true, "same area counts on its own");
assert((await c.creatorsFor("nobody")).length === 0, "no business profile, no list");
console.log("all collabs tests passed");
