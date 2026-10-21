import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { currentUser, type User } from "@/lib/auth";
import { MARKETPLACE } from "./flag";
import { strings, type Strings } from "./i18n";
import { getMember, type Member } from "./store";

/**
 * For marketplace pages: 404 while the flag is off, the login page without a session, and the welcome page for
 * anyone who hasn't joined yet (unless `allowNew`). Returns the screens' strings in the member's language.
 */
export async function marketPage(path: string, opts: { allowNew?: boolean } = {}): Promise<{ user: User; member: Member | null; s: Strings }> {
  if (!MARKETPLACE) notFound();
  await connection();
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  const member = await getMember(user.id);
  if (!member && !opts.allowNew) redirect("/m/start");
  return { user, member, s: strings(member?.uiLanguage) };
}

/** The same, for pages only one side of the marketplace uses. */
export async function marketPageFor(path: string, side: "creator" | "business") {
  const ctx = await marketPage(path);
  const isCreator = ctx.member!.role === "creator";
  if ((side === "creator") !== isCreator) redirect("/m");
  return ctx as { user: User; member: Member; s: Strings };
}
