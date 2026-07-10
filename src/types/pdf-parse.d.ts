// The @types/pdf-parse package only declares the package root. We import the
// implementation subpath directly to avoid pdf-parse's debug harness, so
// declare that module here.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: unknown;
    metadata: unknown;
    version: string;
  }
  function pdf(dataBuffer: Buffer): Promise<PdfParseResult>;
  export default pdf;
}
