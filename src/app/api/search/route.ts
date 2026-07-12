import { NextRequest, NextResponse } from "next/server";
import { getJobs } from "@/lib/jobs/ingest";
import { rankJobs } from "@/lib/match";
import type { ResumeProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Search every cached role by type/keyword (not just the resume shortlist),
 * still ranked by fit against the profile. Works for any title — "scrum",
 * "soc analyst", "product" — by token matching title first, then description.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { profile?: ResumeProfile; query?: string };
    const query = (body.query || "").trim().toLowerCase();
    const profile = body.profile;
    if (!profile || !Array.isArray(profile.topSkills)) {
      return NextResponse.json({ error: "A parsed profile is required." }, { status: 400 });
    }
    if (!query) return NextResponse.json({ jobs: [], total: 0 });

    const jobs = await getJobs();
    const tokens = query.split(/\s+/).filter(Boolean);

    const scored = jobs
      .map((j) => {
        const title = j.title.toLowerCase();
        const desc = j.description.toLowerCase();
        let rel = 0;
        if (title.includes(query)) rel = 3;
        else if (tokens.every((t) => title.includes(t))) rel = 2;
        else if (tokens.every((t) => desc.includes(t))) rel = 1;
        return { j, rel };
      })
      .filter((x) => x.rel > 0);

    if (!scored.length) return NextResponse.json({ jobs: [], total: 0 });

    // Rank the matches by fit (cheap templated reasons keep search snappy),
    // then bias by title relevance so exact-title hits float up.
    const ranked = await rankJobs(
      scored.map((x) => x.j),
      profile,
      { limit: 100, reasonCount: 0 }
    );
    const relById = new Map(scored.map((x) => [x.j.id, x.rel]));
    ranked.sort((a, b) => {
      const ra = relById.get(a.id) ?? 0;
      const rb = relById.get(b.id) ?? 0;
      if (rb !== ra) return rb - ra;
      return b.fitScore - a.fitScore;
    });

    return NextResponse.json({ jobs: ranked, total: ranked.length });
  } catch (err) {
    console.error("search error:", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
