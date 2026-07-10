// Standalone job-cache refresh, for a cron/scheduler outside the web server.
//   npm run jobs:refresh
// Loads env from .env (via Next's loader is not available here, so read process.env).
import { getJobs } from "../src/lib/jobs/ingest";

async function main() {
  const start = Date.now();
  const jobs = await getJobs(true);
  console.log(
    `Refreshed job cache: ${jobs.length} entry-level jobs in ${(
      (Date.now() - start) /
      1000
    ).toFixed(1)}s`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("Refresh failed:", e);
  process.exit(1);
});
