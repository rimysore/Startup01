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
  ...translated("te", {
    weekly: "నమస్తే {{1}}, {{2}} కి మీ మిత్ర వారపు రిపోర్ట్ సిద్ధంగా ఉంది.\n\n{{3}}\n\nపెద్ద విజయం: {{4}}\nఈ వారం సరిచేయండి: {{5}}\n\nపూర్తి రిపోర్ట్, తర్వాతి వీడియో ఐడియా కోసం కింద ట్యాప్ చేయండి.",
    weeklyButtons: ["పూర్తి రిపోర్ట్", "రిపోర్ట్స్ ఆపండి"],
    weeklyExample: ["మీ స్ట్రీట్ ఫుడ్ వీడియోకి మామూలు కంటే 2.6 రెట్లు వ్యూస్ వచ్చాయి.", "మొదటి 10 సెకన్లలోనే ఫలితం చూపించండి."],
    video: "{{1}}, మీ కొత్త వీడియో \"{{2}}\" 2 రోజుల్లో ఇలా ఉంది:\n\n{{3}}\n\nఇప్పుడు ఇది చేయండి: {{4}}",
    videoButtons: ["మరిన్ని టిప్స్", "కొత్త టైటిల్స్"],
    videoExample: ["హైదరాబాద్‌లో Rs 500 స్ట్రీట్ ఫుడ్ ఛాలెంజ్", "తర్వాత ఏ నగరం అని అడుగుతూ ఒక కామెంట్ పిన్ చేయండి."],
  }),
  ...translated("ta", {
    weekly: "வணக்கம் {{1}}, {{2}}-க்கான உங்கள் மித்ரா வார ரிப்போர்ட் தயார்.\n\n{{3}}\n\nபெரிய வெற்றி: {{4}}\nஇந்த வாரம் சரிசெய்யுங்கள்: {{5}}\n\nமுழு ரிப்போர்ட் மற்றும் அடுத்த வீடியோ ஐடியாவுக்கு கீழே தட்டவும்.",
    weeklyButtons: ["முழு ரிப்போர்ட்", "ரிப்போர்ட் நிறுத்து"],
    weeklyExample: ["உங்கள் ஸ்ட்ரீட் ஃபுட் வீடியோ வழக்கத்தை விட 2.6 மடங்கு வியூஸ் பெற்றது.", "முதல் 10 வினாடிகளில் முடிவைக் காட்டுங்கள்."],
    video: "{{1}}, உங்கள் புதிய வீடியோ \"{{2}}\" 2 நாட்களில் இப்படி போகிறது:\n\n{{3}}\n\nஇப்போது இதைச் செய்யுங்கள்: {{4}}",
    videoButtons: ["மேலும் டிப்ஸ்", "புது டைட்டில்கள்"],
    videoExample: ["சென்னையில் Rs 500 ஸ்ட்ரீட் ஃபுட் சேலஞ்ச்", "அடுத்த ஊர் எது என்று கேட்டு ஒரு கமெண்டை பின் செய்யுங்கள்."],
  }),
  ...translated("mr", {
    weekly: "नमस्कार {{1}}, {{2}} चा तुमचा मित्र साप्ताहिक रिपोर्ट तयार आहे.\n\n{{3}}\n\nसर्वात मोठं यश: {{4}}\nया आठवड्यात सुधारा: {{5}}\n\nपूर्ण रिपोर्ट आणि पुढच्या व्हिडिओची आयडिया पाहण्यासाठी खाली टॅप करा.",
    weeklyButtons: ["पूर्ण रिपोर्ट", "रिपोर्ट बंद करा"],
    weeklyExample: ["तुमच्या स्ट्रीट फूड व्हिडिओला नेहमीपेक्षा 2.6 पट व्ह्यूज मिळाले.", "पहिल्या 10 सेकंदात निकाल दाखवा."],
    video: "{{1}}, तुमचा नवा व्हिडिओ \"{{2}}\" 2 दिवसांत असा चाललाय:\n\n{{3}}\n\nआता हे करा: {{4}}",
    videoButtons: ["अजून टिप्स", "नवीन टायटल"],
    videoExample: ["पुण्यात Rs 500 स्ट्रीट फूड चॅलेंज", "पुढचं शहर कोणतं ते विचारणारी कमेंट पिन करा."],
  }),
  ...translated("bn", {
    weekly: "নমস্কার {{1}}, {{2}}-এর আপনার মিত্র সাপ্তাহিক রিপোর্ট তৈরি।\n\n{{3}}\n\nসবচেয়ে বড় সাফল্য: {{4}}\nএই সপ্তাহে ঠিক করুন: {{5}}\n\nপুরো রিপোর্ট আর পরের ভিডিওর আইডিয়া দেখতে নিচে ট্যাপ করুন।",
    weeklyButtons: ["পুরো রিপোর্ট", "রিপোর্ট বন্ধ করুন"],
    weeklyExample: ["আপনার স্ট্রিট ফুড ভিডিও সাধারণের চেয়ে 2.6 গুণ ভিউ পেয়েছে।", "প্রথম 10 সেকেন্ডে ফলাফল দেখান।"],
    video: "{{1}}, আপনার নতুন ভিডিও \"{{2}}\" 2 দিনে এভাবে চলছে:\n\n{{3}}\n\nএখন এটা করুন: {{4}}",
    videoButtons: ["আরও টিপস", "নতুন টাইটেল"],
    videoExample: ["কলকাতায় Rs 500 স্ট্রিট ফুড চ্যালেঞ্জ", "পরের শহর কোনটা জিজ্ঞেস করে একটা কমেন্ট পিন করুন।"],
  }),
  ...translated("kn", {
    weekly: "ನಮಸ್ಕಾರ {{1}}, {{2}} ರ ನಿಮ್ಮ ಮಿತ್ರ ವಾರದ ರಿಪೋರ್ಟ್ ಸಿದ್ಧವಾಗಿದೆ.\n\n{{3}}\n\nದೊಡ್ಡ ಗೆಲುವು: {{4}}\nಈ ವಾರ ಸರಿಪಡಿಸಿ: {{5}}\n\nಪೂರ್ಣ ರಿಪೋರ್ಟ್ ಮತ್ತು ಮುಂದಿನ ವಿಡಿಯೋ ಐಡಿಯಾಗಾಗಿ ಕೆಳಗೆ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    weeklyButtons: ["ಪೂರ್ಣ ರಿಪೋರ್ಟ್", "ರಿಪೋರ್ಟ್ ನಿಲ್ಲಿಸಿ"],
    weeklyExample: ["ನಿಮ್ಮ ಸ್ಟ್ರೀಟ್ ಫುಡ್ ವಿಡಿಯೋಗೆ ಸಾಮಾನ್ಯಕ್ಕಿಂತ 2.6 ಪಟ್ಟು ವ್ಯೂಸ್ ಬಂದಿವೆ.", "ಮೊದಲ 10 ಸೆಕೆಂಡ್‌ಗಳಲ್ಲೇ ಫಲಿತಾಂಶ ತೋರಿಸಿ."],
    video: "{{1}}, ನಿಮ್ಮ ಹೊಸ ವಿಡಿಯೋ \"{{2}}\" 2 ದಿನಗಳಲ್ಲಿ ಹೀಗಿದೆ:\n\n{{3}}\n\nಈಗ ಇದನ್ನು ಮಾಡಿ: {{4}}",
    videoButtons: ["ಇನ್ನಷ್ಟು ಟಿಪ್ಸ್", "ಹೊಸ ಟೈಟಲ್‌ಗಳು"],
    videoExample: ["ಬೆಂಗಳೂರಿನಲ್ಲಿ Rs 500 ಸ್ಟ್ರೀಟ್ ಫುಡ್ ಚಾಲೆಂಜ್", "ಮುಂದಿನ ನಗರ ಯಾವುದು ಎಂದು ಕೇಳುವ ಕಾಮೆಂಟ್ ಪಿನ್ ಮಾಡಿ."],
  }),
  ...translated("ml", {
    weekly: "നമസ്കാരം {{1}}, {{2}} ലെ നിങ്ങളുടെ മിത്ര ആഴ്ച റിപ്പോർട്ട് തയ്യാർ.\n\n{{3}}\n\nഏറ്റവും വലിയ വിജയം: {{4}}\nഈ ആഴ്ച ശരിയാക്കൂ: {{5}}\n\nപൂർണ റിപ്പോർട്ടും അടുത്ത വീഡിയോ ഐഡിയയും കാണാൻ താഴെ ടാപ്പ് ചെയ്യൂ.",
    weeklyButtons: ["പൂർണ റിപ്പോർട്ട്", "റിപ്പോർട്ട് നിർത്തൂ"],
    weeklyExample: ["നിങ്ങളുടെ സ്ട്രീറ്റ് ഫുഡ് വീഡിയോയ്ക്ക് സാധാരണയേക്കാൾ 2.6 മടങ്ങ് വ്യൂസ് കിട്ടി.", "ആദ്യ 10 സെക്കൻഡിൽ തന്നെ ഫലം കാണിക്കൂ."],
    video: "{{1}}, നിങ്ങളുടെ പുതിയ വീഡിയോ \"{{2}}\" 2 ദിവസത്തിൽ ഇങ്ങനെ പോകുന്നു:\n\n{{3}}\n\nഇപ്പോൾ ഇത് ചെയ്യൂ: {{4}}",
    videoButtons: ["കൂടുതൽ ടിപ്സ്", "പുതിയ ടൈറ്റിലുകൾ"],
    videoExample: ["കൊച്ചിയിൽ Rs 500 സ്ട്രീറ്റ് ഫുഡ് ചലഞ്ച്", "അടുത്ത നഗരം ഏതെന്ന് ചോദിച്ച് ഒരു കമന്റ് പിൻ ചെയ്യൂ."],
  }),
];

/** Both templates in one more language; the stats line and dates in the examples are language-neutral. */
function translated(
  language: string,
  t: { weekly: string; weeklyButtons: string[]; weeklyExample: [string, string]; video: string; videoButtons: string[]; videoExample: [string, string] },
): TemplateDef[] {
  return [
    { name: "mitra_weekly_report", language, body: t.weekly, example: ["Rima", "6 Oct – 12 Oct", "👀 10.5K views (▲50%) · ⏱️ 525 hrs · 🙌 +140 subs", ...t.weeklyExample], buttons: t.weeklyButtons },
    { name: "mitra_video_check", language, body: t.video, example: ["Rima", t.videoExample[0], "🚀 4.2K views in 48h · 1.6× your usual (2.6K)", t.videoExample[1]], buttons: t.videoButtons },
  ];
}
