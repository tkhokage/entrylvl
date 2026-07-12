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
    const contentType = req.headers.get("content-type") || "";

    // Path 1: pasted text or LinkedIn profile text (JSON body).
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { text?: string };
      const text = (body.text || "").trim();
      if (text.replace(/\s/g, "").length < 40) {
        return NextResponse.json(
          {
            error:
              "That doesn't look like enough text to work with. Paste your full resume or LinkedIn profile.",
          },
          { status: 422 }
        );
      }
      const profile = await parseResume(text);
      return NextResponse.json({ profile });
    }

    // Path 2: file upload (PDF / DOCX / TXT), or a `text` form field.
    const form = await req.formData();

    const pasted = form.get("text");
    if (typeof pasted === "string" && pasted.trim().replace(/\s/g, "").length >= 40) {
      const profile = await parseResume(pasted.trim());
      return NextResponse.json({ profile });
    }

    const file = form.get("resume");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No resume provided. Upload a file or paste your resume text." },
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
        {
          error:
            "Unsupported file type. Upload a PDF, Word (.docx), or .txt resume — or paste the text.",
        },
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
              kind === "docx"
                ? "We couldn't read this Word file. Try re-saving it, exporting a PDF, or pasting the text."
                : "We couldn't read this PDF — it may be scanned/image-only, password-protected, or corrupted. Try a text-based PDF, a Word file, or paste the text.",
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
            "Could not read enough text from this file. If it's a scanned/image PDF, try a text-based export or paste your resume text.",
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
