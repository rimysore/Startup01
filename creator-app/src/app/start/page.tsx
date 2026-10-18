import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/SiteFooter";
import { COMPANY, WHATSAPP_LOCKED } from "@/lib/company";

export const metadata: Metadata = {
  title: "Get started — Mitra",
  description: "Set up Mitra in 3 minutes: sign in with Google, connect your YouTube channel, and get your weekly report on WhatsApp.",
};

/** Set NEXT_PUBLIC_GOOGLE_VERIFIED=1 once Google approves the YouTube scopes, to drop the "unverified app" step. */
const GOOGLE_VERIFIED = process.env.NEXT_PUBLIC_GOOGLE_VERIFIED === "1";

const STEPS: { title: string; time: string; body: React.ReactNode }[] = [
  {
    title: "Sign in with Google",
    time: "30 seconds",
    body: (
      <>
        Open <b>trymitraapp.com</b> on your phone or laptop and tap <b>Sign in with Google</b>. Use the Google account that owns your YouTube
        channel. Then pick the language you want Mitra to talk to you in (you can change it any time with the 🌐 button).
      </>
    ),
  },
  {
    title: "Connect your YouTube channel",
    time: "1 minute",
    body: (
      <>
        Go to <b>Connections</b> → <b>Connect YouTube</b> and allow access. Mitra can only <b>read</b> your numbers; it can never upload, delete
        or change anything on your channel.
        {!GOOGLE_VERIFIED && (
          <span className="mt-3 block rounded-xl bg-surface-2 p-3 text-sm">
            <b>Seeing &ldquo;Google hasn&apos;t verified this app&rdquo;?</b> That&apos;s normal while Google reviews Mitra. Tap <b>Advanced</b>, then{" "}
            <b>Go to trymitraapp.com</b>, then <b>Continue</b>.
          </span>
        )}
      </>
    ),
  },
  {
    title: WHATSAPP_LOCKED ? "Get your Monday report" : "Get your report on WhatsApp",
    time: WHATSAPP_LOCKED ? "nothing to do" : "1 minute",
    body: WHATSAPP_LOCKED ? (
      <>
        Your <b>weekly report arrives by email every Monday morning</b>, in your language, with a PDF you can save. Reports on WhatsApp are
        coming soon; we&apos;ll let you know when you can connect.
      </>
    ) : (
      <>
        Open <b>WhatsApp &amp; reports</b> and tap <b>Connect WhatsApp</b>. WhatsApp opens with a message like <code>JOIN 123456</code>: just press send.
        Mitra replies with a menu. From then on you get your <b>weekly report every Monday morning</b> and a <b>check on every new video</b> two days
        after you upload it. Send <b>menu</b> any time, or just type a question.
      </>
    ),
  },
  {
    title: "Try your first win",
    time: "2 minutes",
    body: (
      <>
        <b>Overview</b> shows how each video did against your usual (the × badges). Open <b>Title Studio</b>, describe your next video, and get titles
        based on what&apos;s already working on YouTube, plus a thumbnail. Stuck? Tap the <b>✨ Ask Mitra</b> button on any page.
      </>
    ),
  },
];

const FAQ: [string, React.ReactNode][] = [
  ["Do I need to install an app?", <>No. Mitra works in your phone&apos;s browser. To keep it one tap away, open it in Chrome → ⋮ menu → <b>Add to Home screen</b> (iPhone: Safari → Share → <b>Add to Home Screen</b>).</>],
  ["Is it really free?", <>Yes. Every creator gets the Free plan, and the first 100 are Founding Creators: 50 extra free uses a month of the everyday features, for life. No card needed.</>],
  ["Is my channel safe?", <>Mitra has read-only access and only you see your dashboard. To answer you, parts of your channel data are processed by our AI and hosting providers (listed in our <a className="underline" href="/privacy">privacy policy</a>). Disconnect any time in Connections, and we delete your YouTube data.</>],
  ["Which languages?", <>Hindi, Hinglish, Telugu, Tamil, Marathi, Bengali, Kannada, Malayalam and English, on the website and on WhatsApp.</>],
  ["Something not working?", <>Email <a className="underline" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> or reply to the email you got from us. It comes straight to the founder.</>],
];

export default function StartPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Mitra home">
          <Logo />
        </Link>
        <Link href="/login?next=/dashboard/connections" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg">
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Get started</p>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Set up Mitra in about 3 minutes</h1>
        <p className="mt-3 text-ink-2">No app to install. All you need is the Google account that owns your YouTube channel{WHATSAPP_LOCKED ? "" : ", and WhatsApp"}.</p>

        <ol className="mt-8 space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card flex gap-4 !p-5">
              <span className="bg-brand grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-bold text-white">{i + 1}</span>
              <div className="min-w-0">
                <h2 className="flex flex-wrap items-baseline gap-x-3 font-semibold">
                  {s.title} <span className="text-xs font-normal text-muted">{s.time}</span>
                </h2>
                <div className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/login?next=/dashboard/connections" className="bg-brand rounded-full px-6 py-3.5 text-center font-bold text-white">
            Start now: sign in with Google
          </Link>
          <a href={`mailto:${COMPANY.supportEmail}?subject=Help%20setting%20up%20Mitra`} className="rounded-full border border-line px-6 py-3.5 text-center font-semibold">
            Need help? Email us
          </a>
        </div>

        <h2 className="mt-14 font-display text-3xl">Questions</h2>
        <dl className="mt-4 divide-y divide-line">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-4">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-sm text-ink-2">{a}</dd>
            </div>
          ))}
        </dl>
      </main>
      <SiteFooter />
    </div>
  );
}
