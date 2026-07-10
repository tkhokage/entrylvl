"use client";

import type { RankedJob } from "@/lib/types";
import { formatSalary } from "@/lib/format";

function scoreColor(score: number): string {
  if (score >= 70) return "bg-emerald-100 text-emerald-800";
  if (score >= 45) return "bg-beacon-100 text-beacon-800";
  return "bg-slate-100 text-slate-600";
}

function workTypeBadge(t: string): string {
  if (t === "Remote") return "bg-violet-100 text-violet-700";
  if (t === "Hybrid") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-700";
}

export function JobCard({
  job,
  onOpen,
}: {
  job: RankedJob;
  onOpen: (job: RankedJob) => void;
}) {
  const salary = formatSalary(job);
  return (
    <button
      onClick={() => onOpen(job)}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-beacon-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-beacon-700">
            {job.title}
          </h3>
          <p className="truncate text-sm text-slate-600">
            {job.company} · {job.location}
          </p>
        </div>
        <div
          className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-semibold ${scoreColor(
            job.fitScore
          )}`}
          title="Fit score (0-100)"
        >
          {job.fitScore}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${workTypeBadge(
            job.workType
          )}`}
        >
          {job.workType}
        </span>
        {salary ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {salary}
            {job.salaryEstimated && (
              <span className="ml-1 text-slate-400" title="Not listed on the posting — estimated. Confirm on the official posting.">
                (est.)
              </span>
            )}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            Salary not listed
          </span>
        )}
        <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-400">
          {job.source}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">{job.fitReason}</p>

      {job.matchedSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.matchedSkills.slice(0, 5).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
