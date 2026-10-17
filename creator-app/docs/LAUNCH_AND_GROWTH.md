# Launch plan, competition and how Mitra makes creators grow

October 2026. Written before the first public beta.

## 1. Launch: private beta first (recommended, and partly forced)

**Why not open the doors now.** Google only lets an *unverified* app with YouTube scopes be used by test users we
add by hand, at most 100 for the life of the project. Anyone else who clicks "Connect YouTube" gets Google's
"Access blocked" page. Google verification usually takes a few weeks. So a public launch today would mostly show
people an error.

**What we do instead (built):** the site runs in **invite-only mode** (`NEXT_PUBLIC_INVITE_ONLY`, on by default).
- Landing and login offer **Get early access** (email, name, channel, language, WhatsApp). Each person sees their
  place in line and a "share with a creator friend" WhatsApp button.
- **Admin → Waitlist**: pick creators → *Copy emails* → paste into Google Auth Platform → Audience → Test users →
  *Invite* (email goes out; WhatsApp button for those who gave a number). "Joined" shows who signed up.

**Beta shape: 3 waves, 4–6 weeks**
| Wave | Who | Size | Goal |
| --- | --- | --- | --- |
| 0 | Friends, 2–3 creators you can call | 5 | Find bugs, watch them use it on their phone |
| 1 | Hand-picked via *Find creators* (1K–50K subs, Hindi/Telugu/Tamil) | 25 | Does the Monday report change what they post? |
| 2 | Waitlist, by language and niche | 50–70 | Retention and willingness to pay |

Keep ~10 of the 100 test-user slots spare until verification lands.

**Measure every week** (admin AI costs page + a simple sheet until we build the churn page):
- *Activation*: connected YouTube **and** WhatsApp within 24h (target 70%).
- *Week-2 retention*: opened the dashboard or replied on WhatsApp in week 2 (target 60%).
- *Report engagement*: tapped "Full report" / downloaded the PDF (target 50% of reports).
- *Acted on advice*: used a suggested title/idea (ask in WhatsApp: "Did you try it? 👍/👎").
- *Pay intent*: "Would you pay ₹99 for this?" at week 3 (target 40% yes); offer Pro early to test it for real.
- *Proof*: 3–5 creators with a before/after number we can quote (with permission).

**Go public when:** Google verification approved, week-2 retention ≥ 50%, no open critical bugs, 3 real
testimonials. Then set `NEXT_PUBLIC_INVITE_ONLY=0` and the waitlist turns into open sign-up.

**Start Google verification now** (Google Auth Platform → Branding/Data access → Publish app → Prepare for
verification): home page, privacy policy and terms links (done), domain ownership (needs our own domain, a
reason to buy `mitracreators.com` soon), a short demo video showing the consent screen and how each YouTube scope
is used, and a written justification per scope.

## 2. ViewStats (MrBeast) vs Mitra

ViewStats is the best-known analytics tool from MrBeast's team: Pro is around **$49.99/month** (~₹4,200),
with a Business tier above it.

| ViewStats has | Mitra today | Worth copying? |
| --- | --- | --- |
| **Outlier score**: each video vs the channel's last ~9 | Video check compares new uploads with the channel's own first-2-days | **Yes, cheap.** Show an outlier score on every video and on competitors' videos |
| Outlier search across YouTube ("what over-performed in my niche") | Trend Radar (trending by language) | **Yes.** "Breakout videos in your niche + language this month" → ideas |
| Thumbnail search / library | Thumbnail Studio (make) | Later: a gallery of top thumbnails in their niche and language |
| Competitor title/thumbnail **change history** | Competitor compare (snapshot) | **Yes.** Daily snapshot of tracked channels → "they changed the thumbnail, views +40%" |
| Alerts | WhatsApp reports | We're ahead: alerts land on WhatsApp, not email |
| Historic subscriber/view graphs for any channel | Competitor stats (current) | Medium: needs daily snapshots (same job as above) |
| A/B thumbnail data | Advice to use YouTube's own Test & compare | Read the results of YouTube's test once the API allows |

**Where Mitra wins:** it speaks their language (ViewStats is English-only); it reads the creator's *own* private
analytics (retention, traffic sources, cities) and **says what to do**, not just what happened; it lives on
WhatsApp; it costs ₹99 vs ~₹4,200. Reviewers also note ViewStats "doesn't make a single video": it's analytics
for experts. Our creators need a manager, not a dashboard.

## 3. How Mitra actually makes a channel grow

Growth = **Discovery** (impressions × click-through) × **Retention** (how long they watch) × **Return**
(subscribe, come back) × **Consistency** (upload rhythm). Every Mitra feature should move one of these, and every
week Mitra should give **one** clear action, then check whether it worked.

| Lever | What Mitra does now | Next |
| --- | --- | --- |
| Discovery | Titles & thumbnails in their language, trend ideas, search terms viewers used | Outlier ideas from their niche; title/thumbnail test plans with YouTube's Test & compare |
| Retention | Video Doctor on the retention curve; 2-day check | **Moment map** (below): the exact sentence where people left |
| Return | Comment insights, slang, audience persona | Reply suggestions; series and playlist plans; community-post ideas |
| Consistency | Monday report nudges; streaks | Upload calendar with reminders on WhatsApp; "best time to post" from their audience |

**Close the loop (the retention engine):** suggestion → creator uses it → Mitra measures the next video →
celebrates or adjusts. The monthly "Mitra receipt" (roadmap #2) makes this visible: "you used 4 of our ideas;
those videos got 1.8× your usual views."

## 4. Reading the video itself, not just the numbers

YouTube Analytics tells us *when* viewers left; the video tells us *why*. Three steps, cheapest first:

1. **Transcript-aligned retention ("Moment map")** — get the words spoken at each second:
   - From YouTube captions of the creator's own videos (`captions.download`, needs the `youtube.force-ssl`
     scope; YouTube auto-captions now cover most Indian languages). This adds a broader scope to Google's review,
     so request it in a second verification round after the first approval.
   - Or the creator uploads the audio/MP4 and we transcribe it (Sarvam speech-to-text, ~₹30 per hour of audio),
     which also works **before** publishing.
   Then: overlay drops and spikes on the transcript → "at 0:42 you said 'before that, a quick story…' and 18%
   left; cut straight to the result". One small AI call per video.
2. **Pre-publish check** — upload the draft → hook strength (first 15s), pacing (words per minute vs their best
   videos), length vs their audience's watch time, title/thumbnail match with what's said. Sold as a Pro feature.
3. **Visual moments** — sample frames around big drops (the creator uploads the file; YouTube's API doesn't give
   the video) → "the screen stayed on a static slide for 25s here". Only once 1 and 2 prove valuable.

## 5. What to build next (after the beta starts)

1. ~~**Outlier score + breakout ideas**~~ **Built** (October 2026): × badges on Overview and Video Doctor, the
   Monday report's "star" is now the biggest outlier, and **Breakout ideas** (`/dashboard/ideas`) shows tracked
   competitors' 2×+ videos and a niche search, then turns them into 5 ideas (1 credit, free on the Founder Pass).
2. **Moment map via creator upload** (no new Google scope needed) → then captions once verified.
3. **Competitor change tracker** (daily snapshots) + alerts on WhatsApp.
4. **Monthly Mitra receipt** (proves our value; key for retention and pricing).
5. **Churn-risk list** for the founder to call people personally during the beta.
6. **Pause plan / annual plan / exit survey** before paid plans open.
7. **Telugu and Tamil bot words and templates** reviewed by native speakers.

## 6. Outlier score: how it works

- **Score** = a video's views ÷ the median views of the channel's previous 9 uploads **of the same kind** (Shorts
  vs Shorts, long vs long; never mixed, since Shorts routinely get 10× the views). Needs 3 earlier uploads.
  Labels: ≥3× breakout, ≥1.5× above usual, 0.67–1.5× usual, below that below usual. Under 7 days old = "so far".
- **Competitor breakouts**: the same score on tracked channels' last 15 uploads (≥2×, at least 2 days old). Uses
  the snapshots the Competitors page already caches, so no extra YouTube quota.
- **Niche search**: YouTube search (`order=viewCount`, last 30 days, India, the creator's language), scored by
  views ÷ subscribers; channels under 1,000 subscribers and the creator's own channel are skipped. A search costs
  ~102 of our 10,000 daily quota units, so each creator gets **3 new searches a week**; repeats are cached for 7
  days and free. Kill switch: `YOUTUBE_SEARCH=0`. At 100 creators that's at most ~4,300 units/day; ask Google
  for more quota before opening the doors.

## 7. Should Mitra train its own ML model? (evaluation)

**Short answer: not yet. Statistics plus Claude gets most of the value now. We start collecting the right data
now so a model becomes possible at ~1,000 creators.**

| Approach | What it needs | Verdict now |
| --- | --- | --- |
| **Per-channel statistics** (outlier score, medians, pace vs usual, best day) | The creator's own data | **Doing it.** Exact, explainable, free, works from video #4 |
| **Claude on top of the numbers** (why it worked, ideas, coaching) | Good facts in the prompt | **Doing it.** Claude knows YouTube, Indian languages and culture; we feed it the numbers |
| **Our own predictive model** (e.g. "this title will get 2.3×") | Thousands of (idea → outcome) pairs across many channels | **Later.** With <100 creators it would learn noise |
| **Fine-tuning an LLM** | Lots of labelled good/bad advice | **No.** Prompting with examples is cheaper and moves faster |

**Why AI alone isn't "learning":** Claude doesn't remember past creators or learn from our results by itself. The
learning comes from *our* data loop: what we suggested → did they use it → what outlier score did that video get.
That loop is the moat; the model is replaceable.

**What to log next (small):** for each idea/title we generate: creator, idea text, source, date. When a later
upload's title matches an idea, link it and store that video's outlier score after 7 days. That gives the
"Mitra receipt" now ("your 3 Mitra ideas got 2.1× your usual") and a training set later.

**Once we have the data (~1,000 creators, ~10,000 scored uploads):**
1. A gradient-boosted model (LightGBM) predicting outlier score from title features (length, numbers, language
   mix, emotion), format, upload hour/day and topic cluster, used to *rank* Claude's suggestions.
2. Title embeddings to cluster topics per language and spot rising clusters early.
3. Best time to post per channel from its own audience (statistics, no ML needed).
4. Bandit testing of advice styles (which tips creators actually act on).

**YouTube policy limits (important):** the YouTube API Developer Policies don't allow combining creators'
*private* analytics across users (only the channel owner may see their own), estimating metrics YouTube doesn't
provide, or keeping a creator's data more than 7 days after they disconnect. So a cross-creator model may only use
**public** data (titles, public view counts) and our own records of suggestions and outcomes, with consent in the
privacy policy, and it must be checked against the policies before Google's audit. Per-creator statistics on
their own data (what we do now) are fine. Sources: developers.google.com/youtube/terms/developer-policies and
its developer-policies-guide.
