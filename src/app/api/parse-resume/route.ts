import { NextRequest, NextResponse } from "next/server";
import { detectKind, extractText } from "@/lib/resume-extract";
import { parseResume } from "@/lib/resume-parse";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("resume");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No resume file provided." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 8 MB)." },
        { status: 413 }
      );
    }
    const kind = detectKind(file.name, file.type);
    if (!kind) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or .txt resume." },
        { status: 415 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buf, kind);
    if (!text || text.replace(/\s/g, "").length < 40) {
      return NextResponse.json(
        {
          error:
            "Could not read text from this file. If it's a scanned/image PDF, try a text-based PDF or paste your resume as .txt.",
        },
        { status: 422 }
      );
    }

    const profile = await parseResume(text);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("parse-resume error:", err);
    return NextResponse.json(
      { error: "Failed to parse resume. Please try again." },
      { status: 500 }
    );
  }
}
