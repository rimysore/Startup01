# Brand: Mitra (beta), October 2026

Reads: `board.md` (lead with the customer counter), `marketing.md` (positioning: *"the creator counter that shows how many customers each post brought, checked against your bill book"*), the two panels. The name, logo and neutral look are decided; this file sets the promise, the voice and the first things each side sees.

## 1. The name: keep "Mitra", with one check to finish

"Mitra" (ಮಿತ್ರ, friend) is short, easy to say in Kannada and English, and fits a product that sits between two sides. **No serious problem found that justifies a rename.** One real risk: it's a common word, and many Indian businesses use it. Before spending on print or registering the company:

- **Trademark (India first, the market):** search IP India's public register (https://ipindia.gov.in → Trade Marks → Public Search) for "Mitra" and "Mitra app" in **class 35** (advertising, business marketplaces), **class 42** (software as a service) and **class 9** (downloadable software). If the plain word is crowded, a distinctive mark ("Mitra" with the logo, or "trymitra") is the usual route. A trademark lawyer confirms it; I can only point to public searches, and nothing is registered until you file.
- **Domain:** trymitraapp.com is in use. Check whether a shorter `.in` or `.com` is free before printing (I haven't checked; don't assume).
- **Handles:** make sure the Instagram handle on the leaflets is one you control, and use the same handle on every printed item.
- **Confusion:** no overlap with Influish's name or look (they use "Home of Creators"; avoid "home", "creators' home" and similar lines).

## 2. The promise, the tagline, the voice

**One-line promise (what each side can count on, every time):**
> **Every customer a creator brings is counted, and you can check it against your bill book.**

For creators the same promise reads: *"Your results are counted, so the next collab pays you properly."*

**Tagline, three options (English / Kannada):**
1. **"See who brought them in."** / *ಯಾರು ಕರೆತಂದರು ಅಂತ ನೋಡಿ.*
2. **"Count the customers, not the likes."** / *ಲೈಕ್ ಅಲ್ಲ, ಗ್ರಾಹಕರನ್ನು ಎಣಿಸಿ.* (already on the site; keep using it)
3. **"Creators who bring customers."** / *ಗ್ರಾಹಕರನ್ನು ತರುವ ಕ್ರಿಯೇಟರ್‌ಗಳು.*

**Recommend 2** for businesses: it's already in the product, it names the gap Influish leaves (likes and reach vs walk-ins), and owners said it in their own words ("likes, not customers"). Use 1 on the counter standee, where it is read by a customer in two seconds. *(Kannada lines are first drafts: a native speaker checks them before print.)*

**Voice: three adjectives.**

| | Do | Don't |
|---|---|---|
| **Plain** | "We set it up at your counter in 10 minutes." | "Seamless onboarding experience." |
| **Honest** | "Week 1: 23 customers counted across 6 shops. The PIN slowed one counter; we fixed it." | "Thousands of happy businesses!" (we have none yet) |
| **Local** | "10 Jayanagar places want creators this month." Kannada first on print. | Pan-India claims, Hindi, generic "influencer" talk. |

**Before / after (from the business pitch):**
- *Before:* "Mitra (beta): find local creators who fit your business, and count the customers each post brings."
- *After:* "You gave a creator a free lunch. How many customers came? Mitra counts them at your counter, and you check it against your bill book."

## 3. The look (already set; rules to keep it)

**Colour.** The logo gradient is the only colour; everything else is neutral, which also keeps Mitra visually far from colourful competitor apps.

| Token | Hex | Job | Contrast |
|---|---|---|---|
| Ink | `#111113` | All text, primary buttons | on Paper ≈ 18:1, passes AA/AAA |
| Paper | `#fafaf8` | Page background | — |
| Ink-2 | `#5b5c62` | Secondary text | on Paper ≈ 6.4:1, passes AA |
| Ink-3 | `#8b8c92` | Labels, hints only (not body text) | on Paper ≈ 3.3:1: **large text or non-essential labels only** |
| OK | `#1e7f55` | "Verified", "counted", success | on Paper ≈ 5.0:1, passes AA |
| Miss | `#b42318` | Errors, scam warnings | on Paper ≈ 6.4:1, passes AA |

Dark mode mirrors these (already built). On print, use Ink on white; the logo is the only colour.

**Type (already licensed and in the app):** display **Epilogue** and text **Inter** (both SIL Open Font License), Kannada **Noto Sans Kannada** (OFL). Use the same three on print; all are free from Google Fonts.

**Logo:** keep the gradient M and the "mitra" wordmark. Rules: on the counter standee and the 32 px icon, use the M alone; never recolour it; leave space equal to the M's width around it. No new logo work needed for launch.

## 4. The first five touchpoints

1. **The counter standee (what customers and the next creator see first).** A6 or A5, Kannada on top: *ರೀಲ್ ನೋಡಿ ಬಂದ್ರಾ? ಕೂಪನ್ ತೋರಿಸಿ.* / "Came because of a reel? Show the coupon." Below: the shop's offer, the M logo, "Counted by Mitra". No QR to the Mitra site on the customer side (it would confuse customers); the coupon comes from the creator's link.
2. **The leaflet a rep leaves with an owner.** Front: tagline 2 in Kannada and English, then "You gave a creator a free lunch. How many customers came?" Back: three steps (we set it up, your staff tap redeem, you check it against your bill book), the rep's name and phone number, and the answer to "free, so how do you make money?".
3. **The confirmation an owner sees after their first redeem.** "1 customer counted for <creator>. Today: 1. Your bill book should show this sale." Plain, no confetti.
4. **The first Instagram post on Mitra's account.** Behind the scenes at a real counter (with permission), the redeem taking three seconds, caption in Kannada and English, no numbers until there are real ones.
5. **The reply to the first complaint ("the count is wrong").** "Thank you for checking against your bill book; that's exactly what it's for. Tell us the day and the creator; we'll compare both and tell you what we find within a day. If our count is wrong, we'll fix it and say so." Signed with a real name.

**Also fix before launch (found while reviewing touchpoints):** the site-wide default title and description in `creator-app/src/app/layout.tsx` still read *"your channel's digital manager… Hindi and Kannada YouTube creators"*. Link previews and browser tabs for pages without their own title (sign-in, app pages) show this. It should match the counter-first promise and drop Hindi and YouTube. *(Not changed: development is on hold until you say so.)*

## Rules followed
- No competitor name, colours or taglines copied. Fonts are open-licensed and already in the app.
- Not legal advice on trademarks; the public-search steps above are for you or a lawyer to finish.
