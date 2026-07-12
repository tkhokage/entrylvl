// Production start entrypoint, used by `npm start` (Railway/Railpack runs this).
//
// It makes the app boot cleanly on a fresh host:
//   1. Defaults DATABASE_URL to a local SQLite file if the platform didn't set
//      one, so the app never crashes on a missing env var.
//   2. Creates/updates the DB schema (`prisma db push`) so the CachedJob table
//      exists — otherwise the jobs hub and /api/refresh would 500 on first use.
//   3. Hands off to `next start`, which binds to $PORT (Railway sets this) on
//      0.0.0.0 automatically.
//
// npm puts node_modules/.bin on PATH for scripts, so `prisma` and `next`
// resolve without npx.
import { execSync, spawn } from "node:child_process";
import path from "node:path";

// Ensure local CLIs (prisma, next) resolve even when this script is invoked
// directly (not just via an npm script, which is the only thing that normally
// puts node_modules/.bin on PATH).
const binDir = path.resolve(process.cwd(), "node_modules", ".bin");
process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH || ""}`;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
  console.log("[start] DATABASE_URL not set; defaulting to file:./dev.db (SQLite)");
}

// Only meaningful for SQLite (the MVP default). For a managed Postgres you'd
// use real migrations, but `db push` is still idempotent and safe here.
try {
  execSync("prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
  });
} catch (err) {
  console.error(
    "[start] prisma db push failed; continuing so the site still boots:",
    err instanceof Error ? err.message : err
  );
}

const child = spawn("next", ["start"], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error("[start] failed to launch next:", err);
  process.exit(1);
});
