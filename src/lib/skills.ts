// Shared skill vocabulary + matching, used by the heuristic resume parser and
// the role-detail requirements checklist.

export const SKILL_DICTIONARY = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang",
  "rust", "ruby", "php", "swift", "kotlin", "scala", "sql", "html", "css",
  "react", "next.js", "vue", "angular", "svelte", "node.js", "express",
  "django", "flask", "fastapi", "spring", "rails", ".net",
  "postgres", "postgresql", "mysql", "mongodb", "redis", "graphql",
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "git",
  "figma", "sketch", "tableau", "power bi", "looker", "excel", "pandas",
  "numpy", "pytorch", "tensorflow", "scikit-learn", "r", "matlab",
  "jira", "agile", "scrum", "product management", "roadmap", "ux", "ui",
  "user research", "wireframing", "prototyping", "data analysis",
  "machine learning", "a/b testing", "seo", "marketing",
  "security", "grc", "compliance", "penetration testing", "siem",
  "soc", "incident response", "risk assessment", "iso 27001", "soc 2",
  "security+", "cissp", "splunk", "communication", "stakeholder management",
];

/** Whole-token match so "java" doesn't fire on "javascript", etc. */
export function skillPresent(haystackLower: string, skill: string): boolean {
  const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#.])${esc}([^a-z0-9+#.]|$)`, "i").test(
    haystackLower
  );
}

/** Skills from the dictionary that appear in the given text. */
export function extractSkills(text: string, limit = 40): string[] {
  const lower = text.toLowerCase();
  const found = SKILL_DICTIONARY.filter((s) => skillPresent(lower, s));
  return found.slice(0, limit);
}

/** Pretty-print a dictionary skill for display (keeps known casings). */
export function prettySkill(s: string): string {
  const special: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    "next.js": "Next.js",
    "node.js": "Node.js",
    ".net": ".NET",
    postgresql: "PostgreSQL",
    postgres: "Postgres",
    graphql: "GraphQL",
    aws: "AWS",
    gcp: "GCP",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
    ux: "UX",
    ui: "UI",
    grc: "GRC",
    siem: "SIEM",
    soc: "SOC",
    "soc 2": "SOC 2",
    "iso 27001": "ISO 27001",
    "security+": "Security+",
    cissp: "CISSP",
    "power bi": "Power BI",
    "a/b testing": "A/B testing",
    seo: "SEO",
    r: "R",
  };
  if (special[s]) return special[s];
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
