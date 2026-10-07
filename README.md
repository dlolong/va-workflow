# VA Relay — V1 Next.js / Supabase starter

A client-workspace app for delegated operations: SOP → checklist run → evidence → decision → review → handover.

**Start with [START_HERE.md](START_HERE.md).** The product name is a working name; change `src/lib/config.ts` to rename it.

This is source code with implemented application flows, not a hosted service or a production certification. The generation environment could run dependency-free tests and source syntax checks, but could not download npm dependencies, start PostgreSQL, or run a Next.js browser session. Read [the delivery QA report](docs/DELIVERY_QA.md) before using real client data.

## Included

| Area | Implementation |
|---|---|
| Accounts | Supabase signup, login, confirmation callbacks, password reset, sign-out, profile timezone and email preferences |
| Clients and teams | Explicitly scoped workspaces; owner, manager, client and VA roles; expiring email-bound invite links; reassignment/offboarding |
| SOPs | Eight step input types, instructions, authority boundaries, links, paste-a-list, templates, duplication, VA-authored drafts, manager publication, immutable versions |
| Execution | One-off requests and published-process runs, source/reference, required responses, permitted N/A with reasons, explicit save/resume, optimistic locking |
| Recurrence | Daily, weekdays, weekly and monthly; named timezones, ahead-of-deadline generation, pause/resume, unique occurrences |
| Evidence | Private 10 MB uploads, before/after labels, pending vs attached state, retryable uploads, short-lived downloads |
| Decisions | Pre-action permission gates; separate final review; request changes and resubmit; no self-review |
| Exceptions | Blocking/nonblocking issues, recommended next action, responsible person, follow-up dates, waiting status separate from deadline status |
| Operations | My Day, deadline register, attention queue, comments, in-app notifications, activity history, basic handovers/sign-off |
| Reporting | Whole-workspace weekly counts, copyable summary, paginated work list, CSV and JSON exports |
| Automation | Authenticated cron endpoint, catch-up scheduling, deadline/follow-up reminders, optional Resend notification email with retries |
| QA | Dependency-free rules/static tests, real local PostgreSQL test harness, Playwright smoke flows, configuration checker, developer-only Codex QA instructions |

## Stack

Next.js App Router / React / TypeScript, Tailwind CSS with a compact custom UI, Supabase Auth/Postgres/Storage, Zod and Luxon. Node.js 22.16 or newer is required. Version choices are recorded in `package.json`; no lockfile is fabricated. Run `npm install` in a connected environment and commit the resulting lockfile after validation.

Normal browser/server operations use the authenticated user's session. A service-role key is **not** required for manual core workflows and is used only by the optional automation worker.

## Quick commands

```bash
cp .env.example .env.local
# Fill in your Supabase project URL, public key and app URL.
npm install
npm run check:env
npm run dev
```

Apply the four SQL migrations to a **new dedicated Supabase project** before opening a workspace. See the setup guide for the exact order, authentication settings, optional cron/email, and the first end-to-end workflow.

```bash
npm test                 # Pure rules + source guardrails, no external services
npm run check:syntax     # TS/TSX syntax only; not a typecheck
npm run typecheck
npm run lint
npm run build
npm run test:db          # Disposable LOCAL Supabase only
npm run test:e2e         # Browser tests; authenticated case needs test credentials
```

## Project map

```text
src/app/(app)/                       Authenticated workspace pages
src/app/api/command/                 Validated session-scoped command API
src/app/api/cron/                    Optional service-role worker
src/app/api/evidence/                Authorized private downloads
src/app/api/export/                  Workspace CSV/JSON export
src/components/                     Compact UI, forms and checklist runner
src/lib/                            Domain rules, types, clients, validation
src/proxy.ts                        Supabase SSR cookie refresh
supabase/migrations/                Schema, RLS, transactional commands, jobs, views
scripts/                            Configuration, syntax and database checks
tests/                              Unit/static and browser test suites
docs/                               Architecture, scope, security, operations and QA
AGENTS.md                           Developer-only working rules
CODEX_CLEANUP_QA_PROMPT.md            The requested cleanup-and-QA prompt
```

## Deliberately small V1

Invitations are shareable links, not automatically emailed invitations. Weekly reports are generated on demand, not scheduled weekly narrative emails. There is no payroll, attendance/surveillance, paid subscription billing, password vault, standalone chat, external marketplace automation, AI authoring, or comprehensive agency-management layer. Each client workspace is isolated; a user can belong to several workspaces.

Files are private but are not malware-scanned. Exports contain records and file references, not a full database/storage backup. Core work persists only after a successful save; offline editing and background autosave are not implemented. A cron job must be configured for unattended schedules/reminders. See [the scope matrix](docs/V1_SCOPE.md) for operational limits.

**Before a pilot:** have Codex execute `CODEX_CLEANUP_QA_PROMPT.md`, run the live database/storage/browser checks in staging, and complete the backup/restore checklist. Do not replace those checks with mock passing results.
