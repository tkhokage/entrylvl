import type { Job } from "../../types";
import {
  detectWorkType,
  fetchJson,
  isEntryLevel,
  jobId,
  parseSalary,
  stripHtml,
} from "../util";

interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  isRemote?: boolean;
  descriptionPlain?: string;
  descriptionHtml?: string;
  jobUrl?: string;
  applyUrl?: string;
  publishedAt?: string;
  compensation?: unknown;
}
interface AshbyResponse {
  jobs: AshbyJob[];
}

/** Fetch a single Ashby job board. Returns entry-level jobs only. */
export async function fetchAshby(slug: string): Promise<Job[]> {
  const data = await fetchJson<AshbyResponse>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(
      slug
    )}?includeCompensation=true`
  );
  if (!data?.jobs?.length) return [];

  const out: Job[] = [];
  for (const j of data.jobs) {
    const location = j.location || "";
    const text = (j.descriptionPlain || stripHtml(j.descriptionHtml || "")).trim();
    if (!isEntryLevel(j.title, text)) continue;
    const applyUrl = j.applyUrl || j.jobUrl || "";
    if (!applyUrl) continue;
    const salary = parseSalary(text);
    const workType = j.isRemote ? "Remote" : detectWorkType(location, text);

    out.push({
      id: jobId("ashby", applyUrl),
      title: j.title,
      company: prettyCompany(slug),
      location: location || (j.isRemote ? "Remote" : "See posting"),
      workType,
      salaryMin: salary?.min ?? null,
      salaryMax: salary?.max ?? null,
      salaryCurrency: salary?.currency ?? null,
      salaryEstimated: !salary,
      description: text.slice(0, 4000),
      applyUrl,
      source: "ashby",
      sourceCompany: slug,
      postedAt: j.publishedAt || null,
      entryLevel: true,
    });
  }
  return out;
}

function prettyCompany(s: string): string {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
