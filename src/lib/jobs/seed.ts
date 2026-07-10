// Seed list of startup / scale-up company board slugs.
//
// These are the board identifiers used in the public ATS APIs:
//   Greenhouse: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
//   Lever:      https://api.lever.co/v0/postings/{slug}?mode=json
//   Ashby:      https://api.ashbyhq.com/posting-api/job-board/{slug}
//
// Slugs change over time as companies migrate ATS or rebrand. Ingestion is
// resilient: any board that 404s or returns nothing is skipped and logged,
// so an out-of-date entry never breaks the app — it just contributes no jobs.
// Add/remove slugs here to tune coverage.

export const GREENHOUSE_SLUGS: string[] = [
  "stripe",
  "airbnb",
  "databricks",
  "gitlab",
  "figma",
  "brex",
  "ramp",
  "vercel",
  "retool",
  "airtable",
  "asana",
  "instacart",
  "robinhood",
  "affirm",
  "plaid",
  "benchling",
  "samsara",
  "sourcegraph",
  "gusto",
  "webflow",
];

export const LEVER_SLUGS: string[] = [
  "netflix",
  "spotify",
  "plaid",
  "brex",
  "loom",
  "attentive",
  "mixpanel",
  "faire",
  "shieldai",
  "hightouch",
  "census",
  "wealthsimple",
  "voltus",
  "podium",
];

export const ASHBY_SLUGS: string[] = [
  "openai",
  "ramp",
  "linear",
  "notion",
  "vanta",
  "runway",
  "clay",
  "mercury",
  "posthog",
  "replit",
  "cursor",
  "modal",
  "deel",
  "hex",
];
