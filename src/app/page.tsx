"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber font-display text-lg italic group-hover:bg-amber/20 transition">
              F
            </div>
            <span className="text-lg tracking-tight font-body font-semibold">
              Fox<span className="text-amber-light">Lock</span>
            </span>
          </a>
          <div className="flex items-center gap-8 text-sm">
            <a href="#services" className="text-ghost hover:text-ice transition">Services</a>
            <a href="#process" className="text-ghost hover:text-ice transition">Process</a>
            <a href="#pricing" className="text-ghost hover:text-ice transition">Pricing</a>
            <a
              href="mailto:contact@foxlock.dev"
              className="px-4 py-2 border border-amber/30 text-amber-light hover:bg-amber/10 rounded transition text-sm"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
          <div className="reveal">
            <p className="text-amber font-display italic text-lg mb-6 tracking-wide">
              Penetration Testing & Security Audits
            </p>
          </div>

          <h1 className="font-display text-5xl md:text-7xl leading-[1.1] mb-8 reveal reveal-d1">
            See your website
            <br />
            <span className="italic text-amber-light">the way an attacker does.</span>
          </h1>

          <p className="text-steel text-xl max-w-2xl mb-14 leading-relaxed reveal reveal-d2">
            Real penetration testing powered by AI. Not a checkbox audit.
            We probe your attack surface with the same tools threat actors use &mdash;
            then explain everything in language you actually understand.
          </p>

          {/* Free Scan CTA */}
          <div className="reveal reveal-d3">
            <p className="text-ghost text-xs uppercase tracking-widest mb-3 font-semibold">
              Free surface scan &mdash; 30 seconds
            </p>
            <form onSubmit={handleScan} className="max-w-xl">
              <div className="flex gap-0 bg-obsidian border border-white/10 rounded-lg overflow-hidden focus-within:border-amber/40 transition glow-amber">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yourbusiness.com"
                  className="flex-1 bg-transparent px-5 py-4 text-ice placeholder-ghost/50 focus:outline-none font-body"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="px-8 py-4 bg-amber hover:bg-amber-light disabled:bg-ghost/20 disabled:text-ghost text-void font-semibold transition whitespace-nowrap"
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
            <p className="text-ghost/60 text-xs mt-3">
              Passive reconnaissance only. No intrusive testing without authorization.
            </p>
          </div>
        </section>

        <div className="gradient-line max-w-6xl mx-auto" />

        {/* Services */}
        <section id="services" className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-amber font-display italic text-lg mb-3">What we do</p>
          <h2 className="font-display text-3xl md:text-4xl mb-16">
            Comprehensive security assessment,<br />
            <span className="italic text-steel">delivered in plain English.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden">
            {[
              {
                title: "Attack Surface Mapping",
                desc: "Subdomain enumeration, port scanning, service fingerprinting, technology detection. We map every entry point an attacker would find.",
                tools: "amass, subfinder, nmap, httpx",
              },
              {
                title: "Vulnerability Scanning",
                desc: "Template-based CVE detection, web server misconfigurations, outdated software, known exploits across your entire infrastructure.",
                tools: "nuclei, nikto, wafw00f",
              },
              {
                title: "Active Testing",
                desc: "Directory fuzzing, parameter testing, SQL injection probing, authentication analysis. Controlled offensive testing with your authorization.",
                tools: "ffuf, gobuster, sqlmap, hydra",
              },
            ].map((s, i) => (
              <div key={i} className="bg-obsidian p-8 flex flex-col">
                <div className="text-amber font-display italic text-4xl mb-6">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-display text-xl mb-3 text-ice">{s.title}</h3>
                <p className="text-steel text-sm leading-relaxed mb-6 flex-1">{s.desc}</p>
                <p className="text-ghost text-xs font-mono">{s.tools}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Toolkit */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-obsidian border border-white/5 rounded-xl p-10">
            <p className="text-amber font-display italic text-lg mb-3">Our toolkit</p>
            <h2 className="font-display text-2xl mb-8 text-ice">
              11 professional-grade security tools,<br />
              <span className="italic text-steel">orchestrated by AI.</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "nmap", desc: "Port scanning" },
                { name: "nuclei", desc: "CVE detection" },
                { name: "nikto", desc: "Web vulnerabilities" },
                { name: "sqlmap", desc: "SQL injection" },
                { name: "ffuf", desc: "Web fuzzing" },
                { name: "gobuster", desc: "Directory brute force" },
                { name: "amass", desc: "Subdomain mapping" },
                { name: "subfinder", desc: "Subdomain discovery" },
                { name: "httpx", desc: "HTTP probing" },
                { name: "hydra", desc: "Auth testing" },
                { name: "wafw00f", desc: "WAF detection" },
                { name: "AI Engine", desc: "Analysis & reporting" },
              ].map((t, i) => (
                <div
                  key={i}
                  className="px-4 py-3 rounded-lg border border-white/5 bg-void hover:border-amber/20 transition group"
                >
                  <div className="font-mono text-sm text-ice group-hover:text-amber-light transition">
                    {t.name}
                  </div>
                  <div className="text-ghost text-xs">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-amber font-display italic text-lg mb-3">How it works</p>
          <h2 className="font-display text-3xl md:text-4xl mb-16">
            From scan to secure<br />
            <span className="italic text-steel">in four steps.</span>
          </h2>

          <div className="space-y-0">
            {[
              {
                step: "01",
                title: "Free Surface Scan",
                desc: "Enter your URL above. In 30 seconds you get an automated check of your SSL, security headers, and public attack surface. No signup, no commitment.",
              },
              {
                step: "02",
                title: "Authorize & Engage",
                desc: "Want the full picture? Sign our authorization form and choose your service tier. We never test without explicit written permission.",
              },
              {
                step: "03",
                title: "AI-Powered Pentest",
                desc: "Our AI engine orchestrates 11 professional tools against your target. Port scanning, vulnerability detection, directory fuzzing, injection testing — the full methodology.",
              },
              {
                step: "04",
                title: "Report & Remediate",
                desc: "Receive a comprehensive report in plain English. Every finding includes severity, business impact, and step-by-step fix instructions. No jargon, no scare tactics.",
              },
            ].map((p, i) => (
              <div
                key={i}
                className="grid md:grid-cols-[100px_1fr] gap-6 py-8 border-t border-white/5 first:border-0"
              >
                <div className="font-display italic text-4xl text-amber/40">
                  {p.step}
                </div>
                <div>
                  <h3 className="font-display text-xl text-ice mb-2">{p.title}</h3>
                  <p className="text-steel text-sm leading-relaxed max-w-xl">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="gradient-line max-w-6xl mx-auto" />

        {/* Pricing */}
        <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-amber font-display italic text-lg mb-3">Pricing</p>
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Security that fits your budget.
          </h2>
          <p className="text-steel mb-16 max-w-xl">
            Start with a free scan. Upgrade to professional testing when you&apos;re ready.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="rounded-xl border border-white/5 bg-obsidian p-8 flex flex-col">
              <p className="text-ghost text-xs uppercase tracking-widest mb-2">Surface Scan</p>
              <div className="font-display text-4xl italic text-ice mb-1">Free</div>
              <p className="text-ghost text-sm mb-8">Instant, no signup</p>
              <ul className="space-y-3 text-sm text-steel mb-8 flex-1">
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> SSL & header analysis</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Technology detection</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Risk score & top findings</li>
                <li className="flex gap-2 text-ghost"><span className="text-ghost/40">&#10007;</span> Active testing</li>
                <li className="flex gap-2 text-ghost"><span className="text-ghost/40">&#10007;</span> Full report</li>
              </ul>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-full py-3 border border-white/10 rounded-lg text-steel hover:text-ice hover:border-white/20 transition text-sm"
              >
                Scan Now
              </button>
            </div>

            {/* Security Audit */}
            <div className="rounded-xl border border-amber/30 bg-obsidian p-8 flex flex-col relative glow-amber">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-amber text-void text-xs font-bold rounded">
                RECOMMENDED
              </div>
              <p className="text-amber text-xs uppercase tracking-widest mb-2">Security Audit</p>
              <div className="font-display text-4xl italic text-ice mb-1">$249</div>
              <p className="text-ghost text-sm mb-8">One-time assessment</p>
              <ul className="space-y-3 text-sm text-steel mb-8 flex-1">
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Everything in Free</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Full port scan & recon</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Vulnerability scanning</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Directory & parameter fuzzing</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Professional PDF report</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Fix instructions per finding</li>
              </ul>
              <a
                href="https://gumroad.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-amber hover:bg-amber-light text-void font-semibold rounded-lg transition text-sm text-center block"
              >
                Book Audit
              </a>
            </div>

            {/* Full Pentest */}
            <div className="rounded-xl border border-white/5 bg-obsidian p-8 flex flex-col">
              <p className="text-ghost text-xs uppercase tracking-widest mb-2">Full Pentest</p>
              <div className="font-display text-4xl italic text-ice mb-1">Custom</div>
              <p className="text-ghost text-sm mb-8">Scoped engagement</p>
              <ul className="space-y-3 text-sm text-steel mb-8 flex-1">
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Everything in Audit</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> SQL injection testing</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Authentication testing</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Business logic analysis</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Remediation support</li>
                <li className="flex gap-2"><span className="text-amber">&#10003;</span> Re-test after fixes</li>
              </ul>
              <a
                href="mailto:contact@foxlock.dev"
                className="w-full py-3 border border-white/10 rounded-lg text-steel hover:text-ice hover:border-white/20 transition text-sm text-center block"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="bg-obsidian border border-white/5 rounded-xl p-10 md:p-14">
            <h2 className="font-display text-2xl md:text-3xl mb-10 text-ice">
              Our commitment.
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              <div>
                <h3 className="font-display italic text-lg text-amber-light mb-2">
                  Honest reporting
                </h3>
                <p className="text-steel text-sm leading-relaxed">
                  No manufactured urgency. No inflated severity scores.
                  If your site is secure, we&apos;ll tell you. Our reputation depends on trust, not fear.
                </p>
              </div>
              <div>
                <h3 className="font-display italic text-lg text-amber-light mb-2">
                  Always authorized
                </h3>
                <p className="text-steel text-sm leading-relaxed">
                  We never perform active testing without explicit written permission.
                  The free scan uses only passive reconnaissance on publicly visible information.
                </p>
              </div>
              <div>
                <h3 className="font-display italic text-lg text-amber-light mb-2">
                  Plain English
                </h3>
                <p className="text-steel text-sm leading-relaxed">
                  Every finding is explained so you can understand the risk and fix it.
                  No CVE dumps, no OWASP jargon, no technical gatekeeping.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="font-display text-3xl md:text-4xl italic mb-6">
            Don&apos;t wait for the breach.
          </h2>
          <p className="text-steel mb-10 max-w-lg mx-auto">
            Most small businesses find out about vulnerabilities from their customers &mdash;
            or worse, their attackers. Find out from us first.
          </p>
          <a
            href="mailto:contact@foxlock.dev"
            className="inline-block px-8 py-4 bg-amber hover:bg-amber-light text-void font-semibold rounded-lg transition"
          >
            Start a Conversation
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber font-display text-xs italic">
              F
            </div>
            <span className="text-sm text-ghost">FoxLock Security</span>
          </div>
          <div className="flex gap-6 text-xs text-ghost">
            <a href="#services" className="hover:text-ice transition">Services</a>
            <a href="#pricing" className="hover:text-ice transition">Pricing</a>
            <a href="mailto:contact@foxlock.dev" className="hover:text-ice transition">Contact</a>
            <a href="https://github.com/lakotafox" className="hover:text-ice transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
