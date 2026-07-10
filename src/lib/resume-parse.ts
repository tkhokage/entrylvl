import { claudeText, extractJson, hasClaude } from "./anthropic";
import type { ResumeProfile } from "./types";

const SYSTEM = `You are a precise resume parser. You convert raw resume text into a clean structured JSON profile for an early-career (0-2 years experience) job seeker. Return ONLY JSON, no prose.`;

function buildPrompt(text: string): string {
  return `Parse the resume below into this exact JSON shape:

{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,               // city, region/country if present, else ""
  "links": { "linkedin"?: string, "github"?: string, "portfolio"?: string, "other"?: string[] },
  "education": [ { "school": string, "degree"?: string, "field"?: string, "gradYear"?: string } ],
  "yearsOfExperience": number,      // best estimate of professional years, 0 for new grads
  "topSkills": string[],            // 8-15 concrete skills/technologies, most relevant first
  "targetRoles": string[],          // 3-5 realistic ENTRY-LEVEL role titles this person should apply to
  "summary": string                 // 1-2 sentences describing the candidate, used for job matching
}

Rules:
- Infer targetRoles from their skills and background; keep them entry level (e.g. "Junior Frontend Engineer", "Associate Product Manager", "Data Analyst"). Do not invent senior roles.
- If a field is missing, use "" for strings, [] for arrays, 0 for yearsOfExperience.
- topSkills should be specific (languages, frameworks, tools, methods), not soft skills.
- Return raw JSON only.

RESUME TEXT:
"""
${text.slice(0, 12000)}
"""`;
}

/** Parse resume text into a structured profile. Uses Claude when available. */
export async function parseResume(text: string): Promise<ResumeProfile> {
  if (hasClaude()) {
    try {
      const raw = await claudeText({
        system: SYSTEM,
        prompt: buildPrompt(text),
        maxTokens: 1400,
        temperature: 0.2,
      });
      const parsed = extractJson<Partial<ResumeProfile>>(raw);
      return normalize(parsed, "claude");
    } catch (err) {
      console.error("Claude resume parse failed, falling back:", err);
    }
  }
  return normalize(heuristicParse(text), "heuristic");
}

function normalize(
  p: Partial<ResumeProfile>,
  parsedWith: "claude" | "heuristic"
): ResumeProfile {
  const links = p.links || {};
  return {
    name: (p.name || "").trim(),
    email: (p.email || "").trim(),
    phone: (p.phone || "").trim(),
    location: (p.location || "").trim(),
    links: {
      linkedin: links.linkedin || undefined,
      github: links.github || undefined,
      portfolio: links.portfolio || undefined,
      other: Array.isArray(links.other) ? links.other : undefined,
    },
    education: Array.isArray(p.education) ? p.education.slice(0, 5) : [],
    yearsOfExperience:
      typeof p.yearsOfExperience === "number" && p.yearsOfExperience >= 0
        ? Math.min(p.yearsOfExperience, 6)
        : 0,
    topSkills: dedupe((p.topSkills || []).map((s) => String(s).trim())).slice(0, 15),
    targetRoles: dedupe((p.targetRoles || []).map((s) => String(s).trim())).slice(0, 5),
    summary: (p.summary || "").trim(),
    parsedWith,
  };
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

// --- Heuristic fallback (no API key) -----------------------------------------

const SKILL_DICTIONARY = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang",
  "rust", "ruby", "php", "swift", "kotlin", "scala", "sql", "html", "css",
  "react", "next.js", "vue", "angular", "svelte", "node.js", "express",
  "django", "flask", "fastapi", "spring", "rails", ".net",
  "postgres", "postgresql", "mysql", "mongodb", "redis", "graphql",
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "git",
  "figma", "tableau", "power bi", "excel", "pandas", "numpy", "pytorch",
  "tensorflow", "scikit-learn", "r", "matlab", "jira", "agile", "scrum",
  "product management", "ux", "ui", "data analysis", "machine learning",
  "security", "grc", "compliance", "penetration testing", "siem",
];

const ROLE_KEYWORDS: { match: string[]; roles: string[] }[] = [
  { match: ["react", "javascript", "typescript", "css", "frontend", "html"], roles: ["Junior Frontend Engineer", "Junior Software Engineer"] },
  { match: ["node", "python", "java", "go", "backend", "api"], roles: ["Junior Backend Engineer", "Associate Software Engineer"] },
  { match: ["data", "sql", "pandas", "tableau", "analytics"], roles: ["Data Analyst", "Junior Data Analyst"] },
  { match: ["machine learning", "pytorch", "tensorflow", "ml"], roles: ["Junior Machine Learning Engineer", "ML Analyst"] },
  { match: ["figma", "ux", "ui", "design"], roles: ["Junior Product Designer", "UX Designer"] },
  { match: ["product management", "roadmap", "stakeholder"], roles: ["Associate Product Manager"] },
  { match: ["security", "grc", "compliance", "siem", "penetration"], roles: ["Security Analyst", "Junior GRC Analyst", "SOC Analyst"] },
];

/** Whole-token skill match so "java" doesn't fire on "javascript", etc. */
function skillPresent(haystackLower: string, skill: string): boolean {
  const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#.])${esc}([^a-z0-9+#.]|$)`, "i").test(
    haystackLower
  );
}

function heuristicParse(text: string): Partial<ResumeProfile> {
  const lower = text.toLowerCase();
  const email = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] || "";
  const phone =
    text.match(/(\(?\+?\d[\d\s().-]{8,}\d)/)?.[0]?.trim() || "";
  const linkedin = text.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s)]+/i)?.[0];
  const github = text.match(/https?:\/\/(www\.)?github\.com\/[^\s)]+/i)?.[0];
  const portfolio = text
    .match(/https?:\/\/[^\s)]+/gi)
    ?.find((u) => !/linkedin|github/i.test(u));

  // Name: first non-empty line that isn't an email/link/all-caps header.
  const firstLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const name =
    firstLines.find(
      (l) =>
        l.length > 2 &&
        l.length < 48 &&
        !l.includes("@") &&
        !/https?:/i.test(l) &&
        /^[A-Za-z][A-Za-z.'\- ]+$/.test(l) &&
        l.split(/\s+/).length <= 4
    ) || "";

  const skills = SKILL_DICTIONARY.filter((s) => skillPresent(lower, s));

  const roleSet = new Set<string>();
  for (const group of ROLE_KEYWORDS) {
    if (group.match.some((m) => lower.includes(m))) {
      group.roles.forEach((r) => roleSet.add(r));
    }
  }
  if (roleSet.size === 0) {
    roleSet.add("Associate / Entry-Level Analyst");
    roleSet.add("Junior Operations Associate");
  }

  // Years of experience: crude scan for "X years".
  const yearsMatch = lower.match(/(\d+)\+?\s*years?/);
  const years = yearsMatch ? Math.min(parseInt(yearsMatch[1], 10), 4) : 0;

  return {
    name,
    email,
    phone,
    location: "",
    links: { linkedin, github, portfolio },
    education: [],
    yearsOfExperience: years,
    topSkills: skills,
    targetRoles: Array.from(roleSet).slice(0, 5),
    summary: skills.length
      ? `Early-career candidate with skills in ${skills.slice(0, 5).join(", ")}.`
      : "Early-career candidate.",
  };
}
