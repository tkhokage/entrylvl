import { NextRequest, NextResponse } from "next/server";
import { buildApplicationKit } from "@/lib/application-kit";
import type { Job, ResumeProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { job?: Job; profile?: ResumeProfile };
    if (!body.job?.applyUrl || !body.profile) {
      return NextResponse.json(
        { error: "Both job and profile are required." },
        { status: 400 }
      );
    }
    const kit = await buildApplicationKit(body.job, body.profile);
    return NextResponse.json({ kit });
  } catch (err) {
    console.error("application-kit error:", err);
    return NextResponse.json(
      { error: "Failed to build application kit." },
      { status: 500 }
    );
  }
}
