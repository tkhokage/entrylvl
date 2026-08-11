import type { Job } from "../types";
import { prisma } from "../db";
import { fetchMuse } from "./sources/themuse";
import { fetchGreenhouse } from "./sources/greenhouse";
import { fetchLever } from "./sources/lever";
import { fetchAshby } from "./sources/ashby";
import { fetchRemotive } from "./sources/remotive";
import { isUSJob } from "./util";
import { GREENHOUSE_SLUGS, LEVER_SLUGS, ASHBY_SLUGS } from "./seed";

/** How long cached jobs are considered fresh. */
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/** Run promises with a concurrency limit so we don't hammer sources. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

export interface IngestResult {
  jobs: Job[];
  perSource: Record<string, number>;
}

/**
 * Fetch from every enabled source, normalize, and return the combined,
 * de-duplicated list. Failures per board are swallowed and logged.
 */
export async function ingestFromSources(): Promise<IngestResult> {
  const perSource: Record<string, number> = {};
  const all: Job[] = [];

  const collect = (label: string, jobs: Job[]) => {
    perSource[label] = (perSource[label] || 0) + jobs.length;
    all.push(...jobs);
  };

  const tasks: Promise<void>[] = [];

  // The Muse (broad first pass).
  tasks.push(
    fetchMuse(2)
      .then((j) => collect("themuse", j))
      .catch((e) => logErr("themuse", e))
  );

  // Greenhouse boards.
  tasks.push(
    mapLimit(GREENHOUSE_SLUGS, 6, async (slug) => {
      try {
        collect("greenhouse", await fetchGreenhouse(slug));
      } catch (e) {
        logErr(`greenhouse:${slug}`, e);
      }
    }).then(() => undefined)
  );

  // Lever boards.
  tasks.push(
    mapLimit(LEVER_SLUGS, 6, async (slug) => {
      try {
        collect("lever", await fetchLever(slug));
      } catch (e) {
        logErr(`lever:${slug}`, e);
      }
    }).then(() => undefined)
  );

  // Ashby boards.
  tasks.push(
    mapLimit(ASHBY_SLUGS, 6, async (slug) => {
      try {
        collect("ashby", await fetchAshby(slug));
      } catch (e) {
        logErr(`ashby:${slug}`, e);
      }
    }).then(() => undefined)
  );

  // Remotive (supplementary, remote-focused).
  if (process.env.ENABLE_REMOTIVE !== "false") {
    tasks.push(
      fetchRemotive()
        .then((j) => collect("remotive", j))
        .catch((e) => logErr("remotive", e))
    );
  }

  await Promise.all(tasks);

  // US-only filter (default on; set JOBS_US_ONLY=false to include global roles).
  let jobs = all;
  if (process.env.JOBS_US_ONLY !== "false") {
    const before = jobs.length;
    jobs = jobs.filter((j) => isUSJob(j.location, j.description, j.workType));
    perSource["_filtered_non_us"] = before - jobs.length;
  }

  // De-dupe by id (stable across sources/refreshes).
  const byId = new Map<string, Job>();
  for (const j of jobs) if (!byId.has(j.id)) byId.set(j.id, j);

  return { jobs: Array.from(byId.values()), perSource };
}

function logErr(label: string, e: unknown) {
  console.error(`[ingest] ${label} failed:`, e instanceof Error ? e.message : e);
}

/** Persist normalized jobs into the cache, replacing the previous set. */
export async function saveJobs(jobs: Job[]): Promise<void> {
  // Simple strategy for MVP: clear and re-insert.
  await prisma.$transaction([
    prisma.cachedJob.deleteMany({}),
    prisma.cachedJob.createMany({
      data: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        workType: j.workType,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryCurrency: j.salaryCurrency,
        salaryEstimated: j.salaryEstimated,
        description: j.description,
        applyUrl: j.applyUrl,
        source: j.source,
        sourceCompany: j.sourceCompany ?? null,
        postedAt: j.postedAt ? new Date(j.postedAt) : null,
        entryLevel: j.entryLevel,
      })),
    }),
  ]);
}

function rowToJob(r: {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryEstimated: boolean;
  description: string;
  applyUrl: string;
  source: string;
  sourceCompany: string | null;
  postedAt: Date | null;
  entryLevel: boolean;
}): Job {
  return {
    id: r.id,
    title: r.title,
    company: r.company,
    location: r.location,
    workType: r.workType as Job["workType"],
    salaryMin: r.salaryMin,
    salaryMax: r.salaryMax,
    salaryCurrency: r.salaryCurrency,
    salaryEstimated: r.salaryEstimated,
    description: r.description,
    applyUrl: r.applyUrl,
    source: r.source as Job["source"],
    sourceCompany: r.sourceCompany,
    postedAt: r.postedAt ? r.postedAt.toISOString() : null,
    entryLevel: r.entryLevel,
  };
}

// Single in-flight refresh shared across concurrent requests, so a burst of
// visitors never triggers duplicate ingests against the job boards.
let refreshInFlight: Promise<Job[]> | null = null;

async function doRefresh(): Promise<Job[]> {
  const { jobs, perSource } = await ingestFromSources();
  // Sources unreachable (offline / rate-limited): keep whatever is cached.
  if (!jobs.length) {
    const rows = await prisma.cachedJob.findMany();
    return rows.length ? rows.map(rowToJob) : [];
  }
  await saveJobs(jobs);
  await prisma.refreshLog
    .create({
      data: {
        source: "all",
        ok: true,
        count: jobs.length,
        message: JSON.stringify(perSource),
      },
    })
    .catch(() => undefined);
  return jobs;
}

/** De-duped refresh: concurrent callers await the same ingest. */
function refreshOnce(): Promise<Job[]> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Return cached jobs with stale-while-revalidate semantics so the hub loads
 * instantly:
 *   - fresh cache  → serve it;
 *   - stale cache  → serve it now, refresh in the background;
 *   - no cache     → block on the first ingest;
 *   - force        → block and return a fresh ingest.
 */
export async function getJobs(force = false): Promise<Job[]> {
  if (force) return refreshOnce();

  const rows = await prisma.cachedJob.findMany();
  const cached = rows.map(rowToJob);
  const newest = rows.reduce(
    (max, r) => Math.max(max, r.fetchedAt.getTime()),
    0
  );
  const fresh = newest > 0 && Date.now() - newest < CACHE_TTL_MS;

  if (cached.length && fresh) return cached;

  if (cached.length) {
    // Serve stale immediately; warm the cache behind the response. (Railway is
    // a long-running server, so this background promise runs to completion.)
    void refreshOnce().catch(() => undefined);
    return cached;
  }

  // Cold cache: the first request must wait for the ingest.
  return refreshOnce();
}
