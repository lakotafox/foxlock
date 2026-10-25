import type { Metadata } from "next";
import SignClient from "../sign/SignClient";

export const metadata: Metadata = {
  title: "Witness Consent — FoxLock Security",
  description: "Review and sign your FoxLock Security witness evidence consent.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function WitnessPage() {
  return <SignClient variant="witness" />;
}
