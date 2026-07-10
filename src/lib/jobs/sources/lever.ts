import type { Job } from "../../types";
import {
  detectWorkType,
  fetchJson,
  isEntryLevel,
  jobId,
  parseSalary,
  stripHtml,
} from "../util";

interface LeverPosting {
  id: string;
  text: string; // title
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
  categories?: { location?: string; team?: string; commitment?: string };
  descriptionPlain?: string;
  description?: string;
  workplaceType?: string; // "remote" | "on-site" | "hybrid"
}

/** Fetch a single Lever board. Returns entry-level jobs only. */
export async function fetchLever(slug: string): Promise<Job[]> {
  const data = await fetchJson<LeverPosting[]>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`
  );
  if (!Array.isArray(data) || !data.length) return [];

  const out: Job[] = [];
  for (const p of data) {
    const location = p.categories?.location || "";
    const text = (p.descriptionPlain || stripHtml(p.description || "")).trim();
    if (!isEntryLevel(p.text, text)) continue;
    const salary = parseSalary(text);
    const applyUrl = p.hostedUrl || p.applyUrl || "";
    if (!applyUrl) continue;

    const workType =
      p.workplaceType === "remote"
        ? "Remote"
        : p.workplaceType === "hybrid"
          ? "Hybrid"
          : p.workplaceType === "on-site"
            ? "In-office"
            : detectWorkType(location, text);

    out.push({
      id: jobId("lever", applyUrl),
      title: p.text,
      company: prettyCompany(slug),
      location: location || "See posting",
      workType,
      salaryMin: salary?.min ?? null,
      salaryMax: salary?.max ?? null,
      salaryCurrency: salary?.currency ?? null,
      salaryEstimated: !salary,
      description: text.slice(0, 4000),
      applyUrl,
      source: "lever",
      sourceCompany: slug,
      postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      entryLevel: true,
    });
  }
  return out;
}

function prettyCompany(s: string): string {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
