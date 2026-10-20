import type { WeeklyCoach } from "../ai";

/**
 * The headings of the Monday report (PDF, email and WhatsApp). English, Hinglish and Hindi are written by hand;
 * other languages get them translated by the AI with the report itself, and anything missing falls back to English.
 */
export interface ReportLabels {
  report: string;
  views: string;
  watchTime: string;
  subscribers: string;
  wins: string;
  fixes: string;
  next: string;
  milestone: string;
  videoOfWeek: string;
  usual: string;
  thisWeek: string;
  lastWeek: string;
  uploads: string;
  recent: string;
  daysAgo: string;
  watched: string;
}

const EN: ReportLabels = {
  report: "Your week",
  views: "Views",
  watchTime: "Watch hours",
  subscribers: "New subscribers",
  wins: "What went well",
  fixes: "Fix this week",
  next: "This week's one move",
  milestone: "to your next milestone",
  videoOfWeek: "Video of the week",
  usual: "your usual",
  thisWeek: "This week",
  lastWeek: "Last week",
  uploads: "uploads this week",
  recent: "Latest uploads",
  daysAgo: "days ago",
  watched: "watched",
};

const LABELS: Record<string, Partial<ReportLabels>> = {
  en: EN,
  hinglish: {
    report: "Aapka hafta",
    subscribers: "Naye subscribers",
    wins: "Kya accha gaya",
    fixes: "Is hafte sudhaaro",
    next: "Is hafte ka ek kaam",
    milestone: "agle milestone tak",
    videoOfWeek: "Hafte ka best video",
    usual: "aapke usual se",
    thisWeek: "Is hafte",
    lastWeek: "Pichle hafte",
    uploads: "uploads is hafte",
    recent: "Latest uploads",
    daysAgo: "din pehle",
    watched: "dekha gaya",
  },
  hi: {
    report: "आपका हफ्ता",
    views: "व्यूज़",
    watchTime: "देखने के घंटे",
    subscribers: "नए सब्सक्राइबर",
    wins: "क्या अच्छा रहा",
    fixes: "इस हफ्ते सुधारें",
    next: "इस हफ्ते का एक काम",
    milestone: "अगले माइलस्टोन तक",
    videoOfWeek: "हफ्ते का सबसे अच्छा वीडियो",
    usual: "आपके आम से",
    thisWeek: "इस हफ्ते",
    lastWeek: "पिछले हफ्ते",
    uploads: "अपलोड इस हफ्ते",
    recent: "हाल के वीडियो",
    daysAgo: "दिन पहले",
    watched: "देखा गया",
  },
};

export function reportLabels(language: string, coach?: Pick<WeeklyCoach, "labels">): ReportLabels {
  const own = LABELS[language];
  // Our own translations win; the AI's fill in languages we haven't written by hand.
  return { ...EN, ...(own ? {} : (coach?.labels ?? {})), ...(own ?? {}) } as ReportLabels;
}

/** Short weekday names in the creator's language ("Mon", "सोम"). */
export function weekday(date: string, language: string): string {
  const locale = language === "hinglish" || language === "en" ? "en-IN" : `${language}-IN`;
  try {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" });
  } catch {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
  }
}
