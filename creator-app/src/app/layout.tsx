import type { Metadata } from "next";
import { SITE_URL } from "@/lib/company";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are bundled (src/app/fonts) rather than fetched from Google at build time, so a Google Fonts hiccup can
// never fail a deploy. All are variable fonts on the weight axis.
const body = localFont({ src: "./fonts/inter-latin-wght-normal.woff2", variable: "--font-body", weight: "100 900", display: "swap" });
// Display face: a friendly, characterful grotesque for headlines and the wordmark.
const display = localFont({ src: "./fonts/bricolage-grotesque-latin-wght-normal.woff2", variable: "--font-display-face", weight: "200 800", display: "swap" });
const devanagari = localFont({ src: "./fonts/noto-sans-devanagari-devanagari-wght-normal.woff2", variable: "--font-devanagari", weight: "100 900", display: "swap" });
const telugu = localFont({ src: "./fonts/noto-sans-telugu-telugu-wght-normal.woff2", variable: "--font-telugu", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mitra — your channel's digital manager",
  description:
    "Mitra is the AI growth manager for creators who make videos in Hindi, Hinglish, Telugu, Tamil and more.",
  openGraph: { siteName: "Mitra", type: "website", url: "/" },
};

// Applies the saved theme before paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem("mitra-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${body.variable} ${display.variable} ${devanagari.variable} ${telugu.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
