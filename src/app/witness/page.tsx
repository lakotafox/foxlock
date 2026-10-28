import type { Metadata } from "next";
import SignClient from "../sign/SignClient";

// Link previews (texts, iMessage, email) use these instead of the homepage's.
const title = "Witness Consent — FoxLock Security";
const description = "Review and sign your FoxLock Security witness evidence consent.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", url: "https://foxlocksecurity.com/witness", siteName: "FoxLock Security" },
  twitter: { card: "summary", title, description },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function WitnessPage() {
  return <SignClient variant="witness" />;
}
