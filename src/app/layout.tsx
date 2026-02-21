import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoxLock — Penetration Testing & Security Audits",
  description:
    "AI-powered penetration testing for small businesses. Real security assessments, not checkbox compliance. Professional reports in plain English.",
  openGraph: {
    title: "FoxLock — Penetration Testing & Security Audits",
    description:
      "See your website the way an attacker does. AI-powered security assessments for businesses that can't afford to get breached.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise min-h-screen text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
