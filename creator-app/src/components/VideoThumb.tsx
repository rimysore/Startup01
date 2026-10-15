import type { Video } from "@/lib/types";
import { fmtTime } from "@/lib/retention";

const HUES = ["#e2620b", "#0b6e6c", "#6250d6", "#b3261e", "#1f7a3a", "#a86500"];

/** The real thumbnail when we have one, otherwise a generated cover so demo rows still look like videos. */
export function VideoThumb({ video, className = "" }: { video: Video; className?: string }) {
  const hue = HUES[[...video.id].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return (
    <div className={`relative aspect-video shrink-0 overflow-hidden rounded-lg ${className}`} style={{ background: hue }}>
      {video.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-end p-1.5">
          <span className="line-clamp-2 font-indic text-[10px] font-extrabold leading-tight text-white">{video.title}</span>
        </div>
      )}
      <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[10px] font-medium text-white">
        {fmtTime(video.durationSec)}
      </span>
    </div>
  );
}
