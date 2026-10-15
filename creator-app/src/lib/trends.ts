import { detectLanguage, type LanguageCode } from "./languages";
import type { TrendingVideo } from "./youtube";

export const CATEGORIES: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "19": "Travel",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Tech",
  "29": "Nonprofits",
};

export interface TrendItem extends TrendingVideo {
  detected: LanguageCode | null;
  category: string;
  /** Views per hour since publishing: how hot it is right now. */
  velocity: number;
}

export function annotate(videos: TrendingVideo[], now = Date.now()): TrendItem[] {
  return videos.map((v) => {
    const hours = Math.max(1, (now - new Date(v.publishedAt).getTime()) / 3_600_000);
    return { ...v, detected: detectLanguage(v.title, v.language), category: CATEGORIES[v.categoryId] ?? "Other", velocity: Math.round(v.views / hours) };
  });
}
