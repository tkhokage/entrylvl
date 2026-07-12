// Shared domain types for Beacon.

export type WorkType = "In-office" | "Hybrid" | "Remote";

export type JobSource =
  | "themuse"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "remotive"
  | "arbeitnow"
  | "adzuna";

/** The one normalized shape every source is mapped into. */
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: WorkType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  /** True when we inferred/estimated salary rather than reading it from the posting. */
  salaryEstimated: boolean;
  description: string;
  applyUrl: string;
  source: JobSource;
  /** Board slug used to fetch (greenhouse/lever/ashby), if any. */
  sourceCompany?: string | null;
  postedAt: string | null; // ISO
  entryLevel: boolean;
}

/** Structured resume profile produced by the parser. */
export interface ResumeProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    other?: string[];
  };
  education: EducationEntry[];
  yearsOfExperience: number;
  topSkills: string[];
  /** 3-5 realistic entry-level target roles. */
  targetRoles: string[];
  /** Short free-text summary used for matching + cover notes. */
  summary: string;
  /** Whether the LLM parser ran, or we fell back to heuristics. */
  parsedWith: "claude" | "heuristic";
}

export interface EducationEntry {
  school: string;
  degree?: string;
  field?: string;
  gradYear?: string;
}

/** A job plus its match metadata, as shown in the hub. */
export interface RankedJob extends Job {
  fitScore: number; // 0-100
  fitReason: string; // one line
  matchedSkills: string[];
}

/** The application kit shown when a job is opened. */
export interface ApplicationKit {
  fields: { label: string; value: string }[];
  coverNote: string;
  screeningAnswers: { question: string; answer: string }[];
  /** Requirements checklist: what the resume already covers vs. gaps. */
  requirements: { label: string; met: boolean }[];
  applyUrl: string;
  generatedWith: "claude" | "heuristic";
}
