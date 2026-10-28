import type { Metadata } from "next";
import SignClient from "../sign/SignClient";

// Link previews (texts, iMessage, email) use these instead of the homepage's.
const title = "Email Collection Consent — FoxLock Security";
const description = "Review and sign your FoxLock Security email collection consent.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", url: "https://foxlocksecurity.com/email-consent", siteName: "FoxLock Security" },
  twitter: { card: "summary", title, description },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function EmailConsentPage() {
  return <SignClient variant="email" />;
}
