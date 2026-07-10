import { claudeText, extractJson, hasClaude } from "./anthropic";
import type { Job, RankedJob, ResumeProfile } from "./types";

const STOP = new Set([
  "the", "and", "for", "with", "you", "our", "are", "will", "have", "this",
  "that", "your", "from", "who", "all", "can", "not", "but", "job", "role",
  "work", "team", "team's", "company", "years", "year", "experience", "we",
  "a", "an", "to", "of", "in", "on", "at", "is", "as", "or", "be", "by",
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9+#.]+/g) || []).filter(
    (t) => t.length > 1 && !STOP.has(t)
  );
}

/** Build the weighted term set representing what the candidate is looking for. */
function profileTerms(p: ResumeProfile): Map<string, number> {
  const terms = new Map<string, number>();
  const add = (s: string, w: number) => {
    for (const t of tokenize(s)) terms.set(t, (terms.get(t) || 0) + w);
  };
  p.topSkills.forEach((s) => add(s, 3));
  p.targetRoles.forEach((r) => add(r, 4));
  add(p.summary, 1);
  return terms;
}

/**
 * Score a job 0-100 against the profile using weighted keyword overlap.
 * Title matches count more than body matches. Entry-level titles get a bump.
 */
function scoreJob(
  job: Job,
  terms: Map<string, number>,
  skills: string[]
): { score: number; matched: string[] } {
  const titleTokens = new Set(tokenize(job.title));
  const bodyTokens = new Set(tokenize(job.description));

  let raw = 0;
  let possible = 0;
  for (const [term, weight] of terms) {
    possible += weight;
    if (titleTokens.has(term)) raw += weight * 1.6;
    else if (bodyTokens.has(term)) raw += weight * 1.0;
  }

  // Which of the candidate's named skills appear in the posting.
  const matched: string[] = [];
  for (const s of skills) {
    const st = tokenize(s);
    if (st.length && st.every((t) => titleTokens.has(t) || bodyTokens.has(t))) {
      matched.push(s);
    }
  }

  // Normalize to 0-1 against a soft ceiling (you rarely match everything).
  let norm = possible > 0 ? raw / (possible * 1.1) : 0;
  norm = Math.min(1, norm);

  // Small boosts for clear entry-level titles and matched-skill count.
  const titleStr = job.title.toLowerCase();
  const entryBump = /(junior|jr\.?|entry|associate|new grad|graduate|intern)/.test(
    titleStr
  )
    ? 0.08
    : 0;
  const skillBump = Math.min(0.12, matched.length * 0.03);

  const score = Math.round(Math.min(100, (norm * 0.8 + entryBump + skillBump) * 100));
  return { score, matched };
}

/**
 * Rank all jobs against the profile. Bulk scoring is keyword-based (cheap);
 * one LLM call generates fit reasons for the top `reasonCount` only.
 */
export async function rankJobs(
  jobs: Job[],
  profile: ResumeProfile,
  opts: { limit?: number; reasonCount?: number } = {}
): Promise<RankedJob[]> {
  const limit = opts.limit ?? 60;
  const reasonCount = opts.reasonCount ?? 15;
  const terms = profileTerms(profile);

  const scored: RankedJob[] = jobs.map((job) => {
    const { score, matched } = scoreJob(job, terms, profile.topSkills);
    return {
      ...job,
      fitScore: score,
      matchedSkills: matched,
      fitReason: templateReason(matched, job),
    };
  });

  scored.sort((a, b) => b.fitScore - a.fitScore);
  const top = scored.slice(0, limit);

  // Upgrade the top few reasons with a single grounded LLM call.
  if (hasClaude() && top.length) {
    try {
      const shortlist = top.slice(0, reasonCount);
      const reasons = await generateReasons(shortlist, profile);
      shortlist.forEach((j, i) => {
        if (reasons[i]) j.fitReason = reasons[i];
      });
    } catch (e) {
      console.error("fit-reason generation failed, using templates:", e);
    }
  }

  return top;
}

function templateReason(matched: string[], job: Job): string {
  if (matched.length >= 2) {
    return `Matches your ${matched.slice(0, 3).join(", ")} experience for this ${job.workType.toLowerCase()} role.`;
  }
  if (matched.length === 1) {
    return `Your ${matched[0]} background lines up with this entry-level role.`;
  }
  return `Entry-level ${job.workType.toLowerCase()} role that fits an early-career profile.`;
}

async function generateReasons(
  jobs: RankedJob[],
  profile: ResumeProfile
): Promise<string[]> {
  const list = jobs
    .map(
      (j, i) =>
        `[${i}] ${j.title} @ ${j.company} — matched skills: ${
          j.matchedSkills.join(", ") || "none"
        }. Snippet: ${j.description.slice(0, 320).replace(/\s+/g, " ")}`
    )
    .join("\n");

  const prompt = `Candidate profile:
- Target roles: ${profile.targetRoles.join(", ")}
- Top skills: ${profile.topSkills.join(", ")}
- Experience: ${profile.yearsOfExperience} years
- Summary: ${profile.summary}

For each job below, write ONE specific sentence (max 18 words) on why this candidate fits, grounded in their skills and the job. No fluff, no "you would be great". Return JSON: an array of {"i": number, "reason": string}.

JOBS:
${list}`;

  const raw = await claudeText({
    system:
      "You write concise, specific job-fit reasons for an early-career candidate. Return only JSON.",
    prompt,
    maxTokens: 900,
    temperature: 0.5,
  });
  const arr = extractJson<{ i: number; reason: string }[]>(raw);
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item.i === "number" && item.reason) {
      out[item.i] = String(item.reason).trim();
    }
  }
  return out;
}
