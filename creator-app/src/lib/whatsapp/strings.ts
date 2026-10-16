/**
 * The bot's fixed words (menus, buttons, confirmations). AI answers come back in all of Mitra's languages; these
 * short strings exist in English, Hinglish and Hindi for now, and other languages use English until a native
 * speaker has reviewed a translation. Button titles must stay ≤20 characters, menu rows ≤24 (WhatsApp limits).
 */

type Strings = {
  menuText: string;
  menuButton: string;
  rows: Record<"report" | "check" | "ideas" | "titles" | "ask" | "lang" | "plan" | "dashboard" | "stop" | "start", [string, string]>;
  welcome: (name: string) => string;
  notLinked: string;
  linkExpired: string;
  askTopic: string;
  askQuestion: string;
  stopped: string;
  started: string;
  noChannel: string;
  reconnect: string;
  unsupported: string;
  noVideos: string;
  pickLanguage: string;
  languageSet: (label: string) => string;
  plan: (plan: string, used: number, limit: number, pass: string) => string;
  founderPass: (left: number, limit: number) => string;
  outOfCredits: string;
  busy: string;
  working: string;
  btnFullReport: string;
  btnMoreTips: string;
  btnTitles: string;
  btnMenu: string;
  btnIdeas: string;
  btnUpgrade: string;
  openDashboard: string;
  footer: string;
};

const en: Strings = {
  menuText: "What would you like to do? Or just type any question 💬",
  menuButton: "Open menu",
  rows: {
    report: ["📊 Weekly report", "Wins, fixes and what to post next"],
    check: ["🎬 Latest video check", "How your newest upload is doing"],
    ideas: ["💡 Next video ideas", "3 ideas from what works · 1 use"],
    titles: ["✍️ Title ideas", "Send a topic, get 5 titles · 1 use"],
    ask: ["💬 Ask Mitra", "Type any question about your channel"],
    lang: ["🌐 Language", "Change the language I write in"],
    plan: ["🎟️ My plan", "Uses left this month"],
    dashboard: ["🖥️ Open dashboard", "Charts, Video Doctor, Studio"],
    stop: ["🔕 Stop reports", "No more Monday or video reports"],
    start: ["🔔 Turn reports on", "Monday report + 2-day video check"],
  },
  welcome: (name) =>
    `🎉 Connected, ${name}! I'm Mitra, your channel manager on WhatsApp.\n\nEvery *Monday morning* I'll send your weekly report, and *2 days after each upload* I'll tell you how the video is doing and what to do.\n\nYou can also ask me anything here, any time.`,
  notLinked: "Hi! I'm Mitra 👋 your AI channel manager.\n\nTo get your reports here, open Mitra → *WhatsApp & reports* and tap *Connect WhatsApp*.",
  linkExpired: "That code has expired. Open Mitra → WhatsApp & reports and tap Connect again for a new one.",
  askTopic: "✍️ Send me your video topic in one line, e.g. _Rs 500 street food challenge in Hyderabad_",
  askQuestion: "💬 Ask me anything about your channel: what to post, why views dropped, how much to charge a sponsor…",
  stopped: "🔕 Done, no more reports. You can still chat with me any time. Send *START* to turn reports back on.",
  started: "🔔 Reports are on. See you Monday morning!",
  noChannel: "Connect your YouTube channel on the Mitra website first, then I can read your numbers.",
  reconnect: "Google stopped Mitra's access to your channel. Please reconnect YouTube on the website (Connections).",
  unsupported: "I can only read text for now 🙏 Voice notes are coming soon. Type your question, or send *menu*.",
  noVideos: "I couldn't find a recent upload on your channel yet.",
  pickLanguage: "Which language should I write in?",
  languageSet: (label) => `✅ I'll write in ${label} from now on.`,
  plan: (plan, used, limit, pass) => `🎟️ *${plan} plan*\nAI credits this month: ${used} of ${limit} used${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${left} of ${limit} free uses left`,
  outOfCredits: "You've used this month's AI uses. Upgrade for more, or wait for the 1st. Reports stay free.",
  busy: "Mitra is busy right now 🙏 please try again in a minute.",
  working: "⏳ On it…",
  btnFullReport: "Full report",
  btnMoreTips: "More tips",
  btnTitles: "New title ideas",
  btnMenu: "Menu",
  btnIdeas: "Video ideas",
  btnUpgrade: "See plans",
  openDashboard: "Open your Mitra dashboard",
  footer: "Mitra · reply STOP to stop reports",
};

const hinglish: Strings = {
  ...en,
  menuText: "Kya karna hai? Ya seedha koi bhi sawaal type karo 💬",
  menuButton: "Menu kholo",
  rows: {
    report: ["📊 Weekly report", "Wins, fixes aur next kya post karein"],
    check: ["🎬 Latest video check", "Naya video kaisa chal raha hai"],
    ideas: ["💡 Next video ideas", "Jo chal raha hai usse 3 ideas · 1 use"],
    titles: ["✍️ Title ideas", "Topic bhejo, 5 titles pao · 1 use"],
    ask: ["💬 Mitra se poocho", "Channel ke baare mein kuch bhi"],
    lang: ["🌐 Bhasha", "Main kis bhasha mein likhun"],
    plan: ["🎟️ Mera plan", "Is mahine kitne uses bache"],
    dashboard: ["🖥️ Dashboard kholo", "Charts, Video Doctor, Studio"],
    stop: ["🔕 Reports band karo", "Monday aur video reports band"],
    start: ["🔔 Reports chalu karo", "Monday report + 2-din video check"],
  },
  welcome: (name) =>
    `🎉 Connect ho gaya, ${name}! Main Mitra hoon, WhatsApp pe aapka channel manager.\n\nHar *Monday subah* weekly report bhejunga, aur *har upload ke 2 din baad* bataunga video kaisa chal raha hai aur kya karna hai.\n\nKabhi bhi yahan kuch bhi poocho.`,
  notLinked: "Namaste! Main Mitra hoon 👋 aapka AI channel manager.\n\nReports yahan paane ke liye Mitra kholo → *WhatsApp & reports* → *Connect WhatsApp* dabao.",
  linkExpired: "Ye code expire ho gaya. Mitra pe WhatsApp & reports mein dobara Connect dabao.",
  askTopic: "✍️ Apne video ka topic ek line mein bhejo, jaise _Hyderabad mein Rs 500 street food challenge_",
  askQuestion: "💬 Channel ke baare mein kuch bhi poocho: kya post karein, views kyun gire, sponsor se kitna lein…",
  stopped: "🔕 Ho gaya, ab reports nahi aayengi. Chat kabhi bhi kar sakte ho. Wapas chalu karne ke liye *START* bhejo.",
  started: "🔔 Reports chalu! Monday subah milte hain.",
  noChannel: "Pehle Mitra website pe apna YouTube channel connect karo, phir main numbers padh paunga.",
  reconnect: "Google ne Mitra ka access rok diya. Website pe Connections mein YouTube dobara connect karo.",
  unsupported: "Abhi main sirf text padh sakta hoon 🙏 Voice notes jaldi aayenge. Sawaal type karo, ya *menu* bhejo.",
  noVideos: "Aapke channel pe abhi koi naya upload nahi mila.",
  pickLanguage: "Main kis bhasha mein likhun?",
  languageSet: (label) => `✅ Ab se ${label} mein likhunga.`,
  plan: (plan, used, limit, pass) => `🎟️ *${plan} plan*\nIs mahine AI credits: ${limit} mein se ${used} use hue${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${limit} mein se ${left} free uses bache`,
  outOfCredits: "Is mahine ke AI uses khatam. Zyada ke liye upgrade karo, ya 1 tareekh tak ruko. Reports free rahengi.",
  busy: "Mitra abhi busy hai 🙏 ek minute mein dobara try karo.",
  working: "⏳ Kar raha hoon…",
  btnFullReport: "Poori report",
  btnMoreTips: "Aur tips",
  btnTitles: "Naye titles",
  btnMenu: "Menu",
  btnIdeas: "Video ideas",
  btnUpgrade: "Plans dekho",
  openDashboard: "Apna Mitra dashboard kholo",
  footer: "Mitra · reports band karne ko STOP",
};

const hi: Strings = {
  ...hinglish,
  menuText: "क्या करना है? या सीधे कोई भी सवाल लिखें 💬",
  menuButton: "मेन्यू खोलें",
  rows: {
    report: ["📊 साप्ताहिक रिपोर्ट", "जीत, सुधार और अगला वीडियो"],
    check: ["🎬 नया वीडियो चेक", "नया वीडियो कैसा चल रहा है"],
    ideas: ["💡 अगले वीडियो के आइडिया", "जो चल रहा है उससे 3 आइडिया · 1 उपयोग"],
    titles: ["✍️ टाइटल आइडिया", "टॉपिक भेजें, 5 टाइटल पाएं · 1 उपयोग"],
    ask: ["💬 मित्र से पूछें", "चैनल के बारे में कुछ भी"],
    lang: ["🌐 भाषा", "मैं किस भाषा में लिखूं"],
    plan: ["🎟️ मेरा प्लान", "इस महीने कितने उपयोग बचे"],
    dashboard: ["🖥️ डैशबोर्ड खोलें", "चार्ट, वीडियो डॉक्टर, स्टूडियो"],
    stop: ["🔕 रिपोर्ट बंद करें", "सोमवार और वीडियो रिपोर्ट बंद"],
    start: ["🔔 रिपोर्ट चालू करें", "सोमवार रिपोर्ट + 2-दिन वीडियो चेक"],
  },
  welcome: (name) =>
    `🎉 कनेक्ट हो गया, ${name}! मैं मित्र हूं, WhatsApp पर आपका चैनल मैनेजर।\n\nहर *सोमवार सुबह* साप्ताहिक रिपोर्ट भेजूंगा, और *हर अपलोड के 2 दिन बाद* बताऊंगा कि वीडियो कैसा चल रहा है और क्या करना है।\n\nकभी भी यहां कुछ भी पूछें।`,
  askTopic: "✍️ अपने वीडियो का टॉपिक एक लाइन में भेजें",
  askQuestion: "💬 चैनल के बारे में कुछ भी पूछें: क्या पोस्ट करें, व्यूज़ क्यों गिरे, स्पॉन्सर से कितना लें…",
  stopped: "🔕 हो गया, अब रिपोर्ट नहीं आएंगी। चैट कभी भी कर सकते हैं। दोबारा चालू करने के लिए *START* भेजें।",
  started: "🔔 रिपोर्ट चालू! सोमवार सुबह मिलते हैं।",
  noVideos: "आपके चैनल पर अभी कोई नया अपलोड नहीं मिला।",
  pickLanguage: "मैं किस भाषा में लिखूं?",
  languageSet: (label) => `✅ अब से ${label} में लिखूंगा।`,
  busy: "मित्र अभी व्यस्त है 🙏 एक मिनट में फिर कोशिश करें।",
  working: "⏳ कर रहा हूं…",
  btnFullReport: "पूरी रिपोर्ट",
  btnMoreTips: "और टिप्स",
  btnTitles: "नए टाइटल",
  btnMenu: "मेन्यू",
  btnIdeas: "वीडियो आइडिया",
  btnUpgrade: "प्लान देखें",
  openDashboard: "अपना मित्र डैशबोर्ड खोलें",
};

export function t(language: string): Strings {
  return language === "hi" ? hi : language === "hinglish" ? hinglish : en;
}

/** Words that mean "show the menu" / "stop" / "start", in the ways creators actually type them. */
export const MENU_WORDS = /^(hi+|hello|hey|helo|menu|namaste|namaskar|start menu|help|मेन्यू|नमस्ते|हाय|vanakkam|namaskaram)\W*$/i;
export const STOP_WORDS = /^(stop|unsubscribe|band karo|bandh|बंद|बंद करो|stop reports)\W*$/i;
export const START_WORDS = /^(start|subscribe|chalu|शुरू|चालू)\W*$/i;
