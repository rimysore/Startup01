import type { Metadata } from "next";
import { BETA } from "@/lib/beta";
import { SITE_URL } from "@/lib/company";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are bundled (src/app/fonts) rather than fetched from Google at build time, so a Google Fonts hiccup can
// never fail a deploy. All are variable fonts on the weight axis.
const body = localFont({ src: "./fonts/inter-latin-wght-normal.woff2", variable: "--font-body", weight: "100 900", display: "swap" });
// Display face: Epilogue, a broad grotesque for headlines, the wordmark and the public site's text (OFL).
const display = localFont({ src: "./fonts/epilogue-latin-wght-normal.woff2", variable: "--font-display-face", weight: "100 900", display: "swap" });
const devanagari = localFont({ src: "./fonts/noto-sans-devanagari-devanagari-wght-normal.woff2", variable: "--font-devanagari", weight: "100 900", display: "swap" });
const telugu = localFont({ src: "./fonts/noto-sans-telugu-telugu-wght-normal.woff2", variable: "--font-telugu", weight: "100 900", display: "swap" });
// Kannada (beta language): the Noto Sans Kannada files the PDF reports already ship (OFL, assets/pdf-fonts).
const kannada = localFont({
  src: [
    { path: "../../assets/pdf-fonts/NotoSansKannada-Regular.ttf", weight: "400" },
    { path: "../../assets/pdf-fonts/NotoSansKannada-Bold.ttf", weight: "700" },
  ],
  variable: "--font-kannada",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: BETA ? "Mitra (beta) — your channel's digital manager" : "Mitra — your channel's digital manager",
  description: BETA
    ? "Mitra shows Hindi and Kannada YouTube creators where viewers left each video, why, and what to change next. Free during the beta."
    : "Mitra is the AI growth manager for creators who make videos in Hindi, Hinglish, Telugu, Tamil and more.",
  openGraph: { siteName: "Mitra", type: "website", url: "/" },
};

// Applies the saved theme before paint so there is no flash.
// Also marks the page as scripted (.js gates the landing page's scroll reveals where CSS scroll timelines are missing) and, if the reveal observer hasn't
// started within 3 seconds, shows everything so no content can stay hidden.
const themeScript = `try{var t=localStorage.getItem("mitra-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add("js");setTimeout(function(){if(!window.__mitraReveals)document.querySelectorAll("[data-reveal]").forEach(function(e){e.classList.add("is-in")})},3000);`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${body.variable} ${display.variable} ${devanagari.variable} ${telugu.variable} ${kannada.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0b1220" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
