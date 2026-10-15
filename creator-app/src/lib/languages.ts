export const LANGUAGES = [
  { code: "hinglish", label: "Hinglish", native: "Hinglish" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "en", label: "English", native: "English" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "Hinglish";
}

export function isLanguageCode(code: unknown): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}
