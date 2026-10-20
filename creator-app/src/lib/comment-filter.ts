/**
 * Free, code-only clean-up of comments before they reach the AI, so we pay only for comments worth reading.
 * Drops link spam and exact duplicates, folds emoji-only and one-word reactions into a single count line,
 * keeps the most-liked comments, and trims long ones.
 */
export interface RawComment {
  author: string;
  text: string;
  likes: number;
}

const MAX_COMMENTS = 40;
const MAX_CHARS = 300;
const SPAM = /(https?:\/\/|www\.|t\.me\/|wa\.me\/|bit\.ly|telegram|whatsapp\s*(me|now|\+?\d)|\+?\d[\d\s-]{9,})/i;

function letters(text: string): number {
  return (text.match(/\p{L}/gu) ?? []).length;
}

export function prepareComments(comments: RawComment[]): string {
  const seen = new Set<string>();
  const keep: RawComment[] = [];
  let reactions = 0;
  let spam = 0;
  for (const c of comments) {
    const text = c.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (SPAM.test(text)) {
      spam++;
      continue;
    }
    const norm = text.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    // "🔥🔥", "nice", "first" — a mood signal, but not worth a line each.
    if (letters(text) < 3 || (!/\s/.test(text) && text.length < 8)) {
      reactions++;
      continue;
    }
    keep.push({ ...c, text: text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text });
  }
  keep.sort((a, b) => b.likes - a.likes);
  const lines = keep.slice(0, MAX_COMMENTS).map((c) => `${c.author.slice(0, 40)}: ${c.text} [${c.likes}]`);
  if (reactions) lines.push(`(plus ${reactions} short reactions such as emoji or one-word praise)`);
  if (spam) lines.push(`(${spam} link or phone-number spam comments removed)`);
  return lines.join("\n");
}
