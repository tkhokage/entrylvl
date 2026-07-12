import { claudeText, extractJson, hasClaude } from "./anthropic";
import type { ApplicationKit, Job, ResumeProfile } from "./types";
import { extractSkills, prettySkill, skillPresent } from "./skills";

/**
 * Requirements checklist for the role-detail sheet: the concrete skills the
 * posting mentions, each marked met (the resume covers it) or a gap. Grounded
 * in the real posting + resume, no LLM needed.
 */
function buildRequirements(
  job: Job,
  profile: ResumeProfile
): { label: string; met: boolean }[] {
  const profileHay = [
    profile.topSkills.join(" "),
    profile.summary,
    profile.targetRoles.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const jobSkills = extractSkills(job.description, 10);
  const reqs = jobSkills.map((s) => ({
    label: prettySkill(s),
    met: skillPresent(profileHay, s),
  }));

  // Always include an experience-level line, grounded in the profile.
  reqs.unshift({
    label: "Entry-level (0–2 years) experience",
    met: profile.yearsOfExperience <= 2,
  });

  // De-dupe by label and cap the list.
  const seen = new Set<string>();
  return reqs
    .filter((r) => {
      const k = r.label.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 8);
}

const SCREENING_QUESTIONS = [
  "Why are you interested in this role?",
  "What relevant experience do you bring?",
  "What are your salary expectations?",
  "Are you authorized to work in this location?",
];

/** Build the copy-ready fields shown in the kit (always available). */
function buildFields(p: ResumeProfile): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [
    { label: "Full name", value: p.name || "" },
    { label: "Email", value: p.email || "" },
    { label: "Phone", value: p.phone || "" },
    { label: "Location", value: p.location || "" },
  ];
  if (p.links.linkedin) fields.push({ label: "LinkedIn", value: p.links.linkedin });
  if (p.links.github) fields.push({ label: "GitHub", value: p.links.github });
  if (p.links.portfolio)
    fields.push({ label: "Portfolio", value: p.links.portfolio });
  const edu = p.education[0];
  if (edu)
    fields.push({
      label: "Education",
      value: [edu.degree, edu.field, edu.school, edu.gradYear]
        .filter(Boolean)
        .join(", "),
    });
  fields.push({ label: "Top skills", value: p.topSkills.slice(0, 10).join(", ") });
  fields.push({
    label: "Years of experience",
    value: String(p.yearsOfExperience),
  });
  return fields;
}

export async function buildApplicationKit(
  job: Job,
  profile: ResumeProfile
): Promise<ApplicationKit> {
  const fields = buildFields(profile);
  const applyUrl = job.applyUrl;
  const requirements = buildRequirements(job, profile);

  if (hasClaude()) {
    try {
      const { coverNote, screeningAnswers } = await generateWithClaude(
        job,
        profile
      );
      return {
        fields,
        coverNote,
        screeningAnswers,
        requirements,
        applyUrl,
        generatedWith: "claude",
      };
    } catch (e) {
      console.error("Claude kit generation failed, using templates:", e);
    }
  }

  return {
    fields,
    coverNote: templateCoverNote(job, profile),
    screeningAnswers: templateScreening(job, profile),
    requirements,
    applyUrl,
    generatedWith: "heuristic",
  };
}

async function generateWithClaude(
  job: Job,
  profile: ResumeProfile
): Promise<Pick<ApplicationKit, "coverNote" | "screeningAnswers">> {
  const prompt = `You are helping an early-career candidate apply to a job. Ground everything ONLY in the candidate's real details — do not invent experience.

CANDIDATE:
- Name: ${profile.name}
- Experience: ${profile.yearsOfExperience} years
- Skills: ${profile.topSkills.join(", ")}
- Education: ${profile.education
    .map((e) => [e.degree, e.field, e.school].filter(Boolean).join(" "))
    .join("; ")}
- Summary: ${profile.summary}

JOB:
- Title: ${job.title}
- Company: ${job.company}
- Location/type: ${job.location} (${job.workType})
- Description snippet: ${job.description.slice(0, 900).replace(/\s+/g, " ")}

Produce JSON exactly:
{
  "coverNote": string,        // 90-130 words, warm but concise, first person, tailored to ${job.company} and the role
  "screeningAnswers": [       // answer each, 1-3 sentences, grounded in the resume
    { "question": "Why are you interested in this role?", "answer": string },
    { "question": "What relevant experience do you bring?", "answer": string },
    { "question": "What are your salary expectations?", "answer": string },
    { "question": "Are you authorized to work in this location?", "answer": string }
  ]
}
For salary expectations, give an honest, flexible answer that defers to market rate for an entry-level role rather than naming a hard number. For work authorization, say the candidate should confirm this themselves. Return only JSON.`;

  const raw = await claudeText({
    system:
      "You draft honest, specific job application materials for early-career candidates. Never fabricate experience. Return only JSON.",
    prompt,
    maxTokens: 900,
    temperature: 0.6,
  });
  const parsed = extractJson<{
    coverNote: string;
    screeningAnswers: { question: string; answer: string }[];
  }>(raw);
  return {
    coverNote: String(parsed.coverNote || "").trim(),
    screeningAnswers: Array.isArray(parsed.screeningAnswers)
      ? parsed.screeningAnswers
      : templateScreening(job, profile),
  };
}

function templateCoverNote(job: Job, p: ResumeProfile): string {
  const skills = p.topSkills.slice(0, 3).join(", ") || "relevant technical skills";
  return `Dear ${job.company} team,

I'm excited to apply for the ${job.title} role. As an early-career candidate with ${p.yearsOfExperience} year(s) of experience and a foundation in ${skills}, I'm eager to contribute and keep learning in a fast-moving startup environment. I've built and shipped work using these skills and I'm drawn to ${job.company}'s mission and the chance to grow alongside a small, high-impact team. I'd welcome the opportunity to bring my energy and curiosity to this ${job.workType.toLowerCase()} position and would love to discuss how I can help.

Thank you for your consideration,
${p.name || "[Your name]"}`;
}

function templateScreening(
  job: Job,
  p: ResumeProfile
): { question: string; answer: string }[] {
  const skills = p.topSkills.slice(0, 3).join(", ") || "my background";
  return [
    {
      question: SCREENING_QUESTIONS[0],
      answer: `I'm drawn to ${job.company} and the ${job.title} role because it's a strong fit for an early-career person who wants real ownership. I want to grow my skills in ${skills} while contributing from day one.`,
    },
    {
      question: SCREENING_QUESTIONS[1],
      answer: `I bring hands-on experience with ${skills}, plus ${p.yearsOfExperience} year(s) of practical work. I learn quickly and enjoy taking on unfamiliar problems.`,
    },
    {
      question: SCREENING_QUESTIONS[2],
      answer: `I'm flexible and looking for a fair, market-rate offer for an entry-level ${job.title}. I'm happy to align with your range for this role.`,
    },
    {
      question: SCREENING_QUESTIONS[3],
      answer: `Please confirm the specific requirements with me directly — I'll make sure my work authorization matches what this ${job.location} role needs.`,
    },
  ];
}
