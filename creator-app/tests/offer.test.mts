// Run with: npm test. The "paste an offer" checker on the landing page.
const { checkOffer, offerFields, offerReply } = await import("@/lib/offer-check");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };
const state = (text: string, term: string) => checkOffer(text).find((c) => c.term === term)?.state;

const barter = "Hi! Loved your food reels. We'd like 1 reel + 3 stories for our new outlet in Jayanagar. We'll give a free meal for 2 and exposure. Need it this weekend.";
assert(state(barter, "pay") === "warn", "exposure and free meals are flagged, not counted as pay");
assert(checkOffer(barter).find((c) => c.term === "deliverables")?.text.includes("1 reel, 3 stories"), "deliverables are read from the message");
assert(state(barter, "date") === "ok" && state(barter, "timing") === "missing" && state(barter, "usage") === "missing", "date found; payment timing and usage missing");

const fair = "We'd pay ₹6,000 for 1 reel and 2 stories, 50% advance, posted by 2 Nov as a paid partnership. We may repost it on our page for 30 days.";
assert(state(fair, "pay") === "ok" && state(fair, "timing") === "ok" && state(fair, "disclosure") === "ok", "a complete offer passes pay, timing and disclosure");
assert(state(fair, "usage") === "warn", "reuse is flagged so the creator can price it");
assert(state("Can you post about us?", "pay") === "missing", "no pay at all is missing");
assert(state("Exclusive deal, no other cafes for 3 months", "exclusive") === "warn", "exclusivity is flagged");

const reply = offerReply(checkOffer(barter), "en") ?? "";
assert(reply.includes("What fee") && reply.includes("When is payment made") && !reply.includes("By what date"), "the reply asks only for what's missing or risky");
assert((offerReply(checkOffer(barter), "kn") ?? "").startsWith("ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕೆ"), "the reply can be written in Kannada");
assert(offerFields(fair).feeInr === 6000 && offerFields(fair).deliverables === "1 reel, 2 stories", "fee and deliverables are pre-filled from the offer");
assert(offerFields("We can pay Rs 8k for a reel").feeInr === 8000 && offerFields("₹1.5 lakh for 3 videos").feeInr === 150000, "8k and 1.5 lakh are read as rupees");
assert(offerFields(barter).feeInr === null, "no fee when none is offered");
assert(offerFields("₹6,000 for 1 reel + 2 stories. Post by this weekend. We may use your video on our page.").deliverables === "1 reel, 2 stories", "'post by' and 'your video' aren't counted as deliverables");
console.log("all offer tests passed");
