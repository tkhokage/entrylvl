"use client";

import { useEffect, useMemo, useState } from "react";
import type { RankedJob, ResumeProfile, WorkType } from "@/lib/types";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ProfileBar } from "@/components/ProfileBar";
import { JobCard } from "@/components/JobCard";
import { ApplicationKitPanel } from "@/components/ApplicationKitPanel";

type WorkFilter = "All" | WorkType;
type SortMode = "fit" | "salary";

const PROFILE_KEY = "beacon.profile";

export default function Home() {
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [parsing, setParsing] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [workFilter, setWorkFilter] = useState<WorkFilter>("All");
  const [sort, setSort] = useState<SortMode>("fit");
  const [selected, setSelected] = useState<RankedJob | null>(null);

  // Restore a session profile if present (session-only, per the MVP promise).
  useEffect(() => {
    const stored = sessionStorage.getItem(PROFILE_KEY);
    if (stored) {
      try {
        const p = JSON.parse(stored) as ResumeProfile;
        setProfile(p);
        void loadJobs(p);
      } catch {
        sessionStorage.removeItem(PROFILE_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file: File) {
    setError(null);
    setNote(null);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse resume.");
      const p = data.profile as ResumeProfile;
      setProfile(p);
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      await loadJobs(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setParsing(false);
    }
  }

  async function loadJobs(p: ResumeProfile, force = false) {
    setLoadingJobs(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p, force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load jobs.");
      setJobs(data.jobs || []);
      if (data.note) setNote(data.note);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs.");
    } finally {
      setLoadingJobs(false);
    }
  }

  function reset() {
    sessionStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setJobs([]);
    setSelected(null);
    setError(null);
    setNote(null);
  }

  const visibleJobs = useMemo(() => {
    let list =
      workFilter === "All"
        ? jobs
        : jobs.filter((j) => j.workType === workFilter);
    list = [...list];
    if (sort === "fit") {
      list.sort((a, b) => b.fitScore - a.fitScore);
    } else {
      const val = (j: RankedJob) => j.salaryMax ?? j.salaryMin ?? -1;
      list.sort((a, b) => val(b) - val(a));
    }
    return list;
  }, [jobs, workFilter, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: jobs.length };
    for (const t of ["Remote", "Hybrid", "In-office"] as WorkType[]) {
      c[t] = jobs.filter((j) => j.workType === t).length;
    }
    return c;
  }, [jobs]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔦</span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Beacon
          </span>
        </div>
        <a
          href="#how"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          How it works
        </a>
      </header>

      {!profile ? (
        <Landing onFile={handleFile} busy={parsing} error={error} />
      ) : (
        <div className="space-y-6">
          <ProfileBar profile={profile} onReset={reset} />

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Remote", "Hybrid", "In-office"] as WorkFilter[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setWorkFilter(t)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      workFilter === t
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {t}
                    <span className="ml-1.5 text-xs opacity-60">
                      {counts[t] ?? 0}
                    </span>
                  </button>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
              >
                <option value="fit">Best match</option>
                <option value="salary">Salary (listed/est.)</option>
              </select>
              <button
                className="btn-ghost"
                onClick={() => profile && loadJobs(profile, true)}
                disabled={loadingJobs}
                title="Re-fetch live jobs from all sources"
              >
                {loadingJobs ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {note && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {note}
            </div>
          )}

          {/* Job list */}
          {loadingJobs && jobs.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : visibleJobs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              No matching jobs to show yet. Try “Refresh”, or clear the work-type
              filter.
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Showing {visibleJobs.length} entry-level match
                {visibleJobs.length === 1 ? "" : "es"} from live startup boards.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleJobs.map((job) => (
                  <JobCard key={job.id} job={job} onOpen={setSelected} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {selected && profile && (
        <ApplicationKitPanel
          job={selected}
          profile={profile}
          onClose={() => setSelected(null)}
        />
      )}

      <footer
        id="how"
        className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500"
      >
        <p className="mb-2 font-medium text-slate-700">How Beacon works</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Upload your resume — it's parsed into a structured profile.</li>
          <li>
            Beacon pulls live entry-level openings from The Muse and startup
            Greenhouse, Lever &amp; Ashby boards.
          </li>
          <li>Each job is scored against your profile and ranked.</li>
          <li>
            Open any job for a ready-to-paste application kit and the official
            apply link.
          </li>
        </ol>
        <p className="mt-4 text-xs text-slate-400">
          MVP: nothing is stored beyond your browser session. Salary figures
          marked “est.” are inferred, not quoted by the employer — always confirm
          on the official posting.
        </p>
      </footer>
    </main>
  );
}

function Landing({
  onFile,
  busy,
  error,
}: {
  onFile: (f: File) => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Find entry-level startup jobs that fit{" "}
          <span className="text-beacon-600">your</span> resume.
        </h1>
        <p className="mt-3 text-slate-600">
          Upload your resume once. Beacon pulls live openings for 0–2 years of
          experience, ranks them by fit, and prepares each application so it's
          mostly filled out for you.
        </p>
      </div>

      <UploadDropzone onFile={onFile} busy={busy} />

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        Nothing is stored beyond this browser session in the MVP. Your resume is
        parsed on the server and not saved.
      </p>
    </div>
  );
}
