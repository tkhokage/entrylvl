// Extracts raw text from an uploaded resume (PDF or plain text).
// Kept in its own module so it only ever runs on the Node server runtime.

// Import the implementation directly to avoid pdf-parse's index.js debug
// harness, which tries to read a bundled sample file at require time.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export type ResumeFileKind = "pdf" | "txt" | "docx";

/**
 * Thrown when a PDF can't be read (corrupt, encrypted, or scanned/image-only).
 * The API route maps this to a friendly 422 instead of a generic 500.
 */
export class UnreadablePdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnreadablePdfError";
  }
}

export function detectKind(filename: string, mime: string): ResumeFileKind | null {
  const name = filename.toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    name.endsWith(".docx") ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (mime.startsWith("text/") || name.endsWith(".txt")) return "txt";
  return null;
}

export async function extractText(
  buf: Buffer,
  kind: ResumeFileKind
): Promise<string> {
  if (kind === "txt") {
    return buf.toString("utf8");
  }
  if (kind === "docx") {
    try {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return (value || "").trim();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new UnreadablePdfError(detail);
    }
  }
  try {
    const data = await pdfParse(buf);
    return (data.text || "").trim();
  } catch (err) {
    // pdf-parse/pdf.js throws on malformed, encrypted, or otherwise unreadable
    // PDFs. Surface a typed error so the caller can guide the user rather than
    // returning an opaque 500.
    const detail = err instanceof Error ? err.message : String(err);
    throw new UnreadablePdfError(detail);
  }
}
