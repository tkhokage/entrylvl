"use client";

import { useEffect, useState } from "react";
import type { ApplicationKit, RankedJob, ResumeProfile } from "@/lib/types";
import { formatSalary } from "@/lib/format";
import { CopyButton } from "./CopyField";

export function ApplicationKitPanel({
  job,
  profile,
  onClose,
}: {
  job: RankedJob;
  profile: ResumeProfile;
  onClose: () => void;
}) {
  const [kit, setKit] = useState<ApplicationKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setKit(null);
    fetch("/api/application-kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job, profile }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setKit(data.kit);
      })
      .catch(() => active && setError("Could not build the application kit."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [job, profile]);

  const salary = formatSalary(job);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="scroll-thin relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900">
                {job.title}
              </h2>
              <p className="truncate text-sm text-slate-600">
                {job.company} · {job.location} · {job.workType}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-3 w-full"
          >
            Open the official posting ↗
          </a>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Honesty note */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Beacon prepares this from your resume and live job data, which can be
            incomplete. Always confirm salary, location, and details on the
            official posting before you submit.
            {salary && job.salaryEstimated && (
              <>
                {" "}
                The salary <strong>{salary}</strong> shown here is{" "}
                <strong>estimated</strong>, not listed by the employer.
              </>
            )}
          </div>

          {loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-24 rounded-xl bg-slate-200" />
              <div className="h-32 rounded-xl bg-slate-200" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {kit && (
            <>
              {/* Copy-ready fields */}
              <section>
                <SectionTitle>Ready-to-paste details</SectionTitle>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {kit.fields
                    .filter((f) => f.value)
                    .map((f) => (
                      <div
                        key={f.label}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                          {f.label}
                        </div>
                        <div className="min-w-0 flex-1 truncate text-sm text-slate-800">
                          {f.value}
                        </div>
                        <CopyButton text={f.value} />
                      </div>
                    ))}
                </div>
              </section>

              {/* Cover note */}
              <section>
                <div className="flex items-center justify-between">
                  <SectionTitle>Tailored cover note</SectionTitle>
                  <CopyButton text={kit.coverNote} label="Copy note" />
                </div>
                <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
                  {kit.coverNote}
                </div>
              </section>

              {/* Screening answers */}
              <section>
                <SectionTitle>Screening answers</SectionTitle>
                <div className="space-y-3">
                  {kit.screeningAnswers.map((qa) => (
                    <div
                      key={qa.question}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          {qa.question}
                        </p>
                        <CopyButton text={qa.answer} />
                      </div>
                      <p className="mt-1.5 text-sm text-slate-600">{qa.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              <p className="text-center text-xs text-slate-400">
                {kit.generatedWith === "claude"
                  ? "Drafted with Claude from your resume."
                  : "Drafted from a template (no API key set)."}{" "}
                Review everything before sending.
              </p>

              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-500">
                Coming in the browser extension (phase 2): auto-fill this
                straight into the Greenhouse / Lever / Ashby / Workday form on
                the company site.
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-sm font-semibold text-slate-900">{children}</h3>
  );
}
