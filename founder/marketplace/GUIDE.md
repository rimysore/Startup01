# Setting up Mitra's business model properly: guidance (21 Oct 2026)

Built from: the board (`board.md`), two simulated panels (creators 10/20 sign up; businesses 4/20 try), the competitor map (`competitors.md`) and the CFO runs (`cfo.md`, `cfo-flat299.md`). Numbers marked *estimate* are inputs to replace with pilot data. A CA should check the structure and tax before money moves.

## 1. What stays exactly as it is
- **Creators never pay** to join, apply, be seen or be verified, and keep 100% of the agreed fee. This is the line that separates Mitra from Influish's "paid ₹499, got no collabs" reviews, and the creator panel repeats it back as the reason they'd try it.
- **Free tools for creators forever:** offer inbox, scam/sender check, deal log, media kit.
- **Every rupee itemised; no dark patterns.** Keep `docs/BUSINESS_MODEL.md`'s principles.

## 2. What to change (recommended)

| # | Change | Why (evidence) | What it does to the numbers |
| --- | --- | --- | --- |
| 1 | **Free "Track" for businesses:** a promo code and link for *any* creator post, including barter and creators the business found itself | Businesses who pass mostly do barter or DM creators themselves (habit 9 of 16). Several asked for exactly this. It also tackles fee-skipping: tracking keeps repeat deals in Mitra | Revenue ₹0, but it brings businesses in and builds the outcome data that sells matched deals. It also replaces the founders' cold pitch with "try the free counter" |
| 2 | **Charge only on matched deals, flat ₹299 per creator** (business pays, plus GST), instead of 10% (min ₹199) | Panel: bargain ₹199, getting expensive ₹400. ₹500 on a ₹5,000 deal is past the median "expensive" point. A flat fee is easier to explain and doesn't penalise paying a creator more. Above a ₹10,000 creator fee, use 5% | Collecting only Mitra's fee by payment link: contribution **₹236/deal (79%)**, break-even **~42 matched deals/month** (`cfo-flat299.md`) |
| 3 | **Charge the fee when the creator marks it posted, not on accept**, and add a **guarantee: if no customers are counted in 14 days, the next match is free** | The Offers lens condition. Burned businesses were the most willing buyers, and they want proof | Guarantee costs ~₹30–50/deal at a 1-in-10 claim rate *(estimate)* |
| 4 | **Count on the customer's side, not at the till:** the post's link opens a coupon (e.g. "10% off with RUCHI-SR"); staff tap **Redeem** on the customer's phone | 9 of 20 owners said staff won't tap +1 during a rush. A discount gives the *customer* a reason to show it. One tap, and it can be checked against the bill | Makes cost per customer believable. That number is the product |
| 5 | **Barter is a deal type**, with Mitra's fee ₹0 | Most local deals are barter. Count them, then show the owner a cash creator's result next to the barter creator's | Turns barter businesses into future paid ones |
| 6 | **Payment protection, optional, business-paid:** the creator's fee is held and released when the post is live; the ~2% processing cost is itemised to the business | Creators want to be paid on time; burned businesses don't want to pay before results. Holding the whole deal costs ~₹112 per ₹5,000, which would wipe out a ₹299 fee if Mitra absorbed it (`cfo.md` what-ifs) | Never absorb it. Itemise it. Switch on only after a CA signs off (TDS 194-O / TCS) |
| 7 | **Repeat deals with the same creator: ₹99** (or free on the monthly plan) | This makes going round Mitra not worth the hassle, while tracking and protection still apply | Cheap way to keep the record and the relationship |
| 8 | **Mitra for Business ₹999/month later:** unlimited matches at ₹99, monthly report, priority Verified creators | For businesses running 4+ creators a month | Only once some businesses run 4+ deals a month |

**Creator Pro** (optional, much later): the panel's acceptable range is ₹50–300/month, median bargain ₹79. If it ever ships, start at ₹99, and never put deals or visibility behind it.

## 3. Unit economics (CFO tool; *estimates* until the pilot)
- **As built** (10% of ₹5,000 = ₹500, full deal through a payment provider): contribution ₹332/deal, break-even ~30 deals/month, about ₹94k of cash before it pays for itself on the assumed ramp.
- **Recommended** (flat ₹299, Mitra collects only its fee): contribution ₹236, break-even ~42 deals/month, year 1 about +₹29k operating, ~₹99k of cash needed. Most of that is the one-off ₹55k (company + GST registration, legal review, pilot launch).
- **The line to watch is volume, not price.** At half the assumed ramp, year 1 goes to about −₹44k. The ramp assumes 150 matched deals by month 12 (~75 businesses × 2). Nobody knows yet whether that is realistic. Count deals per business per month in the pilot and re-run `numbers-flat299.json`.
- **Never price below ~₹200** unless payment processing comes off the deal: at ₹199 with full collection, each deal leaves ₹31.

## 4. The pilot, re-cut (weeks 5–8)
1. **Freeze the analytics beta** off the first screen. Creators land on the Inbox, businesses on "Track a creator post".
2. **Ship Track + customer-side redeem** (changes 1, 4, 5) before matching goes live. This is the business-side front door.
3. **Walk into 30 food places in 1–2 neighbourhoods** with one line: "Free: see how many customers each creator post brings you, barter or paid." Record what each one pays creators today, cash or barter, and how often. These are the open numbers the board asked for.
4. **Seed creators through the scam check:** post a "forward any collab DM to Mitra on WhatsApp" link in Bengaluru creator WhatsApp groups. Count who arrives without a founder DM.
5. **Close 5 paid matched deals by hand** at ₹299 with the guarantee. Publish each result with the owner's permission ("₹3,000 → 27 customers").
6. **Gates (week 8):** 5+ paid deals, counts checked against bills at 3+, 3+ repeat businesses, sign-up cost per business measured, the share of creators arriving through the inbox, and how many pairs went quiet after one deal (fee-skipping).

## 5. Decisions only you can make
- **The fee: flat ₹299 (recommended) or keep 10%, min ₹199.** One constant in code either way. You could also A/B test both on the first 10 matched deals.
- **The guarantee's terms:** how many counted customers, and over how many days.
- **Company structure before charging:** an Indian Pvt Ltd (grants, GST, Startup India) or a Delaware parent with an Indian subsidiary (YC and US investors). This decides which forms you can file, the YC W27 application due **2 Nov** included. Talk to a CA or lawyer this week.
- **Discount on the coupon:** who funds it (the business, as in normal promotions) and the default (10%?).

## 6. What to say when someone asks "how does Mitra make money?"
"Creators never pay us. Businesses can count customers from any creator post for free. When Mitra brings a creator who actually brings customers, the business pays ₹299 on top of the creator's fee, and if nobody comes, the next one's free."

## Honest limits
Board members and buyers are simulated. They are good at finding objections, bad at predicting conversion; models lean agreeable, so read buy rates as an upper bound. The competitor facts are public and linked, but Reddit couldn't be reached, and some prices aren't published. All costs and the ramp are estimates. Not financial, legal or tax advice.
