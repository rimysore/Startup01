import { MTop } from "@/components/m/MTop";
import { BusinessForm } from "@/components/m/BusinessForm";
import { marketPageFor } from "@/lib/marketplace/page";
import { getBusiness } from "@/lib/marketplace/store";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

export default async function BusinessPage() {
  const { user, member, s } = await marketPageFor("/m/business", "business");
  const b = await getBusiness(user.id);
  return (
    <>
      <MTop s={s} role={member.role} lang={member.uiLanguage} active="business" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 820 }}>
        <h1 className="mk-h1">{s.business.title}</h1>
        <p className="mk-sub">{s.business.sub}</p>
        <BusinessForm
          s={s}
          initial={{
            name: b?.name ?? "",
            category: b?.category ?? "",
            area: b?.area ?? "",
            budgetMinInr: b?.budgetMinInr != null ? String(b.budgetMinInr) : "",
            budgetMaxInr: b?.budgetMaxInr != null ? String(b.budgetMaxInr) : "",
            website: b?.website ?? "",
            instagram: b?.instagram ?? "",
            whatsapp: b?.whatsapp ?? "",
          }}
        />
      </main>
    </>
  );
}
