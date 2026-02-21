import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-main",
});

export const metadata: Metadata = {
  title: "FoxLock — Penetration Testing & Security Audits",
  description:
    "AI-powered penetration testing for small businesses. Real security assessments with professional reports in plain English.",
  openGraph: {
    title: "FoxLock — Penetration Testing & Security Audits",
    description:
      "See your website the way an attacker does. AI-powered security assessments for businesses.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={font.variable}>
      <body className="min-h-screen text-gray-100 antialiased" style={{ fontFamily: "var(--font-main), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
