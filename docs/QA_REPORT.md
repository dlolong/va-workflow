# VA Relay cleanup QA — October 7, 2026

## Verdict

**Validated for a controlled pilot with synthetic data; not yet approved for a live-client production rollout.** The application has been exercised against a dedicated local Supabase stack using real PostgreSQL, Auth, Storage, and Chromium sessions. Deployment configuration, real email delivery, hosted scheduling, and a complete database-plus-file restore remain release requirements.

The existing Next.js App Router / TypeScript / Supabase architecture and compact UI were retained. No production database was reset, seeded, or used for integration testing. `.env.local` was not edited. No service-role client was added to ordinary application operations.

## Environment and reproducibility

- Node **22.23.3**, npm **10.9.9** for installation and final checks. The shell initially exposed Node 23.2.0; subsequent commands explicitly selected Node 22.
- Next.js / eslint-config-next **16.3.8**, React / React DOM **19.3.0**, Supabase SSR **0.8.0**, Supabase JS **2.117.2**.
- TypeScript **5.9.3**, ESLint **9.39.5**, Playwright **1.63.0**, Chromium headless shell **153.0.8010.12**, Luxon **3.7.2**, Zod **4.6.5**, Tailwind **4.3.3**, pg **8.23.1**, Prettier **3.9.9**.
- Supabase CLI **2.120.0**; dedicated project `va-relay-local-qa`, PostgreSQL image `17.11.0.004`, API port **57321**, database port **57322**, local mail port **57324**. The app ran at `http://localhost:3107` with `.next-qa` as its isolated output directory.
- Docker used the existing Colima VM, but VA Relay received its own containers, database, volumes, project ID and ports. Other projects were not reset or modified.
- This extracted folder has **no Git repository**: `git status --short` exited **128**. A source snapshot excluding `.env.local`, dependencies and build output was preserved at `/private/tmp/va-relay-qa-baseline` before changes. Review used that snapshot; no commit was created. All four original migration files remain byte-for-byte unchanged.
- Installed Next.js documentation for cookies, route handlers, Proxy and streamed not-found responses was read. A streamed denied page can legitimately return HTTP 200; isolation tests assert its denied UI and absence of task content, as well as API authorization failures.

`START_HERE.md` documents `scripts/local-qa.mjs`. The runner reads local CLI settings in memory, refuses remote API/database URLs, preserves `.env.local`, disables notification email, and redacts invitation/auth-link tokens from output. The service and local browser suites generate synthetic disposable fixtures. The SQL suite rolls back its fixtures.

## Executed checks

Logs are under `artifacts/qa/`; Playwright's disposable output is under `test-results/browser/`. Logs and screenshots are intentionally ignored by Git.

| Command / check                                                            | Exit | Observed result                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------- | ---: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` with repaired npm-generated lockfile                              |    0 | Clean installation: 392 packages installed; no force/legacy-peer-deps flags.                                                                                                                                                                                      |
| `npm run check:env`                                                        |    0 | Required public settings have valid shape. Does not prove hosted connectivity. Worker/email configuration is incomplete.                                                                                                                                          |
| `npm test`                                                                 |    0 | **68 passed**, no failed/skipped tests: pure rules, static guardrails, malformed/interrupted command responses.                                                                                                                                                   |
| `npm run check:syntax`                                                     |    0 | **48** source/test TypeScript files parsed; generated directories excluded. This is separate from semantic typechecking.                                                                                                                                          |
| `npm run typecheck`                                                        |    0 | Semantic TypeScript check passed after production build generated route types.                                                                                                                                                                                    |
| `npm run lint`                                                             |    0 | No errors or warnings; no wholesale rule suppression.                                                                                                                                                                                                             |
| `npm run build` through the local QA runner                                |    0 | Complete production Webpack build, route generation and build traces passed.                                                                                                                                                                                      |
| `supabase db reset --local --workdir /private/tmp/va-relay-local-qa --yes` |    0 | All **seven final migrations** applied from scratch to the disposable stack.                                                                                                                                                                                      |
| `npm run test:db` through the local runner                                 |    0 | **66** rollback-only database integration checks passed on the final schema.                                                                                                                                                                                      |
| `npm run test:services` through the local runner                           |    0 | **18** real Auth/Storage/concurrency checks passed. These are not storage-metadata substitutes.                                                                                                                                                                   |
| `npx playwright install chromium`                                          |    0 | Actual Chromium browser installed.                                                                                                                                                                                                                                |
| Development-server browser suite                                           |    0 | **20 passed, 2 skipped** across desktop and mobile. The two legacy credential-based smoke cases explicitly skipped because `E2E_EMAIL`/`E2E_PASSWORD` were absent. Separate generated-account tests exercised authenticated workflows.                            |
| Production-server browser suite                                            |    0 | **20 passed, 2 skipped** across desktop/mobile on the final production build, including reload/forward/back cancellation and archived history. The same two optional legacy credential cases skipped.                                                             |
| `npm audit --omit=dev --json`                                              |    0 | **0 runtime dependency vulnerabilities** reported.                                                                                                                                                                                                                |
| `npm audit --json`                                                         |    1 | **5 high** development dependency findings from one underlying `braces` advisory; see below.                                                                                                                                                                      |
| Isolated PostgreSQL dump/restore                                           |    0 | Restore into a new local database succeeded; all 66 SQL checks passed against the final restored schema. The final dump used `pg_dump -Fc`; `pg_restore --exit-on-error` restored into the new local `va_relay_restore_final` database. See recovery scope below. |
| Critical JSX ID comparison                                                 |    0 | No removed or added critical JSX ID expressions compared with the preserved source baseline.                                                                                                                                                                      |
| Artifact secret-pattern scan                                               |    0 | No JWT, secret-key, invitation-token or auth-token patterns found in checked reports/logs. This is a targeted scan, not a general secret-audit certification.                                                                                                     |

Earlier failures were investigated, not hidden:

- The supplied lockfile had versionless package entries. `npm ci` failed with **Invalid Version** (exit 1); initial sandbox network access also failed. A temporary copy of the unchanged package manifest was resolved by npm, the genuine lockfile was copied back, and clean installation subsequently passed. Direct dependency pins were retained.
- Baseline unit/static tests: **59 passed**. Baseline lint exited **2** because `acorn` was missing, then exposed a dialog ref rule violation and navigation/default-export warnings after installation was repaired.
- An initial TypeScript run overlapped a build and failed on disappearing generated files. Subsequent checks ran after build/type generation and passed; this was a verification-order error, not suppressed type errors.
- The malformed direct-RPC regression failed because numeric workflow titles were accepted. It passed after forward validation hardening.
- Browser regressions exposed cancelled create navigation, lost upload selection, failed retry after committed confirmation, and mobile invitation-table overflow. Other browser test corrections addressed hydration timing, actual success wording, and Next.js streamed not-found semantics.
- The expanded production browser run exposed an invalid reload-test assumption: cancelling a reload needs browser user activation and explicit dialog synchronization. The test now clicks the field and waits for the dialog; desktop/mobile reload and forward/back cancellation pass. That initial suite was stopped (exit 130) before a clean final rerun.
- One development compiler run reported an empty manifest. Its isolated cache was moved aside and rebuilt; the user's normal dev server was not stopped.
- Initial restore attempts failed on cleanup of absent schemas, insufficient ownership privileges, and removing the default public schema. The successful empty-database restore retained `public` and used the local infrastructure role to preserve ownership/grants. These attempts touched disposable restore databases only.

## Fixes and source cleanup

- Formatted source with the configured Prettier settings. Separated the SOP editor (`process-form.tsx`), SOP reader (`workflow-read.tsx`), and run-step/evidence controls (`run-step.tsx`) without changing critical action IDs.
- Repaired modal lifecycle and focus return. Successful create/accept actions navigate once instead of immediately cancelling navigation with a refresh. Authentication uses a full same-origin navigation to discard session-specific client cache.
- Quick-task retries retain their generated step ID, keeping the payload stable after an uncertain response. Command responses reject nulls, arrays and malformed/interrupted JSON instead of treating HTTP 200 as a confirmed save.
- Selected files survive answer saves, refreshes and N/A toggles. Answer saves wait for the refreshed optimistic version. A remote response change preserves a local dirty draft and blocks silent overwrite until the user compares/reloads.
- An upload retry always requires SQL confirmation of the exact registered object. A previous confirmation can have committed even when its HTTP response was lost; Storage's subsequent 403 overwrite denial is not by itself proof of failure or success. Reconfirmation neither duplicates attachment audit events nor skips request-ID reservation.
- Archived workspaces retain read-only invitation history and automation health while hiding write controls that their SQL boundary will reject. Wide mobile tables scroll internally instead of widening the page and obscuring actions.
- Added cancelable browser-history traversal protection alongside existing link/dropdown/sign-out/beforeunload warnings. Drafts remain in memory only; forced termination and browsers without cancelable traversal support are not loss-proof. [Navigation API cancellation constraints](https://github.com/WICG/navigation-api/blob/main/README.md).
- Added three **forward migrations**: bounded/typed workflow validation and credential-free HTTP(S) links; direct command scalar validation, honest invite/evidence audit behavior and preservation of omitted reassignment deadlines; attempt-bound email acknowledgements. The old three-argument email acknowledgement is no longer executable by `service_role`; deploy the updated worker with migration 7.
- Worker acknowledgement failure now returns an explicit HTTP 503 instead of silently swallowing the failure. No provider delivery is claimed from SQL lease tests.

## Verified behavior

Database checks cover owner, manager, client reviewer, VA, unrelated client, anonymous and removed identities; all tenant tables and the invoker view; profile isolation; absence of direct authenticated mutation grants; fixed security-definer search paths/private execution grants; draft/publication roles; immutable run snapshots; malformed direct-RPC workflow/scalar inputs; self-review and stale versions; idempotency/payload reuse; approval gates; final correction/resubmission; typed zero/false/whitespace/N/A; pending evidence; blocking issues, resolution ownership and follow-up; archive/restore; deadline-preserving handover; offboarding and inviter authority; daily/weekdays/weekly/monthly/DST recurrence; paused catch-up and changed reviewer requirements; workspace-wide counts and timezone week boundaries; email preferences, archived workspaces, exhausted/expired leases, backoff and stale/successful acknowledgements.

Service checks use real authenticated API sessions and actual uploaded bytes. They cover MIME/size rejection, unauthorized uploads/downloads, fabricated confirmation, immutable overwrite rejection, duplicate retry, before/after evidence, byte-for-byte download, concurrent optimistic saves, simultaneous identical requests, concurrent scheduler invocations and overlapping worker transactions. Removed users cannot obtain new downloads or signed URLs. An already-issued signed URL remained usable immediately after removal: the app issues a **60-second TTL**, and already-downloaded bytes cannot be recalled. Expiry after the full TTL was not separately timed.

Browser checks use desktop and iPhone-sized Chromium viewports, with separate owner/VA/reviewer/unrelated contexts. Covered flows include signup/login, token-hash recovery/password change, workspace creation, draft/publication, quick tasks and reload, recurring generation, invitations/acceptance/revocation, permission before action, typed answers, actual file attachment and interrupted-confirmation retry, final review/correction/resubmission, issues/waiting/follow-up, comments, notifications, training sign-off, reassignment, CSV/JSON downloads, archived controls, modal Escape/focus return, horizontal overflow, network loss, navigation warnings and simultaneous-tab draft preservation.

The recovery test requests a reset and uses a real local Auth-generated token to exercise the callback; it is **not** proof of hosted SMTP delivery, every email-template variant, or cross-device PKCE behavior. Fault injection drops a response only after forwarding the real command to the real database; it does not mock the save path as successful.

Screenshots of real synthetic workflows:

- `artifacts/qa/desktop-completed.png`
- `artifacts/qa/mobile-completed.png`
- `artifacts/qa/desktop-reviewed.png`
- `artifacts/qa/mobile-reviewed.png`

## Dependency finding

`npm audit` reports `braces → micromatch → fast-glob → @next/eslint-plugin-next → eslint-config-next` as five high development findings from [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The advisory lists no patched release. npm proposes a major downgrade of the Next lint configuration; that would not be an appropriate blind compatibility fix. No force fix or vulnerability suppression was applied. Runtime-only audit passes. Keep untrusted glob patterns out of the build/lint toolchain and reassess when upstream publishes a compatible fix. npm also warns that ESLint 9 is no longer supported; its pinned compatibility chain was retained rather than upgraded without validation.

## Remaining release setup and coverage limits

1. Apply only the three new forward migrations to an existing installation with migrations 1–4 already applied. Apply all seven to a new dedicated project. No hosted migration was applied in this cleanup.
2. Configure and test the actual deployment origin, HTTPS, Supabase redirect allowlist, signup confirmation/password-recovery templates and SMTP delivery. Repeat deployed two-account approval and Storage checks. Local signup confirmation is disabled by the supplied local config; enabled-confirmation signup/email delivery is not certified here.
3. Optional unattended automation requires the server-only worker key, a strong `CRON_SECRET`, and a host scheduler. SQL worker concurrency and unauthorized HTTP calls were tested; an external scheduler invoking the deployed endpoint was not.
4. Real notification email requires `RESEND_API_KEY`, a verified `EMAIL_FROM` domain and an actual delivered-message check. Those settings were absent. Lease/acknowledgement logic passed without sending mail. Real provider failures/acknowledgement behavior remain a staging integration check.
5. The dump/restore rehearsal recovered a **database**, including auth records, metadata, RLS and grants. It did not restore object bytes into a separate Storage service or exercise hosted backups/PITR, separate-project auth login, deployment-specific RPO/RTO, retention or operator access. Complete the full `OPERATIONS.md` rehearsal before relying on recovery of live client files.
6. Chromium desktop/mobile emulation is not a physical iPhone/Safari/Firefox certification. Browsers that do not expose cancelable history traversal, forced app termination and fully offline operation remain limitations. No offline sync or sensitive local persistence was added.
7. Export formula defense is unit tested, and actual CSV/JSON downloads are browser tested. The 100,000-record rejection path was reviewed but not exercised with that volume. Application export still excludes attachment bytes and is not a transaction-consistent backup. Load/abuse/rate-limit and malware-scanning coverage is not implied.

No claim of production security certification, external-marketplace action verification, regulatory compliance or unrestricted scale is made.

## UI refinement — October 7, 2026

Preserved the existing working-tree edits and application flows. Updated shared styling to a calm teal/slate palette, grouped desktop/mobile navigation into Daily work, Processes & people, and Workspace insights, replaced the mobile select with a right-aligned menu icon and native modal navigation, and kept the header visible while scrolling. Native form dialogs now explicitly center in the viewport; tall dialogs scroll within viewport bounds. Existing desktop navigation IDs remain intact; `mobile-navigation` now identifies the popup instead of a select. Escape, focus return, active-page indication and unsaved-work cancellation remain supported.

Verification for this UI change (separate from the earlier full QA run):

- `npm ls --depth=0`, configuration shape check, 68 unit/static tests, syntax check (48 files), TypeScript, ESLint and production build: exit **0**. Dependencies were already installed; no dependency versions or lockfile changed. Initial shell checks used Node 23.2.0; browser tests and final lint/typecheck used Node 22.23.3.
- Targeted real Chromium tests against the existing disposable local Supabase project: **4 passed, 0 skipped**, exit **0**, across desktop/mobile. Verified navigation categories and links, popup navigation and Escape/focus return, horizontal overflow, form-dialog center coordinates, sticky-header position after scrolling, and cancelled unsaved-answer navigation.
- Initial sandbox server/browser launches failed (exit **1**) due to OS permissions; reruns outside the sandbox passed. CLI discovery also failed on registry DNS; the existing local QA runner was used after checking that its API/database endpoints were loopback addresses.
- An intermediate lint run included the temporary alternate build directory and failed (exit **1**) on generated output. Moved that build artifact outside the repository and removed only its newly generated TypeScript include entries; final source checks passed without rule suppression.
- No database schema, authorization, production data or `.env.local` changes. Full database/Storage suites and hosted email checks were not repeated for this presentation-only change. Earlier release limitations still apply; these UI checks are not production certification.

## Tutorial page — October 7, 2026

Added `/tutorial` within the authenticated app shell, with desktop/mobile Tutorial navigation, a titled PDF iframe, and open/download links for browsers without inline PDF support. The supplied document is copied byte-for-byte to `public/VA_Relay_User_Tutorial.pdf`; the original was preserved. This tutorial asset is publicly accessible. Only its response permits same-origin framing; other pages retain their existing frame restrictions.

Scoped verification: 68 unit/static tests passed (exit 0); lint, syntax (49 files), configuration-shape check, dependency inspection, production build and final typecheck exited 0. The initial typecheck exited 2 because generated `.next-qa` files were missing; the subsequent check after building passed without source/config suppression. Dependencies were already installed and were not changed. PDF byte comparison and diff whitespace check exited 0.

Live checks remain incomplete: the first server launch exited 1 because port 3107 was occupied; a launch on 3198 reported ready, but the separate HTTP probe could not connect (curl exit 7). Authenticated browser rendering and device-native PDF rendering were not verified in this change. Database/Storage integration suites were not repeated for this static tutorial addition. Earlier release limitations remain applicable.

## Tutorial PDF path repair — October 7, 2026

The tutorial page and framing-header rule referenced `/VA_Relay_User_Tutorial.pdf`, but the new 50-page PDF existed only under `src/app/(app)`. Copied it to `public/VA_Relay_User_Tutorial.pdf`, following the installed Next.js public-folder documentation. Preserved the source PDF and all existing user edits.

Scoped checks: byte comparison, linked-public-file existence/PDF signature check, and `git diff --check` passed (exit 0). HTTP verification on localhost:3000 was blocked by an unavailable server (curl exit 7); browser PDF rendering was not verified. Build, database and full application suites were not rerun for this asset-only repair.

## Process and SOP builder layout repair — October 7, 2026

Fixed a CSS selector collision: `.toolbar form` applied search-form flex layout and a 420px width cap to the SOP builder and recurring-schedule forms inside toolbar dialogs. Scoped both desktop and mobile rules to `.toolbar > form`, restoring the dialogs' existing stacked layout without changing fields, critical IDs, save behavior or authorization. The working tree was clean before this change; generated Next declaration changes from validation were restored.

Scoped validation used installed Node 23.2.0, Next 16.3.8, React 19.3.0 and Playwright 1.63.0. No dependency versions or lockfile changed. `npm ls --depth=0` exited 0 (two existing extraneous WASM packages); configuration shape check, 68 unit/static tests, syntax check (50 files), typecheck, lint and production build exited 0.

The new stylesheet browser regression failed before the fix on desktop and mobile (exit 1: expected grid, received flex). After the fix, both passed (exit 0), verifying stacked fields, full available form width, no dialog horizontal overflow, reachable Save and retained inline search layout. This test uses representative dialog markup and the real stylesheet; it does not claim authenticated application or save verification. Added layout assertions to the existing authenticated SOP workflow for future runs.

The authenticated workflow attempt failed in both viewports before opening the builder (exit 1: local Auth signup `fetch failed`; disposable API at 127.0.0.1:57321 unavailable). Database and Storage checks were not rerun for this CSS-only fix. Full save/publication verification remains blocked until the dedicated local Supabase stack is available; rerun the local workflow suite through `scripts/local-qa.mjs` after starting it. No hosted data or configuration was changed.

Verdict: the reported layout defect is reproduced and fixed with desktop/mobile regression coverage. This scoped repair does not change the earlier release limitations or establish production readiness.

### Recurring deadline layout follow-up — October 7, 2026

Confirmed that “Set a recurring deadline” is nested beneath the same toolbar and is covered by the shared selector fix above. Added representative schedule-dialog stylesheet regressions for daily, weekdays, weekly and monthly layouts on desktop/mobile, plus layout assertions in the real authenticated schedule workflow. All **10** stylesheet browser cases passed (exit 0): eight schedule cases and two SOP cases. Checks cover stacked form layout, controls within their grid, no horizontal dialog overflow and reachable Save. Typecheck, lint and diff whitespace checks exited 0. No additional production-code change was needed beyond the shared CSS repair. The prior successful build remains applicable; authenticated save and database checks remain blocked by the unavailable disposable local service as recorded above.

## Vercel scheduler configuration — October 7, 2026

Added `vercel.json` with a daily `/api/cron` invocation at 00:00 UTC, using the Hobby-compatible minimum interval because the user's Vercel plan is unspecified. Updated setup instructions for Production environment variables, automatic bearer authentication, deployment verification and the optional Pro/Enterprise 15-minute schedule. Daily polling can delay work/reminders by approximately a day and is not precise deadline execution.

JSON parsing/configuration assertions, local configuration-shape check and `git diff --check` exited 0. Both local automation secrets are present; their validity against hosted services is not established. No secrets were printed or added to tracked files. No Vercel account settings were changed, no deployment was made, and no production worker was invoked. Hosted scheduling remains pending Production environment-variable setup and deployment; no live automation success is claimed. Application code, database and dependencies were unchanged for this configuration addition, so their suites were not repeated.

## Typography readability — October 7, 2026

Raised body, navigation, table content, notices and standard buttons to 16px; form controls explicitly use 16px instead of inheriting small label text. Helper text, labels, badges and small buttons now use 14px. Buttons and task links use 600 weight, while navigation retains normal weight. Darkened secondary text and allowed grid tracks/fields to shrink within their containers so larger controls do not widen dialogs. Existing IDs and application behavior remain unchanged.

Working tree was clean at the start. With installed Node 23.2.0, Next 16.3.8 and React 19.3.0, dependency inspection, configuration-shape check, 68 unit/static tests, syntax (50 files), typecheck, lint, production build and diff whitespace check passed (exit 0). All 10 existing desktop/mobile stylesheet dialog regressions passed (exit 0), including SOP and four recurrence layouts with reachable Save controls and no horizontal dialog overflow. These use representative markup and the actual stylesheet, not authenticated workflows. No dependencies were changed. Database, Storage and authenticated browser suites were not repeated for this presentation change; earlier integration and release limitations remain applicable. Verdict: scoped typography update validated, not a new production-readiness certification.

Typography follow-up: reduced eyebrow labels to 12px with 1.2px letter spacing. Explicit page-intro/auth-story selectors prevent their paragraph styles from overriding the eyebrow size. Larger body/form text remains unchanged. Scoped selector review and `git diff --check` passed; full build/browser suites were not repeated for this small CSS adjustment.

## Operations template pack integration — October 7, 2026

Added the supplied `va-operations-templates.ts` byte-for-byte under `src/lib` and appended `OPERATIONS_TEMPLATES` once to the existing catalog: **3 existing + 20 added = 23 templates**, with **113 added steps**. Preserved `EMPTY_WORKFLOW`, all original entries, role placeholders, resources and supplied settings. No current-schema adaptation was necessary. The original untracked public pack was preserved. Its raw developer TypeScript file imports a sibling `./types` that exists only at the intended installation location; excluded precisely that public asset from application compilation. The actual installed module remains fully typechecked. No migrations, seeding, operational writes or publication were performed.

Added 22 unit cases exercising the real catalog, current Zod schema and completion rules: exact companion-JSON equality, catalog reload without duplicates, unique stable IDs, positive/empty/whitespace answers, missing/pending evidence, both before/after labels, permission gates and N/A restrictions. 09A has before-action permission with final review disabled; 15 has both. Only `operations-06-step-02` and `operations-06-step-03` allow N/A. Source review confirms the editor retains step settings, saves resources only from user input and calls `save_process`, not publication. Existing database guards require active authorized reviewers separate from assignees, owner/manager publication, and snapshot preservation. These source observations are not new live database proof. The form's existing outer-whitespace trimming still applies to top-level text on save.

Validation used installed Node 23.2.0 / Next 16.3.8 / React 19.3.0. No dependency or lockfile changes.

| Check | Exit | Result |
|---|---:|---|
| `npm ls --depth=0` | 0 | Installed dependencies inspected; no install required |
| `npm run check:env` | 0 | Local variable shape valid; optional email absent; not service connectivity proof |
| `npm test` | 0 | 90 passed, no skips/failures |
| `npm run check:syntax` | 0 | 52 TS/TSX files parsed |
| `npm run typecheck` | 0 | Installed app and browser test types pass after precise public-asset exclusion |
| `npm run lint` | 0 | No errors/warnings |
| `npm run build` | 0 | Production Webpack build and route generation complete |
| Exact source-pack byte comparison | 0 | Installed module unchanged |
| `npm run test:db` | 1 | Blocked: no disposable `TEST_DATABASE_URL`; no database tests executed |
| `E2E_BASE_URL=http://localhost:3107 npx playwright test --grep 'operations catalog reload'` | 0 | **2 skipped**, desktop/mobile: no explicit disposable local environment; not a passing authenticated test |
| `git diff --check` | 0 | No whitespace errors |

The new authenticated test checks 23 cards after reload, opens all 20 added templates, checks editor fields, saves disposable drafts and compares stored content/settings and unpublished status. It remains **unverified live**. Run it through `scripts/local-qa.mjs` with a dedicated local Supabase stack to close that gap. Existing database snapshot/publication/permission tests were not reported as newly passed. Storage/service suites were not repeated for catalog data.

Initial checks caught two test-fixture assumptions (a URL answer must be a valid URL, and a pre-action gate does not imply final review); corrected the fixtures without altering pack behavior. Initial typecheck exited 2 on the raw public developer module's unresolved import, resolved by the narrow exclusion above. No failing test was skipped to obtain the final unit result.

Verdict: catalog addition integrated and statically validated; authenticated draft/save, authorization and snapshot behavior remain unverified in this run. Client-agreed completion criteria require human judgment: a saved adverse dropdown answer can satisfy a required response and does not automatically create an issue or prove external work succeeded. No production-readiness or external-action verification is claimed.
