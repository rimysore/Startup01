import { redirect } from "next/navigation";
import { MTop } from "@/components/m/MTop";
import { TrackForm } from "@/components/m/TrackParts";
import { marketPageFor } from "@/lib/marketplace/page";
import { getBusiness } from "@/lib/marketplace/store";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

export default async function NewTrackPage() {
  const { user, member, s } = await marketPageFor("/m/track/new", "business");
  if (!(await getBusiness(user.id))) redirect("/m/business");
  return (
    <>
      <MTop s={s} role={member.role} lang={member.uiLanguage} active="track" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 900 }}>
        <h1 className="mk-h1">{s.track.newTitle}</h1>
        <p className="mk-sub">{s.track.newSub}</p>
        <TrackForm s={s} />
      </main>
    </>
  );
}
