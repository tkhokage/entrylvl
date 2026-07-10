// Extracts raw text from an uploaded resume (PDF or plain text).
// Kept in its own module so it only ever runs on the Node server runtime.

// Import the implementation directly to avoid pdf-parse's index.js debug
// harness, which tries to read a bundled sample file at require time.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export type ResumeFileKind = "pdf" | "txt";

export function detectKind(filename: string, mime: string): ResumeFileKind | null {
  const name = filename.toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
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
  const data = await pdfParse(buf);
  return (data.text || "").trim();
}
