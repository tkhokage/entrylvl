import { NextRequest, NextResponse } from "next/server";
import { getJobs } from "@/lib/jobs/ingest";
import { rankJobs } from "@/lib/match";
import type { ResumeProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { profile?: ResumeProfile; force?: boolean };
    const profile = body.profile;
    if (!profile || !Array.isArray(profile.topSkills)) {
      return NextResponse.json(
        { error: "A parsed profile is required." },
        { status: 400 }
      );
    }

    const jobs = await getJobs(Boolean(body.force));
    if (!jobs.length) {
      return NextResponse.json({
        jobs: [],
        note: "No live jobs were reachable right now. Try again shortly — sources refresh on a schedule.",
      });
    }

    const ranked = await rankJobs(jobs, profile, { limit: 60, reasonCount: 15 });
    return NextResponse.json({ jobs: ranked, total: jobs.length });
  } catch (err) {
    console.error("jobs error:", err);
    return NextResponse.json({ error: "Failed to load jobs." }, { status: 500 });
  }
}
