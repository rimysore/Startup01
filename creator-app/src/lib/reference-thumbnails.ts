import type { InputImage } from "./ai";

/**
 * Small public thumbnails (320×180) of viral videos on the same topic, as style references for the AI. Fetched
 * fresh for this one request and never stored. Missing ones are skipped.
 */
export async function referenceThumbnails(ids: string[]): Promise<InputImage[]> {
  const out = await Promise.all(
    ids.map(async (id): Promise<InputImage | null> => {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (!res?.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length > 1000 && buf.length < 200_000 ? { mediaType: "image/jpeg", data: buf.toString("base64") } : null;
    }),
  );
  return out.filter((x): x is InputImage => x != null);
}

