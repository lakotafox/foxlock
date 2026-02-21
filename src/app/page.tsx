"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const NetworkCanvas = dynamic(() => import("@/components/NetworkCanvas"), {
  ssr: false,
});

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Scan failed");
        setLoading(false);
        return;
      }

      const result = await res.json();
      sessionStorage.setItem("foxlock-result", JSON.stringify(result));
      router.push("/results");
    } catch {
      setError("Connection failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-void">
      {/* Nav */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-md bg-void/70">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber/15 border border-amber/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-amber-light">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              Fox<span className="text-amber-light">Lock</span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#services" className="text-steel hover:text-white transition">Services</a>
            <a href="#how-it-works" className="text-steel hover:text-white transition">How It Works</a>
            <a href="#pricing" className="text-steel hover:text-white transition">Pricing</a>
            <a
              href="mailto:contact@foxlocksecurity.com"
              className="px-4 py-2 bg-amber hover:bg-amber-light text-void font-semibold rounded-lg transition text-sm"
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <NetworkCanvas />
          <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-24">
            <div className="fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/8 border border-amber/15 text-amber-light text-xs font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-light animate-pulse" />
                AI-Powered Penetration Testing
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] mb-6 fade-up fade-d1 tracking-tight">
              See your website the way
              <br />
              <span className="text-amber-light">an attacker does.</span>
            </h1>

            <p className="text-lg text-steel max-w-xl mb-12 leading-relaxed fade-up fade-d2">
              We use the same tools threat actors use to probe your attack surface.
              Then we explain everything in language you actually understand.
            </p>

            {/* Scan Input */}
            <div className="fade-up fade-d3">
              <p className="text-ghost text-xs uppercase tracking-widest mb-3 font-semibold">
                Try a free surface scan
              </p>
              <form onSubmit={handleScan} className="max-w-lg">
                <div className="flex bg-obsidian border border-white/10 rounded-xl overflow-hidden focus-within:border-amber/40 transition">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yourbusiness.com"
                    className="flex-1 bg-transparent px-5 py-4 text-white placeholder-steel/60 focus:outline-none"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="px-8 py-4 bg-amber hover:bg-amber-light disabled:bg-white/5 disabled:text-ghost text-void font-bold rounded-r-xl transition whitespace-nowrap"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Scanning
                      </span>
                    ) : (
                      "Scan"
                    )}
                  </button>
                </div>
                {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
              </form>
              <p className="text-steel text-xs mt-3">
                Passive reconnaissance only. No intrusive testing without written authorization.
              </p>
            </div>
          </div>
        </section>

        <div className="gradient-line max-w-5xl mx-auto" />

        {/* Services */}
        <section id="services" className="max-w-5xl mx-auto px-6 py-24">
          <div className="mb-14">
            <p className="text-amber text-xs uppercase tracking-widest font-semibold mb-3">Services</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Comprehensive security assessment.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "Find Every Entry Point",
                desc: "We map your entire digital footprint — every subdomain, open port, and connected service. If there's a way in, we find it.",
              },
              {
                num: "02",
                title: "Test for Real Threats",
                desc: "Our AI scans for thousands of known vulnerabilities, misconfigurations, and outdated software that hackers actively exploit.",
              },
              {
                num: "03",
                title: "Deliver a Clear Action Plan",
                desc: "You get a plain-English report with every issue ranked by severity, its business impact, and exactly how to fix it.",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-white/5 bg-obsidian hover:border-amber/15 transition group"
              >
                <span className="text-amber/30 text-xs font-mono">{s.num}</span>
                <h3 className="text-lg font-bold mt-3 mb-2 group-hover:text-amber-light transition">{s.title}</h3>
                <p className="text-steel text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Us */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="p-8 rounded-xl border border-white/5 bg-obsidian text-center">
            <p className="text-amber text-xs uppercase tracking-widest font-semibold mb-4">Why FoxLock</p>
            <h3 className="text-2xl md:text-3xl font-bold text-ice mb-4">
              Advanced toolkit. AI-powered analysis. Expert team.
            </h3>
            <p className="text-steel max-w-2xl mx-auto leading-relaxed">
              We combine 11 professional-grade security tools with AI analysis
              to find vulnerabilities that automated scanners miss. Every report is
              reviewed by our security team and written so you can actually act on it.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-14">
            <p className="text-amber text-xs uppercase tracking-widest font-semibold mb-3">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From scan to secure.
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "1", title: "Free Scan", desc: "Enter your URL. Get an instant surface-level security check. No signup." },
              { num: "2", title: "Authorize", desc: "Sign our authorization form and choose your service tier. We never test without permission." },
              { num: "3", title: "Deep Scan", desc: "Our AI engine runs 11 tools against your target. Port scanning, vulnerability detection, fuzzing, injection testing." },
              { num: "4", title: "Report", desc: "Get a comprehensive report in plain English. Every finding includes severity, business impact, and how to fix it." },
            ].map((p, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-full bg-amber/10 border border-amber/20 text-amber-light font-bold text-sm flex items-center justify-center mx-auto mb-4">
                  {p.num}
                </div>
                <h3 className="font-bold mb-2">{p.title}</h3>
                <p className="text-steel text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="gradient-line max-w-5xl mx-auto" />

        {/* Pricing */}
        <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
          <div className="mb-14">
            <p className="text-amber text-xs uppercase tracking-widest font-semibold mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Security that fits your budget.
            </h2>
            <p className="text-steel">Start free. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Free */}
            <div className="rounded-xl border border-white/5 bg-obsidian p-6 flex flex-col">
              <p className="text-ghost text-xs uppercase tracking-widest font-semibold mb-4">Surface Scan</p>
              <div className="text-3xl font-bold mb-1 tracking-tight">Free</div>
              <p className="text-ghost text-sm mb-6">Instant results</p>
              <ul className="space-y-2.5 text-sm text-steel mb-6 flex-1">
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> SSL &amp; header check</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Tech detection</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Risk score</li>
                <li className="flex gap-2 opacity-40"><span>&#10007;</span> Active testing</li>
              </ul>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-full py-3 border border-white/10 rounded-lg text-steel hover:text-white hover:border-white/20 transition text-sm font-medium"
              >
                Scan Now
              </button>
            </div>

            {/* Monitoring */}
            <div className="rounded-xl border border-white/5 bg-obsidian p-6 flex flex-col">
              <p className="text-ghost text-xs uppercase tracking-widest font-semibold mb-4">Monitoring</p>
              <div className="text-3xl font-bold mb-1 tracking-tight">$39<span className="text-lg text-ghost font-normal">/mo</span></div>
              <p className="text-ghost text-sm mb-6">Continuous</p>
              <ul className="space-y-2.5 text-sm text-steel mb-6 flex-1">
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Weekly re-scans</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Email alerts</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> SSL expiry warnings</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Change detection</li>
              </ul>
              <a
                href="mailto:contact@foxlocksecurity.com?subject=Security Monitoring"
                className="w-full py-3 border border-white/10 rounded-lg text-steel hover:text-white hover:border-white/20 transition text-sm text-center block font-medium"
              >
                Get Started
              </a>
            </div>

            {/* Security Audit */}
            <div className="rounded-xl border border-amber/25 bg-obsidian p-6 flex flex-col relative glow-amber">
              <div className="absolute -top-2.5 left-6 px-3 py-0.5 bg-amber text-void text-[10px] font-bold uppercase tracking-wider rounded">
                Popular
              </div>
              <p className="text-amber text-xs uppercase tracking-widest font-semibold mb-4">Security Audit</p>
              <div className="text-3xl font-bold mb-1 tracking-tight">$199</div>
              <p className="text-ghost text-sm mb-6">One-time report</p>
              <ul className="space-y-2.5 text-sm text-steel mb-6 flex-1">
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Full recon &amp; port scan</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Vulnerability scanning</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Directory fuzzing</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> PDF report + fix guide</li>
              </ul>
              <a
                href="/checkout"
                className="w-full py-3 bg-amber hover:bg-amber-light text-void font-bold rounded-lg transition text-sm text-center block"
              >
                Book Audit
              </a>
            </div>

            {/* Full Pentest */}
            <div className="rounded-xl border border-white/5 bg-obsidian p-6 flex flex-col">
              <p className="text-ghost text-xs uppercase tracking-widest font-semibold mb-4">Full Pentest</p>
              <div className="text-3xl font-bold mb-1 tracking-tight">Custom</div>
              <p className="text-ghost text-sm mb-6">Scoped engagement</p>
              <ul className="space-y-2.5 text-sm text-steel mb-6 flex-1">
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Everything in Audit</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> SQL injection testing</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Auth &amp; logic testing</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Re-test after fixes</li>
              </ul>
              <a
                href="mailto:contact@foxlocksecurity.com"
                className="w-full py-3 border border-white/10 rounded-lg text-steel hover:text-white hover:border-white/20 transition text-sm text-center block font-medium"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="rounded-xl border border-white/5 bg-obsidian p-10">
            <h2 className="text-2xl font-bold mb-8">Our commitment.</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Honest Reporting",
                  desc: "No manufactured urgency. No inflated severity. If your site is secure, we'll tell you.",
                },
                {
                  title: "Always Authorized",
                  desc: "We never perform active testing without explicit written permission. Free scans are passive only.",
                },
                {
                  title: "Plain English",
                  desc: "Every finding explained so you understand the risk and can fix it. No jargon, no gatekeeping.",
                },
              ].map((c, i) => (
                <div key={i}>
                  <h3 className="font-bold text-amber-light mb-2">{c.title}</h3>
                  <p className="text-steel text-sm leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-5 tracking-tight">
            Don&apos;t wait for the breach.
          </h2>
          <p className="text-steel mb-10 max-w-lg mx-auto">
            Most small businesses find out about vulnerabilities from their customers &mdash;
            or worse, their attackers. Find out from us first.
          </p>
          <a
            href="mailto:contact@foxlocksecurity.com"
            className="inline-block px-8 py-4 bg-amber hover:bg-amber-light text-void font-bold rounded-xl transition"
          >
            Start a Conversation
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber/50">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            FoxLock Security
          </div>
          <div className="flex gap-6 text-xs text-ghost">
            <a href="#services" className="hover:text-white transition">Services</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="mailto:contact@foxlocksecurity.com" className="hover:text-white transition">Contact</a>
            <a href="https://github.com/lakotafox" className="hover:text-white transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
