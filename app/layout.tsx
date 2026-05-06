import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://guidekn.com"),
  title: {
    default: "Guide Kin — Guidance from people who get it.",
    template: "%s — Guide Kin",
  },
  description:
    "A free community for adults 35+ figuring out what's next. Honest writing on the things that actually matter at this stage — sourced, plainspoken, and from people who've been there.",
  openGraph: {
    title: "Guide Kin — Guidance from people who get it.",
    description:
      "A free community for adults 35+. Honest writing on the things that actually matter at this stage.",
    url: "https://guidekn.com",
    siteName: "Guide Kin",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guide Kin",
    description:
      "Guidance from people who get it. A free community for adults 35+.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}