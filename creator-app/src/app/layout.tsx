import type { Metadata } from "next";
import { Inter, Instrument_Serif, Noto_Sans_Devanagari, Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const display = Instrument_Serif({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["500", "800"],
});
const telugu = Noto_Sans_Telugu({ variable: "--font-telugu", subsets: ["telugu"], weight: ["500", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://mitracreators.com"),
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
