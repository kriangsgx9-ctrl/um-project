import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

// The UI is majority-Thai copy, so the primary typeface must actually cover
// Thai glyphs — Geist Sans (the previous choice) doesn't, and was silently
// overridden by a hardcoded `font-family: Arial` in globals.css as a result.
// IBM Plex Sans Thai covers Thai + Latin in one consistent family instead.
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRIME UM ASCEND",
  description: "From Agent → Leader → UM",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${plexThai.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
