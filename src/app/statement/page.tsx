import type { Metadata } from "next";
import SignClient from "../sign/SignClient";

// Link previews (texts, iMessage, email) use these instead of the homepage's.
const title = "Witness Statement — FoxLock Security";
const description = "Write and sign your witness statement in your own words.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", url: "https://foxlocksecurity.com/statement", siteName: "FoxLock Security" },
  twitter: { card: "summary", title, description },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function StatementPage() {
  return <SignClient variant="statement" />;
}
