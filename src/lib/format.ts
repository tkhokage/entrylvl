import type { Job } from "./types";

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

/**
 * Human-readable salary. Returns null when there's nothing to show.
 * Honest: callers must render the "estimated" flag separately — this function
 * never disguises an estimate as a listed figure.
 */
export function formatSalary(job: Job): string | null {
  if (job.salaryMin == null && job.salaryMax == null) return null;
  const sym = SYMBOL[job.salaryCurrency || "USD"] || "";
  const fmt = (n: number) => `${sym}${Math.round(n / 1000)}k`;
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${fmt(job.salaryMin)}–${fmt(job.salaryMax)}`;
  }
  const one = job.salaryMin ?? job.salaryMax!;
  return fmt(one);
}
