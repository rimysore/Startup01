# Finding creators to invite — plan (automate later)

## What's possible and what isn't
- **YouTube Data API** finds channels and their public stats. `search.list` (type=channel or video,
  regionCode=IN, relevanceLanguage=te/hi/…, publishedAfter) costs **100 units** per call (50 results);
  `channels.list` for stats costs **1 unit per 50 channels**. With the default 10,000 units/day:
  ~80 searches + stats ≈ 4,000 candidate channels/day.
- **Emails**: the API does not expose business emails. YouTube's "View email address" button needs a human
  and a CAPTCHA, and scraping YouTube pages is against YouTube's Terms. Legit sources:
  1. emails the creator wrote **publicly in the channel description** (returned by the API) or on a website
     they link;
  2. their public Instagram bio / link-in-bio (manual lookup);
  3. reaching them where they publish contact (Instagram DM, business WhatsApp they list publicly).
- **Law**: India's DPDP Act doesn't apply to personal data the person *made publicly available* themselves,
  but still: send few, personal, relevant messages; one follow-up max; easy opt-out ("reply STOP"); keep a
  do-not-contact list; never buy email lists. For non-Indian creators, CAN-SPAM/GDPR rules apply.
- Send from a **separate outreach domain/mailbox** (e.g. getmitra.in) to protect the main domain's
  reputation; warm it up; ≤30 emails/day at first.

## Pipeline (admin-only, in Mitra)
1. **Seeds**: language × niche × city keywords ("తెలుగు tech review", "bhojpuri comedy", "marathi recipe").
2. **Search** (100 units each) for recent videos/channels in that language, India region.
3. **Stats** for every channel found (1 unit / 50): subscribers, views, upload count; uploads playlist for
   recent activity.
4. **Filter & score**: 1K–1L subscribers (our sweet spot), uploaded in the last 30 days, language matches,
   growth signal (recent views vs subscribers), not already a Mitra user, not on do-not-contact.
5. **Contact**: extract public emails/links from the description; mark "no public email" otherwise.
6. **Personalise**: Haiku writes a 2-line opener referencing their latest video (~₹0.1 each).
7. **Review**: you approve in an admin table (prospects: channel, stats, score, contact, opener, status).
8. **Send**: create Gmail drafts for approved rows (you press send), later a scheduled sender with daily caps.
9. **Track**: replied / joined / not interested; joined creators link to their user account.

## Automate later
A scheduled job (daily) runs steps 2–6 within a fixed quota budget (e.g. 3,000 units/day so the product's
own users keep 7,000), stores new prospects, and posts a summary to the admin page.

## Sending account
Outreach goes out from **mitracontentsupport@gmail.com**. The Gmail button opens compose in that account
(`authuser`), and the email signs off with it. Stay under ~30–50 personal emails a day from a new Gmail
account so it isn't flagged as spam.
