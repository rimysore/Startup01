import { redirect } from "next/navigation";
import { MTop } from "@/components/m/MTop";
import { StartForm } from "@/components/m/StartForm";
import { isRole } from "@/lib/marketplace/flag";
import { strings } from "@/lib/marketplace/i18n";
import { marketPage } from "@/lib/marketplace/page";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

/** Joining the marketplace: which side you're on, the language of your screens, and the Terms. No connections. */
export default async function StartPage({ searchParams }: PageProps<"/m/start">) {
  const { member } = await marketPage("/m/start", { allowNew: true });
  if (member) redirect("/m");
  const q = await searchParams;
  const lang = q.lang === "kn" ? "kn" : "en";
  const role = isRole(q.role) ? q.role : "creator";
  const s = strings(lang);
  return (
    <>
      <MTop s={s} role={null} lang={lang} />
      <main className="lp-wrap mk-main" style={{ maxWidth: 820 }}>
        <h1 className="mk-h1">{s.start.title}</h1>
        <p className="mk-sub">{s.start.sub}</p>
        <StartForm s={s} lang={lang} initialRole={role} />
      </main>
    </>
  );
}
