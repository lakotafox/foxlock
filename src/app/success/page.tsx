"use client";

export default function Success() {
  return (
    <div className="min-h-screen bg-void flex flex-col">
      <nav className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber font-bold text-lg">
              F
            </div>
            <span className="text-lg tracking-tight font-semibold">
              Fox<span className="text-amber-light">Lock</span>
            </span>
          </a>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-ice mb-3">Payment received.</h1>
          <p className="text-steel leading-relaxed mb-8">
            We&apos;ll email you within 24 hours to confirm your target URL and scope.
            Your full security audit will be delivered within 48 hours as a PDF report.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 border border-white/10 rounded-lg text-steel hover:text-white hover:border-white/20 transition text-sm font-medium"
          >
            Back to FoxLock
          </a>
        </div>
      </main>
    </div>
  );
}
