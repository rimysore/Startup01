/**
 * The bot's fixed words (menus, buttons, confirmations) in all nine of Mitra's languages, so the menus around an AI
 * answer match the creator's chosen language. Telugu, Tamil, Marathi, Bengali, Kannada and Malayalam still need a
 * native speaker's review. WhatsApp limits (tested): button titles ≤20 characters, menu row titles ≤24, row
 * descriptions ≤72, footers ≤60.
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
  pdfCaption: string;
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
  pdfCaption: "📄 Your report as a PDF: save it, print it or share it.",
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
  pdfCaption: "📄 Aapki report PDF mein: save karo, print karo ya share karo.",
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
  notLinked: "नमस्ते! मैं मित्र हूं 👋 आपका AI चैनल मैनेजर।\n\nरिपोर्ट यहां पाने के लिए Mitra खोलें → *WhatsApp & reports* → *Connect WhatsApp* दबाएं।",
  linkExpired: "यह कोड एक्सपायर हो गया। Mitra पर WhatsApp & reports में फिर से Connect दबाएं।",
  noChannel: "पहले Mitra वेबसाइट पर अपना YouTube चैनल कनेक्ट करें, फिर मैं आपके आंकड़े पढ़ पाऊंगा।",
  reconnect: "Google ने मित्र का एक्सेस रोक दिया है। वेबसाइट पर Connections में YouTube फिर से कनेक्ट करें।",
  unsupported: "अभी मैं सिर्फ़ टेक्स्ट पढ़ सकता हूं 🙏 वॉइस नोट्स जल्द आएंगे। सवाल टाइप करें, या *menu* भेजें।",
  plan: (plan, used, limit, pass) => `🎟️ *${plan} प्लान*\nइस महीने AI क्रेडिट: ${limit} में से ${used} इस्तेमाल हुए${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${limit} में से ${left} फ्री उपयोग बचे`,
  outOfCredits: "इस महीने के AI उपयोग खत्म हो गए। ज़्यादा के लिए अपग्रेड करें, या 1 तारीख तक रुकें। रिपोर्ट फ्री रहेंगी।",
  footer: "Mitra · रिपोर्ट बंद करने के लिए STOP",
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
  pdfCaption: "📄 आपकी रिपोर्ट PDF में: सेव करें, प्रिंट करें या शेयर करें।",
};

const te: Strings = {
  menuText: "ఏం చేయాలి? లేదా ఏ ప్రశ్న అయినా టైప్ చేయండి 💬",
  menuButton: "మెనూ తెరవండి",
  rows: {
    report: ["📊 వారపు రిపోర్ట్", "విజయాలు, సరిచేయాల్సినవి, తర్వాత ఏం పోస్ట్ చేయాలి"],
    check: ["🎬 కొత్త వీడియో చెక్", "మీ తాజా వీడియో ఎలా ఉంది"],
    ideas: ["💡 వీడియో ఐడియాలు", "పనిచేస్తున్న వాటి నుంచి 3 ఐడియాలు · 1 use"],
    titles: ["✍️ టైటిల్ ఐడియాలు", "టాపిక్ పంపండి, 5 టైటిల్స్ పొందండి · 1 use"],
    ask: ["💬 మిత్రను అడగండి", "మీ ఛానల్ గురించి ఏదైనా అడగండి"],
    lang: ["🌐 భాష", "నేను ఏ భాషలో రాయాలి"],
    plan: ["🎟️ నా ప్లాన్", "ఈ నెల మిగిలిన uses"],
    dashboard: ["🖥️ డాష్‌బోర్డ్", "Charts, Video Doctor, Studio"],
    stop: ["🔕 రిపోర్ట్స్ ఆపండి", "Monday, వీడియో రిపోర్ట్స్ ఇక రావు"],
    start: ["🔔 రిపోర్ట్స్ ఆన్", "Monday రిపోర్ట్ + 2 రోజుల వీడియో చెక్"],
  },
  welcome: (name) =>
    `🎉 కనెక్ట్ అయ్యింది, ${name}! నేను మిత్ర, WhatsApp లో మీ ఛానల్ మేనేజర్.\n\nప్రతి *సోమవారం ఉదయం* మీ వారపు రిపోర్ట్ పంపుతాను, *ప్రతి అప్‌లోడ్ తర్వాత 2 రోజులకు* వీడియో ఎలా ఉందో, ఏం చేయాలో చెప్తాను.\n\nఎప్పుడైనా ఇక్కడ ఏదైనా అడగండి.`,
  notLinked: "నమస్తే! నేను మిత్ర 👋 మీ AI ఛానల్ మేనేజర్.\n\nరిపోర్ట్స్ ఇక్కడ పొందడానికి Mitra తెరిచి → *WhatsApp & reports* → *Connect WhatsApp* నొక్కండి.",
  linkExpired: "ఈ కోడ్ గడువు ముగిసింది. Mitra లో WhatsApp & reports లో మళ్లీ Connect నొక్కండి.",
  askTopic: "✍️ మీ వీడియో టాపిక్ ఒక లైన్‌లో పంపండి, ఉదా: _హైదరాబాద్‌లో Rs 500 స్ట్రీట్ ఫుడ్ ఛాలెంజ్_",
  askQuestion: "💬 మీ ఛానల్ గురించి ఏదైనా అడగండి: ఏం పోస్ట్ చేయాలి, వ్యూస్ ఎందుకు తగ్గాయి, స్పాన్సర్‌కి ఎంత చార్జ్ చేయాలి…",
  stopped: "🔕 సరే, ఇక రిపోర్ట్స్ రావు. ఎప్పుడైనా చాట్ చేయవచ్చు. మళ్లీ ఆన్ చేయడానికి *START* పంపండి.",
  started: "🔔 రిపోర్ట్స్ ఆన్! సోమవారం ఉదయం కలుద్దాం.",
  noChannel: "ముందుగా Mitra వెబ్‌సైట్‌లో మీ YouTube ఛానల్ కనెక్ట్ చేయండి, అప్పుడు నేను మీ నంబర్లు చదవగలను.",
  reconnect: "Google మిత్రకి మీ ఛానల్ యాక్సెస్ ఆపేసింది. వెబ్‌సైట్‌లో Connections లో YouTube మళ్లీ కనెక్ట్ చేయండి.",
  unsupported: "ప్రస్తుతం నేను టెక్స్ట్ మాత్రమే చదవగలను 🙏 వాయిస్ నోట్స్ త్వరలో వస్తాయి. ప్రశ్న టైప్ చేయండి, లేదా *menu* పంపండి.",
  noVideos: "మీ ఛానల్‌లో ఇటీవలి అప్‌లోడ్ ఇంకా కనిపించలేదు.",
  pickLanguage: "నేను ఏ భాషలో రాయాలి?",
  languageSet: (label) => `✅ ఇకపై ${label} లో రాస్తాను.`,
  plan: (plan, used, limit, pass) => `🎟️ *${plan} ప్లాన్*\nఈ నెల AI credits: ${limit} లో ${used} వాడారు${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${limit} లో ${left} free uses మిగిలాయి`,
  outOfCredits: "ఈ నెల AI uses అయిపోయాయి. ఎక్కువ కావాలంటే upgrade చేయండి, లేదా 1వ తేదీ వరకు ఆగండి. రిపోర్ట్స్ ఉచితంగానే వస్తాయి.",
  busy: "మిత్ర ఇప్పుడు బిజీగా ఉంది 🙏 ఒక నిమిషంలో మళ్లీ ప్రయత్నించండి.",
  working: "⏳ చేస్తున్నాను…",
  btnFullReport: "పూర్తి రిపోర్ట్",
  btnMoreTips: "మరిన్ని టిప్స్",
  btnTitles: "కొత్త టైటిల్స్",
  btnMenu: "మెనూ",
  btnIdeas: "వీడియో ఐడియాలు",
  btnUpgrade: "ప్లాన్స్ చూడండి",
  openDashboard: "మీ Mitra డాష్‌బోర్డ్ తెరవండి",
  footer: "Mitra · రిపోర్ట్స్ ఆపడానికి STOP",
  pdfCaption: "📄 మీ రిపోర్ట్ PDF గా: సేవ్ చేయండి, ప్రింట్ చేయండి లేదా షేర్ చేయండి.",
};

const ta: Strings = {
  menuText: "என்ன செய்யலாம்? அல்லது எந்தக் கேள்வியையும் டைப் செய்யுங்கள் 💬",
  menuButton: "மெனு திற",
  rows: {
    report: ["📊 வார ரிப்போர்ட்", "வெற்றிகள், திருத்தங்கள், அடுத்து என்ன போடலாம்"],
    check: ["🎬 புது வீடியோ செக்", "உங்கள் புதிய வீடியோ எப்படி போகிறது"],
    ideas: ["💡 வீடியோ ஐடியா", "நன்றாகப் போவதிலிருந்து 3 ஐடியாக்கள் · 1 use"],
    titles: ["✍️ டைட்டில் ஐடியா", "டாபிக் அனுப்புங்கள், 5 டைட்டில்கள் · 1 use"],
    ask: ["💬 மித்ராவிடம் கேள்", "உங்கள் சேனல் பற்றி எதுவும் கேளுங்கள்"],
    lang: ["🌐 மொழி", "நான் எந்த மொழியில் எழுத வேண்டும்"],
    plan: ["🎟️ என் பிளான்", "இந்த மாதம் மீதமுள்ள uses"],
    dashboard: ["🖥️ டாஷ்போர்டு", "Charts, Video Doctor, Studio"],
    stop: ["🔕 ரிப்போர்ட் நிறுத்து", "Monday, வீடியோ ரிப்போர்ட்கள் இனி வராது"],
    start: ["🔔 ரிப்போர்ட் ஆன்", "Monday ரிப்போர்ட் + 2 நாள் வீடியோ செக்"],
  },
  welcome: (name) =>
    `🎉 இணைந்துவிட்டது, ${name}! நான் மித்ரா, WhatsApp-ல் உங்கள் சேனல் மேனேஜர்.\n\nஒவ்வொரு *திங்கள் காலையும்* உங்கள் வார ரிப்போர்ட் அனுப்புவேன், *ஒவ்வொரு அப்லோடுக்கும் 2 நாள் கழித்து* வீடியோ எப்படி போகிறது, என்ன செய்யலாம் என்று சொல்வேன்.\n\nஎப்போது வேண்டுமானாலும் இங்கே எதுவும் கேளுங்கள்.`,
  notLinked: "வணக்கம்! நான் மித்ரா 👋 உங்கள் AI சேனல் மேனேஜர்.\n\nரிப்போர்ட்களை இங்கே பெற Mitra-வைத் திறந்து → *WhatsApp & reports* → *Connect WhatsApp* அழுத்துங்கள்.",
  linkExpired: "இந்த கோடு காலாவதியாகிவிட்டது. Mitra-வில் WhatsApp & reports-ல் மீண்டும் Connect அழுத்துங்கள்.",
  askTopic: "✍️ உங்கள் வீடியோ டாபிக்கை ஒரு வரியில் அனுப்புங்கள், உதா: _சென்னையில் Rs 500 ஸ்ட்ரீட் ஃபுட் சேலஞ்ச்_",
  askQuestion: "💬 உங்கள் சேனல் பற்றி எதுவும் கேளுங்கள்: என்ன போடலாம், வியூஸ் ஏன் குறைந்தது, ஸ்பான்சரிடம் எவ்வளவு கேட்கலாம்…",
  stopped: "🔕 சரி, இனி ரிப்போர்ட்கள் வராது. எப்போது வேண்டுமானாலும் சாட் செய்யலாம். மீண்டும் ஆன் செய்ய *START* அனுப்புங்கள்.",
  started: "🔔 ரிப்போர்ட்கள் ஆன்! திங்கள் காலை சந்திப்போம்.",
  noChannel: "முதலில் Mitra இணையதளத்தில் உங்கள் YouTube சேனலை இணையுங்கள், பிறகு உங்கள் எண்களைப் படிக்க முடியும்.",
  reconnect: "Google மித்ராவின் அணுகலை நிறுத்திவிட்டது. இணையதளத்தில் Connections-ல் YouTube-ஐ மீண்டும் இணையுங்கள்.",
  unsupported: "இப்போது நான் டெக்ஸ்ட் மட்டுமே படிக்க முடியும் 🙏 வாய்ஸ் நோட்ஸ் விரைவில். கேள்வியை டைப் செய்யுங்கள், அல்லது *menu* அனுப்புங்கள்.",
  noVideos: "உங்கள் சேனலில் சமீபத்திய அப்லோட் இன்னும் கிடைக்கவில்லை.",
  pickLanguage: "நான் எந்த மொழியில் எழுத வேண்டும்?",
  languageSet: (label) => `✅ இனி ${label}-ல் எழுதுவேன்.`,
  plan: (plan, used, limit, pass) => `🎟️ *${plan} பிளான்*\nஇந்த மாத AI credits: ${limit}-ல் ${used} பயன்படுத்தப்பட்டது${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${limit}-ல் ${left} free uses மீதம்`,
  outOfCredits: "இந்த மாத AI uses முடிந்துவிட்டன. மேலும் வேண்டுமென்றால் upgrade செய்யுங்கள், அல்லது 1-ஆம் தேதி வரை காத்திருங்கள். ரிப்போர்ட்கள் இலவசம்.",
  busy: "மித்ரா இப்போது பிஸி 🙏 ஒரு நிமிடத்தில் மீண்டும் முயற்சிக்கவும்.",
  working: "⏳ செய்கிறேன்…",
  btnFullReport: "முழு ரிப்போர்ட்",
  btnMoreTips: "மேலும் டிப்ஸ்",
  btnTitles: "புது டைட்டில்கள்",
  btnMenu: "மெனு",
  btnIdeas: "வீடியோ ஐடியா",
  btnUpgrade: "பிளான்கள்",
  openDashboard: "உங்கள் Mitra டாஷ்போர்டைத் திறக்கவும்",
  footer: "Mitra · ரிப்போர்ட் நிறுத்த STOP",
  pdfCaption: "📄 உங்கள் ரிப்போர்ட் PDF-ஆக: சேமிக்கவும், பிரிண்ட் செய்யவும் அல்லது பகிரவும்.",
};

const mr: Strings = {
  menuText: "काय करायचं? किंवा कोणताही प्रश्न टाइप करा 💬",
  menuButton: "मेन्यू उघडा",
  rows: {
    report: ["📊 साप्ताहिक रिपोर्ट", "यश, सुधारणा आणि पुढे काय पोस्ट करायचं"],
    check: ["🎬 नवीन व्हिडिओ चेक", "तुमचा नवा व्हिडिओ कसा चाललाय"],
    ideas: ["💡 व्हिडिओ आयडिया", "जे चालतंय त्यातून 3 आयडिया · 1 use"],
    titles: ["✍️ टायटल आयडिया", "टॉपिक पाठवा, 5 टायटल मिळवा · 1 use"],
    ask: ["💬 मित्राला विचारा", "चॅनलबद्दल काहीही विचारा"],
    lang: ["🌐 भाषा", "मी कोणत्या भाषेत लिहू"],
    plan: ["🎟️ माझा प्लॅन", "या महिन्यात किती uses बाकी"],
    dashboard: ["🖥️ डॅशबोर्ड उघडा", "Charts, Video Doctor, Studio"],
    stop: ["🔕 रिपोर्ट बंद करा", "Monday आणि व्हिडिओ रिपोर्ट बंद"],
    start: ["🔔 रिपोर्ट चालू करा", "Monday रिपोर्ट + 2 दिवसांचा व्हिडिओ चेक"],
  },
  welcome: (name) =>
    `🎉 कनेक्ट झालं, ${name}! मी मित्र, WhatsApp वर तुमचा चॅनल मॅनेजर.\n\nदर *सोमवारी सकाळी* तुमचा साप्ताहिक रिपोर्ट पाठवेन, आणि *प्रत्येक अपलोडनंतर 2 दिवसांनी* व्हिडिओ कसा चाललाय आणि काय करायचं ते सांगेन.\n\nकधीही इथे काहीही विचारा.`,
  notLinked: "नमस्कार! मी मित्र 👋 तुमचा AI चॅनल मॅनेजर.\n\nरिपोर्ट इथे मिळवण्यासाठी Mitra उघडा → *WhatsApp & reports* → *Connect WhatsApp* दाबा.",
  linkExpired: "हा कोड कालबाह्य झाला. Mitra वर WhatsApp & reports मध्ये पुन्हा Connect दाबा.",
  askTopic: "✍️ तुमच्या व्हिडिओचा टॉपिक एका ओळीत पाठवा, उदा. _पुण्यात Rs 500 स्ट्रीट फूड चॅलेंज_",
  askQuestion: "💬 चॅनलबद्दल काहीही विचारा: काय पोस्ट करायचं, व्ह्यूज का कमी झाले, स्पॉन्सरकडून किती घ्यायचे…",
  stopped: "🔕 झालं, आता रिपोर्ट येणार नाहीत. चॅट कधीही करू शकता. पुन्हा चालू करायला *START* पाठवा.",
  started: "🔔 रिपोर्ट चालू! सोमवारी सकाळी भेटू.",
  noChannel: "आधी Mitra वेबसाइटवर तुमचं YouTube चॅनल कनेक्ट करा, मग मी तुमचे आकडे वाचू शकेन.",
  reconnect: "Google ने Mitra चा ॲक्सेस थांबवला. वेबसाइटवर Connections मध्ये YouTube पुन्हा कनेक्ट करा.",
  unsupported: "सध्या मी फक्त टेक्स्ट वाचू शकतो 🙏 व्हॉइस नोट्स लवकरच. प्रश्न टाइप करा, किंवा *menu* पाठवा.",
  noVideos: "तुमच्या चॅनलवर अजून नवीन अपलोड सापडला नाही.",
  pickLanguage: "मी कोणत्या भाषेत लिहू?",
  languageSet: (label) => `✅ आतापासून ${label} मध्ये लिहीन.`,
  plan: (plan, used, limit, pass) => `🎟️ *${plan} प्लॅन*\nया महिन्याचे AI credits: ${limit} पैकी ${used} वापरले${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${limit} पैकी ${left} free uses बाकी`,
  outOfCredits: "या महिन्याचे AI uses संपले. जास्त हवे असल्यास upgrade करा, किंवा 1 तारखेपर्यंत थांबा. रिपोर्ट मोफत राहतील.",
  busy: "मित्र सध्या बिझी आहे 🙏 एका मिनिटात पुन्हा प्रयत्न करा.",
  working: "⏳ करतोय…",
  btnFullReport: "पूर्ण रिपोर्ट",
  btnMoreTips: "अजून टिप्स",
  btnTitles: "नवीन टायटल",
  btnMenu: "मेन्यू",
  btnIdeas: "व्हिडिओ आयडिया",
  btnUpgrade: "प्लॅन पहा",
  openDashboard: "तुमचा Mitra डॅशबोर्ड उघडा",
  footer: "Mitra · रिपोर्ट बंद करायला STOP",
  pdfCaption: "📄 तुमचा रिपोर्ट PDF मध्ये: सेव्ह करा, प्रिंट करा किंवा शेअर करा.",
};

const bn: Strings = {
  menuText: "কী করতে চান? অথবা যেকোনো প্রশ্ন টাইপ করুন 💬",
  menuButton: "মেনু খুলুন",
  rows: {
    report: ["📊 সাপ্তাহিক রিপোর্ট", "সাফল্য, সংশোধন আর এরপর কী পোস্ট করবেন"],
    check: ["🎬 নতুন ভিডিও চেক", "আপনার নতুন ভিডিও কেমন চলছে"],
    ideas: ["💡 ভিডিও আইডিয়া", "যা চলছে তা থেকে 3টি আইডিয়া · 1 use"],
    titles: ["✍️ টাইটেল আইডিয়া", "টপিক পাঠান, 5টি টাইটেল পান · 1 use"],
    ask: ["💬 মিত্রকে প্রশ্ন", "আপনার চ্যানেল নিয়ে যা খুশি জিজ্ঞেস করুন"],
    lang: ["🌐 ভাষা", "আমি কোন ভাষায় লিখব"],
    plan: ["🎟️ আমার প্ল্যান", "এই মাসে কত uses বাকি"],
    dashboard: ["🖥️ ড্যাশবোর্ড খুলুন", "Charts, Video Doctor, Studio"],
    stop: ["🔕 রিপোর্ট বন্ধ করুন", "Monday আর ভিডিও রিপোর্ট বন্ধ"],
    start: ["🔔 রিপোর্ট চালু করুন", "Monday রিপোর্ট + 2 দিনের ভিডিও চেক"],
  },
  welcome: (name) =>
    `🎉 কানেক্ট হয়ে গেছে, ${name}! আমি মিত্র, WhatsApp-এ আপনার চ্যানেল ম্যানেজার।\n\nপ্রতি *সোমবার সকালে* আপনার সাপ্তাহিক রিপোর্ট পাঠাব, আর *প্রতিটি আপলোডের 2 দিন পরে* জানাব ভিডিও কেমন চলছে আর কী করতে হবে।\n\nযখন খুশি এখানে যা খুশি জিজ্ঞেস করুন।`,
  notLinked: "নমস্কার! আমি মিত্র 👋 আপনার AI চ্যানেল ম্যানেজার।\n\nরিপোর্ট এখানে পেতে Mitra খুলুন → *WhatsApp & reports* → *Connect WhatsApp* চাপুন।",
  linkExpired: "এই কোডের মেয়াদ শেষ। Mitra-তে WhatsApp & reports-এ আবার Connect চাপুন।",
  askTopic: "✍️ আপনার ভিডিওর টপিক এক লাইনে পাঠান, যেমন _কলকাতায় Rs 500 স্ট্রিট ফুড চ্যালেঞ্জ_",
  askQuestion: "💬 আপনার চ্যানেল নিয়ে যা খুশি জিজ্ঞেস করুন: কী পোস্ট করবেন, ভিউ কেন কমল, স্পনসরের কাছে কত নেবেন…",
  stopped: "🔕 ঠিক আছে, আর রিপোর্ট আসবে না। যখন খুশি চ্যাট করতে পারেন। আবার চালু করতে *START* পাঠান।",
  started: "🔔 রিপোর্ট চালু! সোমবার সকালে দেখা হবে।",
  noChannel: "আগে Mitra ওয়েবসাইটে আপনার YouTube চ্যানেল কানেক্ট করুন, তারপর আমি আপনার সংখ্যাগুলো পড়তে পারব।",
  reconnect: "Google মিত্রের অ্যাক্সেস বন্ধ করেছে। ওয়েবসাইটে Connections-এ YouTube আবার কানেক্ট করুন।",
  unsupported: "এখন আমি শুধু টেক্সট পড়তে পারি 🙏 ভয়েস নোট শিগগিরই আসছে। প্রশ্ন টাইপ করুন, অথবা *menu* পাঠান।",
  noVideos: "আপনার চ্যানেলে এখনও নতুন আপলোড পাওয়া যায়নি।",
  pickLanguage: "আমি কোন ভাষায় লিখব?",
  languageSet: (label) => `✅ এখন থেকে ${label}-এ লিখব।`,
  plan: (plan, used, limit, pass) => `🎟️ *${plan} প্ল্যান*\nএই মাসের AI credits: ${limit}-এর মধ্যে ${used} ব্যবহার হয়েছে${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${limit}-এর মধ্যে ${left}টি free uses বাকি`,
  outOfCredits: "এই মাসের AI uses শেষ। আরও চাইলে upgrade করুন, অথবা 1 তারিখ পর্যন্ত অপেক্ষা করুন। রিপোর্ট ফ্রি থাকবে।",
  busy: "মিত্র এখন ব্যস্ত 🙏 এক মিনিট পরে আবার চেষ্টা করুন।",
  working: "⏳ করছি…",
  btnFullReport: "পুরো রিপোর্ট",
  btnMoreTips: "আরও টিপস",
  btnTitles: "নতুন টাইটেল",
  btnMenu: "মেনু",
  btnIdeas: "ভিডিও আইডিয়া",
  btnUpgrade: "প্ল্যান দেখুন",
  openDashboard: "আপনার Mitra ড্যাশবোর্ড খুলুন",
  footer: "Mitra · রিপোর্ট বন্ধ করতে STOP",
  pdfCaption: "📄 আপনার রিপোর্ট PDF-এ: সেভ করুন, প্রিন্ট করুন বা শেয়ার করুন।",
};

const kn: Strings = {
  menuText: "ಏನು ಮಾಡಬೇಕು? ಅಥವಾ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ 💬",
  menuButton: "ಮೆನು ತೆರೆಯಿರಿ",
  rows: {
    report: ["📊 ವಾರದ ರಿಪೋರ್ಟ್", "ಗೆಲುವುಗಳು, ಸುಧಾರಣೆಗಳು, ಮುಂದೆ ಏನು ಪೋಸ್ಟ್ ಮಾಡಬೇಕು"],
    check: ["🎬 ಹೊಸ ವಿಡಿಯೋ ಚೆಕ್", "ನಿಮ್ಮ ಹೊಸ ವಿಡಿಯೋ ಹೇಗೆ ಹೋಗುತ್ತಿದೆ"],
    ideas: ["💡 ವಿಡಿಯೋ ಐಡಿಯಾ", "ಚೆನ್ನಾಗಿ ಓಡುತ್ತಿರುವುದರಿಂದ 3 ಐಡಿಯಾಗಳು · 1 use"],
    titles: ["✍️ ಟೈಟಲ್ ಐಡಿಯಾ", "ಟಾಪಿಕ್ ಕಳುಹಿಸಿ, 5 ಟೈಟಲ್ ಪಡೆಯಿರಿ · 1 use"],
    ask: ["💬 ಮಿತ್ರನನ್ನು ಕೇಳಿ", "ನಿಮ್ಮ ಚಾನೆಲ್ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ"],
    lang: ["🌐 ಭಾಷೆ", "ನಾನು ಯಾವ ಭಾಷೆಯಲ್ಲಿ ಬರೆಯಲಿ"],
    plan: ["🎟️ ನನ್ನ ಪ್ಲಾನ್", "ಈ ತಿಂಗಳು ಉಳಿದ uses"],
    dashboard: ["🖥️ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "Charts, Video Doctor, Studio"],
    stop: ["🔕 ರಿಪೋರ್ಟ್ ನಿಲ್ಲಿಸಿ", "Monday, ವಿಡಿಯೋ ರಿಪೋರ್ಟ್ ಇನ್ನು ಬರುವುದಿಲ್ಲ"],
    start: ["🔔 ರಿಪೋರ್ಟ್ ಆನ್", "Monday ರಿಪೋರ್ಟ್ + 2 ದಿನದ ವಿಡಿಯೋ ಚೆಕ್"],
  },
  welcome: (name) =>
    `🎉 ಕನೆಕ್ಟ್ ಆಯಿತು, ${name}! ನಾನು ಮಿತ್ರ, WhatsApp ನಲ್ಲಿ ನಿಮ್ಮ ಚಾನೆಲ್ ಮ್ಯಾನೇಜರ್.\n\nಪ್ರತಿ *ಸೋಮವಾರ ಬೆಳಿಗ್ಗೆ* ನಿಮ್ಮ ವಾರದ ರಿಪೋರ್ಟ್ ಕಳುಹಿಸುತ್ತೇನೆ, ಮತ್ತು *ಪ್ರತಿ ಅಪ್‌ಲೋಡ್ ಆದ 2 ದಿನಗಳ ನಂತರ* ವಿಡಿಯೋ ಹೇಗಿದೆ, ಏನು ಮಾಡಬೇಕು ಎಂದು ಹೇಳುತ್ತೇನೆ.\n\nಯಾವಾಗ ಬೇಕಾದರೂ ಇಲ್ಲಿ ಏನಾದರೂ ಕೇಳಿ.`,
  notLinked: "ನಮಸ್ಕಾರ! ನಾನು ಮಿತ್ರ 👋 ನಿಮ್ಮ AI ಚಾನೆಲ್ ಮ್ಯಾನೇಜರ್.\n\nರಿಪೋರ್ಟ್‌ಗಳನ್ನು ಇಲ್ಲಿ ಪಡೆಯಲು Mitra ತೆರೆಯಿರಿ → *WhatsApp & reports* → *Connect WhatsApp* ಒತ್ತಿ.",
  linkExpired: "ಈ ಕೋಡ್ ಅವಧಿ ಮುಗಿದಿದೆ. Mitra ನಲ್ಲಿ WhatsApp & reports ನಲ್ಲಿ ಮತ್ತೆ Connect ಒತ್ತಿ.",
  askTopic: "✍️ ನಿಮ್ಮ ವಿಡಿಯೋ ಟಾಪಿಕ್ ಅನ್ನು ಒಂದು ಸಾಲಿನಲ್ಲಿ ಕಳುಹಿಸಿ, ಉದಾ: _ಬೆಂಗಳೂರಿನಲ್ಲಿ Rs 500 ಸ್ಟ್ರೀಟ್ ಫುಡ್ ಚಾಲೆಂಜ್_",
  askQuestion: "💬 ನಿಮ್ಮ ಚಾನೆಲ್ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ: ಏನು ಪೋಸ್ಟ್ ಮಾಡಬೇಕು, ವ್ಯೂಸ್ ಯಾಕೆ ಕಡಿಮೆಯಾಯಿತು, ಸ್ಪಾನ್ಸರ್‌ಗೆ ಎಷ್ಟು ಚಾರ್ಜ್ ಮಾಡಬೇಕು…",
  stopped: "🔕 ಸರಿ, ಇನ್ನು ರಿಪೋರ್ಟ್‌ಗಳು ಬರುವುದಿಲ್ಲ. ಯಾವಾಗ ಬೇಕಾದರೂ ಚಾಟ್ ಮಾಡಬಹುದು. ಮತ್ತೆ ಆನ್ ಮಾಡಲು *START* ಕಳುಹಿಸಿ.",
  started: "🔔 ರಿಪೋರ್ಟ್‌ಗಳು ಆನ್! ಸೋಮವಾರ ಬೆಳಿಗ್ಗೆ ಸಿಗೋಣ.",
  noChannel: "ಮೊದಲು Mitra ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನಿಮ್ಮ YouTube ಚಾನೆಲ್ ಕನೆಕ್ಟ್ ಮಾಡಿ, ನಂತರ ನಾನು ನಿಮ್ಮ ಸಂಖ್ಯೆಗಳನ್ನು ಓದಬಲ್ಲೆ.",
  reconnect: "Google ಮಿತ್ರನ ಆಕ್ಸೆಸ್ ನಿಲ್ಲಿಸಿದೆ. ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ Connections ನಲ್ಲಿ YouTube ಮತ್ತೆ ಕನೆಕ್ಟ್ ಮಾಡಿ.",
  unsupported: "ಸದ್ಯ ನಾನು ಟೆಕ್ಸ್ಟ್ ಮಾತ್ರ ಓದಬಲ್ಲೆ 🙏 ವಾಯ್ಸ್ ನೋಟ್ಸ್ ಶೀಘ್ರದಲ್ಲೇ. ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ, ಅಥವಾ *menu* ಕಳುಹಿಸಿ.",
  noVideos: "ನಿಮ್ಮ ಚಾನೆಲ್‌ನಲ್ಲಿ ಇನ್ನೂ ಹೊಸ ಅಪ್‌ಲೋಡ್ ಸಿಗಲಿಲ್ಲ.",
  pickLanguage: "ನಾನು ಯಾವ ಭಾಷೆಯಲ್ಲಿ ಬರೆಯಲಿ?",
  languageSet: (label) => `✅ ಇನ್ನು ಮುಂದೆ ${label} ನಲ್ಲಿ ಬರೆಯುತ್ತೇನೆ.`,
  plan: (plan, used, limit, pass) => `🎟️ *${plan} ಪ್ಲಾನ್*\nಈ ತಿಂಗಳ AI credits: ${limit} ರಲ್ಲಿ ${used} ಬಳಸಲಾಗಿದೆ${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${limit} ರಲ್ಲಿ ${left} free uses ಉಳಿದಿವೆ`,
  outOfCredits: "ಈ ತಿಂಗಳ AI uses ಮುಗಿದಿವೆ. ಹೆಚ್ಚು ಬೇಕಾದರೆ upgrade ಮಾಡಿ, ಅಥವಾ 1ನೇ ತಾರೀಖಿನವರೆಗೆ ಕಾಯಿರಿ. ರಿಪೋರ್ಟ್‌ಗಳು ಉಚಿತ.",
  busy: "ಮಿತ್ರ ಈಗ ಬ್ಯುಸಿ 🙏 ಒಂದು ನಿಮಿಷದಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  working: "⏳ ಮಾಡುತ್ತಿದ್ದೇನೆ…",
  btnFullReport: "ಪೂರ್ಣ ರಿಪೋರ್ಟ್",
  btnMoreTips: "ಇನ್ನಷ್ಟು ಟಿಪ್ಸ್",
  btnTitles: "ಹೊಸ ಟೈಟಲ್‌ಗಳು",
  btnMenu: "ಮೆನು",
  btnIdeas: "ವಿಡಿಯೋ ಐಡಿಯಾ",
  btnUpgrade: "ಪ್ಲಾನ್‌ಗಳು",
  openDashboard: "ನಿಮ್ಮ Mitra ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ",
  footer: "Mitra · ರಿಪೋರ್ಟ್ ನಿಲ್ಲಿಸಲು STOP",
  pdfCaption: "📄 ನಿಮ್ಮ ರಿಪೋರ್ಟ್ PDF ಆಗಿ: ಸೇವ್ ಮಾಡಿ, ಪ್ರಿಂಟ್ ಮಾಡಿ ಅಥವಾ ಶೇರ್ ಮಾಡಿ.",
};

const ml: Strings = {
  menuText: "എന്ത് ചെയ്യണം? അല്ലെങ്കിൽ ഏത് ചോദ്യവും ടൈപ്പ് ചെയ്യൂ 💬",
  menuButton: "മെനു തുറക്കൂ",
  rows: {
    report: ["📊 ആഴ്ച റിപ്പോർട്ട്", "വിജയങ്ങൾ, തിരുത്തലുകൾ, അടുത്തത് എന്ത് പോസ്റ്റ് ചെയ്യണം"],
    check: ["🎬 പുതിയ വീഡിയോ ചെക്ക്", "നിങ്ങളുടെ പുതിയ വീഡിയോ എങ്ങനെ പോകുന്നു"],
    ideas: ["💡 വീഡിയോ ഐഡിയ", "നന്നായി പോകുന്നവയിൽ നിന്ന് 3 ഐഡിയകൾ · 1 use"],
    titles: ["✍️ ടൈറ്റിൽ ഐഡിയ", "ടോപ്പിക് അയക്കൂ, 5 ടൈറ്റിലുകൾ നേടൂ · 1 use"],
    ask: ["💬 മിത്രയോട് ചോദിക്കൂ", "ചാനലിനെക്കുറിച്ച് എന്തും ചോദിക്കൂ"],
    lang: ["🌐 ഭാഷ", "ഞാൻ ഏത് ഭാഷയിൽ എഴുതണം"],
    plan: ["🎟️ എന്റെ പ്ലാൻ", "ഈ മാസം ബാക്കിയുള്ള uses"],
    dashboard: ["🖥️ ഡാഷ്‌ബോർഡ്", "Charts, Video Doctor, Studio"],
    stop: ["🔕 റിപ്പോർട്ട് നിർത്തൂ", "Monday, വീഡിയോ റിപ്പോർട്ടുകൾ ഇനി വരില്ല"],
    start: ["🔔 റിപ്പോർട്ട് ഓൺ", "Monday റിപ്പോർട്ട് + 2 ദിവസ വീഡിയോ ചെക്ക്"],
  },
  welcome: (name) =>
    `🎉 കണക്ട് ആയി, ${name}! ഞാൻ മിത്ര, WhatsApp-ൽ നിങ്ങളുടെ ചാനൽ മാനേജർ.\n\nഎല്ലാ *തിങ്കളാഴ്ച രാവിലെയും* നിങ്ങളുടെ ആഴ്ചത്തെ റിപ്പോർട്ട് അയക്കും, *ഓരോ അപ്‌ലോഡിനും 2 ദിവസത്തിന് ശേഷം* വീഡിയോ എങ്ങനെ പോകുന്നു, എന്ത് ചെയ്യണം എന്ന് പറയും.\n\nഎപ്പോൾ വേണമെങ്കിലും ഇവിടെ എന്തും ചോദിക്കൂ.`,
  notLinked: "നമസ്കാരം! ഞാൻ മിത്ര 👋 നിങ്ങളുടെ AI ചാനൽ മാനേജർ.\n\nറിപ്പോർട്ടുകൾ ഇവിടെ ലഭിക്കാൻ Mitra തുറക്കൂ → *WhatsApp & reports* → *Connect WhatsApp* അമർത്തൂ.",
  linkExpired: "ഈ കോഡിന്റെ കാലാവധി കഴിഞ്ഞു. Mitra-യിൽ WhatsApp & reports-ൽ വീണ്ടും Connect അമർത്തൂ.",
  askTopic: "✍️ നിങ്ങളുടെ വീഡിയോ ടോപ്പിക് ഒരു വരിയിൽ അയക്കൂ, ഉദാ: _കൊച്ചിയിൽ Rs 500 സ്ട്രീറ്റ് ഫുഡ് ചലഞ്ച്_",
  askQuestion: "💬 ചാനലിനെക്കുറിച്ച് എന്തും ചോദിക്കൂ: എന്ത് പോസ്റ്റ് ചെയ്യണം, വ്യൂസ് എന്തുകൊണ്ട് കുറഞ്ഞു, സ്പോൺസറോട് എത്ര ചാർജ് ചെയ്യണം…",
  stopped: "🔕 ശരി, ഇനി റിപ്പോർട്ടുകൾ വരില്ല. എപ്പോൾ വേണമെങ്കിലും ചാറ്റ് ചെയ്യാം. വീണ്ടും ഓണാക്കാൻ *START* അയക്കൂ.",
  started: "🔔 റിപ്പോർട്ടുകൾ ഓൺ! തിങ്കളാഴ്ച രാവിലെ കാണാം.",
  noChannel: "ആദ്യം Mitra വെബ്സൈറ്റിൽ നിങ്ങളുടെ YouTube ചാനൽ കണക്ട് ചെയ്യൂ, എന്നിട്ട് എനിക്ക് നിങ്ങളുടെ നമ്പറുകൾ വായിക്കാം.",
  reconnect: "Google മിത്രയുടെ ആക്സസ് നിർത്തി. വെബ്സൈറ്റിൽ Connections-ൽ YouTube വീണ്ടും കണക്ട് ചെയ്യൂ.",
  unsupported: "ഇപ്പോൾ എനിക്ക് ടെക്സ്റ്റ് മാത്രമേ വായിക്കാൻ കഴിയൂ 🙏 വോയ്സ് നോട്ടുകൾ ഉടൻ. ചോദ്യം ടൈപ്പ് ചെയ്യൂ, അല്ലെങ്കിൽ *menu* അയക്കൂ.",
  noVideos: "നിങ്ങളുടെ ചാനലിൽ പുതിയ അപ്‌ലോഡ് ഇതുവരെ കണ്ടില്ല.",
  pickLanguage: "ഞാൻ ഏത് ഭാഷയിൽ എഴുതണം?",
  languageSet: (label) => `✅ ഇനി മുതൽ ${label}-ൽ എഴുതാം.`,
  plan: (plan, used, limit, pass) => `🎟️ *${plan} പ്ലാൻ*\nഈ മാസത്തെ AI credits: ${limit}-ൽ ${used} ഉപയോഗിച്ചു${pass}`,
  founderPass: (left, limit) => `\n🏅 Founder Pass: ${limit}-ൽ ${left} free uses ബാക്കി`,
  outOfCredits: "ഈ മാസത്തെ AI uses കഴിഞ്ഞു. കൂടുതൽ വേണമെങ്കിൽ upgrade ചെയ്യൂ, അല്ലെങ്കിൽ 1-ാം തീയതി വരെ കാത്തിരിക്കൂ. റിപ്പോർട്ടുകൾ സൗജന്യമാണ്.",
  busy: "മിത്ര ഇപ്പോൾ തിരക്കിലാണ് 🙏 ഒരു മിനിറ്റ് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ.",
  working: "⏳ ചെയ്യുന്നു…",
  btnFullReport: "പൂർണ റിപ്പോർട്ട്",
  btnMoreTips: "കൂടുതൽ ടിപ്സ്",
  btnTitles: "പുതിയ ടൈറ്റിലുകൾ",
  btnMenu: "മെനു",
  btnIdeas: "വീഡിയോ ഐഡിയ",
  btnUpgrade: "പ്ലാനുകൾ",
  openDashboard: "നിങ്ങളുടെ Mitra ഡാഷ്‌ബോർഡ് തുറക്കൂ",
  footer: "Mitra · റിപ്പോർട്ട് നിർത്താൻ STOP",
  pdfCaption: "📄 നിങ്ങളുടെ റിപ്പോർട്ട് PDF ആയി: സേവ് ചെയ്യൂ, പ്രിന്റ് ചെയ്യൂ അല്ലെങ്കിൽ ഷെയർ ചെയ്യൂ.",
};

const ALL: Record<string, Strings> = { en, hinglish, hi, te, ta, mr, bn, kn, ml };

/** Every bot language, for the length checks in tests. */
export const BOT_LANGUAGES = Object.keys(ALL);

export function t(language: string): Strings {
  return ALL[language] ?? en;
}

/** Words that mean "show the menu" / "stop" / "start", in the ways creators actually type them. */
export const MENU_WORDS = /^(hi+|hello|hey|helo|menu|namaste|namaskar|start menu|help|मेन्यू|नमस्ते|हाय|नमस्कार|vanakkam|namaskaram|namaskara|మెనూ|నమస్తే|மெனு|வணக்கம்|মেনু|নমস্কার|ಮೆನು|ನಮಸ್ಕಾರ|മെനു|നമസ്കാരം)[\s\p{P}]*$/iu;
export const STOP_WORDS = /^(stop|unsubscribe|band karo|bandh|बंद|बंद करो|stop reports)\W*$/i;
export const START_WORDS = /^(start|subscribe|chalu|शुरू|चालू)\W*$/i;
