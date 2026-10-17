import type { ChannelSummary, Comment, DailyPoint, RetentionPoint, Trend, Video } from "./types";
import type { AudienceReport, ChannelSnapshot, NicheVideo, TrendingVideo } from "./youtube";

// Deterministic PRNG so the demo looks the same on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const DEMO_VIDEOS: Array<Omit<Video, "publishedAt"> & { daysAgo: number }> = [
  { id: "demo-1", title: "₹15,000 में Best Phone? 5 Phones Tested 🔥", daysAgo: 3, thumbnail: null, durationSec: 742, views: 184_200, likes: 9_840, comments: 1_212, avgViewPct: 46 },
  { id: "demo-2", title: "Laptop Kharidne Se Pehle Ye Video Dekho | Students 2026", daysAgo: 7, thumbnail: null, durationSec: 1105, views: 96_400, likes: 5_310, comments: 688, avgViewPct: 38 },
  { id: "demo-3", title: "Jio vs Airtel 5G — Real Speed Test in Lucknow", daysAgo: 11, thumbnail: null, durationSec: 615, views: 61_900, likes: 2_870, comments: 402, avgViewPct: 52 },
  { id: "demo-4", title: "AI से Paise Kaise Kamaye? (Honest Guide)", daysAgo: 15, thumbnail: null, durationSec: 1388, views: 22_300, likes: 1_120, comments: 251, avgViewPct: 24 },
  { id: "demo-5", title: "Budget Earbuds Under ₹1500 — Sabse Best Kaun?", daysAgo: 19, thumbnail: null, durationSec: 534, views: 143_700, likes: 7_020, comments: 954, avgViewPct: 55 },
  { id: "demo-6", title: "Mera Desk Setup Tour 2026 (Sirf ₹40k)", daysAgo: 24, thumbnail: null, durationSec: 802, views: 38_100, likes: 2_640, comments: 377, avgViewPct: 41 },
  { id: "demo-7", title: "UPI Fraud Se Kaise Bache — 7 Tricks", daysAgo: 28, thumbnail: null, durationSec: 671, views: 211_500, likes: 12_400, comments: 2_031, avgViewPct: 49 },
  { id: "demo-8", title: "Smartwatch Review After 6 Months | Worth It?", daysAgo: 33, thumbnail: null, durationSec: 902, views: 17_800, likes: 760, comments: 140, avgViewPct: 29 },
];

export function demoSummary(): ChannelSummary {
  const r = rng(42);
  const daily: DailyPoint[] = [];
  for (let i = 27; i >= 0; i--) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - i);
    const weekend = [0, 6].includes(day.getUTCDay()) ? 1.18 : 1;
    const trend = 1 + (27 - i) * 0.012;
    const spike = i === 3 || i === 2 ? 1.6 : 1;
    const views = Math.round(21_000 * trend * weekend * spike * (0.88 + r() * 0.24));
    daily.push({
      date: isoDaysAgo(i),
      views,
      watchMinutes: Math.round(views * (3.6 + r() * 0.8)),
      subscribersGained: Math.round(views / (95 + r() * 30)),
    });
  }
  return {
    mode: "demo",
    channel: {
      id: "demo",
      title: "Desi Tech Diaries",
      handle: "@desitechdiaries",
      avatar: null,
      subscribers: 312_400,
      totalViews: 41_820_000,
      videoCount: 286,
    },
    daily,
    videos: DEMO_VIDEOS.map(({ daysAgo, ...v }) => ({ ...v, publishedAt: isoDaysAgo(daysAgo) })),
  };
}

/** A believable retention curve: an intro drop, a slow decay, optional dips and a spike. */
export function demoRetention(videoId: string): RetentionPoint[] {
  const seed = [...videoId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = rng(seed);
  const introDrop = 0.18 + r() * 0.22;
  const dipAt = 0.3 + r() * 0.3;
  const spikeAt = 0.55 + r() * 0.3;
  const points: RetentionPoint[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    let w = 1 - introDrop * Math.min(1, t / 0.08);
    w *= Math.exp(-0.75 * t);
    w -= 0.08 * Math.exp(-((t - dipAt) ** 2) / 0.002);
    w += 0.06 * Math.exp(-((t - spikeAt) ** 2) / 0.0008);
    if (t > 0.92) w *= 1 - (t - 0.92) * 3;
    points.push({ t, watching: Math.min(1, Math.max(0.02, w + (r() - 0.5) * 0.01)) });
  }
  return points;
}

/** Typical channel curve, used as the comparison line. */
export function demoBenchmark(): RetentionPoint[] {
  return Array.from({ length: 101 }, (_, i) => {
    const t = i / 100;
    return { t, watching: (1 - 0.25 * Math.min(1, t / 0.08)) * Math.exp(-0.7 * t) };
  });
}

export function demoComments(): Comment[] {
  const raw = [
    ["Rahul Verma", "Bhai Redmi wala test camera low light me bhi dikhao next video me 🙏", 412],
    ["Priya S", "Sabse honest review, baaki sab sponsored lagte hain", 388],
    ["Ankit Yadav", "Intro bahut lamba tha bhai, seedha point pe aao", 301],
    ["तनुज", "क्या आप गेमिंग टेस्ट BGMI में भी करेंगे?", 254],
    ["Sneha Reddy", "Please Telugu dubbing bhi karo, mere parents ko samajh nahi aata", 233],
    ["Mohit", "Battery test kahan hai?? sabse important wahi tha", 219],
    ["Kavya", "Background music thoda loud hai voice dab jaati hai", 176],
    ["Arjun K", "₹20k budget wala video bhi banao", 165],
    ["Deepak Singh", "Lucknow se hoon, aapke videos se hi phone liya tha 👍", 141],
    ["Ritu", "Comparison table end me screenshot lene layak tha, thanks", 129],
    ["Faizan", "Camera samples side by side dikhate to aur acha hota", 117],
    ["Neha Gupta", "Mujhe iPhone 13 second hand lena chahiye ya new Android?", 96],
    ["Vikas", "Sponsor segment skip button chahiye 😂", 88],
    ["Harish", "Telugu lo kuda videos cheyandi anna", 81],
    ["Pooja", "Aapki voice bahut clear hai, mic konsa hai?", 74],
  ] as const;
  return raw.map(([author, text, likes], i) => ({
    id: `c${i}`,
    author,
    text,
    likes,
    publishedAt: isoDaysAgo(i % 5),
  }));
}

export const DEMO_TRENDS: Trend[] = [
  { topic: "₹20k phone with best camera", language: "Hinglish", niche: "Tech", growth: 142, searches: "Very high", angle: "Low-light camera shootout, shot at night in a tier-2 city market" },
  { topic: "UPI Lite / UPI on feature phones", language: "Hindi", niche: "Finance", growth: 96, searches: "High", angle: "Explain it to your parents — 60-second Short + long-form guide" },
  { topic: "Diwali sale: what not to buy", language: "Hinglish", niche: "Tech", growth: 210, searches: "Very high", angle: "List of fake discounts with price-history proof" },
  { topic: "Sankranti special pindi vantalu", language: "Telugu", niche: "Food", growth: 88, searches: "High", angle: "Grandma vs YouTube recipe challenge" },
  { topic: "Board exam 90-day plan", language: "Hindi", niche: "Education", growth: 74, searches: "High", angle: "Daily timetable PDF in description, Shorts series for each subject" },
  { topic: "Chennai monsoon EV range test", language: "Tamil", niche: "Auto", growth: 63, searches: "Medium", angle: "Real-world range in waterlogged traffic vs company claim" },
  { topic: "Ganpati decoration on a budget", language: "Marathi", niche: "Lifestyle", growth: 55, searches: "Medium", angle: "₹500 / ₹2000 / ₹5000 tiers in one video" },
  { topic: "Durga Puja pandal hopping vlog", language: "Bengali", niche: "Vlog", growth: 120, searches: "High", angle: "Top 10 pandals with a metro route map overlay" },
  { topic: "AI tools for govt job prep", language: "Hindi", niche: "Education", growth: 133, searches: "Very high", angle: "Free tools only, demo on a real SSC question" },
  { topic: "Kannada stand-up reacts", language: "Kannada", niche: "Comedy", growth: 47, searches: "Medium", angle: "Reaction + breakdown of why the joke works" },
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const tv = (id: string, title: string, channelTitle: string, categoryId: string, language: string | null, h: number, views: number): TrendingVideo => ({
  id, title, channelTitle, categoryId, language, publishedAt: hoursAgo(h), durationSec: 600, views, likes: Math.round(views * 0.04), comments: Math.round(views * 0.004), tags: [], thumbnail: null,
});

/** Sample "Trending in India" list for the demo. */
export const DEMO_TRENDING: TrendingVideo[] = [
  tv("demo-t1", "దసరా స్పెషల్ బిర్యానీ 🔥 హైదరాబాద్ స్టైల్", "Vismai Food", "26", "te", 20, 1_840_000),
  tv("demo-t2", "ராத்திரி 11 மணிக்கு Chennai Marina-ல என்ன நடக்குது?", "Madras Vlogs", "22", "ta", 30, 920_000),
  tv("demo-t3", "₹15,000 में सबसे अच्छा कैमरा फोन? | Night Test", "Tech Burner Hindi", "28", "hi", 14, 2_300_000),
  tv("demo-t4", "Bhai ye game toh next level hai 😂 | BGMI Funny Moments", "Gamer Bhai", "20", "hi", 9, 1_150_000),
  tv("demo-t5", "Navratri Garba Night in Ahmedabad | Full Vlog", "Desi Wanderer", "19", "hi", 26, 640_000),
  tv("demo-t6", "ಬೆಂಗಳೂರು ಟ್ರಾಫಿಕ್ ಸತ್ಯ! ಯಾರೂ ಹೇಳದ ವಿಷಯ", "Namma Bengaluru", "25", "kn", 40, 410_000),
  tv("demo-t7", "অষ্টমীর ভোগ রেসিপি | কলকাতার পুজো স্পেশাল", "Bong Kitchen", "26", "bn", 18, 530_000),
  tv("demo-t8", "UPI fraud se kaise bache — 5 tricks jo aapko pata honi chahiye", "Paisa Talks", "27", "hi", 22, 870_000),
  tv("demo-t9", "മഴക്കാലത്ത് മൂന്നാർ യാത്ര | Monsoon Munnar", "Kerala Trails", "19", "ml", 50, 300_000),
  tv("demo-t10", "Pushpa style dialogue spoof | Telugu comedy", "Fun Bucket", "23", "te", 12, 760_000),
  tv("demo-t11", "Marathi Ganpati aarti — full HD", "Bappa Bhakti", "10", "mr", 60, 450_000),
  tv("demo-t12", "IPL auction recap: who won big?", "Cricket Today", "17", "en", 8, 1_400_000),
];

/** Sample audience for the demo channel. */
export const DEMO_AUDIENCE: AudienceReport = {
  days: 28,
  countries: [
    { country: "IN", views: 512_000, minutes: 2_310_000 },
    { country: "AE", views: 34_000, minutes: 190_000 },
    { country: "US", views: 18_000, minutes: 82_000 },
    { country: "SA", views: 12_000, minutes: 61_000 },
    { country: "NP", views: 9_000, minutes: 30_000 },
  ],
  cities: [
    { city: "Lucknow", country: "IN", views: 71_000, minutes: 340_000 },
    { city: "Kanpur", country: "IN", views: 44_000, minutes: 200_000 },
    { city: "Delhi", country: "IN", views: 39_000, minutes: 160_000 },
    { city: "Patna", country: "IN", views: 31_000, minutes: 150_000 },
    { city: "Jaipur", country: "IN", views: 22_000, minutes: 98_000 },
    { city: "Dubai", country: "AE", views: 21_000, minutes: 130_000 },
  ],
  sources: [
    { source: "YT_SEARCH", views: 248_000, minutes: 1_200_000 },
    { source: "RELATED_VIDEO", views: 131_000, minutes: 540_000 },
    { source: "SHORTS", views: 92_000, minutes: 110_000 },
    { source: "SUBSCRIBER", views: 61_000, minutes: 390_000 },
    { source: "EXT_URL", views: 28_000, minutes: 120_000 },
    { source: "NOTIFICATION", views: 12_000, minutes: 70_000 },
  ],
  searchTerms: [
    { term: "best camera phone under 20000", views: 41_000 },
    { term: "upi fraud kaise bache", views: 22_000 },
    { term: "ai se paise kaise kamaye", views: 17_000 },
    { term: "phone night camera test", views: 12_000 },
    { term: "desi tech diaries", views: 9_000 },
  ],
  demographics: [
    { ageGroup: "age18-24", gender: "male", percent: 34 },
    { ageGroup: "age25-34", gender: "male", percent: 31 },
    { ageGroup: "age18-24", gender: "female", percent: 9 },
    { ageGroup: "age25-34", gender: "female", percent: 8 },
    { ageGroup: "age35-44", gender: "male", percent: 11 },
    { ageGroup: "age13-17", gender: "male", percent: 7 },
  ],
  subscribed: [
    { status: "UNSUBSCRIBED", views: 468_000 },
    { status: "SUBSCRIBED", views: 117_000 },
  ],
};

/** The demo channel and two made-up rivals, for the Competitors page without a connected account. */
export function demoCompetitors(): { me: ChannelSnapshot; rivals: ChannelSnapshot[] } {
  const s = demoSummary();
  const me: ChannelSnapshot = {
    id: "demo",
    title: s.channel.title,
    handle: s.channel.handle,
    avatar: null,
    subscribers: s.channel.subscribers,
    totalViews: s.channel.totalViews,
    videoCount: s.channel.videoCount,
    recent: s.videos.map((v) => ({ id: v.id, title: v.title, publishedAt: v.publishedAt, durationSec: v.durationSec, views: v.views, likes: v.likes, comments: v.comments })),
  };
  const make = (id: string, title: string, handle: string, subs: number, rows: [string, number, number, number][]): ChannelSnapshot => ({
    id, title, handle, avatar: null, subscribers: subs, totalViews: subs * 120, videoCount: 400,
    recent: rows.map(([t, days, dur, views], i) => ({ id: `${id}-${i}`, title: t, publishedAt: new Date(Date.now() - days * 86_400_000).toISOString(), durationSec: dur, views, likes: Math.round(views * 0.05), comments: Math.round(views * 0.006) })),
  });
  return {
    me,
    rivals: [
      make("demo-r1", "Gadget Guru Hindi", "@gadgetgurudemo", 1_200_000, [
        ["₹10,000 vs ₹20,000 phone — कौन सा लें?", 3, 720, 910_000], ["iPhone ka sach 😳", 3, 45, 980_000], ["Best phone under 15000 (Oct)", 6, 840, 350_000],
        ["Mat lena ye phone!", 8, 52, 1_300_000], ["Camera test raat me 🌙", 10, 660, 290_000], ["5 hidden Android tricks", 12, 58, 760_000],
        ["Unboxing: naya budget king?", 15, 900, 240_000], ["Battery drain fix 100%", 17, 49, 640_000],
      ]),
      make("demo-r2", "Techno Telugu", "@technotelugudemo", 480_000, [
        ["₹15K లో బెస్ట్ ఫోన్ ఏది?", 4, 780, 120_000], ["ఈ ఫోన్ కొనకండి!", 9, 600, 210_000], ["Camera test night 🔥", 13, 55, 330_000],
        ["Dasara sale lo best deals", 16, 520, 150_000], ["5G ఫోన్ under 12K", 21, 700, 95_000],
      ]),
    ],
  };
}

/** Sample niche search for the Ideas page: what a "budget phone" search in Hindi might turn up. */
export function demoNiche(): { videos: NicheVideo[]; subscribers: Record<string, number> } {
  const day = 86_400_000;
  const v = (id: string, title: string, channelId: string, channelTitle: string, views: number, days: number, durationSec: number): NicheVideo => ({
    id, title, channelId, channelTitle, views, publishedAt: new Date(Date.now() - days * day).toISOString(), durationSec, thumbnail: null,
  });
  return {
    videos: [
      v("demo-n1", "₹8,000 का फोन जो ₹30,000 वाले को हराता है 😱", "demo-c1", "Sasta Tech", 1_450_000, 9, 610),
      v("demo-n2", "Dukaandaar ye nahi batayega — phone kharidne se pehle dekho", "demo-c2", "Mobile Wale Bhaiya", 820_000, 14, 48),
      v("demo-n3", "मैंने 30 दिन सिर्फ़ ₹6,999 वाला फोन चलाया", "demo-c3", "Ek Mahina Challenge", 610_000, 21, 940),
      v("demo-n4", "Best phone under 15000 — honest review", "demo-c4", "Big Tech India", 900_000, 6, 780),
    ],
    subscribers: { "demo-c1": 85_000, "demo-c2": 140_000, "demo-c3": 52_000, "demo-c4": 4_800_000 },
  };
}
