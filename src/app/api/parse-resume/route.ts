import { NextRequest, NextResponse } from "next/server";
import {
  detectKind,
  extractText,
  UnreadablePdfError,
} from "@/lib/resume-extract";
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
    let text: string;
    try {
      text = await extractText(buf, kind);
    } catch (err) {
      if (err instanceof UnreadablePdfError) {
        return NextResponse.json(
          {
            error:
              "We couldn't read this PDF — it may be scanned/image-only, password-protected, or corrupted. Try exporting a text-based PDF, or upload your resume as a .txt file.",
          },
          { status: 422 }
        );
      }
      throw err;
    }
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
