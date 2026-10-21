/**
 * "Paste an offer": plain rules that read a brand or shop's message to a creator and list what's clear, what's
 * risky and what's missing, plus a reply asking for the missing terms in English or Kannada. No AI, so it is
 * instant, free and predictable; the deal room can add an AI read later.
 */

export type OfferLang = "en" | "kn";
export type CheckState = "ok" | "warn" | "missing";
export type OfferTerm = "pay" | "deliverables" | "date" | "timing" | "usage" | "exclusive" | "disclosure";
export type OfferCheck = { term: OfferTerm; state: CheckState; text: string };

const MONEY = /(₹|rs\.?|inr|rupees?|ರೂ)\s?\d[\d,]*(\.\d+)?\s?(k|l|lakh)?|\b\d[\d,]*(\.\d+)?\s?(k|lakh)?\s?(₹|rs\.?|inr|rupees?|ರೂಪಾಯಿ)/i;
const BARTER = /\b(free|barter|complimentary|hamper|voucher|gift|meal|treat|product)\b|ಉಚಿತ/i;
const EXPOSURE = /\b(exposure|visibility|shout ?out|promotion for you)\b/i;
const DELIVERABLE = /(?<![a-z])(\d+|one|two|three|a|an)?\s*(reels?|posts?|stories|story|shorts?|videos?|vlogs?|carousels?|ರೀಲ್|ಸ್ಟೋರಿ|ಪೋಸ್ಟ್)(?![a-z])/gi;
const DATE = /\b(by|before|on|deadline|this (week|weekend)|next (week|weekend)|tomorrow|today|within \d+ days?|\d{1,2}(st|nd|rd|th)?\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))\b|ಒಳಗೆ|ನಾಳೆ/i;
const TIMING = /\b(advance|upfront|up front|before posting|after posting|on delivery|within \d+ (working )?days|net ?\d+|50 ?%|half now)\b|ಮುಂಗಡ/i;
const USAGE = /\b(usage rights?|repost|boost|whitelist|run (it |the video )?as (an? )?ads?|use (the|your) (video|content|reel)|ads? on (our|their) page|paid promotion)\b/i;
const EXCLUSIVE = /\b(exclusive|exclusivity|no other (brand|cafe|café|restaurant)s?|competitors?)\b/i;
const DISCLOSURE = /(#ad\b|#sponsored|paid partnership|sponsored|disclos)/i;

/** "1 reel + 3 stories" → "1 reel, 3 stories", from what the message names. */
export function deliverables(text: string): string | null {
  const found = new Map<string, number>();
  for (const m of text.matchAll(DELIVERABLE)) {
    const raw = m[2].toLowerCase();
    const kind = /reel|ರೀಲ್/.test(raw) ? "reel" : /stor|ಸ್ಟೋರಿ/.test(raw) ? "story" : /short/.test(raw) ? "Short" : /vlog|video/.test(raw) ? "video" : "post";
    // "Post by Friday", "posting" or "use your video" aren't deliverables: posts, videos and Shorts need a count.
    if (!m[1] && (kind === "post" || kind === "video" || kind === "Short")) continue;
    const n = m[1] ? ({ one: 1, a: 1, an: 1, two: 2, three: 3 } as Record<string, number>)[m[1].toLowerCase()] ?? Number(m[1]) : 1;
    found.set(kind, Math.max(found.get(kind) ?? 0, n || 1));
  }
  if (!found.size) return null;
  return [...found].map(([k, n]) => `${n} ${n > 1 ? (k === "story" ? "stories" : `${k}s`) : k}`).join(", ");
}

export function checkOffer(raw: string): OfferCheck[] {
  const text = raw.trim();
  const out: OfferCheck[] = [];
  const money = text.match(MONEY);
  if (money) out.push({ term: "pay", state: "ok", text: `Pay is stated: ${money[0].trim()}.` });
  else if (EXPOSURE.test(text)) out.push({ term: "pay", state: "warn", text: "They offer \"exposure\", not money. Exposure doesn't pay rent: ask for a fee." });
  else if (BARTER.test(text)) out.push({ term: "pay", state: "warn", text: "Barter only (free food or products). Fine if it's worth it to you; otherwise ask for a fee as well." });
  else out.push({ term: "pay", state: "missing", text: "No pay mentioned. Ask what they'll pay before anything else." });

  const d = deliverables(text);
  out.push(d ? { term: "deliverables", state: "ok", text: `They want: ${d}.` } : { term: "deliverables", state: "missing", text: "It doesn't say what to post. Ask how many reels, posts or stories." });
  out.push(DATE.test(text) ? { term: "date", state: "ok", text: "A posting date is given." } : { term: "date", state: "missing", text: "No date. Agree when it goes live, so you can plan it." });
  out.push(
    TIMING.test(text)
      ? { term: "timing", state: "ok", text: "It says when you get paid." }
      : { term: "timing", state: "missing", text: "It doesn't say when you get paid. Ask for part in advance and the rest on posting." },
  );
  out.push(
    USAGE.test(text)
      ? { term: "usage", state: "warn", text: "They want to reuse your video. Agree for how long, and charge extra if it runs as an ad." }
      : { term: "usage", state: "missing", text: "Usage isn't mentioned. Agree they can't run your video as an ad without paying you." },
  );
  if (EXCLUSIVE.test(text)) out.push({ term: "exclusive", state: "warn", text: "They ask for exclusivity. Limit it (say 30 days) and get paid for it." });
  out.push(
    DISCLOSURE.test(text)
      ? { term: "disclosure", state: "ok", text: "They mention labelling it as paid. Good." }
      : { term: "disclosure", state: "warn", text: "Paid or gifted posts must be labelled (ASCI rules). Plan to use \"Paid partnership\"." },
  );
  return out;
}

const ASK: Record<OfferLang, Partial<Record<OfferTerm, string>> & { hi: string; bye: string }> = {
  en: {
    hi: "Thanks for reaching out! Before I confirm, could you share:",
    pay: "What fee are you offering for this?",
    deliverables: "How many reels, posts or stories do you need?",
    date: "By what date should it go live?",
    timing: "When is payment made? Could part of it be in advance?",
    usage: "Will you use my video as an ad? If so, for how long?",
    exclusive: "How long would the exclusivity last?",
    bye: "Thank you!",
  },
  // First draft: a native Kannada speaker checks these before launch.
  kn: {
    hi: "ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ಒಪ್ಪಿಕೊಳ್ಳುವ ಮೊದಲು ಇವನ್ನು ತಿಳಿಸುತ್ತೀರಾ:",
    pay: "ಈ ಕೆಲಸಕ್ಕೆ ಎಷ್ಟು ಹಣ ಕೊಡುತ್ತೀರಿ?",
    deliverables: "ಎಷ್ಟು ರೀಲ್, ಪೋಸ್ಟ್ ಅಥವಾ ಸ್ಟೋರಿಗಳು ಬೇಕು?",
    date: "ಯಾವ ದಿನಾಂಕದೊಳಗೆ ಪೋಸ್ಟ್ ಮಾಡಬೇಕು?",
    timing: "ಹಣ ಯಾವಾಗ ಕೊಡುತ್ತೀರಿ? ಸ್ವಲ್ಪ ಮುಂಗಡ ಸಿಗಬಹುದೇ?",
    usage: "ನನ್ನ ವೀಡಿಯೊವನ್ನು ಜಾಹೀರಾತಾಗಿ ಬಳಸುತ್ತೀರಾ? ಹಾಗಿದ್ದರೆ ಎಷ್ಟು ದಿನ?",
    exclusive: "ಈ exclusivity ಎಷ್ಟು ದಿನ ಇರುತ್ತದೆ?",
    bye: "ಧನ್ಯವಾದಗಳು!",
  },
};

/** A polite reply asking for every term that's missing or risky (disclosure is the creator's job, so it's left out). */
export function offerReply(checks: OfferCheck[], lang: OfferLang): string | null {
  const a = ASK[lang];
  const asks = checks
    .filter((c) => c.state !== "ok" && c.term !== "disclosure")
    .map((c) => a[c.term])
    .filter((s): s is string => Boolean(s));
  if (!asks.length) return null;
  return [a.hi, ...asks.map((s) => `• ${s}`), a.bye].join("\n");
}

/** Fields worth pre-filling in the deal log from an offer: the fee in whole rupees and what they want. */
export function offerFields(raw: string): { feeInr: number | null; deliverables: string | null } {
  const m = raw.match(MONEY);
  let feeInr: number | null = null;
  if (m) {
    const n = Number((m[0].match(/\d[\d,]*(\.\d+)?/)?.[0] ?? "").replace(/,/g, ""));
    const unit = /lakh|\bl\b/i.test(m[0]) ? 100_000 : /\d\s?k\b/i.test(m[0]) ? 1000 : 1;
    if (Number.isFinite(n) && n > 0) feeInr = Math.round(n * unit);
  }
  return { feeInr, deliverables: deliverables(raw) };
}
