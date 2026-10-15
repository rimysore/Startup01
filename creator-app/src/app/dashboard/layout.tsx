import { Shell } from "@/components/Shell";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <Shell>{children}</Shell>;
}
