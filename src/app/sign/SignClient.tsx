"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Dancing_Script } from "next/font/google";
import { CONTRACT_HTML, CONTRACT_VERSION } from "./contract";
import { WITNESS_HTML, WITNESS_VERSION } from "../witness/contract";
import { EMAIL_CONSENT_HTML, EMAIL_CONSENT_VERSION } from "../email-consent/contract";

const script = Dancing_Script({ subsets: ["latin"], weight: "600" });

type Details = { caseId: string; client: string; clientLabel: string; date: string; endDate: string };
type Status = "reading" | "signing" | "sending" | "signed" | "error";
export type SignVariant = "client" | "witness" | "email";

type Choice = { name: string; kind: "checkbox" | "radio" | "text"; labels?: Record<string, string> };

// Tick boxes in the witness form (generated into WITNESS_HTML), with the wording shown back after signing.
const WITNESS_CHOICES: Choice[] = [
  { name: "share_messages", kind: "checkbox", labels: { yes: "Copies of the messages" } },
  { name: "share_alerts", kind: "checkbox", labels: { yes: "Security alerts" } },
  { name: "share_statement", kind: "checkbox", labels: { yes: "A short written statement" } },
  { name: "share_contact", kind: "checkbox", labels: { yes: "Email address / username, to see how the sender found you" } },
  { name: "account_check", kind: "radio", labels: { yes: "Account security check", no: "No account security check" } },
  { name: "account_check_for", kind: "text" },
  { name: "name_in_packet", kind: "radio", labels: { name: "Name may appear in the evidence package", label: "Referred to by a label, not by name" } },
];

// Inputs in the email collection consent (generated into EMAIL_CONSENT_HTML).
const EMAIL_CHOICES: Choice[] = [
  { name: "account_email", kind: "text" },
  { name: "search_sender", kind: "checkbox", labels: { yes: "Search for emails from the sender's addresses" } },
  { name: "search_mentions", kind: "checkbox", labels: { yes: "Search for emails that mention the client or the sender" } },
  { name: "search_alerts", kind: "checkbox", labels: { yes: "Security alerts from the same time" } },
  { name: "name_in_packet", kind: "radio", labels: { name: "Name may appear in the evidence package", label: "Referred to by a label, not by name" } },
];

const VARIANTS = {
  client: {
    html: CONTRACT_HTML,
    version: CONTRACT_VERSION,
    formName: "foxlock-signature",
    choices: null,
    nameSection: "",
    eyebrow: "Client Authorization",
    title: "Authorization and Scope Agreement",
    agreement: "the FoxLock Security Client Authorization and Scope Agreement",
  },
  witness: {
    html: WITNESS_HTML,
    version: WITNESS_VERSION,
    formName: "foxlock-witness",
    choices: WITNESS_CHOICES,
    nameSection: "section 3",
    eyebrow: "Witness Consent",
    title: "Witness Evidence Consent",
    agreement: "the FoxLock Security Witness Evidence Consent",
  },
  email: {
    html: EMAIL_CONSENT_HTML,
    version: EMAIL_CONSENT_VERSION,
    formName: "foxlock-email-consent",
    choices: EMAIL_CHOICES,
    nameSection: "section 4",
    eyebrow: "Email Collection Consent",
    title: "Email Collection Consent",
    agreement: "the FoxLock Security Email Collection Consent",
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
// on a witness or email consent form), which browsers never send to the server, so names are never logged or
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
  if (variant !== "client") {
    return VARIANTS[variant].html.replaceAll("{{CASE_ID}}", escapeHtml(d.caseId || "—"))
      .replaceAll("{{DATE}}", escapeHtml(d.date))
      .replaceAll("{{SIGNER}}", escapeHtml(d.client || "The person signing below"))
      .replaceAll("{{CLIENT}}", escapeHtml(d.clientLabel || "our client"));
  }
  return CONTRACT_HTML.replace("{{CASE_ID}}", escapeHtml(d.caseId || "—"))
    .replace("{{DATE}}", escapeHtml(d.date))
    .replace("{{CLIENT}}", escapeHtml(d.client || "The client signing below"))
    .replace("{{END_DATE}}", escapeHtml(d.endDate));
}

function readChoices(root: HTMLElement, list: Choice[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of list) {
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

function choiceSummary(list: Choice[], choices: Record<string, string>): string[] {
  const lines = list.flatMap((c) => (c.labels?.[choices[c.name]] ? [c.labels[choices[c.name]]] : []))
    .filter((l) => !l.startsWith("No account"));
  const i = lines.indexOf("Account security check");
  if (i >= 0 && choices.account_check_for) lines[i] += ` (${choices.account_check_for})`;
  if (choices.account_email) lines.unshift(`Email account: ${choices.account_email}`);
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
      className="contract paper rounded-xl border border-gray-200 bg-white px-5 sm:px-8 py-4 shadow-sm"
    />
  );
}

function LockMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded fl-grad-bg flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-white">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
  );
}

export default function SignClient({ variant = "client" }: { variant?: SignVariant }) {
  const v = VARIANTS[variant];
  const consent = v.choices !== null;
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
    ctx.strokeStyle = "#111827";
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

  // Consent signers pick what they share before signing; the name choice is required, and the
  // email form also needs the account and at least one search.
  const openSheet = () => {
    if (v.choices && articleRef.current) {
      const picked = readChoices(articleRef.current, v.choices);
      const ask = (msg: string, input: string) => {
        setChoiceError(msg);
        articleRef.current?.querySelector(`input[name="${input}"]`)?.closest("ul, p")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      if (variant === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(picked.account_email)) {
        ask("Please enter the email account you will sign in to (section 1), then tap Sign here again.", "account_email");
        return;
      }
      if (variant === "email" && ![picked.search_sender, picked.search_mentions, picked.search_alerts].includes("yes")) {
        ask("Please tick at least one thing we may search for (section 2), then tap Sign here again.", "search_sender");
        return;
      }
      if (!picked.name_in_packet) {
        setChoiceError(`Please choose how your name should appear (${v.nameSection}), then tap Sign here again.`);
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
        ...(consent && choices ? choices : {}),
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

  if (!details) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <style>{`
        body { background: #fff; }
        .fl-grad-bg { background: linear-gradient(135deg, #7c3aed, #db2777); }
        .fl-grad-text { background: linear-gradient(90deg, #7c3aed, #db2777); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .contract h2 { color: #7c3aed; font-weight: 700; font-size: 1.05rem; margin: 2rem 0 .6rem; letter-spacing: -.01em; }
        .contract p { color: #111827; line-height: 1.7; margin: .6rem 0; }
        .contract ul { margin: .5rem 0 .9rem; padding-left: 1.15rem; list-style: disc; }
        .contract li { color: #111827; line-height: 1.65; margin: .45rem 0; }
        .contract li::marker { color: #db2777; }
        .contract strong { color: #000; font-weight: 650; }
        .contract ul:has(li.choice) { list-style: none; padding-left: 0; }
        .contract li.choice label { display: flex; gap: .7rem; align-items: flex-start; padding: .7rem .8rem; border: 1px solid #e5e7eb; border-radius: .6rem; cursor: pointer; }
        .contract li.choice label:has(input:checked) { border-color: #a78bfa; background: #faf5ff; }
        .contract li.choice input[type=checkbox], .contract li.choice input[type=radio] { accent-color: #7c3aed; width: 1.2rem; height: 1.2rem; margin-top: .2rem; flex-shrink: 0; }
        .contract li.choice input[type=text] { background: #fff; border: 1px solid #d1d5db; border-radius: .4rem; padding: .35rem .55rem; color: #111827; font-size: 1rem; width: 11rem; max-width: 100%; }
        .contract input[type=email] { display: block; margin-top: .4rem; background: #fff; border: 1px solid #d1d5db; border-radius: .4rem; padding: .55rem .7rem; color: #111827; font-size: 1rem; width: 100%; max-width: 24rem; }
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .contract h2 { color: #6d28d9; }
          .contract p, .contract li, .print-ink { color: #111 !important; }
          .contract strong { color: #000; }
          .paper { background: #fff !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>

      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 no-print">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <LockMark />
            <span className="text-lg font-bold tracking-tight">
              <span className="fl-grad-text">FoxLock</span>
            </span>
          </a>
          {details.caseId && (
            <span className="text-xs font-mono text-gray-500 border border-gray-300 rounded px-2 py-1">{details.caseId}</span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8 pb-40">
        <p className="text-[#7c3aed] text-xs font-semibold uppercase tracking-[0.2em] mb-2">{v.eyebrow}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-2 print-ink">
          {v.title}
        </h1>
        <p className="text-gray-600 text-sm mb-6 print-ink">
          {details.client ? `Prepared for ${details.client}. ` : ""}Read it through{consent ? ", tick what you’re comfortable with" : ""}, then tap <span className="text-[#db2777] font-semibold">Sign here</span> at the bottom.
        </p>
        <div className="h-0.5 rounded-full fl-grad-bg mb-6" />

        <Contract html={fillContract(variant, details)} articleRef={articleRef} />

        {status === "signed" && signature && signedAt && (
          <section className="paper mt-8 rounded-xl border border-purple-200 bg-white px-5 sm:px-8 py-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 no-print">
              <div className="w-9 h-9 rounded-full fl-grad-bg flex items-center justify-center text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div>
                <p className="font-bold">Signed. Thank you{details.client ? `, ${details.client.split(" ")[0]}` : ""}.</p>
                <p className="text-gray-600 text-sm">FoxLock has received your signed {consent ? "consent" : "agreement"}.</p>
              </div>
            </div>
            {v.choices && choices && (
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-1.5 print-ink">You agreed to</p>
                <ul className="text-sm list-disc pl-5 space-y-1 print-ink">
                  {choiceSummary(v.choices, choices).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            )}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signature} alt="Your signature" className="w-full max-w-sm mx-auto" />
            </div>
            <p className="text-sm print-ink"><span className="text-gray-600 print-ink">Signed by</span> {name.trim()}</p>
            <p className="text-sm print-ink"><span className="text-gray-600 print-ink">Date</span> {signedAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
            <p className="text-[11px] text-gray-400 font-mono mt-3 break-all print-ink">{consent ? "Consent" : "Agreement"} version {v.version.slice(0, 16)}</p>
            <button onClick={() => window.print()} className="no-print mt-5 w-full sm:w-auto rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold hover:bg-gray-50 transition">
              Save a copy
            </button>
          </section>
        )}
      </main>

      {status !== "signed" && (
        <div className="no-print fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-3xl mx-auto px-4 py-3">
            {choiceError && <p className="text-sm text-[#db2777] mb-2 text-center">{choiceError}</p>}
            <button
              onClick={openSheet}
              className="w-full rounded-xl fl-grad-bg text-white font-bold text-base py-4 shadow-[0_8px_24px_rgba(124,58,237,0.3)] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              Sign here
            </button>
          </div>
        </div>
      )}

      {(status === "signing" || status === "sending" || status === "error") && (
        <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => status !== "sending" && setStatus("reading")} />
          <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <LockMark size={24} />
                <p className="font-bold">{consent ? "Sign consent" : "Sign agreement"}</p>
              </div>
              <button onClick={() => setStatus("reading")} disabled={status === "sending"} className="text-gray-600 hover:text-gray-900 p-1" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <label className="block text-xs text-gray-600 mb-1.5">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className="w-full rounded-lg bg-white border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-[#7c3aed] mb-4"
            />

            <div className="flex gap-1 p-1 rounded-lg bg-gray-100 border border-gray-200 mb-3 text-sm">
              {(["draw", "type"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-md py-2 font-semibold transition ${mode === m ? "bg-white text-[#7c3aed] shadow-sm" : "text-gray-600"}`}
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
                  className="w-full h-44 rounded-lg bg-white border border-dashed border-[#c4b5fd] cursor-crosshair"
                  style={{ touchAction: "none" }}
                />
                {!hasInk && (
                  <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Sign with your finger</p>
                )}
                <div className="absolute left-4 right-4 bottom-9 border-b border-gray-200 pointer-events-none" />
                {hasInk && (
                  <button onClick={clearPad} className="absolute top-2 right-2 text-xs text-gray-600 bg-white border border-gray-300 rounded px-2 py-1">Clear</button>
                )}
              </div>
            ) : (
              <div className="h-44 rounded-lg bg-white border border-dashed border-[#c4b5fd] flex items-center justify-center px-4">
                <span className={`${script.className} text-4xl sm:text-5xl text-gray-900 truncate`}>{name.trim() || "Your name"}</span>
              </div>
            )}

            {status === "error" && (
              <p className="text-sm text-red-600 mt-3">That didn’t go through. Check your connection and tap Sign again.</p>
            )}

            <button
              onClick={submit}
              disabled={!canSign || status === "sending"}
              className="mt-4 w-full rounded-xl fl-grad-bg text-white font-bold py-4 disabled:opacity-40 transition"
            >
              {status === "sending" ? "Signing…" : consent ? "Sign consent" : "Sign agreement"}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-2.5 leading-relaxed">
              By tapping {consent ? "Sign consent" : "Sign agreement"}, you agree to {v.agreement} above
              {consent ? ", for the items you ticked" : ""}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
