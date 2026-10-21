import { MTop } from "@/components/m/MTop";
import { KitEditor } from "@/components/m/KitEditor";
import { DELIVERABLES } from "@/lib/marketplace/flag";
import { marketPageFor } from "@/lib/marketplace/page";
import { getKit, isVerified, rateRange } from "@/lib/marketplace/store";
import { youtubeConnection } from "@/lib/youtube";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

export default async function KitPage() {
  const { user, member, s } = await marketPageFor("/m/kit", "creator");
  const [{ profile, handles }, yt] = await Promise.all([getKit(user.id), youtubeConnection(user.id)]);
  const niches = profile?.niches ?? [];
  const ranges = Object.fromEntries(await Promise.all(DELIVERABLES.map(async (d) => [d, await rateRange(user.id, d, niches)] as const)));
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} active="kit" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 980 }}>
        <h1 className="mk-h1">{s.kit.title}</h1>
        <p className="mk-sub">{s.kit.sub}</p>
        <KitEditor
          s={s}
          initial={{
            displayName: profile?.displayName ?? user.name ?? "",
            bio: profile?.bio ?? "",
            area: profile?.area ?? "",
            niches,
            languages: profile?.languages ?? ["kn"],
            rates: profile?.rates ?? [],
            contactEmail: profile?.contactEmail ?? user.email,
            whatsapp: profile?.whatsapp ?? "",
            isPublic: profile?.isPublic ?? false,
            openToOffers: profile?.openToOffers ?? false,
            slug: profile?.slug ?? null,
            handles: handles.map((h) => ({
              platform: h.platform,
              handle: h.handle,
              followers: h.followers,
              avgViews: h.avgViews,
              verifiedAt: h.verifiedAt && isVerified(h) ? h.verifiedAt.toISOString() : null,
            })),
          }}
          youtubeConnected={Boolean(yt && !yt.needsReconnectAt)}
          ranges={ranges}
        />
      </main>
    </>
  );
}
