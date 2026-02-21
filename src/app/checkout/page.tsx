"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ scannedUrl }: { scannedUrl: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <p className="mt-4 text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-6 py-4 bg-amber hover:bg-amber-light disabled:bg-white/5 disabled:text-ghost text-void font-bold rounded-lg transition text-sm"
      >
        {loading ? "Processing..." : "Pay $199"}
      </button>

      <p className="text-ghost text-xs text-center mt-4">
        {scannedUrl
          ? `Audit for: ${scannedUrl}`
          : "We'll confirm your target URL via email after payment."}
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("foxlock-result");
    const url = stored ? JSON.parse(stored)?.url : null;
    setScannedUrl(url);

    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scannedUrl: url }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || "Failed to initialize payment");
        }
      })
      .catch(() => setError("Connection failed"));
  }, []);

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <nav className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber font-bold text-lg">
              F
            </div>
            <span className="text-lg tracking-tight font-semibold">
              Fox<span className="text-amber-light">Lock</span>
            </span>
          </a>
          <a href="/results" className="text-steel hover:text-ice transition text-sm">
            Back to Results
          </a>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Order summary */}
          <div className="mb-8 p-6 rounded-xl border border-white/5 bg-obsidian">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-bold text-xl text-ice">Security Audit</h1>
                <p className="text-ghost text-sm mt-1">Professional vulnerability assessment</p>
              </div>
              <div className="text-2xl font-bold text-ice">$199</div>
            </div>
            <div className="border-t border-white/5 pt-4 space-y-2 text-sm text-steel">
              <div className="flex gap-2"><span className="text-amber">&#10003;</span> Full recon &amp; port scanning</div>
              <div className="flex gap-2"><span className="text-amber">&#10003;</span> Vulnerability scanning with 11 tools</div>
              <div className="flex gap-2"><span className="text-amber">&#10003;</span> PDF report with remediation guide</div>
              <div className="flex gap-2"><span className="text-amber">&#10003;</span> Delivered within 48 hours</div>
            </div>
          </div>

          {/* Payment form */}
          <div className="p-6 rounded-xl border border-white/5 bg-obsidian">
            <h2 className="font-bold text-lg text-ice mb-6">Payment</h2>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            {clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#d97706",
                      colorBackground: "#0a0d14",
                      colorText: "#f0f4f8",
                      colorDanger: "#ef4444",
                      borderRadius: "8px",
                      fontFamily: "var(--font-main), sans-serif",
                    },
                  },
                }}
              >
                <CheckoutForm scannedUrl={scannedUrl} />
              </Elements>
            ) : !error ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-6 w-6 border-2 border-amber border-t-transparent rounded-full" />
              </div>
            ) : null}
          </div>

          <p className="text-ghost text-xs text-center mt-6">
            Secured by Stripe. We never see your card details.
          </p>
        </div>
      </main>
    </div>
  );
}
