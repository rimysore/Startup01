/**
 * The two WhatsApp templates Mitra sends outside the 24-hour window, as submitted to Meta for approval
 * (scripts/whatsapp-templates.mts). Category UTILITY: each is about the creator's own account and is only sent
 * because they turned it on. Variable order must match `template.params` in src/lib/reports/build.ts, and the
 * quick-reply order must match `template.buttons`.
 */

export interface TemplateDef {
  name: "mitra_weekly_report" | "mitra_video_check";
  language: string;
  body: string;
  example: string[];
  buttons: string[];
}

export const TEMPLATES: TemplateDef[] = [
  {
    name: "mitra_weekly_report",
    language: "en",
    body: "Hi {{1}}, your Mitra weekly report for {{2}} is ready.\n\n{{3}}\n\nBiggest win: {{4}}\nFix this week: {{5}}\n\nTap Full report for everything, including what to post next.",
    example: ["Rima", "6 Oct – 12 Oct", "👀 10.5K views (▲50%) · ⏱️ 525 hrs · 🙌 +140 subs", "Your street food video got 2.6x your usual views.", "Show the result in the first 10 seconds."],
    buttons: ["Full report", "Stop reports"],
  },
  {
    name: "mitra_video_check",
    language: "en",
    body: "{{1}}, here's how your new video \"{{2}}\" is doing after 2 days:\n\n{{3}}\n\nDo this now: {{4}}",
    example: ["Rima", "Rs 500 street food challenge", "🚀 4.2K views in 48h · 1.6× your usual (2.6K)", "Pin a comment asking viewers which city is next."],
    buttons: ["More tips", "New title ideas"],
  },
  {
    name: "mitra_weekly_report",
    language: "hi",
    body: "नमस्ते {{1}}, {{2}} की आपकी मित्र साप्ताहिक रिपोर्ट तैयार है।\n\n{{3}}\n\nसबसे बड़ी जीत: {{4}}\nइस हफ्ते सुधारें: {{5}}\n\nपूरी रिपोर्ट और अगले वीडियो का आइडिया देखने के लिए नीचे टैप करें।",
    example: ["रीमा", "6 Oct – 12 Oct", "👀 10.5K views (▲50%) · ⏱️ 525 hrs · 🙌 +140 subs", "स्ट्रीट फूड वीडियो को आपके आम व्यूज़ से 2.6 गुना व्यूज़ मिले।", "पहले 10 सेकंड में नतीजा दिखाइए।"],
    buttons: ["पूरी रिपोर्ट", "रिपोर्ट बंद करें"],
  },
  {
    name: "mitra_video_check",
    language: "hi",
    body: "{{1}}, आपका नया वीडियो \"{{2}}\" 2 दिन में ऐसा चल रहा है:\n\n{{3}}\n\nअभी यह करें: {{4}}",
    example: ["रीमा", "500 रुपये स्ट्रीट फूड चैलेंज", "🚀 4.2K views in 48h · 1.6× your usual (2.6K)", "एक कमेंट पिन करें और पूछें कि अगला शहर कौन सा हो।"],
    buttons: ["और टिप्स", "नए टाइटल"],
  },
];
