import * as https from "https";
import * as http from "http";
import { URL } from "url";

export interface SSLInfo {
  valid: boolean;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  protocol: string;
  grade: "A" | "B" | "C" | "F";
}

export interface HeaderCheck {
  name: string;
  present: boolean;
  value: string | null;
  grade: "A" | "B" | "C" | "F";
  description: string;
  fix: string;
}

export interface CookieCheck {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string | null;
}

export interface TechInfo {
  server: string | null;
  poweredBy: string | null;
  cms: string | null;
  framework: string | null;
}

export interface ScanResult {
  url: string;
  timestamp: string;
  score: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  ssl: SSLInfo | null;
  headers: HeaderCheck[];
  cookies: CookieCheck[];
  tech: TechInfo;
  httpsRedirect: boolean;
  mixedContent: boolean;
  serverExposed: boolean;
  findings: Finding[];
  summary: string;
}

export interface Finding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  fix: string;
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url.match(/^https?:\/\//)) url = "https://" + url;
  return url;
}

async function checkSSL(hostname: string): Promise<SSLInfo | null> {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname, port: 443, method: "HEAD", timeout: 8000, rejectUnauthorized: false },
      (res) => {
        const sock = res.socket as any;
        const cert = sock.getPeerCertificate?.();
        const authorized = sock.authorized ?? false;

        if (!cert || !cert.valid_to) {
          resolve(null);
          return;
        }

        const expiry = new Date(cert.valid_to);
        const days = Math.floor((expiry.getTime() - Date.now()) / 86400000);
        const protocol = sock.getProtocol?.() || "unknown";

        let grade: "A" | "B" | "C" | "F" = "A";
        if (!authorized) grade = "F";
        else if (days < 7) grade = "C";
        else if (days < 30) grade = "B";

        resolve({
          valid: authorized,
          issuer: cert.issuer?.O || cert.issuer?.CN || "Unknown",
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysUntilExpiry: days,
          protocol,
          grade,
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function fetchSite(
  url: string
): Promise<{ statusCode: number; headers: Record<string, string>; body: string; finalUrl: string } | null> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === "https:" ? https : http;

    const req = mod.request(
      url,
      { method: "GET", timeout: 10000, headers: { "User-Agent": "FoxLock-Scanner/1.0" } },
      (res) => {
        // Follow one redirect
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (redirectUrl.startsWith("/")) redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
          const rMod = redirectUrl.startsWith("https") ? https : http;
          const req2 = rMod.request(
            redirectUrl,
            { method: "GET", timeout: 10000, headers: { "User-Agent": "FoxLock-Scanner/1.0" } },
            (res2) => {
              let body = "";
              res2.on("data", (chunk: Buffer) => { if (body.length < 100000) body += chunk.toString(); });
              res2.on("end", () => {
                const h: Record<string, string> = {};
                for (const [k, v] of Object.entries(res2.headers)) {
                  if (typeof v === "string") h[k.toLowerCase()] = v;
                  else if (Array.isArray(v)) h[k.toLowerCase()] = v.join(", ");
                }
                resolve({ statusCode: res2.statusCode || 0, headers: h, body, finalUrl: redirectUrl });
              });
            }
          );
          req2.on("error", () => resolve(null));
          req2.on("timeout", () => { req2.destroy(); resolve(null); });
          req2.end();
          return;
        }

        let body = "";
        res.on("data", (chunk: Buffer) => { if (body.length < 100000) body += chunk.toString(); });
        res.on("end", () => {
          const h: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === "string") h[k.toLowerCase()] = v;
            else if (Array.isArray(v)) h[k.toLowerCase()] = v.join(", ");
          }
          resolve({ statusCode: res.statusCode || 0, headers: h, body, finalUrl: url });
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.end();
  });
}

function checkHeaders(headers: Record<string, string>): HeaderCheck[] {
  const checks: HeaderCheck[] = [];

  const securityHeaders: Array<{
    name: string;
    key: string;
    description: string;
    fix: string;
    grader: (val: string | undefined) => "A" | "B" | "C" | "F";
  }> = [
    {
      name: "Strict-Transport-Security",
      key: "strict-transport-security",
      description: "Forces browsers to use HTTPS, preventing downgrade attacks.",
      fix: "Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains",
      grader: (v) => {
        if (!v) return "F";
        const maxAge = parseInt(v.match(/max-age=(\d+)/)?.[1] || "0");
        if (maxAge >= 31536000) return "A";
        if (maxAge >= 86400) return "B";
        return "C";
      },
    },
    {
      name: "Content-Security-Policy",
      key: "content-security-policy",
      description: "Controls which resources the browser can load, blocking XSS attacks.",
      fix: "Add a Content-Security-Policy header. Start with: Content-Security-Policy: default-src 'self'",
      grader: (v) => (v ? (v.includes("unsafe-inline") ? "B" : "A") : "F"),
    },
    {
      name: "X-Frame-Options",
      key: "x-frame-options",
      description: "Prevents your site from being embedded in iframes (clickjacking protection).",
      fix: "Add header: X-Frame-Options: DENY or SAMEORIGIN",
      grader: (v) => (v ? "A" : "F"),
    },
    {
      name: "X-Content-Type-Options",
      key: "x-content-type-options",
      description: "Prevents browsers from MIME-sniffing, reducing drive-by download attacks.",
      fix: "Add header: X-Content-Type-Options: nosniff",
      grader: (v) => (v === "nosniff" ? "A" : v ? "B" : "F"),
    },
    {
      name: "Referrer-Policy",
      key: "referrer-policy",
      description: "Controls what URL information is shared when users click links on your site.",
      fix: "Add header: Referrer-Policy: strict-origin-when-cross-origin",
      grader: (v) => {
        if (!v) return "F";
        if (v.includes("no-referrer") || v.includes("strict-origin")) return "A";
        return "B";
      },
    },
    {
      name: "Permissions-Policy",
      key: "permissions-policy",
      description: "Controls which browser features (camera, mic, location) your site can use.",
      fix: "Add header: Permissions-Policy: camera=(), microphone=(), geolocation=()",
      grader: (v) => (v ? "A" : "C"),
    },
  ];

  for (const sh of securityHeaders) {
    const value = headers[sh.key] || undefined;
    checks.push({
      name: sh.name,
      present: !!value,
      value: value || null,
      grade: sh.grader(value),
      description: sh.description,
      fix: sh.fix,
    });
  }

  return checks;
}

function parseCookies(headers: Record<string, string>): CookieCheck[] {
  const raw = headers["set-cookie"];
  if (!raw) return [];

  return raw.split(/,(?=\s*\w+=)/).map((c) => {
    const name = c.split("=")[0]?.trim() || "unknown";
    const lower = c.toLowerCase();
    return {
      name,
      secure: lower.includes("secure"),
      httpOnly: lower.includes("httponly"),
      sameSite: lower.match(/samesite=(strict|lax|none)/i)?.[1] || null,
    };
  });
}

function detectTech(headers: Record<string, string>, body: string): TechInfo {
  const server = headers["server"] || null;
  const poweredBy = headers["x-powered-by"] || null;

  let cms: string | null = null;
  if (body.includes("wp-content") || body.includes("wordpress")) cms = "WordPress";
  else if (body.includes("Shopify")) cms = "Shopify";
  else if (body.includes("Squarespace")) cms = "Squarespace";
  else if (body.includes("Wix")) cms = "Wix";
  else if (body.includes("Drupal")) cms = "Drupal";
  else if (body.includes("Joomla")) cms = "Joomla";
  else if (body.includes("ghost")) cms = "Ghost";
  else if (body.includes("webflow")) cms = "Webflow";

  let framework: string | null = null;
  if (body.includes("__next") || body.includes("_next/static")) framework = "Next.js";
  else if (body.includes("__nuxt")) framework = "Nuxt.js";
  else if (headers["x-powered-by"]?.includes("Express")) framework = "Express";
  else if (body.includes("ng-version")) framework = "Angular";
  else if (body.includes("data-reactroot") || body.includes("__REACT")) framework = "React";
  else if (body.includes("data-vue") || body.includes("__VUE")) framework = "Vue.js";

  return { server, poweredBy, cms, framework };
}

function checkMixedContent(body: string): boolean {
  return /src=["']http:\/\//i.test(body) || /href=["']http:\/\/[^"']*\.(css|js)/i.test(body);
}

function generateFindings(result: Partial<ScanResult>): Finding[] {
  const findings: Finding[] = [];

  if (!result.ssl) {
    findings.push({
      severity: "critical",
      title: "No SSL Certificate Detected",
      description:
        "Your website doesn't appear to have a valid SSL certificate. This means data sent between your customers and your website is not encrypted.",
      fix: "Install an SSL certificate. Most hosting providers offer free certificates through Let's Encrypt.",
    });
  } else if (!result.ssl.valid) {
    findings.push({
      severity: "critical",
      title: "Invalid SSL Certificate",
      description:
        "Your SSL certificate is not trusted by browsers. Visitors will see a security warning before reaching your site.",
      fix: "Renew or replace your SSL certificate with a valid one from a trusted certificate authority.",
    });
  } else if (result.ssl.daysUntilExpiry < 7) {
    findings.push({
      severity: "high",
      title: "SSL Certificate Expiring Soon",
      description: `Your SSL certificate expires in ${result.ssl.daysUntilExpiry} days. If it expires, your site will show security warnings.`,
      fix: "Renew your SSL certificate immediately. Set up auto-renewal if your provider supports it.",
    });
  } else if (result.ssl.daysUntilExpiry < 30) {
    findings.push({
      severity: "medium",
      title: "SSL Certificate Expiring Within 30 Days",
      description: `Your SSL certificate expires in ${result.ssl.daysUntilExpiry} days.`,
      fix: "Plan to renew your SSL certificate soon. Consider setting up auto-renewal.",
    });
  }

  if (!result.httpsRedirect) {
    findings.push({
      severity: "high",
      title: "No HTTPS Redirect",
      description:
        "Your site doesn't automatically redirect HTTP traffic to HTTPS. Visitors accessing your site via http:// will use an unencrypted connection.",
      fix: "Configure your server to redirect all HTTP requests to HTTPS.",
    });
  }

  if (result.headers) {
    for (const h of result.headers) {
      if (h.grade === "F") {
        findings.push({
          severity: h.name === "Strict-Transport-Security" || h.name === "Content-Security-Policy" ? "high" : "medium",
          title: `Missing: ${h.name}`,
          description: h.description,
          fix: h.fix,
        });
      }
    }
  }

  if (result.serverExposed) {
    findings.push({
      severity: "low",
      title: "Server Software Exposed",
      description:
        "Your server is revealing its software version in HTTP headers. Attackers can use this to find known vulnerabilities.",
      fix: "Configure your server to remove or obscure the Server and X-Powered-By headers.",
    });
  }

  if (result.mixedContent) {
    findings.push({
      severity: "medium",
      title: "Mixed Content Detected",
      description:
        "Your HTTPS page loads some resources over insecure HTTP. This weakens your encryption and may trigger browser warnings.",
      fix: "Update all resource URLs (images, scripts, stylesheets) to use https:// instead of http://.",
    });
  }

  if (result.cookies) {
    const insecureCookies = result.cookies.filter((c) => !c.secure || !c.httpOnly);
    if (insecureCookies.length > 0) {
      findings.push({
        severity: "medium",
        title: `${insecureCookies.length} Cookie(s) Missing Security Flags`,
        description:
          "Some cookies are missing the Secure or HttpOnly flags, making them vulnerable to interception or theft via JavaScript.",
        fix: "Set the Secure, HttpOnly, and SameSite flags on all cookies.",
      });
    }
  }

  if (!findings.length) {
    findings.push({
      severity: "info",
      title: "No Major Issues Found",
      description: "Your website passed our basic security checks. Consider a deeper professional audit for comprehensive coverage.",
      fix: "Schedule a professional penetration test for thorough coverage.",
    });
  }

  return findings;
}

function calculateScore(result: Partial<ScanResult>): number {
  let score = 100;

  // SSL (25 points)
  if (!result.ssl) score -= 25;
  else if (!result.ssl.valid) score -= 25;
  else if (result.ssl.grade === "C") score -= 10;
  else if (result.ssl.grade === "B") score -= 5;

  // Headers (up to 30 points)
  if (result.headers) {
    const headerScore = result.headers.reduce((acc, h) => {
      if (h.grade === "F") return acc + 5;
      if (h.grade === "C") return acc + 2;
      if (h.grade === "B") return acc + 1;
      return acc;
    }, 0);
    score -= Math.min(30, headerScore);
  }

  // HTTPS redirect (10 points)
  if (!result.httpsRedirect) score -= 10;

  // Mixed content (10 points)
  if (result.mixedContent) score -= 10;

  // Server exposure (5 points)
  if (result.serverExposed) score -= 5;

  // Cookie security (10 points)
  if (result.cookies && result.cookies.length > 0) {
    const insecure = result.cookies.filter((c) => !c.secure || !c.httpOnly).length;
    score -= Math.min(10, insecure * 3);
  }

  return Math.max(0, Math.min(100, score));
}

function riskLevel(score: number): "low" | "moderate" | "high" | "critical" {
  if (score >= 80) return "low";
  if (score >= 60) return "moderate";
  if (score >= 40) return "high";
  return "critical";
}

function generateSummary(result: ScanResult): string {
  const critical = result.findings.filter((f) => f.severity === "critical").length;
  const high = result.findings.filter((f) => f.severity === "high").length;
  const medium = result.findings.filter((f) => f.severity === "medium").length;

  if (result.riskLevel === "low") {
    return `Good news — your website has strong baseline security. We found ${medium} minor improvement${medium !== 1 ? "s" : ""} that could make it even better.`;
  }
  if (result.riskLevel === "moderate") {
    return `Your website has decent security but there are ${high + medium} issues that should be addressed. None are immediately dangerous, but fixing them will significantly reduce your risk.`;
  }
  if (result.riskLevel === "high") {
    return `We found ${high} high-priority and ${medium} medium-priority issues. Your website is at elevated risk and these should be fixed soon to protect your business and customers.`;
  }
  return `Your website has ${critical} critical and ${high} high-priority security issues. Immediate action is recommended to protect your business data and customer information.`;
}

export async function scanWebsite(input: string): Promise<ScanResult> {
  const url = normalizeUrl(input);
  const hostname = new URL(url).hostname;

  // Run SSL check and site fetch in parallel
  const [ssl, site] = await Promise.all([checkSSL(hostname), fetchSite(url)]);

  // Check HTTPS redirect
  let httpsRedirect = false;
  if (url.startsWith("https://")) {
    httpsRedirect = true; // already HTTPS
  } else {
    const httpSite = await fetchSite(`http://${hostname}`);
    httpsRedirect = httpSite?.finalUrl.startsWith("https://") || false;
  }

  const headers = site ? checkHeaders(site.headers) : [];
  const cookies = site ? parseCookies(site.headers) : [];
  const tech = site ? detectTech(site.headers, site.body) : { server: null, poweredBy: null, cms: null, framework: null };
  const mixedContent = site ? checkMixedContent(site.body) : false;
  const serverExposed = !!(tech.server || tech.poweredBy);

  const partial: Partial<ScanResult> = {
    url,
    ssl,
    headers,
    cookies,
    tech,
    httpsRedirect,
    mixedContent,
    serverExposed,
  };

  const score = calculateScore(partial);
  const findings = generateFindings(partial);

  const result: ScanResult = {
    url,
    timestamp: new Date().toISOString(),
    score,
    riskLevel: riskLevel(score),
    ssl,
    headers,
    cookies,
    tech,
    httpsRedirect,
    mixedContent,
    serverExposed,
    findings,
    summary: "",
  };

  result.summary = generateSummary(result);
  return result;
}
