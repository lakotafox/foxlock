import type { Metadata } from "next";
import SignClient from "./SignClient";

export const metadata: Metadata = {
  title: "Client Authorization — FoxLock Security",
  description: "Review and sign your FoxLock Security client authorization.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function SignPage() {
  return <SignClient />;
}
