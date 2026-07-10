import type { Job } from "../../types";
import {
  detectWorkType,
  fetchJson,
  isEntryLevel,
  jobId,
  parseSalary,
  stripHtml,
} from "../util";

interface MuseResult {
  name: string;
  contents?: string;
  publication_date?: string;
  company?: { name?: string };
  locations?: { name?: string }[];
  levels?: { name?: string }[];
  refs?: { landing_page?: string };
}
interface MuseResponse {
  results: MuseResult[];
  page_count: number;
}

/**
 * The Muse public API. Free, broad, has a level filter (Entry Level).
 * Good MVP source for volume. No salary data, so all are estimated.
 */
export async function fetchMuse(pages = 2): Promise<Job[]> {
  const out: Job[] = [];
  for (let page = 0; page < pages; page++) {
    const data = await fetchJson<MuseResponse>(
      `https://www.themuse.com/api/public/jobs?level=Entry%20Level&page=${page}`
    );
    if (!data?.results?.length) break;

    for (const r of data.results) {
      const url = r.refs?.landing_page;
      if (!url) continue;
      const location = r.locations?.[0]?.name || "";
      const text = stripHtml(r.contents || "");
      const isEntry =
        r.levels?.some((l) => /entry/i.test(l.name || "")) ||
        isEntryLevel(r.name, text);
      if (!isEntry) continue;
      const salary = parseSalary(text);
      out.push({
        id: jobId("themuse", url),
        title: r.name,
        company: r.company?.name || "Unknown",
        location: location || "See posting",
        workType: detectWorkType(location, text),
        salaryMin: salary?.min ?? null,
        salaryMax: salary?.max ?? null,
        salaryCurrency: salary?.currency ?? null,
        salaryEstimated: !salary,
        description: text.slice(0, 4000),
        applyUrl: url,
        source: "themuse",
        postedAt: r.publication_date || null,
        entryLevel: true,
      });
    }
    if (page + 1 >= (data.page_count || 1)) break;
  }
  return out;
}
