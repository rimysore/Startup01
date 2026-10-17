"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { postAi, useDashboard, type AiError } from "./dashboard-context";
import { AiErrorNote } from "./ui";
import { LANGUAGES } from "@/lib/languages";
import { FEATURE_CREDITS } from "@/lib/plans";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/** Per account, so a second person signing in on the same browser never sees someone else's conversation. */
const storeKey = (userId: string) => `mitra-chat:${userId}`;
const SPARK = "M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z";

/** The panel's own words in each language, so a Telugu creator isn't greeted (and nudged) in Hinglish. */
const WORDS: Record<string, { hello: string; sub: string; asks: string[] }> = {
  en: { hello: "Ask me anything.", sub: "Your channel, ideas, sponsors, anything about growing.", asks: ["What should I upload this week?", "How is my channel doing this week?", "Why aren't my subscribers growing?", "How much should I charge a sponsor?"] },
  hinglish: { hello: "Kuch bhi poocho.", sub: "Aapka channel, ideas, sponsors: growth ke baare mein kuch bhi.", asks: ["Is hafte kya upload karun?", "Is hafte mera channel kaisa chal raha hai?", "Mere subscribers kyun nahi badh rahe?", "Sponsor ko kitna charge karun?"] },
  hi: { hello: "कुछ भी पूछिए।", sub: "आपका चैनल, आइडिया, स्पॉन्सर: ग्रोथ से जुड़ा कुछ भी।", asks: ["इस हफ्ते क्या अपलोड करूँ?", "इस हफ्ते मेरा चैनल कैसा चल रहा है?", "मेरे सब्सक्राइबर क्यों नहीं बढ़ रहे?", "स्पॉन्सर से कितना चार्ज करूँ?"] },
  te: { hello: "ఏదైనా అడగండి.", sub: "మీ ఛానల్, ఐడియాలు, స్పాన్సర్లు: గ్రోత్ గురించి ఏదైనా.", asks: ["ఈ వారం ఏ వీడియో అప్‌లోడ్ చేయాలి?", "ఈ వారం నా ఛానల్ ఎలా ఉంది?", "నా సబ్‌స్క్రైబర్లు ఎందుకు పెరగడం లేదు?", "స్పాన్సర్‌కి ఎంత చార్జ్ చేయాలి?"] },
  ta: { hello: "எதுவும் கேளுங்கள்.", sub: "உங்கள் சேனல், ஐடியாக்கள், ஸ்பான்சர்கள்: வளர்ச்சி பற்றி எதுவும்.", asks: ["இந்த வாரம் என்ன வீடியோ போடலாம்?", "இந்த வாரம் என் சேனல் எப்படி இருக்கிறது?", "என் சப்ஸ்கிரைபர்கள் ஏன் அதிகரிக்கவில்லை?", "ஸ்பான்சரிடம் எவ்வளவு கேட்கலாம்?"] },
  mr: { hello: "काहीही विचारा.", sub: "तुमचं चॅनल, आयडिया, स्पॉन्सर: ग्रोथबद्दल काहीही.", asks: ["या आठवड्यात काय अपलोड करू?", "या आठवड्यात माझं चॅनल कसं चाललंय?", "माझे सबस्क्रायबर का वाढत नाहीत?", "स्पॉन्सरकडून किती चार्ज करू?"] },
  bn: { hello: "যা খুশি জিজ্ঞেস করুন।", sub: "আপনার চ্যানেল, আইডিয়া, স্পনসর: গ্রোথ নিয়ে যেকোনো কিছু।", asks: ["এই সপ্তাহে কী আপলোড করব?", "এই সপ্তাহে আমার চ্যানেল কেমন চলছে?", "আমার সাবস্ক্রাইবার কেন বাড়ছে না?", "স্পনসরের কাছে কত চার্জ করব?"] },
  kn: { hello: "ಏನು ಬೇಕಾದರೂ ಕೇಳಿ.", sub: "ನಿಮ್ಮ ಚಾನೆಲ್, ಐಡಿಯಾಗಳು, ಸ್ಪಾನ್ಸರ್‌ಗಳು: ಗ್ರೋತ್ ಬಗ್ಗೆ ಏನಾದರೂ.", asks: ["ಈ ವಾರ ಏನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಿ?", "ಈ ವಾರ ನನ್ನ ಚಾನೆಲ್ ಹೇಗಿದೆ?", "ನನ್ನ ಸಬ್‌ಸ್ಕ್ರೈಬರ್‌ಗಳು ಯಾಕೆ ಹೆಚ್ಚಾಗುತ್ತಿಲ್ಲ?", "ಸ್ಪಾನ್ಸರ್‌ಗೆ ಎಷ್ಟು ಚಾರ್ಜ್ ಮಾಡಲಿ?"] },
  ml: { hello: "എന്തും ചോദിക്കൂ.", sub: "നിങ്ങളുടെ ചാനൽ, ഐഡിയകൾ, സ്പോൺസർമാർ: ഗ്രോത്തിനെക്കുറിച്ച് എന്തും.", asks: ["ഈ ആഴ്ച എന്ത് അപ്‌ലോഡ് ചെയ്യണം?", "ഈ ആഴ്ച എന്റെ ചാനൽ എങ്ങനെയുണ്ട്?", "എന്റെ സബ്സ്ക്രൈബർമാർ എന്തുകൊണ്ട് കൂടുന്നില്ല?", "സ്പോൺസറോട് എത്ര ചാർജ് ചെയ്യണം?"] },
};

/** Minimal formatting for replies: **bold** and bullet lines. */
function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const bullet = /^\s*([-•*]|\d+\.)\s+/.exec(line);
        const body = bullet ? line.slice(bullet[0].length) : line;
        const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith("**") && p.endsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>));
        return bullet ? (
          <div key={i} className="flex gap-2">
            <span className="text-accent">•</span>
            <span>{parts}</span>
          </div>
        ) : (
          <p key={i}>{parts}</p>
        );
      })}
    </div>
  );
}

function loadSaved(userId: string): Msg[] {
  try {
    const raw = sessionStorage.getItem(storeKey(userId));
    const v = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(v) ? v.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-30) : [];
  } catch {
    return [];
  }
}

/**
 * The chat itself. Mitra answers from everything we know about the creator (gathered on the server): channel numbers,
 * outlier scores, this week's facts, competitors, WhatsApp, the latest report. The conversation survives page changes
 * within the tab.
 */
export function AssistantChat({ onClose }: { onClose?: () => void }) {
  const { language, refreshMe, me } = useDashboard();
  const userId = me?.user?.id ?? "guest";
  const path = usePathname();
  const [messages, setMessages] = useState<Msg[]>(() => loadSaved(userId));
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
    try {
      sessionStorage.setItem(storeKey(userId), JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages, sending, userId]);
  useEffect(() => field.current?.focus(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: content.slice(0, 2000) }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);
    const res = await postAi<string>("/api/ai/chat", { language, page: path, messages: next.slice(-12) });
    setSending(false);
    if (typeof res.result === "string" && res.result.trim()) setMessages([...next, { role: "assistant", content: res.result }]);
    else setError(res.error ?? { message: "Mitra couldn't answer that. Please try again." });
    refreshMe();
  }

  const founderFree = me?.founderNumber != null;
  const words = WORDS[language] ?? WORDS.en;
  const native = LANGUAGES.find((l) => l.code === language)?.native ?? "English";
  return (
    // translate="no": Chrome's page translation rewrites the text React manages and crashes the chat.
    <div translate="no" className="notranslate flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={SPARK} />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">Ask Mitra</p>
          <p className="truncate text-[11px] text-muted">
            Replies in <span className="font-indic font-semibold text-ink-2">{native}</span> · {founderFree ? "free on your Founder Pass" : `${FEATURE_CREDITS.chat} credit a reply`}
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="rounded-full px-2.5 py-1 text-xs text-muted hover:bg-surface-2">
            New chat
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-surface-2" aria-label="Close Ask Mitra">
            ×
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!messages.length && (
          <div className="py-4 text-center">
            <p className="font-display font-indic text-3xl">{words.hello}</p>
            <p className="mt-1 font-indic text-sm text-muted">{words.sub}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {words.asks.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3.5 py-2 text-left font-indic text-sm hover:border-accent">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-md bg-ink text-bg" : "rounded-bl-md bg-surface-2"}`}>
              <div className="font-indic">{m.role === "assistant" ? <Rich text={m.content} /> : m.content}</div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3" aria-label="Mitra is typing">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        {error && <AiErrorNote error={error} />}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t border-line p-3"
      >
        <textarea
          ref={field}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder={`Type your question (${native})…`}
          maxLength={2000}
          className="max-h-32 min-w-0 flex-1 resize-none rounded-2xl border border-line bg-surface px-4 py-2.5 text-base outline-none focus:border-accent sm:text-sm"
        />
        <button type="submit" disabled={sending || !input.trim()} className="bg-brand grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white disabled:opacity-40" aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}

/**
 * The ✨ button at the bottom right of every dashboard page. Opens Ask Mitra as a panel (a full sheet on phones),
 * sitting above the phone tab bar. Esc closes it.
 */
export function AssistantWidget() {
  const path = usePathname();
  const { me } = useDashboard();
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const close = () => {
    setState("closing");
    setTimeout(() => setState("closed"), 180);
  };
  useEffect(() => {
    if (state !== "open") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);
  // The full-page chat doesn't need a second one floating over it.
  if (path.startsWith("/dashboard/assistant")) return null;
  // Mitra answers from the creator's own channel, so there's nothing to ask before it's connected.
  if (!me?.user || !me.youtube) return null;

  return (
    <>
      {state === "closed" && (
        <button
          onClick={() => setState("open")}
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full border border-line bg-surface p-3.5 text-ink shadow-lg shadow-black/10 transition hover:bg-surface-2 lg:bottom-6 lg:right-6 lg:px-4 lg:py-2.5"
          aria-label="Ask Mitra"
          aria-haspopup="dialog"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-accent" aria-hidden>
            <path d={SPARK} />
          </svg>
          <span className="hidden text-sm font-semibold lg:inline">Ask Mitra</span>
        </button>
      )}
      {state !== "closed" &&
        createPortal(
          <div className={`app fixed inset-0 z-50 flex items-end justify-end bg-black/30 sm:p-6 ${state === "closing" ? "fade-out" : "fade-in"}`} onClick={close} role="dialog" aria-modal="true" aria-label="Ask Mitra">
            <div
              className={`card flex h-[88dvh] w-full flex-col overflow-hidden !rounded-b-none !p-0 shadow-2xl sm:h-[min(640px,85dvh)] sm:max-w-[420px] sm:!rounded-2xl ${state === "closing" ? "modal-out" : "modal-in"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <AssistantChat onClose={close} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
