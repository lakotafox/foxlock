"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Finding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  fix: string;
}

interface HeaderCheck {
  name: string;
  present: boolean;
  value: string | null;
  grade: "A" | "B" | "C" | "F";
  description: string;
}

interface ScanResult {
  url: string;
  timestamp: string;
  score: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  ssl: {
    valid: boolean;
    issuer: string;
    validTo: string;
    daysUntilExpiry: number;
    protocol: string;
    grade: string;
  } | null;
  headers: HeaderCheck[];
  tech: {
    server: string | null;
    poweredBy: string | null;
    cms: string | null;
    framework: string | null;
  };
  httpsRedirect: boolean;
  mixedContent: boolean;
  serverExposed: boolean;
  findings: Finding[];
  summary: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/5",
  high: "border-orange-500/30 bg-orange-500/5",
  medium: "border-amber/30 bg-amber/5",
  low: "border-blue-500/30 bg-blue-500/5",
  info: "border-white/10 bg-white/5",
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-amber-light",
  low: "text-blue-400",
  info: "text-ghost",
};

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400 border-green-500/30",
  B: "text-amber-light border-amber/30",
  C: "text-orange-400 border-orange-500/30",
  F: "text-red-400 border-red-500/30",
};

function ScoreGauge({ score, riskLevel }: { score: number; riskLevel: string }) {
  const color =
    score >= 80 ? "stroke-green-400" : score >= 60 ? "stroke-amber-light" : score >= 40 ? "stroke-orange-400" : "stroke-red-400";
  const textColor =
    score >= 80 ? "text-green-400" : score >= 60 ? "text-amber-light" : score >= 40 ? "text-orange-400" : "text-red-400";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  const riskColors: Record<string, string> = {
    low: "text-green-400 bg-green-500/10 border-green-500/20",
    moderate: "text-amber-light bg-amber/10 border-amber/20",
    high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" stroke="#111827" strokeWidth="6" fill="none" />
          <circle
            cx="60"
            cy="60"
            r="54"
            className={`${color} score-ring`}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-display italic ${textColor}`}>{score}</span>
          <span className="text-xs text-ghost">/100</span>
        </div>
      </div>
      <span className={`mt-3 px-4 py-1 rounded border text-xs font-semibold uppercase tracking-wider ${riskColors[riskLevel]}`}>
        {riskLevel} risk
      </span>
    </div>
  );
}

export default function Results() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("foxlock-result");
    if (!stored) {
      router.push("/");
      return;
    }
    setResult(JSON.parse(stored));
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="animate-spin h-8 w-8 border-2 border-amber border-t-transparent rounded-full" />
      </div>
    );
  }

  const freeFindings = result.findings.slice(0, 3);
  const lockedFindings = result.findings.slice(3);

  return (
    <div className="min-h-screen bg-void noise">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber font-display text-lg italic">
              F
            </div>
            <span className="text-lg tracking-tight font-semibold">
              Fox<span className="text-amber-light">Lock</span>
            </span>
          </a>
          <a href="/" className="px-4 py-2 border border-white/10 rounded-lg text-steel hover:text-ice hover:border-white/20 transition text-sm">
            New Scan
          </a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 reveal">
          <p className="text-amber font-display italic text-lg mb-2">Surface Scan Report</p>
          <h1 className="font-display text-3xl text-ice mb-2">{result.url.replace(/^https?:\/\//, '')}</h1>
          <p className="text-ghost text-sm">
            Scanned {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Score + Summary */}
        <div className="grid md:grid-cols-[220px_1fr] gap-10 mb-14 p-8 rounded-xl border border-white/5 bg-obsidian reveal reveal-d1">
          <ScoreGauge score={result.score} riskLevel={result.riskLevel} />
          <div className="flex flex-col justify-center">
            <p className="text-ice text-lg leading-relaxed font-display italic">
              {result.summary}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 reveal reveal-d2">
          {[
            {
              label: "SSL",
              value: result.ssl ? (result.ssl.valid ? "Valid" : "Invalid") : "None",
              ok: result.ssl?.valid,
            },
            { label: "HTTPS Redirect", value: result.httpsRedirect ? "Yes" : "No", ok: result.httpsRedirect },
            {
              label: "Security Headers",
              value: `${result.headers.filter((h) => h.present).length}/${result.headers.length}`,
              ok: result.headers.filter((h) => h.present).length >= 4,
            },
            { label: "Findings", value: String(result.findings.length), ok: result.findings.length <= 2 },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-xl border border-white/5 bg-obsidian text-center">
              <div className={`text-2xl font-display italic ${s.ok ? "text-green-400" : s.ok === false ? "text-red-400" : "text-ice"}`}>
                {s.value}
              </div>
              <div className="text-xs text-ghost mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* SSL */}
        {result.ssl && (
          <section className="mb-10 reveal reveal-d3">
            <h2 className="font-display text-xl text-ice mb-4">SSL Certificate</h2>
            <div className="p-6 rounded-xl border border-white/5 bg-obsidian">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <div className="text-ghost text-xs uppercase tracking-wider mb-1">Status</div>
                  <div className={result.ssl.valid ? "text-green-400" : "text-red-400"}>
                    {result.ssl.valid ? "Valid" : "Invalid"}
                  </div>
                </div>
                <div>
                  <div className="text-ghost text-xs uppercase tracking-wider mb-1">Issuer</div>
                  <div className="text-ice">{result.ssl.issuer}</div>
                </div>
                <div>
                  <div className="text-ghost text-xs uppercase tracking-wider mb-1">Expires</div>
                  <div className="text-ice">{new Date(result.ssl.validTo).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-ghost text-xs uppercase tracking-wider mb-1">Days Left</div>
                  <div className={result.ssl.daysUntilExpiry < 30 ? "text-amber-light" : "text-green-400"}>
                    {result.ssl.daysUntilExpiry}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Headers */}
        <section className="mb-10 reveal reveal-d4">
          <h2 className="font-display text-xl text-ice mb-4">Security Headers</h2>
          <div className="space-y-2">
            {result.headers.map((h, i) => (
              <div key={i} className="p-4 rounded-lg border border-white/5 bg-obsidian flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded border flex items-center justify-center font-mono text-sm font-bold ${GRADE_COLORS[h.grade]}`}>
                    {h.grade}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-ice">{h.name}</div>
                    <div className="text-xs text-ghost font-mono">
                      {h.present ? (h.value?.substring(0, 50) + (h.value && h.value.length > 50 ? "..." : "")) : "Not configured"}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded border ${h.present ? "text-green-400 border-green-500/20 bg-green-500/5" : "text-red-400 border-red-500/20 bg-red-500/5"}`}>
                  {h.present ? "SET" : "MISSING"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Tech */}
        {(result.tech.server || result.tech.cms || result.tech.framework) && (
          <section className="mb-10 reveal reveal-d5">
            <h2 className="font-display text-xl text-ice mb-4">Detected Technology</h2>
            <div className="p-6 rounded-xl border border-white/5 bg-obsidian">
              <div className="flex flex-wrap gap-2">
                {result.tech.server && (
                  <span className="px-3 py-1.5 rounded border border-white/10 text-ice text-sm font-mono">
                    {result.tech.server}
                  </span>
                )}
                {result.tech.poweredBy && (
                  <span className="px-3 py-1.5 rounded border border-white/10 text-ice text-sm font-mono">
                    {result.tech.poweredBy}
                  </span>
                )}
                {result.tech.cms && (
                  <span className="px-3 py-1.5 rounded border border-purple-500/20 bg-purple-500/5 text-purple-400 text-sm font-mono">
                    {result.tech.cms}
                  </span>
                )}
                {result.tech.framework && (
                  <span className="px-3 py-1.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400 text-sm font-mono">
                    {result.tech.framework}
                  </span>
                )}
              </div>
              {result.serverExposed && (
                <p className="mt-4 text-xs text-amber-light border-t border-white/5 pt-4">
                  Server software is visible in HTTP headers. Attackers use this to target known exploits for specific versions.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Findings */}
        <section className="mb-10 reveal reveal-d6">
          <h2 className="font-display text-xl text-ice mb-4">Findings</h2>

          <div className="space-y-3">
            {freeFindings.map((f, i) => (
              <div key={i} className={`p-5 rounded-xl border ${SEVERITY_COLORS[f.severity]}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${SEVERITY_TEXT[f.severity]}`}>
                    {f.severity}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ice">{f.title}</h3>
                    <p className="text-sm text-steel mt-1 leading-relaxed">{f.description}</p>
                    <div className="mt-3 p-3 rounded-lg bg-void border border-white/5 text-sm">
                      <span className="text-amber text-xs uppercase tracking-wider font-semibold">Recommended fix</span>
                      <p className="text-steel mt-1">{f.fix}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {lockedFindings.length > 0 && (
              <div className="relative mt-6">
                <div className="space-y-3 blur-sm pointer-events-none select-none opacity-50">
                  {lockedFindings.slice(0, 2).map((f, i) => (
                    <div key={i} className={`p-5 rounded-xl border ${SEVERITY_COLORS[f.severity]}`}>
                      <div className="flex items-start gap-3">
                        <span className={`text-xs font-bold uppercase ${SEVERITY_TEXT[f.severity]}`}>{f.severity}</span>
                        <div>
                          <h3 className="font-semibold text-ice">{f.title}</h3>
                          <p className="text-sm text-steel mt-1">{f.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-obsidian border border-amber/20 rounded-xl p-8 text-center max-w-md glow-amber">
                    <p className="font-display italic text-2xl text-ice mb-2">
                      {lockedFindings.length} more finding{lockedFindings.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-steel text-sm mb-6">
                      Get a professional security audit with complete findings,
                      business impact analysis, and step-by-step remediation.
                    </p>
                    <a
                      href="https://gumroad.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-8 py-3 bg-amber hover:bg-amber-light text-void font-semibold rounded-lg transition"
                    >
                      Get Full Audit &mdash; $249
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Upsell */}
        <section className="mb-12 p-10 rounded-xl border border-amber/15 bg-amber/3 text-center">
          <p className="font-display italic text-2xl text-ice mb-4">
            This scan checked the surface.
          </p>
          <p className="text-steel mb-8 max-w-lg mx-auto">
            A professional penetration test goes deeper &mdash; testing for SQL injection,
            authentication bypasses, business logic flaws, and real attack paths
            that automated scans can&apos;t find.
          </p>
          <a
            href="mailto:contact@foxlock.dev"
            className="inline-block px-8 py-4 bg-amber hover:bg-amber-light text-void font-semibold rounded-lg transition"
          >
            Book a Professional Pentest
          </a>
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-ghost text-xs">
        FoxLock Security &mdash; Penetration testing for small businesses.
      </footer>
    </div>
  );
}
