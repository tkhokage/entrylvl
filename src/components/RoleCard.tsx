"use client";

import type { RankedJob } from "@/lib/types";
import { formatSalary } from "@/lib/format";
import { MatchArc } from "./MatchArc";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function RoleCard({
  job,
  onOpen,
  saved,
  applied,
  onToggleSave,
}: {
  job: RankedJob;
  onOpen: (job: RankedJob) => void;
  saved: boolean;
  applied: boolean;
  onToggleSave: (job: RankedJob) => void;
}) {
  const salary = formatSalary(job);
  const meta = [
    salary ? `${salary}${job.salaryEstimated ? " (est.)" : ""}` : "Salary not listed",
    job.workType,
    "Entry level",
  ];

  return (
    <div className="group card p-6 transition duration-300 ease-physical hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold tracking-tight text-charcoal">
              {job.title}
            </h3>
            {applied && (
              <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-semibold text-sage">
                Applied
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[15px] text-taupe">
            {job.company} · {job.location}
          </p>

          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/85">
            {job.fitReason}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {meta.map((m) => (
              <span key={m} className="chip">
                {m}
              </span>
            ))}
            {job.matchedSkills.slice(0, 3).map((s) => (
              <span key={s} className="chip-amber">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <MatchArc value={job.fitScore} />
          <span className="text-[11px] font-medium uppercase tracking-wide text-taupe">
            match
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-beige/70 pt-4">
        <button
          onClick={() => onOpen(job)}
          className="btn-primary flex-1 sm:flex-none sm:px-7"
        >
          View role
        </button>
        <button
          onClick={() => onToggleSave(job)}
          className={`btn-ghost gap-1.5 ${saved ? "text-amber-deep" : "text-taupe"}`}
          aria-pressed={saved}
        >
          <BookmarkIcon filled={saved} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
