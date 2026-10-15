import type { AudienceInsights, CommentInsights, Doctor, ThumbnailDesign, TrendInsights, Titles } from "./ai";

// Sample answers shown when no Anthropic API key is configured, so the product can be demoed offline.

export const DEMO_DOCTOR: Doctor = {
  score: 71,
  verdict: "Topic aur thumbnail strong the, lekin 40-second intro ne pehle hi minute me 30% audience gawa di.",
  traffic: "Most viewers came from YouTube search for 'best camera phone under 20000', led by Lucknow and Kanpur; Shorts brought young viewers who left in the first 30 seconds.",
  whatWorked: [
    "Price ₹ title me hone se CTR channel average se upar raha",
    "Comparison table wala section rewatch hua — log screenshot le rahe the",
    "Lucknow jaisa real location test trust build karta hai",
  ],
  whatHurt: [
    { at: "0:12", issue: "Intro me channel branding aur 'video ko like karo' bahut jaldi", fix: "Pehle 5 sec me result dikhao: 'Ye ₹15k wala phone sabko hara deta hai'" },
    { at: "3:40", issue: "Sponsor segment bina transition ke aaya", fix: "Sponsor ko video ke 60% ke baad le jao, ek line ka bridge do" },
    { at: "8:05", issue: "Battery test ka wada kiya tha par dikhaya nahi — comments me shikayat", fix: "Chapters me battery ka timestamp do, ya pinned comment me result" },
  ],
  nextVideo: [
    "Hook: final verdict pehle 5 second me, explanation baad me",
    "Har 90 second par pattern break — B-roll, zoom ya on-screen text",
    "End screen se pehle 'next video kyun dekhein' ka 1-line teaser",
  ],
  titleIdeas: [
    "₹15,000 Ka King Kaun? 5 Phones Ka Asli Test",
    "Is Budget Me Sirf 1 Phone Lo — Baaki Bekaar",
    "5 Phones, 1 Winner: ₹15k Ka Sach",
  ],
};

export const DEMO_TITLES: Titles = {
  titles: [
    { title: "₹20,000 Me Best Camera Phone? Raat Me Test Kiya 🌙", why: "Price + specific test condition creates curiosity", strength: 9 },
    { title: "In 3 Phones Ko Mat Lena — ₹20k Budget Guide", why: "Negative framing ('mat lena') pulls clicks from cautious buyers", strength: 8 },
    { title: "Night Camera Shootout: Kaun Jeeta? (Shocking)", why: "Competition format; 'kaun jeeta' is searchable Hinglish", strength: 7 },
    { title: "₹20k Phone vs ₹80k iPhone — Low Light Me Fark?", why: "David vs Goliath comparison drives debate in comments", strength: 8 },
    { title: "Mera Honest Pick: Best Camera Under ₹20,000", why: "Trust-led title for returning subscribers", strength: 6 },
  ],
  thumbnailText: ["कौन जीता?", "₹20k का KING", "रात का टेस्ट", "मत लेना!"],
  hook: "Raat ke 11 baje, Aminabad market, aur 3 phones. Sirf ek phone ne ye photo khinchi — aur wo sabse sasta tha. Kaunsa? Video ke end tak ruko, lekin pehle dekho ye pehla sample…",
};

export const DEMO_COMMENTS: CommentInsights = {
  mood: { positive: 62, neutral: 24, negative: 14 },
  emotions: [{ emotion: "curiosity", share: 38 }, { emotion: "joy", share: 27 }, { emotion: "humor", share: 15 }, { emotion: "pride", share: 12 }, { emotion: "anger", share: 8 }],
  themes: [
    { theme: "Requests for specific tests (battery, gaming, low light)", share: 31, example: "Battery test kahan hai?? sabse important wahi tha" },
    { theme: "Trust — viewers value honest, unsponsored reviews", share: 22, example: "Sabse honest review, baaki sab sponsored lagte hain" },
    { theme: "Pacing — intro too long", share: 14, example: "Intro bahut lamba tha bhai, seedha point pe aao" },
    { theme: "Language requests (Telugu dubbing)", share: 11, example: "Please Telugu dubbing bhi karo" },
    { theme: "Audio mix — music too loud", share: 8, example: "Background music thoda loud hai" },
  ],
  questions: [
    "Kya BGMI gaming test bhi karoge?",
    "Second-hand iPhone 13 ya naya Android?",
    "Mic konsa use karte ho?",
  ],
  videoIdeas: [
    "₹20k budget phones — battery + gaming test special",
    "Second-hand iPhone vs new Android: honest buying guide",
    "Telugu dubbed version of the top 3 videos (YouTube multi-language audio)",
  ],
  replies: [
    { to: "Mohit", reply: "Sahi pakde 😅 Battery result pinned comment me daal diya hai, aur full battery test agle video me!" },
    { to: "Sneha Reddy", reply: "Telugu audio track aa raha hai is hafte — settings ⚙️ me Audio track change karna. Parents ko mera namaste 🙏" },
    { to: "Ankit Yadav", reply: "Feedback noted bhai — agle video me verdict pehle 5 second me milega 🔥" },
  ],
};

export const DEMO_CHAT_REPLY =
  "(Sample jawab — sign in karke apne channel ke liye asli jawab paao.)\n\n" +
  "• **Is hafte ka plan:** Tuesday 7 PM long video (₹20k camera test), Thursday + Saturday 2 Shorts uske clips se.\n" +
  "• **Sabse bada fix:** Pichhle 3 videos me pehle 30 sec me ~30% log chhod rahe hain. Verdict pehle dikhao.\n" +
  "• **Quick win:** UPI Fraud wale video (2.1L views) ka Part 2 banao — comments me 40+ log maang rahe hain.";

export const DEMO_THUMBNAIL: ThumbnailDesign = {
  headline: "₹20K में कौन जीता?",
  highlight: "जीता?",
  badge: "NIGHT TEST",
  layout: "subject-right",
  images: [],
  palette: { accent: "#ffd23f", text: "#ffffff", stroke: "#000000", glow: "#ff7a1a", bgFrom: "#1b1446", bgTo: "#e2620b" },
  backgroundQuery: "city night lights",
  imagePrompt: "Busy Indian city street at night after rain, neon shop signs reflecting on wet road, bokeh lights, cinematic, empty left side",
  emoji: "🌙",
  arrow: false,
  why: "A price and a question in big Hindi text make viewers want the answer.",
};

export const DEMO_TREND_INSIGHTS: TrendInsights = {
  summary: "Festival season is driving food, travel and devotional videos, while budget phone tests and money-safety tips keep pulling big views every week.",
  emotions: [{ emotion: "joy", share: 30 }, { emotion: "curiosity", share: 26 }, { emotion: "devotion", share: 16 }, { emotion: "humor", share: 14 }, { emotion: "fear", share: 8 }, { emotion: "pride", share: 6 }],
  topics: [
    { topic: "Festival food specials", why: "Dasara and Durga Puja week: recipe searches peak", emotion: "joy", examples: ["దసరా స్పెషల్ బిర్యానీ 🔥 హైదరాబాద్ స్టైల్"], angle: "A 60-second Short: your city's one must-eat festival dish, filmed at a local stall" },
    { topic: "Budget phone night tests", why: "New launches under ₹20k this month", emotion: "curiosity", examples: ["₹15,000 में सबसे अच्छा कैमरा फोन? | Night Test"], angle: "Test 2 phones on your own city's streets at night and let viewers vote" },
    { topic: "Money safety (UPI fraud)", why: "Festive shopping brings more scams", emotion: "fear", examples: ["UPI fraud se kaise bache — 5 tricks jo aapko pata honi chahiye"], angle: "Show 3 real scam messages your viewers sent you and how to spot them" },
  ],
  regional: ["Hyderabad and Vijayawada (Telugu food)", "Kolkata Durga Puja", "Ahmedabad Garba nights", "Bengaluru traffic debates"],
  formats: ["Shorts under 60s for food and comedy", "10-15 min long-form for tech tests", "Night vlogs with on-screen location names"],
};

export const DEMO_AUDIENCE_INSIGHTS: AudienceInsights = {
  persona: "Mostly men aged 18-34 in Hindi-speaking cities, watching on phones in the evening, who want honest buying advice before spending.",
  regions: [
    { place: "Lucknow and Kanpur", insight: "Your strongest cities: 22% of views. Mention local prices and shops to deepen loyalty." },
    { place: "Dubai", insight: "A surprising 6% from the Gulf: diaspora viewers. They watch longer; a 'send home' gift guide could work." },
  ],
  discovery: "Half your views come from YouTube search, so titles that match what people type matter more than clickbait.",
  searchIntent: ["Best phone under a budget", "Camera tests at night", "Which one to buy, comparisons"],
  emotions: [{ emotion: "curiosity", share: 45 }, { emotion: "pride", share: 20 }, { emotion: "fear", share: 20 }, { emotion: "joy", share: 15 }],
  actions: [
    "Put the price and city in titles: 'Lucknow me ₹20k ka best phone'",
    "Make a Gulf-diaspora special (gifts to send home)",
    "Upload around 7 pm IST when your core viewers are online",
    "Answer the top search term 'best camera phone under 20000' in one focused video",
    "Turn comparisons into Shorts to feed the Shorts traffic source",
  ],
};
