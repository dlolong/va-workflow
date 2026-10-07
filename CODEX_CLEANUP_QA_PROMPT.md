# Codex prompt — clean and QA the generated VA Relay V1

You are the single Developer responsible for cleaning, correcting and validating this **existing** Next.js / Supabase starter. Do not rebuild it, redesign its architecture, or add new product modules. Do not spawn PM/QA/multi-agent roles. Finish all work that can safely be completed with the available environment, including your own QA.

## 1. Discover before editing

Read `AGENTS.md`, `README.md`, `START_HERE.md`, `docs/V1_SCOPE.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md`, `docs/DELIVERY_QA.md`, the migrations, package scripts and existing tests. Inspect git status and preserve all user edits. Confirm installed Node, Next.js, React and Supabase package versions instead of assuming them. Use installed version-specific Next.js docs when available and official primary documentation for compatibility fixes.

The code was generated without access to npm installation, a live Postgres instance or an actual Next.js browser session. The delivery report distinguishes native/static checks from unverified integration behavior. Your priority is to close these verification gaps and fix real defects, not create a different starter.

If `.env.local` is missing, read `.env.example`; do not invent credentials. A local Supabase stack may be used when the environment supports it. Never reuse another product's production database or change its policies.

## 2. Install and establish a baseline

Use Node 22.16+. When a lockfile exists, use `npm ci`; otherwise run `npm install`, review the resolution, create the genuine lockfile and keep it in the final change set. Do not use `--force` or `--legacy-peer-deps` to hide conflicts. Verify the pinned package versions and adjust only a confirmed compatibility/security problem, documenting why.

Run and record:

```bash
npm run check:env
npm test
npm run check:syntax
npm run typecheck
npm run lint
npm run build
```

Missing optional email/worker configuration is not a core-app failure, but unattended automation/email must not be reported as tested. Keep required-env failures visible. Run an appropriate dependency vulnerability check when the registry is reachable and review findings; do not blindly run a breaking `audit fix --force`.

## 3. Clean generated code without changing its contract

Format source with the configured formatter. Remove genuine unused imports and duplication; improve names, error types and narrow type boundaries. Split oversized `workspace-section`, `work-forms` and `run-workspace` components into coherent components where this improves maintenance, preserving public behavior and important DOM IDs. Avoid blanket `any`, `ts-ignore` or linter disable comments as fixes.

Keep compact layouts, normal-weight navigation, prominent primary actions, modal add/edit flows and one primary page scroll. Check keyboard navigation, focus return, labelled fields, mobile navigation, table overflow, visible loading/error/empty states and disabled/readonly controls. Controls on archived workspaces should clearly indicate readonly state rather than inviting futile writes.

Inspect SSR cookie refresh, Next.js async params/cookies, proxy behavior, cache headers, module boundaries, route error paths and Supabase client usage. Ensure a malformed/interrupted HTTP response is not treated as a confirmed save.

## 4. Database and authorization QA (mandatory when local Supabase is available)

Use the existing local `supabase/config.toml` and migrations in a disposable local stack. Run `npm run test:db`. It refuses remote hosts and rolls fixtures back. Fix migration syntax, SQL ambiguities, grants, row constraints and function errors that a source scan could not detect.

Test owner, manager, client-reviewer, VA, removed user, unauthenticated user and unrelated-client user. Expand tests where existing coverage is insufficient:

- Cross-client reads and writes through **every** relevant table, view, command and file path; forged workspace/run/process/member IDs; profile visibility.
- Direct RPC calls that bypass Zod/UI. Malformed/missing workflow steps, wrong input types, invalid URLs, oversized values, invalid reviewer/assignee and role changes must fail safely.
- No direct authenticated business-table writes; no anonymous business reads; fixed security-definer search paths; no accidental execution grants on private or worker functions.
- VA SOP drafting is allowed; publishing remains manager/owner-only. Published snapshots are immutable for existing runs.
- Required answers including numeric `0`, boolean `false` for yes/no, whitespace-only text, permitted N/A with reason, and configured evidence.
- Before-action approval must precede the protected step. Submission and acceptance are distinct. Self-review fails. Changes requested → correction → resubmission works. Closed/cancelled runs cannot receive unauthorized writes or stale pending approvals.
- Waiting/blocked states preserve the business deadline and record who owns the next action. Issues have a resolution/owner/follow-up and can block submission.
- Idempotent request retries, different-payload request-ID reuse, optimistic stale versions and actual concurrent saves/scheduler invocations. The existing sequential recurrence test is not proof of concurrency safety.
- Workspace archive/restore, process archive/pause/resume, invalid required reviewer after publication, offboarding/reassignment and old invitation authority.
- Audit events reflect actions actually observed inside this app, never assert an externally verified action without evidence.

Do not make permissions pass by disabling RLS, introducing a service-role client in normal routes or granting broad table writes. Add regression tests for each meaningful bug.

## 5. Real Storage and browser QA

Install the Playwright browser and run `npm run test:e2e` against local/staging, not production. Without test credentials, the authenticated smoke test skips; list it as blocked, not passed. Use at least two distinct real authenticated sessions for approval flows, plus an unrelated client for isolation tests.

Cover login/signup/confirmation/password recovery, invitation creation/acceptance/revocation, create workspace, draft/publish SOP, quick task, recurring run, required typed inputs, saved reload, evidence, pre-action approval, correction/resubmission, issue/follow-up, comments, notifications, training sign-off, reassignment and exports. Run desktop and mobile widths and capture screenshots of the real running app when available.

Use actual Storage API uploads/downloads, not only `storage.objects` metadata fixtures. Check valid file upload, failed upload, retry after uncertain response, duplicate submit, before/after requirements, MIME/size rejection, forbidden overwrite, fabricated confirmation, unauthorized download and post-offboarding behavior. Signed URLs last up to 60 seconds; document that bounded revocation lag accurately. Do not upload real private documents.

Exercise unsaved answers and unfinished uploads with links, workspace/mobile dropdowns, close/reload, browser back/forward, sign-out, network loss and simultaneous tabs. Fix avoidable loss and misleading success states without silently adding sensitive offline storage or claiming offline support.

## 6. Schedules, notifications, reports and operations

Test daily/weekdays/weekly/monthly recurrence, month-end clamping, named timezones and DST boundaries, before-deadline generation, paused/resumed catch-up, duplicate calls, removed assignees and reviewers. Keep fixed-deadline recurrence independent of the previous run's completion. Do not quietly change existing deadlines when a workspace timezone changes.

The cron endpoint requires a strong bearer secret and the server-only worker key. Verify unauthorized requests fail. Check failed/expired email leases, retries, disabled preferences, archived/removed memberships and acknowledgement failures. Test a real email only when provider credentials/domain are configured; otherwise record the blocked delivery test and validate unblocked logic without claiming delivery.

Verify that stats cover the whole workspace, not only the current page; weekly boundaries use the client timezone; waiting work can still be overdue. CSV must resist formula injection. Exports must signal limits, exclude secret job/receipt tables, and accurately state that attachment bytes are not included. Do not describe an application export as a transaction-consistent backup.

Read the backup/restore runbook. A restore rehearsal is only complete when performed against an isolated environment. Do not report the written runbook as a tested backup system.

## 7. Scope boundaries

Keep the existing V1. Invitations are copyable links. Weekly summaries are on demand. Real-time chat, payroll, screen monitoring, subscription billing, AI/Loom authoring, external marketplace automation, advanced agency dashboards, offline sync and new verticals are out of scope. Missing necessary configuration or tests are not reasons to add unrelated frameworks.

When a discovered bug requires a narrowly scoped fix or small missing control to complete an existing workflow, implement it and test it. When a requested verification needs unavailable credentials or services, finish all other work and record the exact remaining setup and command. Never invent credentials or hide the block behind fake data.

## 8. Deliverables and stop condition

Finish with:

1. The cleaned source and minimal bug fixes, plus regression tests and a genuine dependency lockfile when installation succeeds.
2. Updated setup/configuration instructions only where actual behavior changed.
3. `docs/QA_REPORT.md`: versions used, commands/exit codes, tests passed/failed/skipped/blocked, screenshots paths where applicable, bugs fixed, known limitations and remaining manual configuration.
4. An explicit verdict: **not ready**, **ready for controlled pilot with listed limitations**, or another evidence-supported outcome. Do not claim production-ready merely because unit tests/build pass.

Review the final diff and ensure no secrets or user edits were lost. Continue fixing reproducible issues within this scope until the available checks pass or a genuine external blocker remains. Then summarize what was verified and exactly what still requires configuration. Do not ask whether to start another phase and do not replace this app with a new one.
