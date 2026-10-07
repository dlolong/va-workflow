/** Static guardrails only: these are NOT a substitute for executing RLS tests. */
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const core = read("supabase/migrations/202610060001_core.sql");
const workflow = read("supabase/migrations/202610060002_workflows.sql");
const jobs = read("supabase/migrations/202610060003_jobs_reports.sql");
test("all business writes are explicitly revoked", () =>
  assert.match(core, /revoke all on public\.%I from anon, authenticated/));
test("RLS enabled through the migration table loop", () =>
  assert.match(core, /alter table public\.%I enable row level security/));
test("recurring occurrences have a unique database constraint", () =>
  assert.match(core, /unique\(schedule_id,occurrence_at\)/));
test("versioned runs refer to immutable process versions", () =>
  assert.match(core, /references public\.process_versions\(process_id,version\)/));
test("uploaded evidence bucket is not public", () =>
  assert.match(core, /values\('evidence','evidence',false,10485760/));
test("storage does not grant overwrite or delete", () => {
  assert.doesNotMatch(core, /on storage\.objects for update/i);
  assert.doesNotMatch(core, /on storage\.objects for delete/i);
});
test("commands use request IDs and receipts", () => {
  assert.match(workflow, /private\.command_receipts/);
  assert.match(workflow, /pg_advisory_xact_lock/);
});
test("stale response saves are rejected", () =>
  assert.match(workflow, /expected_version.*is distinct from r\.version/));
test("completion is checked by the database", () =>
  assert.match(workflow, /perform private\.check_complete\(r\)/));
test("storage existence is required before confirmation", () =>
  assert.match(workflow, /from storage\.objects where bucket_id='evidence'/));
test("worker functions are not callable by authenticated users", () =>
  assert.match(
    jobs,
    /revoke all on function public\.run_automation\(\).*from public,anon,authenticated/,
  ));
test("tokens are hashed rather than stored in invitation rows", () =>
  assert.match(workflow, /extensions\.digest\(token,'sha256'\)/));
test("worker-only client remains isolated", () => {
  const root = fileURLToPath(new URL("../../src/", import.meta.url));
  const walk = (p) =>
    fs
      .readdirSync(p, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)]));
  const paths = walk(root).filter(
    (p) => /\.tsx?$/.test(p) && fs.readFileSync(p, "utf8").includes('from "@/lib/supabase/admin"'),
  );
  assert.equal(paths.length, 1);
  assert.ok(paths[0].endsWith("api/cron/route.ts"));
});
