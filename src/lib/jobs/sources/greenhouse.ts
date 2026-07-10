import type { Job } from "../../types";
import {
  detectWorkType,
  fetchJson,
  isEntryLevel,
  jobId,
  parseSalary,
  stripHtml,
} from "../util";

interface GhJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  location?: { name?: string };
  content?: string;
  company_name?: string;
}
interface GhResponse {
  jobs: GhJob[];
}

/** Fetch a single Greenhouse board. Returns entry-level jobs only. */
export async function fetchGreenhouse(slug: string): Promise<Job[]> {
  const data = await fetchJson<GhResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
      slug
    )}/jobs?content=true`
  );
  if (!data?.jobs?.length) return [];

  const out: Job[] = [];
  for (const j of data.jobs) {
    const location = j.location?.name || "";
    const text = stripHtml(j.content || "");
    if (!isEntryLevel(j.title, text)) continue;
    const salary = parseSalary(text);
    out.push({
      id: jobId("greenhouse", j.absolute_url),
      title: j.title,
      company: prettyCompany(j.company_name || slug),
      location: location || "See posting",
      workType: detectWorkType(location, text),
      salaryMin: salary?.min ?? null,
      salaryMax: salary?.max ?? null,
      salaryCurrency: salary?.currency ?? null,
      salaryEstimated: !salary,
      description: text.slice(0, 4000),
      applyUrl: j.absolute_url,
      source: "greenhouse",
      sourceCompany: slug,
      postedAt: j.updated_at || null,
      entryLevel: true,
    });
  }
  return out;
}

function prettyCompany(s: string): string {
  return s
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
