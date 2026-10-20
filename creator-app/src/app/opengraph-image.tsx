import { ImageResponse } from "next/og";
import { BRAND, MitraMark } from "@/components/brand";

export const alt = "Mitra: grow your channel in your language";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when the site is shared on WhatsApp, X, LinkedIn… */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0e0d0b", color: "#f4efe6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <MitraMark size={80} id="og" />
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
              backgroundImage: `linear-gradient(100deg, ${BRAND.saffron}, ${BRAND.fuchsia} 50%, ${BRAND.violet})`,
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
