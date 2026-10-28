import type { Metadata } from "next";
import SignClient from "./SignClient";

// Link previews (texts, iMessage, email) use these instead of the homepage's.
const title = "Client Authorization — FoxLock Security";
const description = "Review and sign your FoxLock Security client authorization.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", url: "https://foxlocksecurity.com/sign", siteName: "FoxLock Security" },
  twitter: { card: "summary", title, description },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function SignPage() {
  return <SignClient />;
}
