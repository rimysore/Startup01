import { BriefForm } from "@/components/m/BriefForm";
import { MTop } from "@/components/m/MTop";
import { marketPageFor } from "@/lib/marketplace/page";
import { getBusiness } from "@/lib/marketplace/store";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

export default async function NewBriefPage() {
  const { user, member, s } = await marketPageFor("/m/briefs/new", "business");
  const biz = await getBusiness(user.id);
  return (
    <>
      <MTop s={s} role={member.role} lang={member.uiLanguage} active="briefs" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 900 }}>
        <h1 className="mk-h1">{s.brief.newTitle}</h1>
        <p className="mk-sub">{s.brief.newSub}</p>
        <BriefForm s={s} area={biz?.area ?? ""} link={biz?.website?.startsWith("https://") ? biz.website : ""} budget={biz?.budgetMaxInr ?? biz?.budgetMinInr ?? null} />
      </main>
    </>
  );
}
