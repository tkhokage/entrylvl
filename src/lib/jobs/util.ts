import crypto from "crypto";
import type { WorkType } from "../types";
import { ensureProxy } from "../http-proxy";

/** Stable id for a job from its source + apply url (dedupes across refreshes). */
export function jobId(source: string, applyUrl: string): string {
  return crypto
    .createHash("sha1")
    .update(`${source}|${applyUrl}`)
    .digest("hex")
    .slice(0, 16);
}

/** Strip HTML to readable-ish text and collapse whitespace. */
export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&rsquo;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

const ENTRY_POSITIVE =
  /\b(entry[\s-]?level|junior|jr\.?|associate|new[\s-]?grad|graduate|early[\s-]?career|intern(ship)?|apprentice|trainee|level\s*(1|i)|l1)\b/i;

// Words in a TITLE that clearly signal seniority. Deliberately excludes bare
// "manager" so legit early-career roles ("Associate Product Manager",
// "Program Manager I") are not wrongly dropped — an explicit entry signal in
// the title overrides this anyway (see isEntryLevel).
const TITLE_SENIOR =
  /\b(senior|sr\.?|staff|principal|lead|director|head\s+of|vp|vice president|architect|distinguished|expert)\b/i;

const YEARS_REQ = /(\d+)\+?\s*(?:-\s*\d+\s*)?years?/gi;

/**
 * Decide if a posting reads as entry-level (0-2 yrs) using title + text.
 * Conservative: an explicit senior signal or a high years requirement fails it.
 */
export function isEntryLevel(title: string, text: string): boolean {
  const hay = `${title}\n${text}`;

  // A clearly senior title always fails.
  if (TITLE_SENIOR.test(title)) return false;

  // An explicit entry signal in the title always wins (Associate/Junior/etc.).
  if (ENTRY_POSITIVE.test(title)) return true;

  // Otherwise, respect a high years-of-experience requirement anywhere.
  let maxYears = 0;
  let m: RegExpExecArray | null;
  YEARS_REQ.lastIndex = 0;
  while ((m = YEARS_REQ.exec(hay))) {
    const n = parseInt(m[1], 10);
    if (n > maxYears) maxYears = n;
  }
  if (maxYears >= 3) return false;

  // Entry signal in the body, or no signal but a low/absent years requirement.
  if (ENTRY_POSITIVE.test(text)) return true;
  return maxYears <= 2;
}

/** Classify work type from location + text signals. */
export function detectWorkType(location: string, text: string): WorkType {
  const hay = `${location}\n${text}`.toLowerCase();
  const remote = /\bremote\b|work from home|wfh|distributed team|remote[- ]first/.test(hay);
  const hybrid = /\bhybrid\b|(\d+\s*days?\s*(in|per week).*office)|flexible.*office/.test(hay);
  const onsite = /\bon[\s-]?site\b|in[\s-]?office|in person/.test(hay);
  if (hybrid) return "Hybrid";
  if (remote && !onsite) return "Remote";
  if (onsite) return "In-office";
  if (remote) return "Remote";
  return "In-office";
}

/**
 * Try to read an explicit salary range from posting text.
 * Returns null when nothing credible is found (caller marks it estimated).
 */
export function parseSalary(
  text: string
): { min: number; max: number; currency: string } | null {
  // e.g. "$90,000 - $120,000", "$90k-$120k", "€45.000 – €60.000"
  const re =
    /(?<cur>[$€£])\s?(?<a>\d{1,3}(?:[.,]\d{3})+|\d{2,3}(?:\.\d+)?\s?[kK]?)\s?(?:-|–|to)\s?(?<cur2>[$€£])?\s?(?<b>\d{1,3}(?:[.,]\d{3})+|\d{2,3}(?:\.\d+)?\s?[kK]?)/;
  const m = text.match(re);
  if (!m || !m.groups) return null;
  const cur = m.groups.cur === "€" ? "EUR" : m.groups.cur === "£" ? "GBP" : "USD";
  const a = normalizeMoney(m.groups.a);
  const b = normalizeMoney(m.groups.b);
  if (!a || !b) return null;
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  // Sanity: annual salaries only, ignore hourly-looking small numbers.
  if (min < 20000 || max > 500000) return null;
  return { min, max, currency: cur };
}

function normalizeMoney(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (/k$/.test(t)) {
    const n = parseFloat(t.replace(/k$/, "").replace(/[, ]/g, ""));
    return isNaN(n) ? null : Math.round(n * 1000);
  }
  const n = parseInt(t.replace(/[.,\s]/g, ""), 10);
  return isNaN(n) ? null : n;
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T | null> {
  ensureProxy();
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": "Beacon-JobHub/0.1 (+https://github.com/tkhokage/pluginmusicpro)",
        Accept: "application/json",
        ...(init?.headers || {}),
      },
      // Node fetch: fail fast rather than hang the ingest.
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
