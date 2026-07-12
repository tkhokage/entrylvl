"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApplicationKit, RankedJob, ResumeProfile } from "@/lib/types";
import { formatSalary } from "@/lib/format";
import { parseSections, relativeDate } from "@/lib/job-sections";
import { extractSkills, prettySkill } from "@/lib/skills";
import { MatchArc } from "./MatchArc";
import { CopyButton } from "./CopyField";

function Check({ met }: { met: boolean }) {
  return met ? (
    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage/20 text-sage">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </span>
  ) : (
    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-beige text-beige">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
    </span>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
  );
}

export function RoleSheet({
  job,
  profile,
  saved,
  applied,
  onToggleSave,
  onMarkApplied,
  onClose,
}: {
  job: RankedJob;
  profile: ResumeProfile;
  saved: boolean;
  applied: boolean;
  onToggleSave: (job: RankedJob) => void;
  onMarkApplied: (id: string) => void;
  onClose: () => void;
}) {
  const [kit, setKit] = useState<ApplicationKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
  const sections = useMemo(() => parseSections(job.description), [job.description]);
  const tech = useMemo(
    () => extractSkills(job.description, 10).map(prettySkill),
    [job.description]
  );
  const posted = relativeDate(job.postedAt);

  const meta: { label: string; value: string }[] = [
    { label: "Salary", value: salary ? `${salary}${job.salaryEstimated ? " (est.)" : ""}` : "Not listed" },
    { label: "Work type", value: job.workType },
    { label: "Location", value: job.location },
    { label: "Seniority", value: "Entry level (0–2 yrs)" },
    ...(posted ? [{ label: "Posted", value: posted }] : []),
    { label: "Source", value: job.source },
  ];

  function close() {
    setEntered(false);
    setTimeout(onClose, 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-charcoal/30 backdrop-blur-[2px] transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={close}
        aria-hidden
      />
      <aside
        className={`relative flex h-full w-full max-w-xl flex-col bg-cream shadow-sheet transition-transform duration-300 ease-physical ${entered ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-beige px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal">{job.title}</h2>
              <p className="mt-0.5 text-[15px] text-taupe">{job.company} · {job.location} · {job.workType}</p>
            </div>
            <button onClick={close} className="shrink-0 rounded-full p-1.5 text-taupe transition hover:bg-sand" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="scroll-thin flex-1 space-y-7 overflow-y-auto px-7 py-6">
          <section className="card flex items-center gap-4 p-5">
            <MatchArc value={job.fitScore} size={64} stroke={6} />
            <div>
              <p className="font-display font-semibold text-charcoal">Why this fits you</p>
              <p className="mt-1 text-[15px] leading-relaxed text-charcoal/85">{job.fitReason}</p>
            </div>
          </section>

          {/* Meta grid */}
          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-beige bg-beige/60 sm:grid-cols-3">
            {meta.map((m) => (
              <div key={m.label} className="bg-sand px-4 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-taupe">{m.label}</div>
                <div className="mt-0.5 truncate text-[14px] text-charcoal" title={m.value}>{m.value}</div>
              </div>
            ))}
          </section>

          <div className="rounded-xl border border-amber/30 bg-amber/[0.07] p-4 text-[13px] leading-relaxed text-charcoal/80">
            Beacon prepares this from your resume and live job data, which can be incomplete. Confirm salary, location, and details on the official posting before you apply.
            {salary && job.salaryEstimated && (<> The salary <strong>{salary}</strong> shown is <strong>estimated</strong>, not listed by the employer.</>)}
          </div>

          {tech.length > 0 && (
            <section>
              <SectionTitle>Key skills for this role</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {tech.map((t) => (<span key={t} className="chip-amber">{t}</span>))}
              </div>
            </section>
          )}

          {loading && (
            <div className="space-y-3"><div className="h-28 animate-pulse rounded-2xl bg-sand" /><div className="h-40 animate-pulse rounded-2xl bg-sand" /></div>
          )}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          {kit && (
            <>
              <section>
                <SectionTitle>How you match the requirements</SectionTitle>
                <p className="mb-3 text-[13px] text-taupe">Green means your resume already covers it; open circles are gaps to address.</p>
                <ul className="card divide-y divide-beige/70 overflow-hidden">
                  {kit.requirements.map((r) => (
                    <li key={r.label} className="flex items-start gap-3 px-4 py-3">
                      <Check met={r.met} />
                      <span className={`text-[15px] ${r.met ? "text-charcoal" : "text-taupe"}`}>{r.label}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {sections.responsibilities.length > 0 && (
                <BulletSection title="Responsibilities" items={sections.responsibilities} />
              )}
              {sections.requirements.length > 0 && (
                <BulletSection title="Requirements" items={sections.requirements} />
              )}

              <section>
                <SectionTitle>Ready-to-paste details</SectionTitle>
                <div className="card divide-y divide-beige/70 overflow-hidden">
                  {kit.fields.filter((f) => f.value).map((f) => (
                    <div key={f.label} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-32 shrink-0 text-[11px] font-medium uppercase tracking-wide text-taupe">{f.label}</div>
                      <div className="min-w-0 flex-1 truncate text-[15px] text-charcoal">{f.value}</div>
                      <CopyButton text={f.value} />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <SectionTitle>Tailored cover note</SectionTitle>
                  <CopyButton text={kit.coverNote} label="Copy note" />
                </div>
                <div className="card whitespace-pre-wrap p-5 text-[15px] leading-relaxed text-charcoal/90">{kit.coverNote}</div>
              </section>

              <section>
                <SectionTitle>Screening answers</SectionTitle>
                <div className="space-y-3">
                  {kit.screeningAnswers.map((qa) => (
                    <div key={qa.question} className="card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-semibold text-charcoal">{qa.question}</p>
                        <CopyButton text={qa.answer} />
                      </div>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-charcoal/80">{qa.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              {job.description && (
                <section>
                  <SectionTitle>Full role description</SectionTitle>
                  <div className="card max-h-72 overflow-y-auto whitespace-pre-wrap p-5 text-[14px] leading-relaxed text-charcoal/75 scroll-thin">{job.description}</div>
                </section>
              )}

              <p className="text-center text-[13px] text-taupe">
                {kit.generatedWith === "claude" ? "Drafted with Claude from your resume." : "Drafted from a template (no API key set)."} Review before sending.
              </p>
            </>
          )}
        </div>

        {/* Pinned actions */}
        <div className="shrink-0 border-t border-beige bg-cream/95 px-7 py-4 backdrop-blur">
          <div className="flex gap-2.5">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onMarkApplied(job.id)}
              className="btn-primary flex-1"
            >
              {applied ? "Apply again →" : "Apply →"}
            </a>
            <button
              onClick={() => onToggleSave(job)}
              className={`btn-ghost gap-1.5 ${saved ? "text-amber-deep" : "text-taupe"}`}
              aria-pressed={saved}
            >
              <BookmarkIcon filled={saved} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          {applied && <p className="mt-2 text-center text-[12px] text-sage">✓ Marked as applied — it'll show in your tracker.</p>}
        </div>
      </aside>
    </div>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <ul className="card space-y-2 p-5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-charcoal/85">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
            {it}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 font-display text-[15px] font-semibold text-charcoal">{children}</h3>;
}
