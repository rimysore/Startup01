# Making Mitra simple: plan for the Indian creator

Most of our creators are on a mid-range Android phone, often on patchy data, more at home in Hindi or
Telugu than in English, and have never used an "analytics tool". They want to be told what to do, in their
language, in one tap. If an app feels complicated, they don't complain; they just stop opening it.

## Principles
1. **One screen, one job.** Every screen answers one question ("Why did this video drop?", "What should I
   post next?"), with one big button.
2. **Tell, don't show.** Lead with the action ("Make the intro 10 seconds shorter"), and put charts behind it.
3. **Their words, not ours.** No CTR, AVD or impressions in the main UI: "how many people clicked",
   "how long people watched". Credits become "uses".
4. **Their language everywhere,** not only in AI answers: menus, buttons and errors too.
5. **Phone first.** Thumb-reachable bottom tabs, 48px tap targets, fast on 3G, light on data.
6. **Come to them.** The best screen is one they don't have to open: WhatsApp report, 48-hour check.
7. **Never trap them.** Cancel in one tap, no nagging, real numbers only (CCPA dark-pattern rules).

## Phase 1: quick wins (≈ 2–3 days)
- **Bottom tab bar on phones** with 5 tabs: Home · Videos (Video Doctor) · Ideas (titles, thumbnails,
  trends) · Audience · Me (plan, connections, language). The other pages stay, grouped under these.
- **"Today" card on Home**: one thing to do today, with one button. It replaces three cards competing for
  attention.
- **Plain-word pass** over every label, button and error (glossary below), and "credits" → "uses left".
- **Three-tap start**: Google sign-in → connect YouTube → straight to your first win (best video, or new
  subscribers) with confetti. Skip everything else until later.
- **Bigger text and buttons** on phones (16px base, 48px buttons); the language picker in the top bar
  shows the native script name.

## Phase 2: their language, everywhere (≈ 1 week)
- **Translate the app itself** (menus, buttons, empty states, errors) into Hindi, Hinglish, Telugu and Tamil
  first, then Marathi, Bengali, Kannada and Malayalam. A small dictionary file per language, reviewed by a
  native speaker; no AI needed at run time, so it costs nothing per use.
- One language setting drives both the app and Mitra's answers.
- **Short how-to clips** (30–60 seconds, in Hindi and Telugu) on each screen's empty state.

## Phase 3: no typing, no opening the app (with the Monday report)
- **WhatsApp first:** the Monday report and the 48-hour check arrive on WhatsApp, with one link back to the
  exact screen. Help and support on WhatsApp too.
- **Speak instead of type** in Ask Mitra and Video Doctor (speech-to-text, already planned).
- **Install to home screen** (PWA) so Mitra opens like an app without a Play Store download.

## Phase 4: low-end phones and slow networks
- Lite mode: no animations or blur, smaller images, fewer requests; switches on automatically on slow
  connections and on "Save data".
- Answers stay readable offline once loaded; clear "you're offline" messages.
- Test on a ₹10,000 Android phone on throttled 3G before every release.

## Glossary for the plain-word pass
| Now | Becomes |
| --- | --- |
| CTR / impressions click-through | People who clicked |
| Average view duration | How long people watched |
| Retention curve | Where people left |
| Traffic sources | Where viewers found you |
| AI credits | Uses left this month |
| Connections | Your YouTube |
| Plan & billing | My plan |

## How we'll know it's simpler
- Time from sign-in to the first "aha" screen under 60 seconds.
- Share of new creators who come back in week 2.
- Fewer support questions starting "how do I…".
- Watch 5 real creators use it on their own phones each month, silently; fix whatever they get stuck on.
