export type Mode = "live" | "demo";

export interface Channel {
  id: string;
  title: string;
  handle: string;
  avatar: string | null;
  subscribers: number;
  totalViews: number;
  videoCount: number;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  views: number;
  watchMinutes: number;
  subscribersGained: number;
}

export interface Video {
  id: string;
  title: string;
  publishedAt: string;
  /** Exact upload time (ISO); missing in data cached before it was added. */
  publishedAtIso?: string;
  thumbnail: string | null;
  durationSec: number;
  views: number;
  likes: number;
  comments: number;
  /** Average percentage of the video watched, 0-100. Null when analytics aren't available. */
  avgViewPct: number | null;
}

export interface ChannelSummary {
  mode: Mode;
  channel: Channel;
  daily: DailyPoint[];
  videos: Video[];
  /** When this data was fetched from YouTube (epoch ms); live data only. */
  fetchedAt?: number;
}

/** Audience retention: share of viewers still watching at each point (ratio of video length 0..1). */
export interface RetentionPoint {
  t: number;
  watching: number; // 0..1+ (can exceed 1 when people rewatch)
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  likes: number;
  publishedAt: string;
}

export interface Trend {
  topic: string;
  language: string;
  niche: string;
  growth: number; // % week over week
  searches: string; // human label e.g. "High"
  angle: string;
}
