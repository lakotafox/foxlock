import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover",
  });

  try {
    const { email, scannedUrl } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 19900, // $199.00
      currency: "usd",
      metadata: {
        product: "FoxLock Security Audit",
        scannedUrl: scannedUrl || "",
      },
      receipt_email: email || undefined,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
