"use client";

import { useEffect, useRef, useState } from "react";
import { postAi, useDashboard, type AiError } from "@/components/dashboard-context";
import { channelContext } from "@/lib/channel-context";
import { AiErrorNote, Button, Card, PageHeader } from "@/components/ui";
import { compact } from "@/lib/format";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Is hafte kya upload karun?",
  "Mere subscribers kyun nahi badh rahe?",
  "Plan a 4-week Shorts series from my best video",
  "Sponsor ko kitna charge karun?",
];

/** Minimal formatting for replies: **bold** and bullet lines. */
function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const bullet = /^\s*([-•*]|\d+\.)\s+/.exec(line);
        const body = bullet ? line.slice(bullet[0].length) : line;
        const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>,
        );
        return bullet ? (
          <div key={i} className="flex gap-2"><span className="text-accent">•</span><span>{parts}</span></div>
        ) : (
          <p key={i}>{parts}</p>
        );
      })}
    </div>
  );
}

export default function AssistantPage() {
  const { summary, language, refreshMe } = useDashboard();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages, sending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending || !summary) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);
    const res = await postAi<string>("/api/ai/chat", { language, context: channelContext(summary), messages: next.slice(-12).map((m) => ({ ...m, content: m.content.slice(0, 2000) })) });
    setSending(false);
    if (res.result) setMessages([...next, { role: "assistant", content: res.result }]);
    else setError(res.error ?? { message: "Something went wrong." });
    refreshMe();
  }

  return (
    // dvh = the visible screen on phones (browser bars excluded); leave room for the bottom tab bar there.
    <div className="rise flex h-[calc(100dvh-13.5rem)] min-h-[420px] flex-col lg:h-[calc(100dvh-170px)] lg:min-h-[520px]">
      <PageHeader eyebrow="Ask Mitra" title="Your manager, on call" />
      <Card className="flex min-h-0 flex-1 flex-col !p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {!messages.length && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="font-display text-4xl">Kuch bhi poocho.</p>
                <p className="mt-2 text-sm text-muted">
                  Mitra knows your {summary ? `${compact(summary.channel.subscribers)} subscribers and recent ${summary.videos.length} uploads` : "channel"}.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user" ? "rounded-br-md bg-ink text-bg" : "rounded-bl-md bg-surface-2"
                }`}
              >
                {m.role === "assistant" ? <Rich text={m.content} /> : m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex">
              <div className="rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3 text-sm text-muted">Mitra is typing…</div>
            </div>
          )}
          {error && <AiErrorNote error={error} />}
          <div ref={end} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-line p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type in Hindi, Hinglish, Telugu, English…"
            maxLength={2000}
            className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <Button type="submit" disabled={sending || !input.trim()}>Send</Button>
        </form>
      </Card>
    </div>
  );
}
