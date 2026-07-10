import { NextRequest, NextResponse } from "next/server";
import { getJobs } from "@/lib/jobs/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Scheduled refresh endpoint. Point a cron (e.g. Vercel Cron or an external
 * scheduler) at this to keep the server-side job cache warm. Optionally
 * protect it with a shared secret via the REFRESH_SECRET env var.
 */
async function handle(req: NextRequest) {
  const secret = process.env.REFRESH_SECRET;
  if (secret) {
    const provided =
      req.nextUrl.searchParams.get("secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const jobs = await getJobs(true);
  return NextResponse.json({ ok: true, count: jobs.length });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
