// A stand-in for the Anthropic Messages API: records each request and returns schema-shaped answers.
import http from "node:http";

const requests = [];
let mode = "ok"; // ok | refusal | max_tokens

const ANSWERS = {
  trends: { summary: "Festival food is rising.", emotions: [{ emotion: "joy", share: 3 }, { emotion: "curiosity", share: 1 }, { emotion: "humor", share: 0 }], topics: [{ topic: "Dasara biryani", why: "Festival week", emotion: "joy", examples: ["దసరా బిర్యానీ"], angle: "Your city's festival dish" }], regional: ["Hyderabad"], formats: ["Shorts"] },
  audience: { persona: "Young men in Hyderabad.", regions: [{ place: "Hyderabad", insight: "Core city" }], discovery: "Search.", searchIntent: ["biryani"], emotions: [{ emotion: "pride", share: 70 }, { emotion: "joy", share: 30 }], actions: ["Do X"] },
  doctor: { score: 150, verdict: "Intro was too long.", traffic: "Mostly search from Lucknow.", whatWorked: ["Good thumbnail"], whatHurt: [{ at: "0:12", issue: "Slow intro", fix: "Start with the result" }], nextVideo: ["Hook first"], titleIdeas: ["A", "B", "C"] },
  titles: { titles: [{ title: "Raat me test kiya", why: "curiosity", strength: 42 }], thumbnailText: ["कौन जीता?"], hook: "Raat ke 11 baje…" },
  thumbnail: { headline: "रात में कौन जीता?", highlight: "जीता?", badge: "₹20K TEST", layout: "subject-right", images: [{ index: 0, role: "subject", focusX: 0.5, focusY: 0.35, zoom: 7 }, { index: 9, role: "inset", focusX: 0.5, focusY: 0.5, zoom: 1 }], palette: { accent: "#ffd23f", text: "#ffffff", stroke: "#000000", glow: "#ff7a1a", bgFrom: "#1b1446", bgTo: "not-a-colour" }, backgroundQuery: "city night <b>lights</b>", imagePrompt: "Rainy <city> street at night", emoji: "🌙", arrow: true, why: "Price plus a question makes people click." },
  comments: { mood: { positive: 3, neutral: 1, negative: 1 }, emotions: [{ emotion: "joy", share: 2 }, { emotion: "anger", share: 2 }], themes: [{ theme: "Battery", share: 250, example: "battery?" }], questions: ["mic?"], videoIdeas: ["part 2"], replies: [{ to: "Mohit", reply: "Thanks!" }] },
};

function featureOf(body) {
  const props = Object.keys(body.output_config?.format?.schema?.properties ?? {});
  if (props.includes("verdict")) return "doctor";
  if (props.includes("headline")) return "thumbnail";
  if (props.includes("regional")) return "trends";
  if (props.includes("persona")) return "audience";
  if (props.includes("hook")) return "titles";
  if (props.includes("mood")) return "comments";
  return "chat";
}

http
  .createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (req.url === "/__requests") return res.end(JSON.stringify(requests));
      if (req.url === "/__mode") {
        mode = JSON.parse(raw).mode;
        return res.end("{}");
      }
      const body = JSON.parse(raw || "{}");
      const feature = featureOf(body);
      requests.push({ feature, model: body.model, effort: body.output_config?.effort, fallbacks: body.fallbacks ?? null, betas: req.headers["anthropic-beta"] ?? null, workspace: req.headers["anthropic-workspace-id"] ?? null, max_tokens: body.max_tokens, system: body.system, prompt: JSON.stringify(body.messages), images: (body.messages?.[0]?.content ?? []).filter?.((b) => b.type === "image").length ?? 0 });
      const text = feature === "chat" ? "• Is hafte 2 Shorts banao." : JSON.stringify(ANSWERS[feature]);
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          id: `msg_${requests.length}`,
          type: "message",
          role: "assistant",
          model: body.model,
          content: mode === "refusal" ? [] : [{ type: "text", text }],
          stop_reason: mode === "refusal" ? "refusal" : mode === "max_tokens" ? "max_tokens" : "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 2000, output_tokens: 3000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
        }),
      );
    });
  })
  .listen(4010, () => console.log("mock anthropic on :4010"));
