import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Shell } from "@/components/Shell";
import { currentUser, isAdmin } from "@/lib/auth";
import { MARKETPLACE } from "@/lib/marketplace/flag";

/**
 * With the marketplace on, /dashboard is the admin console only: creators and businesses use /m. Admins see the
 * pilot numbers, members, programs, waitlist, AI costs and the original tools.
 */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard/pilot");
  if (!isAdmin(user)) redirect("/m");
  return <Shell>{children}</Shell>;
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  if (!MARKETPLACE) return <Shell>{children}</Shell>;
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
