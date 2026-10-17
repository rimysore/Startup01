"use client";

import { AssistantChat } from "@/components/Assistant";
import { PageHeader } from "@/components/ui";

/** Ask Mitra full page (links from WhatsApp and old bookmarks). Everywhere else it's the ✨ button. */
export default function AssistantPage() {
  return (
    // dvh = the visible screen on phones (browser bars excluded); leave room for the bottom tab bar there.
    <div className="rise flex h-[calc(100dvh-13.5rem)] min-h-[420px] flex-col lg:h-[calc(100dvh-170px)] lg:min-h-[520px]">
      <PageHeader eyebrow="Ask Mitra" title="Your manager, on call" />
      <div className="card min-h-0 flex-1 overflow-hidden !p-0">
        <AssistantChat />
      </div>
    </div>
  );
}
