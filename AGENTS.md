# VA Relay — Developer-only workflow

Use one Developer agent. Do not spawn a Project Manager, QA subagents, or unrelated parallel workstreams. The Developer owns discovery, scoped implementation fixes, review, tests and the final report.

Read `README.md`, `START_HERE.md`, `docs/V1_SCOPE.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DELIVERY_QA.md` and `CODEX_CLEANUP_QA_PROMPT.md` before changing code. Inspect `git status` and preserve existing user changes. Read the installed Next.js documentation in `node_modules/next/dist/docs` when available; otherwise use official documentation for the installed version.

## Scope

This is an existing V1 starter to clean and validate, not permission to redesign/rebuild it. Keep Next.js App Router, TypeScript, Supabase SSR/Postgres/RLS and the compact UI. Preserve working product flows and stable critical DOM IDs. Refactor oversized generated components when warranted, without removing capabilities or changing authorization semantics.

Do not introduce payroll, attendance, subscription billing, a CRM, external marketplaces, a chat service, AI authoring/agents, a different database, or a new architecture. No SQLite/JSON/mock-data production substitute. Do not add feature scaffolding that merely looks functional.

## Non-negotiable safety

- Do not disable RLS, weaken workspace isolation, expose service-role keys, grant broad direct table writes, or use an admin client for ordinary user operations.
- Test against a disposable local/staging project only. Never reset, seed or delete production data. Ask for genuinely missing credentials only after running all unblocked checks, and report the blocked tests clearly.
- No real client data, passwords, tokens or uploaded source documents in fixtures, screenshots, logs, commits or reports.
- Do not force-install incompatible dependencies, fabricate a lockfile, silence TypeScript/ESLint wholesale, skip a failing test to make CI green, or mock away the code path under test.
- Do not equate a SQL storage-metadata fixture with a real Storage API test, or a syntax parse with a successful build/typecheck.
- Once a migration is applied outside a disposable environment, fix schema changes with a forward migration.

## Working loop

Inspect → reproduce → minimal fix → add/update regression test → run relevant checks → review diff → update documentation. Group cleanup logically. Keep API and database validation aligned. Be explicit about observed saves, pending uploads, deadlines and external proof limitations.

Run dependency install/config checks, unit/static tests, syntax, typecheck, lint, build, local database integration and real-browser checks as the environment permits. Record actual exit codes and skipped/blocked cases. Do not call the product production-ready solely because it builds. Produce `docs/QA_REPORT.md` with verified behavior, remaining issues and configuration still required.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
