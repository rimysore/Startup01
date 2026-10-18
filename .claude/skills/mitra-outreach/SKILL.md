---
name: mitra-outreach
description: >-
  Finds, contacts and converts Indian regional-language YouTube creators into Mitra users, and learns why they
  want it. Picks a focused cohort in Admin → Prospects, checks each AI-written email against cold-email rules,
  runs the "free channel read" offer, answers replies (yes, questions, objections, stop), plans the one
  follow-up, and reviews the weekly numbers and what creators said in the in-app interview to decide what to
  build next. Use when the user says "get customers", "find creators", "outreach", "write to creators",
  "reply to this creator", "how is outreach going", "what are creators telling us", or "help my co-founder sell".
argument-hint: "[cohort, e.g. 'telugu tech 10K-200K' | a creator's reply | 'weekly review']"
---

# mitra-outreach

Mitra's first customers come one creator at a time. This skill runs that loop well, using Mitra's own admin
tools (no scraping, no bought lists) and cold-email rules adapted from Harvey (MIT, see `reference/`).

What the user typed: `$ARGUMENTS`. Decide which part below they need: **cohort**, **review emails**,
**reply**, **channel read**, or **weekly review**. If unclear, ask one question.

## What we learned before writing a single email (founder/ in the repo)

- 0 of 20 simulated creators would pay today. Not because of price: **trust and proof**. Every one said some
  version of "show me one specific, checkable thing about MY channel first" or "a creator I follow vouching".
- So the offer in every first email is a **free one-page read of their last 10 videos**, done by the founder,
  not a sign-up link. The read earns trust; the sign-up comes after.
- Focus: **one or two languages** at a time (the board's condition), creators **10K–200K subscribers** who
  uploaded in the last 30 days (they post regularly and many earn something).

## 1. Cohort (Admin → Prospects)

1. Pick ONE language and ONE niche (e.g. Telugu tech, Marathi food). Write 3–5 seed searches in that
   language's script and in English ("తెలుగు mobile review", "telugu tech unboxing").
2. Discover with: subscribers 10K–200K, uploaded in the last 30 days, language set.
3. Keep only channels with a **public email in their description** (the tool extracts it). Never guess an
   address, never scrape YouTube's "view email" button, never buy a list.
4. Aim for 20–30 a batch. Small sharp batches beat blasts.

## 2. Review every email before it goes

The page writes the subject and opener (AI) and the fixed body (`creator-app/src/lib/outreach.ts`). For each
one, check and fix:

- Starts with **them** (name or channel), not "I". One specific, true observation from their latest video or
  channel. No praise you can't see in the data, no numbers you didn't read.
- No em dashes, no exclamation marks, no "hope this finds you well", no "loved your video", no questions in
  the opener. Subject under 60 characters, specific, low-key (e.g. "Your Lucknow night test").
- Body stays as is: the one offer (free channel read), design-partner line, "reply stop" opt-out, postal
  address. No links in the first email.
- Send from the outreach mailbox (Gmail button), **≤30 a day** while the mailbox is new. Mark "contacted".

Full rules: `reference/email_frameworks.md` (Harvey). Where it conflicts with this file, this file wins
(Mitra's sends are manual, one at a time, plain text from Gmail; there is no Instantly).

## 3. Replies

Classify, then answer within 24 hours, shorter than their message:

| They said | Do |
| --- | --- |
| "yes" / "send it" | Do the channel read (step 4) and send it within 24h. |
| stop / not interested / remove me | Mark **do_not_contact**. Never write again. No reply needed beyond a one-line "Done, sorry for the bother." if they wrote more than one word. |
| A question | Answer it in 2–3 sentences, then repeat the one offer. |
| An objection | Use the table below (LAARC from `reference/objection_handling.md`: acknowledge, answer the real concern, one easy next step). |

Objections we expect (from the creator panel), and the honest answer:

| Objection | Answer |
| --- | --- |
| "I won't give an unknown app access to my channel" | Fair. The read needs no access at all: I use only your public videos. If you like it, connecting is read-only and you can remove it in one click from your Google account. |
| "YouTube Studio already shows this" | Studio shows the numbers. The read says which video beat your usual, the likely reason, and what to post next, in Telugu/Hindi. Let me show you on yours; if it says nothing new, tell me. |
| "vidIQ didn't help me" | Most tools give keyword scores in English. This is one page about your own last 10 videos. No sign-up. |
| "My channel earns nothing yet, I can't pay" | You don't pay. Design partners use it free for life; I only ask for honest feedback. |
| "No time for another dashboard" | That's why the main thing is a short report every Monday by email (WhatsApp soon). Nothing to open. |

Never promise growth, numbers or results. Never pressure. Never invent other creators' results.

## 4. The free channel read (what they said yes to)

Use Admin tools on their **public** channel (no access needed): Competitors (add their channel), Breakout
ideas in their niche, Trend Radar in their language. Then write ONE page, in their language if they wrote in
it, plain text:

```
<Name>, here's the read on your last 10 videos.

1. What worked: "<video>" got <views> views, about <N> times your typical video lately. Likely why: <one reason
   from title/topic/format/length you can point to>.
2. What didn't: "<video>" got <views>. Likely why: <one reason>.
3. What I'd post next: <one concrete video idea and title> because <reason from 1 and the trend data>.

If this was useful, Mitra can send you this every Monday from your own analytics (read-only, free for you as a
design partner): <link>. And if it wasn't, tell me what was missing.
```

Rules: numbers only from YouTube's public counts; label any comparison as your own reading ("about 3 times your
typical video"), never as a YouTube metric; no made-up reasons. One link only, in this second email.

## 5. One follow-up, then stop

If no reply after 5 days, send ONE bump, two sentences, new value, same thread, e.g. "Still happy to send the
read on your last 10 videos, <Name>. Takes me a day, costs you nothing." Then stop for good. (Harvey suggests
longer sequences; our rule is one follow-up, see `creator-app/docs/PROSPECTING.md`.)

## 6. Weekly review (Monday, 20 minutes)

From Admin → Prospects (statuses) and Admin → Users → **What creators told us** (the in-app interview):

- Funnel: contacted → replied → said yes → read sent → connected → answered interview → paying.
  Healthy first targets: reply ≥10%, yes ≥5% of contacted, connected ≥50% of reads sent.
- What creators said: top "hardest thing", what they use today, where they want Mitra (WhatsApp vs email),
  what they'd pay, and their own words. Pick **one** thing to build or change this week because of it.
- Everyone who said "yes, call me": the co-founder calls within 48 hours using
  `founder/` interview script (Creator discovery interviews doc) and logs notes on the prospect.

Write the review to `founder/outreach-log.md` (date, numbers, the one decision) so the next review can compare.

## Never

- Scrape YouTube pages, guess or buy emails, or send to anyone who said stop.
- Send more than ~30 a day from a new mailbox, or add tracking pixels or attachments.
- Use simulated panel quotes as testimonials, or invent results.
- Send in bulk without a human reading each email.
