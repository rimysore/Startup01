# Opening sign-in to everyone and getting Google's approval

Mitra asks Google for two kinds of access, and they behave differently:

| Step | Scopes | Needs Google review? |
| --- | --- | --- |
| **Sign in** | `openid`, `email`, `profile` | **No.** Works for anyone as soon as the app is published |
| **Connect YouTube** | `youtube.readonly`, `yt-analytics.readonly` (both "sensitive", not "restricted") | **Yes.** Until approved, people see "Google hasn't verified this app" (they can continue via *Advanced*), and at most 100 people can connect in total |

Sensitive scopes need brand + scope verification only (no paid security assessment, which is for "restricted"
scopes like Gmail). Google usually answers in 3–7 working days, sometimes a few weeks if they ask questions.

## Step 1: publish (today, 2 minutes)

Google Cloud → **Google Auth Platform → Audience → Publish app → Confirm**. Sign-in now works for everyone.
Then in Vercel set `NEXT_PUBLIC_INVITE_ONLY=0` and redeploy: the site switches from the waitlist to open sign-up.
(Keep it `1` if you'd rather keep inviting people in waves while verification runs.)

## Step 2: get everything Google checks ready

- [x] Home page explaining what Mitra does: https://trymitraapp.com
- [x] Privacy policy on the same domain, with the Limited Use statement: https://trymitraapp.com/privacy
- [x] Terms: https://trymitraapp.com/terms
- [x] Read-only scopes only, requested when the creator presses Connect YouTube (not at sign-in)
- [x] Revoking: Disconnect and Delete account revoke Google's token and delete YouTube data
- [ ] **Domain verified** in Google Search Console (Domain property `trymitraapp.com`, TXT record at your registrar),
      using the same Google account that owns the Cloud project
- [ ] **Branding page** (Google Auth Platform → Branding): app name "Mitra", logo 120×120 PNG (the Mitra mark),
      support email mitracontentsupport@gmail.com, home/privacy/terms links above, authorized domain `trymitraapp.com`
- [ ] **Demo video** (below), uploaded to YouTube as *Unlisted*
- [ ] **Scope justifications** (below), pasted under Data Access

## Step 3: scope justifications (paste these)

**`https://www.googleapis.com/auth/youtube.readonly`**
> Mitra is a growth assistant for YouTube creators. After the creator connects their own channel, we read their
> channel details, their recent uploads (titles, publish dates, durations, view/like/comment counts) and the top
> comments on their videos. We show these on their dashboard, compare each video with the channel's usual
> performance, and use them to give the creator personal advice (title ideas, what to post next, comment
> summaries). We only read; we never upload, edit or delete anything. Data is shown only to the channel owner.

**`https://www.googleapis.com/auth/yt-analytics.readonly`**
> We read the connected channel's own YouTube Analytics: daily views, watch time and subscribers gained, audience
> retention for a video the creator selects, traffic sources, top search terms and viewer geography. These power
> the creator's weekly report (on WhatsApp/email and as a PDF), the "Video Doctor" view that shows where viewers
> stopped watching, and the Audience page. Analytics are only shown to the channel owner and are never combined
> with other users' data or sold.

## Step 4: demo video (2–3 minutes, screen recording with your voice or captions)

Google wants to see the consent screen and every scope in use. Record in one take on trymitraapp.com:

1. Open https://trymitraapp.com, show the URL bar. Click **Sign in with Google**, pick the account.
2. Go to **Connections → Connect YouTube**. On Google's screen, **show the app name and the two YouTube
   permissions clearly**, and the URL (trymitraapp.com). Allow.
3. **Overview**: the channel's numbers and recent uploads (youtube.readonly + analytics).
4. **Video Doctor**: pick a video, show the retention curve (yt-analytics.readonly).
5. **Audience**: traffic sources, cities, search terms (yt-analytics.readonly).
6. **Comments**: top comments summary (youtube.readonly).
7. **WhatsApp & reports**: the weekly report / PDF.
8. **Connections → Disconnect** (and mention **Plan & billing → Delete account**): access is revoked.

Say in the video: "Mitra only reads this data, shows it only to the channel owner, and never shares or sells it."

## Step 5: submit

Google Auth Platform → **Verification Center → Prepare for verification → Submit**. Watch the support inbox:
Google replies there, and slow replies are the usual reason verification drags on.

## After approval

Set `NEXT_PUBLIC_GOOGLE_VERIFIED=1` in Vercel and redeploy: the "unverified app" tip on the Connections page
disappears.
