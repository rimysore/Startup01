import { z } from "zod";

/**
 * The in-app interview, shared by the form, the API and the admin summary. Short on purpose (about a minute):
 * multiple choice where we want counts, one or two free answers where we want their words.
 */
export const INTERVIEW = {
  // The beta's paying market is creators who already earn and people who manage channels; beginners stay free.
  who: {
    q: "Which describes you best?",
    multi: false,
    options: {
      earning: "I earn from YouTube (AdSense or brand deals)",
      manager: "I manage channels for others (agency or manager)",
      starting: "I'm just starting out",
    },
  },
  hardest: {
    q: "What's hardest about growing your channel right now?",
    multi: true,
    options: {
      ideas: "Knowing what to post next",
      views: "My views dropped or are stuck",
      packaging: "Titles and thumbnails that get clicks",
      time: "Finding time to post regularly",
      audience: "Understanding what my audience wants",
      money: "Earning from it (monetisation, brand deals)",
    },
  },
  tried: {
    q: "What do you use today to grow?",
    multi: true,
    options: {
      studio: "YouTube Studio",
      vidiq: "vidIQ or TubeBuddy",
      chatgpt: "ChatGPT or Gemini",
      gurus: "Growth tips videos",
      friends: "Creator friends or groups",
      nothing: "Nothing yet",
    },
  },
  weekly: {
    q: "What would make Mitra worth opening every week?",
    free: true,
  },
  where: {
    q: "Where should Mitra reach you?",
    multi: false,
    options: { whatsapp: "WhatsApp", email: "Email", app: "Only when I open the app" },
  },
  pay: {
    q: "If Mitra clearly helped your views grow, what would you pay a month?",
    multi: false,
    options: { "0": "Nothing, only if free", "99": "₹99", "299": "₹299", "499": "₹499 or more" },
  },
  call: {
    q: "Can the founder call or WhatsApp you for 15 minutes about your channel?",
    multi: false,
    options: { yes: "Yes", no: "Not now" },
  },
} as const;

export type QuestionId = keyof typeof INTERVIEW;
export const QUESTION_IDS = Object.keys(INTERVIEW) as QuestionId[];

const pick = (id: QuestionId) => {
  const def = INTERVIEW[id];
  if ("free" in def) return z.string().trim().max(1000).optional();
  const keys = Object.keys(def.options) as [string, ...string[]];
  return def.multi ? z.array(z.enum(keys)).max(keys.length).optional() : z.enum(keys).optional();
};

export const InterviewBody = z.object({
  who: pick("who"),
  hardest: pick("hardest"),
  tried: pick("tried"),
  weekly: pick("weekly"),
  where: pick("where"),
  pay: pick("pay"),
  call: pick("call"),
  /** Free text: their own words on anything else, and a number if they said yes to a call. */
  other: z.string().trim().max(1000).optional(),
  phone: z.string().trim().max(30).optional(),
});
export type InterviewAnswers = z.infer<typeof InterviewBody>;

/** The label for a stored answer (an option key, or free text as is). */
export function answerLabel(id: QuestionId, value: string): string {
  const def = INTERVIEW[id];
  return "options" in def ? ((def.options as Record<string, string>)[value] ?? value) : value;
}
