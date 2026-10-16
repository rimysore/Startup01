import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the Mitra mark on a warm background. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff7ee" }}>
        <svg width="132" height="132" viewBox="0 0 48 48">
          <defs>
            <linearGradient id="g" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FF8A1F" />
              <stop offset="0.55" stopColor="#FF3D6E" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <path d="M15 3h18a13 13 0 0 1 13 13v11a13 13 0 0 1-13 13H21.5l-8.6 6.2c-1 .7-2.3-.2-2-1.4l1.2-5.4A13 13 0 0 1 2 27V16A13 13 0 0 1 15 3z" fill="url(#g)" />
          <path d="M19.5 14.6v12.8c0 1.1 1.2 1.8 2.2 1.2l10.4-6.4c.9-.6.9-1.9 0-2.4l-10.4-6.4c-1-.6-2.2.1-2.2 1.2z" fill="#fff" />
          <path d="M38.5 1.5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z" fill="#FFD23F" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
