# Board brief: Mitra (beta), October 2026

## The idea
- **What it is:** a collab marketplace for Bengaluru's Instagram creators and the local businesses and brands they post about. Creators find collabs that fit their profile in one place; businesses find creators who fit them and count the customers each post brings.
- **Who it is for:** (1) Bengaluru Instagram creators posting in Kannada and/or English, roughly 2K-100K followers; (2) independent cafés, darshinis, salons, gyms and boutiques in South and Central Bengaluru, plus small brands.
- **Where and how:** Bengaluru only, starting with two neighbourhoods. Web app (mobile website, no app-store app) at trymitraapp.com, Google sign-in. English and Kannada throughout.

## What is built (on the dev branch, not yet live in production)
- **Instagram connect** (official Instagram API, read-only): reads followers, average reel views, engagement, posting rhythm, audience city/age/gender, recent posts; marks numbers "Verified"; auto-fills the creator's profile (niches, languages, area, bio). Other platforms are self-reported.
- **Collabs for you:** every listed business and brand is shown to each creator, ranked to their area and niche with the reasons ("In Jayanagar, your area", "Fits your food content", "Looking for creators now"). One tap "Interested" and the business sees the creator. Plus 10 real affiliate/brand programmes (Amazon Associates, Flipkart, Myntra, Meesho, Wishlink...).
- **Business side:** profile listed to creators at once; sees interested creators and creators who fit; can post briefs, invite creators with a fee, barter, and/or a bonus per customer; deal room with messages.
- **Customer counter:** each creator post gets a coupon link; customers show it on their phone; staff redeem with a 4-digit PIN (or type the code); the owner sees customers and cost per customer per creator, and can download a daily sheet to check against the bill book.
- **Auto-DM:** when someone comments a keyword (e.g. DOSA) on a creator's reel, Mitra sends them a private reply from the creator's account with a link, often a business's coupon link, so the customer is counted. Official Instagram API; one DM per comment; capped under Instagram's hourly limit.
- **Offer scam check:** creators paste or forward any collab offer; Mitra flags registration-fee scams, checks the sender and drafts a reply.
- **Admin:** members list, pilot numbers (businesses counting customers, customers per post, paying, repeat rate, creators using it).

## Pricing (decided by the founder)
- Launch month free for everyone.
- After that, each creator's first collab through Mitra is free; then the **Creator Pass at ₹499 a year** (collabs and Auto-DM). Payment is not built: an admin switches the pass on after the creator pays (e.g. by UPI). Enforcement can be switched on later.
- **Businesses and brands pay nothing for now.** Mitra takes no cut of creators' fees.
- Offer checks and the media kit stay free.

## Status and constraints
- Zero users. Production launch is waiting on the founder's go-ahead.
- Instagram connect and Auto-DM need a Meta developer app and Meta App Review (usually 1-2 weeks); **the founder has not set up the Meta app yet.** Until approval only test accounts can connect; others type their numbers.
- The company is not yet registered (operated by an individual founder); holding payments until work is approved (escrow) needs a registered company and a payment gateway.
- Team: a founder building the product (based in the USA) and people on the ground in India; a co-founder's name is not yet public.
- Budget: not stated. Do not assume one.

## The competitor named by the founder: Influish
Public facts (influish.com, Google Play, press, read October 2026):
- Instagram-only creator app (Android and iPhone), official Meta API. Main hook is Instagram Auto-DM (comments, story replies, DMs), plus 8+ creator tools (insights, AI captions, invoice generator, rate calculator).
- Creators pay: free plan; Pro ₹42/month or ₹499/year with "bonus collab access". 0% commission on collabs; escrow payments released on approval; brands post campaigns (pricing not published), creators apply and wait to be selected.
- Claims 1.5M+ creators and 90K+ brands; pan-India. Founded 2025, bootstrapped.
- Public reviews include a creator who paid ₹499 and got no collab in six months (Influish replied collabs are not guaranteed) and campaigns showing "Full" before they load. Terms: subscriptions non-refundable.

## Fresh simulated buyer panels (20 per side; simulated, not real customers; buy rates are an upper bound)
**Creators: 6 buy · 14 pass (30%).** Nearly every "buy" is only the free launch-month sign-up; payment depends on getting a cash (not barter) collab. Pass reasons: trust 10, habit 3, need 1.
- Top doubts: "Will there be businesses on it, or is it empty?"; "local cafés pay in food, not money"; "who is behind it and who do I complain to if a business doesn't pay?"; "Auto-DM might get my account flagged"; "my WhatsApp groups already send me leads free"; "Influish costs the same and has lakhs of creators".
- What would flip a no: a creator they know in their WhatsApp groups saying they got a real paid collab on time through Mitra; a named company and a way to report a non-paying business; one cash collab in the free month.
- Price answers (₹/year) cluster at bargain ₹199, getting expensive ₹499-999.

**Local businesses: 11 buy · 9 pass (55%)** for a free tool. Buyers are barter veterans and numbers-minded owners: "I give free meals to creators and have no idea if anyone walks in". Pass reasons: habit 4 (word of mouth is enough, agency handles it), trust 3 (unknown beta could vanish; "free, so how do you make money?"), convenience 2 (no time for another app).
- Top doubt on both yes and no sides: staff won't redeem with the PIN during a rush, and customers won't show a coupon, so counts read low.
- What would flip a no: a nearby owner showing real redeemed coupons matched to their bill book; someone from Mitra setting it up in person; working over WhatsApp with no new app or login.
