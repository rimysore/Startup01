import { ImageResponse } from "next/og";

export const alt = "Mitra: grow your channel in your language";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when the site is shared on WhatsApp, X, LinkedIn… */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0e0d0b", color: "#f4efe6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="76" height="76" viewBox="0 0 48 48">
            <defs>
              <linearGradient id="g" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#FF8A1F" />
                <stop offset="0.55" stopColor="#FF3D6E" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <path d="M15 3h18a13 13 0 0 1 13 13v11a13 13 0 0 1-13 13H21.5l-8.6 6.2c-1 .7-2.3-.2-2-1.4l1.2-5.4A13 13 0 0 1 2 27V16A13 13 0 0 1 15 3z" fill="url(#g)" />
            <path d="M19.5 14.6v12.8c0 1.1 1.2 1.8 2.2 1.2l10.4-6.4c.9-.6.9-1.9 0-2.4l-10.4-6.4c-1-.6-2.2.1-2.2 1.2z" fill="#fff" />
            <path d="M38.5 1.5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z" fill="#FFD23F" />
          </svg>
          <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: -3 }}>mitra</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>Grow your channel</span>
          <span
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -3,
              backgroundImage: "linear-gradient(100deg, #ff8a1f, #ff3d6e 55%, #8b5cf6)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            in your language.
          </span>
          <span style={{ marginTop: 28, fontSize: 30, color: "#cdc6b8" }}>AI channel manager · Hindi · Telugu · Tamil · Hinglish & more</span>
        </div>
      </div>
    ),
    size,
  );
}
