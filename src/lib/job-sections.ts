// Best-effort extraction of Responsibilities / Requirements bullet lists from a
// raw job description. Heuristic and honest: if we can't find a section, we
// return nothing for it and the UI falls back to the full description.

const RESP_HEADINGS =
  /(responsibilities|what you'?ll do|what you will do|the role|your impact|day[- ]to[- ]day|in this role)/i;
const REQ_HEADINGS =
  /(requirements|qualifications|what we'?re looking for|what you'?ll bring|you have|must have|about you|who you are|basic qualifications)/i;
const STOP_HEADING =
  /(responsibilities|requirements|qualifications|what you'?ll do|what we'?re looking for|benefits|perks|compensation|about (the|us|the company)|equal opportunity|why join|nice to have|preferred)/i;

function collectAfter(lines: string[], startIdx: number): string[] {
  const out: string[] = [];
  for (let i = startIdx + 1; i < lines.length && out.length < 10; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    // Stop when we hit the next section heading.
    if (raw.length < 60 && STOP_HEADING.test(raw)) break;
    const cleaned = raw.replace(/^[•\-*·▪◦‣]\s*/, "").trim();
    if (cleaned.length >= 3 && cleaned.length <= 240) out.push(cleaned);
  }
  return out;
}

export function parseSections(description: string): {
  responsibilities: string[];
  requirements: string[];
} {
  const lines = description.split(/\r?\n/);
  let responsibilities: string[] = [];
  let requirements: string[] = [];

  lines.forEach((line, i) => {
    const l = line.trim();
    if (l.length > 70) return; // headings are short
    if (!responsibilities.length && RESP_HEADINGS.test(l))
      responsibilities = collectAfter(lines, i);
    if (!requirements.length && REQ_HEADINGS.test(l))
      requirements = collectAfter(lines, i);
  });

  return { responsibilities, requirements };
}

/** "3 days ago" / "2 weeks ago" style relative posted date. */
export function relativeDate(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
  return `${Math.floor(days / 365)}y ago`;
}
