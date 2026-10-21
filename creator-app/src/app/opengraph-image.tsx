import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Mitra: paid deals between Bengaluru creators and the businesses near them";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when the site is shared on WhatsApp, X, LinkedIn… */
export default async function OpenGraphImage() {
  const mark = await readFile(path.join(process.cwd(), "public", "brand", "mitra-mark-256.png"));
  const src = `data:image/png;base64,${mark.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#111113", color: "#F2F2EF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={src} width={88} height={88} alt="" />
          <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: -3 }}>mitra</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>Get paid by brands</span>
          <span style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.1, letterSpacing: -3, color: "#8B8C92" }}>and shops near you.</span>
          <span style={{ marginTop: 28, fontSize: 30, color: "#A7B3C7" }}>
            Kannada and English creators · Bengaluru · free for creators
          </span>
        </div>
      </div>
    ),
    size,
  );
}
