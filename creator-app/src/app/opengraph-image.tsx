import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/components/brand";
import { BETA } from "@/lib/beta";

export const alt = "Mitra: know why viewers leave, in your language";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when the site is shared on WhatsApp, X, LinkedIn… */
export default async function OpenGraphImage() {
  const mark = await readFile(path.join(process.cwd(), "public", "brand", "mitra-mark-256.png"));
  const src = `data:image/png;base64,${mark.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: BRAND.navy, color: "#F1F5F9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={src} width={88} height={88} alt="" />
          <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: -3 }}>mitra</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>Know why viewers leave.</span>
          <span style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.1, letterSpacing: -3, color: BRAND.mint }}>In your language.</span>
          <span style={{ marginTop: 28, fontSize: 30, color: "#A7B3C7" }}>
            {BETA ? "Video Doctor for Hindi and Kannada YouTube creators · free beta" : "AI channel manager for India's creators"}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
