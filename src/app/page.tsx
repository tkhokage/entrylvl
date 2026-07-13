"use client";

import { useEffect, useMemo, useState } from "react";
import type { RankedJob, ResumeProfile, WorkType } from "@/lib/types";
import { LiquidGlassHero } from "@/components/hero/LiquidGlassHero";
import { ImportPanel } from "@/components/ImportPanel";
import { ReadingState } from "@/components/ReadingState";
import { ProfileSummary } from "@/components/ProfileSummary";
import { SearchBar } from "@/components/SearchBar";
import { RoleCard } from "@/components/RoleCard";
import { RoleSheet } from "@/components/RoleSheet";
import { useTracker } from "@/lib/useTracker";

type View = "landing" | "import" | "reading" | "hub";
type WorkFilter = "All" | WorkType;
type SortMode = "fit" | "salary";

const PROFILE_KEY = "beacon.profile";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [parsing, setParsing] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [workFilter, setWorkFilter] = useState<WorkFilter>("All");
  const [sort, setSort] = useState<SortMode>("fit");
  const [showSaved, setShowSaved] = useState(false);
  const [selected, setSelected] = useState<RankedJob | null>(null);

  // Search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RankedJob[] | null>(null);
  const [searching, setSearching] = useState(false);

  const tracker = useTracker();

  useEffect(() => {
    const stored = sessionStorage.getItem(PROFILE_KEY);
    if (stored) {
      try {
        const p = JSON.parse(stored) as ResumeProfile;
        setProfile(p);
        setView("hub");
        void loadJobs(p);
      } catch {
        sessionStorage.removeItem(PROFILE_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runImport(source: { file?: File; text?: string }) {
    setError(null);
    setParsing(true);
    setProfile(null);
    setView("reading");
    try {
      let res: Response;
      if (source.file) {
        const fd = new FormData();
        fd.append("resume", source.file);
        res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: source.text }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to read your resume.");
      const p = data.profile as ResumeProfile;
      setProfile(p);
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      void loadJobs(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setView("import");
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
      if (!res.ok) throw new Error(data.error || "Failed to load roles.");
      setJobs(data.jobs || []);
      if (data.note) setNote(data.note);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roles.");
    } finally {
      setLoadingJobs(false);
    }
  }

  async function runSearch(q: string) {
    setQuery(q);
    if (!q) {
      setSearchResults(null);
      return;
    }
    if (!profile) return;
    setSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, query: q }),
      });
      const data = await res.json();
      setSearchResults(data.jobs || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function reset() {
    sessionStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setJobs([]);
    setSelected(null);
    setError(null);
    setNote(null);
    setShowSaved(false);
    setQuery("");
    setSearchResults(null);
    setView("landing");
  }

  const searchActive = searchResults !== null && query.length > 0;
  const baseList = showSaved ? tracker.saved : searchActive ? searchResults! : jobs;

  const visibleJobs = useMemo(() => {
    let list = workFilter === "All" ? baseList : baseList.filter((j) => j.workType === workFilter);
    list = [...list];
    if (sort === "fit") list.sort((a, b) => b.fitScore - a.fitScore);
    else {
      const val = (j: RankedJob) => j.salaryMax ?? j.salaryMin ?? -1;
      list.sort((a, b) => val(b) - val(a));
    }
    return list;
  }, [baseList, workFilter, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: baseList.length };
    for (const t of ["Remote", "Hybrid", "In-office"] as WorkType[])
      c[t] = baseList.filter((j) => j.workType === t).length;
    return c;
  }, [baseList]);

  return (
    <main className="min-h-screen">
      {view !== "landing" && (
        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <button onClick={reset} className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-charcoal">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-amber/20 text-[15px]">🔦</span>
            Beacon
          </button>
          {view === "hub" ? (
            <button onClick={() => setShowSaved((s) => !s)} className={`btn-ghost text-[14px] ${showSaved ? "border-amber text-amber-deep" : ""}`}>
              {showSaved ? "← All roles" : `Saved (${tracker.saved.length})`}
            </button>
          ) : (
            <span className="text-[13px] text-taupe">Accounts coming soon</span>
          )}
        </header>
      )}

      {view === "landing" && <LiquidGlassHero onStart={() => setView("import")} />}

      {view === "import" && (
        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <ImportPanel
            onFile={(file) => runImport({ file })}
            onText={(text) => runImport({ text })}
            busy={parsing}
            error={error}
            onBack={() => { setError(null); setView("landing"); }}
          />
        </section>
      )}

      {view === "reading" && (
        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          <ReadingState profile={profile} onDone={() => setView("hub")} />
        </section>
      )}

      {view === "hub" && profile && (
        <section className="mx-auto max-w-3xl space-y-6 px-5 pb-24 sm:px-8">
          <ProfileSummary profile={profile} onReset={reset} />

          <SearchBar onSearch={runSearch} titles={jobs.map((j) => j.title)} busy={searching} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Remote", "Hybrid", "In-office"] as WorkFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setWorkFilter(t)}
                  className={`rounded-full px-3.5 py-1.5 text-[14px] font-medium transition duration-300 ease-physical ${
                    workFilter === t ? "bg-charcoal text-cream" : "border border-beige bg-transparent text-taupe hover:bg-sand"
                  }`}
                >
                  {t}
                  <span className="ml-1.5 text-[12px] opacity-60">{counts[t] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="rounded-xl border border-beige bg-transparent px-3 py-1.5 text-[14px] text-charcoal outline-none">
                <option value="fit">Best match</option>
                <option value="salary">Salary</option>
              </select>
              {!showSaved && !searchActive && (
                <button className="btn-ghost text-[13px]" onClick={() => profile && loadJobs(profile, true)} disabled={loadingJobs}>
                  {loadingJobs ? "Refreshing…" : "Refresh"}
                </button>
              )}
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-[14px] text-red-700">{error}</div>}
          {note && <div className="rounded-xl border border-amber/30 bg-amber/[0.07] p-3.5 text-[14px] text-charcoal/80">{note}</div>}

          {loadingJobs && jobs.length === 0 ? (
            <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-44 animate-pulse rounded-2xl bg-sand" />))}</div>
          ) : visibleJobs.length === 0 ? (
            <EmptyState mode={showSaved ? "saved" : searchActive ? "search" : "matches"} query={query} onRefresh={() => profile && loadJobs(profile, true)} />
          ) : (
            <>
              <p className="text-[14px] text-taupe">
                {showSaved
                  ? "Your saved roles"
                  : searchActive
                    ? `${visibleJobs.length} role${visibleJobs.length === 1 ? "" : "s"} matching “${query}”, ranked by your fit`
                    : `Showing ${visibleJobs.length} US entry-level match${visibleJobs.length === 1 ? "" : "es"}`}
              </p>
              <div className="space-y-4">
                {visibleJobs.map((job) => (
                  <RoleCard
                    key={job.id}
                    job={job}
                    onOpen={setSelected}
                    saved={tracker.isSaved(job.id)}
                    applied={tracker.isApplied(job.id)}
                    onToggleSave={tracker.toggleSaved}
                  />
                ))}
              </div>
            </>
          )}

          <FooterNote />
        </section>
      )}

      {selected && profile && (
        <RoleSheet
          job={selected}
          profile={profile}
          saved={tracker.isSaved(selected.id)}
          applied={tracker.isApplied(selected.id)}
          onToggleSave={tracker.toggleSaved}
          onMarkApplied={tracker.markApplied}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}

function EmptyState({ mode, query, onRefresh }: { mode: "saved" | "search" | "matches"; query: string; onRefresh: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-8 py-14 text-center">
      <div className="relative mb-2 h-16 w-16">
        <div className="absolute inset-0 rounded-full border border-amber/40" />
        <div className="absolute inset-2 rounded-full border border-amber/25" />
        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-soft" />
      </div>
      <p className="font-display text-lg font-semibold text-charcoal">
        {mode === "saved" ? "No saved roles yet" : mode === "search" ? `No roles matching “${query}”` : "No matching roles right now"}
      </p>
      <p className="max-w-sm text-[15px] text-taupe">
        {mode === "saved"
          ? "Tap Save on any role and it'll wait for you here."
          : mode === "search"
            ? "Try a broader term, or clear the search to return to your matches."
            : "Try clearing the work-type filter, or refresh to pull the latest live roles."}
      </p>
      {mode === "matches" && <button onClick={onRefresh} className="btn-ghost mt-1">Refresh roles</button>}
    </div>
  );
}

function FooterNote() {
  return (
    <footer className="border-t border-beige pt-6 text-[13px] leading-relaxed text-taupe">
      Beacon shows US entry-level roles from The Muse and startup Greenhouse,
      Lever &amp; Ashby boards. Salaries marked “est.” are inferred, not quoted —
      always confirm on the official posting. Saved roles live in this browser;
      nothing else is stored beyond your session.
    </footer>
  );
}
