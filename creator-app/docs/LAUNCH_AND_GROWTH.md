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

1. **Outlier score + breakout ideas** in their niche and language (ViewStats' best feature, cheap with data we
   have) — also in the Monday report.
2. **Moment map via creator upload** (no new Google scope needed) → then captions once verified.
3. **Competitor change tracker** (daily snapshots) + alerts on WhatsApp.
4. **Monthly Mitra receipt** (proves our value; key for retention and pricing).
5. **Churn-risk list** for the founder to call people personally during the beta.
6. **Pause plan / annual plan / exit survey** before paid plans open.
7. **Telugu and Tamil bot words and templates** reviewed by native speakers.
