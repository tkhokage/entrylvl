import type { Job } from "../../types";
import { fetchJson, isEntryLevel, jobId, parseSalary, stripHtml } from "../util";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
  publication_date?: string;
}
interface RemotiveResponse {
  jobs: RemotiveJob[];
}

/**
 * Remotive: free, remote-focused, no key. Supplementary source.
 * Every job here is Remote by definition.
 */
export async function fetchRemotive(): Promise<Job[]> {
  const data = await fetchJson<RemotiveResponse>(
    "https://remotive.com/api/remote-jobs?limit=200"
  );
  if (!data?.jobs?.length) return [];

  const out: Job[] = [];
  for (const j of data.jobs) {
    const text = stripHtml(j.description || "");
    if (!isEntryLevel(j.title, text)) continue;
    const salary = parseSalary(j.salary || text);
    out.push({
      id: jobId("remotive", j.url),
      title: j.title,
      company: j.company_name || "Unknown",
      location: j.candidate_required_location || "Remote",
      workType: "Remote",
      salaryMin: salary?.min ?? null,
      salaryMax: salary?.max ?? null,
      salaryCurrency: salary?.currency ?? null,
      salaryEstimated: !salary,
      description: text.slice(0, 4000),
      applyUrl: j.url,
      source: "remotive",
      postedAt: j.publication_date || null,
      entryLevel: true,
    });
  }
  return out;
}
