import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, url, score, riskLevel, findingsCount } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const entry = {
      email,
      url: url || null,
      score: score || null,
      riskLevel: riskLevel || null,
      findingsCount: findingsCount || 0,
      timestamp: new Date().toISOString(),
    };

    // Store locally as JSONL — simple, no dependencies
    const dataDir = path.join(process.cwd(), "data");
    await fs.mkdir(dataDir, { recursive: true });

    const filePath = path.join(dataDir, "subscribers.jsonl");
    await fs.appendFile(filePath, JSON.stringify(entry) + "\n");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
