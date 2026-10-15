export const LANGUAGES = [
  { code: "hinglish", label: "Hinglish", native: "Hinglish", script: "Latin", writing: "Roman (Latin) letters, Hindi and English mixed the way creators talk, e.g. 'Ye phone kaisa hai?'" },
  { code: "hi", label: "Hindi", native: "हिन्दी", script: "Devanagari", writing: "Devanagari script (हिन्दी)" },
  { code: "te", label: "Telugu", native: "తెలుగు", script: "Telugu", writing: "Telugu script (తెలుగు)" },
  { code: "ta", label: "Tamil", native: "தமிழ்", script: "Tamil", writing: "Tamil script (தமிழ்)" },
  { code: "mr", label: "Marathi", native: "मराठी", script: "Devanagari", writing: "Marathi in Devanagari script (मराठी)" },
  { code: "bn", label: "Bengali", native: "বাংলা", script: "Bengali", writing: "Bengali script (বাংলা)" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", script: "Kannada", writing: "Kannada script (ಕನ್ನಡ)" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", script: "Malayalam", writing: "Malayalam script (മലയാളം)" },
  { code: "en", label: "English", native: "English", script: "Latin", writing: "English" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "Hinglish";
}

/** How text in this language should be written, for the AI's instructions. */
export function languageWriting(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.writing ?? LANGUAGES[0].writing;
}

export function isLanguageCode(code: unknown): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

const SCRIPTS = ["Devanagari", "Telugu", "Tamil", "Bengali", "Kannada", "Malayalam", "Latin"] as const;
type Script = (typeof SCRIPTS)[number];
const SCRIPT_RE: Record<Script, RegExp> = {
  Devanagari: /\p{Script=Devanagari}/u,
  Telugu: /\p{Script=Telugu}/u,
  Tamil: /\p{Script=Tamil}/u,
  Bengali: /\p{Script=Bengali}/u,
  Kannada: /\p{Script=Kannada}/u,
  Malayalam: /\p{Script=Malayalam}/u,
  Latin: /\p{Script=Latin}/u,
};

/** Letters per script in `text` (digits, emoji and punctuation ignored). */
function scriptCounts(text: string): Record<Script, number> {
  const counts = Object.fromEntries(SCRIPTS.map((s) => [s, 0])) as Record<Script, number>;
  for (const ch of text) {
    if (!/\p{L}|\p{M}/u.test(ch)) continue;
    const s = SCRIPTS.find((sc) => SCRIPT_RE[sc].test(ch));
    if (s) counts[s]++;
  }
  return counts;
}

/** True when most letters in `text` are in the script expected for `language`. Empty text passes. */
export function matchesLanguage(language: string, text: string): boolean {
  const lang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  const counts = scriptCounts(text);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return total === 0 || counts[lang.script] / total >= 0.5;
}

const HINGLISH_WORDS = /\b(hai|hain|kya|kaise|kaisa|nahi|nahin|mein|aur|bhai|yaar|wala|wali|kar|karo|ke|ki|ka|se|ko|ye|yeh|sabse|kitna|kyun)\b/i;
const AUDIO_CODES: Record<string, LanguageCode> = { hi: "hi", te: "te", ta: "ta", mr: "mr", bn: "bn", kn: "kn", ml: "ml", en: "en" };

/**
 * Best guess at a video's language from its title (script) and YouTube's declared audio language.
 * Devanagari defaults to Hindi (Marathi only when YouTube says so); Hindi audio with a Roman title is Hinglish.
 */
export function detectLanguage(title: string, audioLanguage?: string | null): LanguageCode | null {
  const audio = audioLanguage ? AUDIO_CODES[audioLanguage.toLowerCase().split("-")[0]] : undefined;
  const counts = scriptCounts(title);
  const [top] = (Object.entries(counts) as [Script, number][]).sort((a, b) => b[1] - a[1]);
  if (!top || top[1] === 0) return audio ?? null;
  const byScript: Partial<Record<Script, LanguageCode>> = { Telugu: "te", Tamil: "ta", Bengali: "bn", Kannada: "kn", Malayalam: "ml" };
  if (byScript[top[0]]) return byScript[top[0]]!;
  if (top[0] === "Devanagari") return audio === "mr" ? "mr" : "hi";
  // Latin title
  if (audio === "hi" || HINGLISH_WORDS.test(title)) return "hinglish";
  if (audio && audio !== "en") return audio;
  return "en";
}
