import type { Metadata } from "next";
import SignClient from "../sign/SignClient";

export const metadata: Metadata = {
  title: "Email Collection Consent — FoxLock Security",
  description: "Review and sign your FoxLock Security email collection consent.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function EmailConsentPage() {
  return <SignClient variant="email" />;
}
