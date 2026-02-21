import { NextRequest, NextResponse } from "next/server";
import { scanWebsite } from "@/lib/scanner";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Basic URL validation
    const cleaned = url.trim().replace(/^https?:\/\//, "");
    if (!cleaned || cleaned.length > 253 || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cleaned)) {
      return NextResponse.json({ error: "Please enter a valid domain (e.g., example.com)" }, { status: 400 });
    }

    const result = await scanWebsite(url);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ error: `Scan failed: ${message}` }, { status: 500 });
  }
}
