"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Dancing_Script } from "next/font/google";
import { CONTRACT_HTML, CONTRACT_VERSION } from "./contract";
import { WITNESS_HTML, WITNESS_VERSION } from "../witness/contract";

const script = Dancing_Script({ subsets: ["latin"], weight: "600" });

type Details = { caseId: string; client: string; clientLabel: string; date: string; endDate: string };
type Status = "reading" | "signing" | "sending" | "signed" | "error";
export type SignVariant = "client" | "witness";

// Tick boxes in the witness form (generated into WITNESS_HTML), with the wording shown back after signing.
const WITNESS_CHOICES: { name: string; kind: "checkbox" | "radio" | "text"; labels?: Record<string, string> }[] = [
  { name: "share_messages", kind: "checkbox", labels: { yes: "Copies of the messages" } },
  { name: "share_alerts", kind: "checkbox", labels: { yes: "Security alerts" } },
  { name: "share_statement", kind: "checkbox", labels: { yes: "A short written statement" } },
  { name: "share_contact", kind: "checkbox", labels: { yes: "Email address / username, to see how the sender found you" } },
  { name: "account_check", kind: "radio", labels: { yes: "Account security check", no: "No account security check" } },
  { name: "account_check_for", kind: "text" },
  { name: "name_in_packet", kind: "radio", labels: { name: "Name may appear in the evidence package", label: "Referred to by a label, not by name" } },
];

const VARIANTS = {
  client: {
    html: CONTRACT_HTML,
    version: CONTRACT_VERSION,
    formName: "foxlock-signature",
    eyebrow: "Client Authorization",
    title: "Authorization and Scope Agreement",
    agreement: "the FoxLock Security Client Authorization and Scope Agreement",
  },
  witness: {
    html: WITNESS_HTML,
    version: WITNESS_VERSION,
    formName: "foxlock-witness",
    eyebrow: "Witness Consent",
    title: "Witness Evidence Consent",
    agreement: "the FoxLock Security Witness Evidence Consent",
  },
} as const;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const longDate = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function parseIsoDate(value: string | null): Date | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

// Personal details come from the URL fragment (#c=…&n=…&d=…&e=…, plus m=… naming the client
// on a witness form), which browsers never send to the server, so names are never logged or
// stored by the site.
function readDetails(): Details {
  const p = new URLSearchParams(window.location.hash.slice(1));
  const today = new Date();
  const start = parseIsoDate(p.get("d")) ?? today;
  const end = parseIsoDate(p.get("e")) ?? new Date(start.getTime() + 90 * 86400000);
  return {
    caseId: (p.get("c") || "").slice(0, 40),
    client: (p.get("n") || "").slice(0, 120),
    clientLabel: (p.get("m") || "").slice(0, 60),
    date: longDate(start),
    endDate: longDate(end),
  };
}

function fillContract(variant: SignVariant, d: Details) {
  if (variant === "witness") {
    return WITNESS_HTML.replaceAll("{{CASE_ID}}", escapeHtml(d.caseId || "—"))
      .replaceAll("{{DATE}}", escapeHtml(d.date))
      .replaceAll("{{SIGNER}}", escapeHtml(d.client || "The person signing below"))
      .replaceAll("{{CLIENT}}", escapeHtml(d.clientLabel || "our client"));
  }
  return CONTRACT_HTML.replace("{{CASE_ID}}", escapeHtml(d.caseId || "—"))
    .replace("{{DATE}}", escapeHtml(d.date))
    .replace("{{CLIENT}}", escapeHtml(d.client || "The client signing below"))
    .replace("{{END_DATE}}", escapeHtml(d.endDate));
}

function readChoices(root: HTMLElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of WITNESS_CHOICES) {
    if (c.kind === "checkbox") {
      out[c.name] = root.querySelector<HTMLInputElement>(`input[name="${c.name}"]`)?.checked ? "yes" : "no";
    } else if (c.kind === "radio") {
      out[c.name] = root.querySelector<HTMLInputElement>(`input[name="${c.name}"]:checked`)?.value ?? "";
    } else {
      out[c.name] = (root.querySelector<HTMLInputElement>(`input[name="${c.name}"]`)?.value ?? "").trim().slice(0, 80);
    }
  }
  return out;
}

function choiceSummary(choices: Record<string, string>): string[] {
  const lines = WITNESS_CHOICES.flatMap((c) => (c.labels?.[choices[c.name]] ? [c.labels[choices[c.name]]] : []))
    .filter((l) => !l.startsWith("No account"));
  const i = lines.indexOf("Account security check");
  if (i >= 0 && choices.account_check_for) lines[i] += ` (${choices.account_check_for})`;
  return lines;
}

// The contract HTML is set imperatively, once per html value: with dangerouslySetInnerHTML,
// page re-renders rewrote the article and cleared the witness's tick boxes.
function Contract({ html, articleRef }: { html: string; articleRef: React.RefObject<HTMLElement | null> }) {
  useLayoutEffect(() => {
    if (articleRef.current) articleRef.current.innerHTML = html;
  }, [html, articleRef]);
  return (
    <article
      ref={articleRef}
      className="contract paper rounded-xl border border-white/5 bg-obsidian/80 px-5 sm:px-8 py-4 glow-amber"
    />
  );
}

function LockMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded bg-amber/15 border border-amber/30 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-amber-light">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
  );
}

export default function SignClient({ variant = "client" }: { variant?: SignVariant }) {
  const v = VARIANTS[variant];
  const [details, setDetails] = useState<Details | null>(null);
  const [choices, setChoices] = useState<Record<string, string> | null>(null);
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>("reading");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [hasInk, setHasInk] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<Date | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const d = readDetails();
    setDetails(d);
    setName(d.client);
  }, []);

  // Size the pad to its box at device resolution whenever the sheet opens or the mode changes.
  useEffect(() => {
    if (status !== "signing" || mode !== "draw") return;
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#f0f4f8";
    setHasInk(false);
  }, [status, mode]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext("2d")!;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    setHasInk(true);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearPad = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  // Export a small dark-ink PNG on a transparent background, so it prints on white paper.
  const exportSignature = useCallback(async (): Promise<string> => {
    const out = document.createElement("canvas");
    out.width = 600;
    out.height = 200;
    const ctx = out.getContext("2d")!;
    if (mode === "type") {
      const family = script.style.fontFamily;
      await document.fonts.load(`72px ${family}`);
      let size = 84;
      do {
        ctx.font = `${size}px ${family}`;
        size -= 4;
      } while (ctx.measureText(name).width > 560 && size > 24);
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name.trim(), 300, 105);
    } else {
      const src = canvasRef.current!;
      const scale = Math.min(out.width / src.width, out.height / src.height);
      const w = src.width * scale;
      const h = src.height * scale;
      ctx.drawImage(src, (out.width - w) / 2, (out.height - h) / 2, w, h);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, out.width, out.height);
    }
    return out.toDataURL("image/png");
  }, [mode, name]);

  const canSign = name.trim().length >= 2 && (mode === "type" || hasInk);

  // The witness picks what they share before signing; the name choice in section 3 is required.
  const openSheet = () => {
    if (variant === "witness" && articleRef.current) {
      const picked = readChoices(articleRef.current);
      if (!picked.name_in_packet) {
        setChoiceError("Please choose how your name should appear (section 3), then tap Sign here again.");
        articleRef.current.querySelector('input[name="name_in_packet"]')?.closest("ul")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setChoiceError(null);
      setChoices(picked);
    }
    setStatus("signing");
  };

  const submit = async () => {
    if (!canSign || !details) return;
    setStatus("sending");
    try {
      const png = await exportSignature();
      const now = new Date();
      const body = new URLSearchParams({
        "form-name": v.formName,
        "bot-field": "",
        ...(variant === "witness" && choices ? choices : {}),
        case_id: details.caseId,
        signer_name: name.trim(),
        signature_method: mode,
        signature_png: png,
        signed_at: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        contract_version: v.version,
        user_agent: navigator.userAgent,
      });
      if (window.location.hostname === "localhost") {
        console.info("[sign] local preview: not submitted", Object.fromEntries(body));
      } else {
        const res = await fetch("/__forms.html", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
      }
      articleRef.current?.querySelectorAll("input").forEach((el) => (el.disabled = true));
      setSignature(png);
      setSignedAt(now);
      setStatus("signed");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch {
      setStatus("error");
    }
  };

  if (!details) return <div className="min-h-screen bg-void" />;

  return (
    <div className="min-h-screen bg-void text-ice">
      <style>{`
        .contract h2 { color: #fbbf24; font-weight: 700; font-size: 1.05rem; margin: 2rem 0 .6rem; letter-spacing: -.01em; }
        .contract p { color: #cbd5e1; line-height: 1.7; margin: .6rem 0; }
        .contract ul { margin: .5rem 0 .9rem; padding-left: 1.15rem; list-style: disc; }
        .contract li { color: #cbd5e1; line-height: 1.65; margin: .45rem 0; }
        .contract li::marker { color: #d97706; }
        .contract strong { color: #f0f4f8; font-weight: 650; }
        .contract ul:has(li.choice) { list-style: none; padding-left: 0; }
        .contract li.choice label { display: flex; gap: .7rem; align-items: flex-start; padding: .7rem .8rem; border: 1px solid rgba(255,255,255,.08); border-radius: .6rem; cursor: pointer; }
        .contract li.choice label:has(input:checked) { border-color: rgba(245,158,11,.55); background: rgba(245,158,11,.07); }
        .contract li.choice input[type=checkbox], .contract li.choice input[type=radio] { accent-color: #f59e0b; width: 1.2rem; height: 1.2rem; margin-top: .2rem; flex-shrink: 0; }
        .contract li.choice input[type=text] { background: #05070b; border: 1px solid rgba(255,255,255,.15); border-radius: .4rem; padding: .35rem .55rem; color: #f0f4f8; font-size: 1rem; width: 11rem; max-width: 100%; }
        @media print {
          body, .bg-void { background: #fff !important; }
          .no-print { display: none !important; }
          .contract h2 { color: #92400e; }
          .contract p, .contract li, .print-ink { color: #111 !important; }
          .contract strong { color: #000; }
          .paper { background: #fff !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>

      <header className="border-b border-white/5 bg-void/80 backdrop-blur-md sticky top-0 z-30 no-print">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <LockMark />
            <span className="text-lg font-bold tracking-tight">
              Fox<span className="text-amber-light">Lock</span>
            </span>
          </a>
          {details.caseId && (
            <span className="text-xs font-mono text-steel border border-white/10 rounded px-2 py-1">{details.caseId}</span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8 pb-40">
        <p className="text-amber-light text-xs font-semibold uppercase tracking-[0.2em] mb-2">{v.eyebrow}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-2 print-ink">
          {v.title}
        </h1>
        <p className="text-steel text-sm mb-6 print-ink">
          {details.client ? `Prepared for ${details.client}. ` : ""}Read it through{variant === "witness" ? ", tick what you’re comfortable with" : ""}, then tap <span className="text-amber-light font-semibold">Sign here</span> at the bottom.
        </p>
        <div className="gradient-line mb-6" />

        <Contract html={fillContract(variant, details)} articleRef={articleRef} />

        {status === "signed" && signature && signedAt && (
          <section className="paper mt-8 rounded-xl border border-amber/30 bg-obsidian px-5 sm:px-8 py-6">
            <div className="flex items-center gap-3 mb-4 no-print">
              <div className="w-9 h-9 rounded-full bg-amber/15 border border-amber/40 flex items-center justify-center text-amber-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div>
                <p className="font-bold">Signed. Thank you{details.client ? `, ${details.client.split(" ")[0]}` : ""}.</p>
                <p className="text-steel text-sm">FoxLock has received your signed {variant === "witness" ? "consent" : "agreement"}.</p>
              </div>
            </div>
            {variant === "witness" && choices && (
              <div className="mb-4">
                <p className="text-steel text-sm mb-1.5 print-ink">You agreed to</p>
                <ul className="text-sm list-disc pl-5 space-y-1 print-ink">
                  {choiceSummary(choices).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            )}
            <div className="rounded-lg bg-ice p-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signature} alt="Your signature" className="w-full max-w-sm mx-auto" />
            </div>
            <p className="text-sm print-ink"><span className="text-steel print-ink">Signed by</span> {name.trim()}</p>
            <p className="text-sm print-ink"><span className="text-steel print-ink">Date</span> {signedAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
            <p className="text-[11px] text-ghost font-mono mt-3 break-all print-ink">{variant === "witness" ? "Consent" : "Agreement"} version {v.version.slice(0, 16)}</p>
            <button onClick={() => window.print()} className="no-print mt-5 w-full sm:w-auto rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5 transition">
              Save a copy
            </button>
          </section>
        )}
      </main>

      {status !== "signed" && (
        <div className="no-print fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-void/90 backdrop-blur-md" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-3xl mx-auto px-4 py-3">
            {choiceError && <p className="text-sm text-amber-glow mb-2 text-center">{choiceError}</p>}
            <button
              onClick={openSheet}
              className="w-full rounded-xl bg-amber-light text-void font-bold text-base py-4 shadow-[0_0_30px_rgba(245,158,11,0.35)] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              Sign here
            </button>
          </div>
        </div>
      )}

      {(status === "signing" || status === "sending" || status === "error") && (
        <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => status !== "sending" && setStatus("reading")} />
          <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 bg-obsidian px-5 pt-5 pb-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <LockMark size={24} />
                <p className="font-bold">{variant === "witness" ? "Sign consent" : "Sign agreement"}</p>
              </div>
              <button onClick={() => setStatus("reading")} disabled={status === "sending"} className="text-steel hover:text-white p-1" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <label className="block text-xs text-steel mb-1.5">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className="w-full rounded-lg bg-void border border-white/10 px-3.5 py-3 text-base outline-none focus:border-amber/60 mb-4"
            />

            <div className="flex gap-1 p-1 rounded-lg bg-void border border-white/5 mb-3 text-sm">
              {(["draw", "type"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-md py-2 font-semibold transition ${mode === m ? "bg-amber/15 text-amber-light" : "text-steel"}`}
                >
                  {m === "draw" ? "Draw" : "Type"}
                </button>
              ))}
            </div>

            {mode === "draw" ? (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={() => (drawing.current = false)}
                  onPointerCancel={() => (drawing.current = false)}
                  className="w-full h-44 rounded-lg bg-void border border-dashed border-amber/30 cursor-crosshair"
                  style={{ touchAction: "none" }}
                />
                {!hasInk && (
                  <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-ghost text-sm">Sign with your finger</p>
                )}
                <div className="absolute left-4 right-4 bottom-9 border-b border-white/10 pointer-events-none" />
                {hasInk && (
                  <button onClick={clearPad} className="absolute top-2 right-2 text-xs text-steel bg-obsidian/80 border border-white/10 rounded px-2 py-1">Clear</button>
                )}
              </div>
            ) : (
              <div className="h-44 rounded-lg bg-void border border-dashed border-amber/30 flex items-center justify-center px-4">
                <span className={`${script.className} text-4xl sm:text-5xl text-ice truncate`}>{name.trim() || "Your name"}</span>
              </div>
            )}

            {status === "error" && (
              <p className="text-sm text-red-300 mt-3">That didn’t go through. Check your connection and tap Sign again.</p>
            )}

            <button
              onClick={submit}
              disabled={!canSign || status === "sending"}
              className="mt-4 w-full rounded-xl bg-amber-light text-void font-bold py-4 disabled:opacity-40 transition"
            >
              {status === "sending" ? "Signing…" : variant === "witness" ? "Sign consent" : "Sign agreement"}
            </button>
            <p className="text-[11px] text-ghost text-center mt-2.5 leading-relaxed">
              By tapping {variant === "witness" ? "Sign consent" : "Sign agreement"}, you agree to {v.agreement} above
              {variant === "witness" ? ", for the items you ticked" : ""}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
