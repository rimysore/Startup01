import { ImageResponse } from "next/og";
import { MitraMark } from "@/components/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the Mitra mark on a warm background. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff7ee" }}>
        <MitraMark size={140} id="apple" />
      </div>
    ),
    size,
  );
}
