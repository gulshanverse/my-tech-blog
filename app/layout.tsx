import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Source_Serif_4 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gulshanblogs.vercel.app"),
  title: {
    default: "Gulshan Kumar — AI, software, and technology",
    template: "%s — Gulshan Kumar",
  },
  description: "A personal technology publication about AI, software engineering, projects, research, and the lessons learned while building.",
  keywords: ["Gulshan Kumar", "AI", "software engineering", "technology blog", "machine learning", "developer blog"],
  authors: [{ name: "Gulshan Kumar", url: "https://github.com/gulshanverse" }],
  creator: "Gulshan Kumar",
  openGraph: {
    type: "website",
    siteName: "Gulshan Kumar",
    title: "Gulshan Kumar — Building, learning, and writing about technology",
    description: "A personal technology publication about AI, software engineering, projects, research, and the lessons learned while building.",
  },
  twitter: { card: "summary_large_image", title: "Gulshan Kumar — AI, software, and technology" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${serif.variable} ${mono.variable}`}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
