# Start here — configure VA Relay

## 1. Open the project

Extract the archive and open the `va-workflow-v1` folder. Use Node.js **22.16+**. With nvm:

```bash
nvm install 22
nvm use 22
npm ci
cp .env.example .env.local
```

Use the checked-in npm-generated `package-lock.json` with `npm ci`. The invalid supplied lockfile was preserved in the cleanup baseline and replaced after reproducing its installation failure.

Do not copy an unrelated application's `node_modules` or lockfile into this starter.

## 2. Create a new Supabase project

Use a separate project for this app. These migrations create tables in `public` and an `evidence` storage bucket. **Do not run them in another application’s existing database or any unrelated production database.**

Set `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PROJECT_PUBLIC_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the publishable key, or the project's legacy `anon` key when applicable. Never use a service-role/secret key in a `NEXT_PUBLIC_` variable. The URL must match the browser's origin exactly, including port. Switching to `127.0.0.1:3000` while configured for `localhost:3000` causes the write-origin check to reject requests.

Run:

```bash
npm run check:env
```

This validates variable shape, not connectivity or access permissions.

## 3. Apply all migrations

### Option A: Supabase SQL Editor

In your new project, run each complete file, in this order:

1. `supabase/migrations/202610060001_core.sql`
2. `supabase/migrations/202610060002_workflows.sql`
3. `supabase/migrations/202610060003_jobs_reports.sql`
4. `supabase/migrations/202610060004_views.sql`
5. `supabase/migrations/202610070001_validation.sql`
6. `supabase/migrations/202610070002_command_validation.sql`
7. `supabase/migrations/202610070003_email_leases.sql`

For an existing installation with the first four already applied, apply only the three forward migrations. Deploy the updated worker with migration 7: its email acknowledgement RPC now requires the claimed attempt number. Do not rewrite or rerun applied initial migrations.

Each file contains its own transaction. Stop on the first error; do not continue as though it succeeded. These initial migrations are not designed to be rerun repeatedly over existing tables. Record which files were applied. Do not mix manually applied initial migrations with an un-reconciled CLI migration history.

The first migration creates the **private** `evidence` bucket and its rules. Do not create a public bucket with the same name beforehand.

### Option B: Supabase CLI

Use the supported Supabase CLI installation for your machine, then from this folder:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Do not run `db reset` against a hosted project. Reset is used only for disposable local testing below.

## 4. Configure authentication

In the project's authentication URL settings:

- Site URL: `http://localhost:3000` during local development.
- Allow the app's `/auth/callback` and `/auth/confirm` routes, including the query-bearing redirect paths used by the app. Use a development-only local wildcard if needed; restrict production to your own domain.
- Keep email confirmation configured as appropriate for your project. The app does not force it off.
- Before inviting real users, configure and test Supabase authentication email delivery, including password recovery.

The app supports the default PKCE callback route and a token-hash confirmation route. For confirmation links that do not rely on the original browser's PKCE verifier, the following minimal Supabase email-template links are supported:

**Confirm signup**

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email&amp;next=/dashboard"
  >Confirm your email</a
>
```

**Reset password**

```html
<a
  href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/reset-password"
  >Reset your password</a
>
```

Test links in the actual deployed environment. With the simple signup template above, a new invitee confirms their email and then reopens the workspace invitation link. The invitation is bound to the verified email address, not merely possession of the link.

Authentication emails and application notification emails are separate: Supabase SMTP handles authentication; the optional Resend worker handles workspace notifications.

## 5. Start the app and complete the first real flow

```bash
npm run dev
```

Open `http://localhost:3000`.

The development and build scripts explicitly use Webpack. This supports installations that load only WebAssembly (WASM) bindings; Turbopack requires native bindings.

1. Create an account and confirm its email when your Supabase settings require it.
2. Create a client workspace. Its creator becomes its owner. Choose the **client's named timezone**, such as `Europe/Amsterdam` or `Asia/Manila`.
3. In **Processes & SOPs**, use a starter template or paste checklist lines. Review its instructions and save a draft.
4. Publish the draft. Only owners/managers can publish. VAs can author drafts, but drafts do not replace published instructions automatically.
5. In **Team & access**, create an invitation for a second account. Copy the link and share it with that person. They sign in with the invited email and accept.
6. Start a run, assign the VA, and select a different reviewer when the process requires approval/review.
7. Sign in as the VA, save answers, attach any required evidence, and submit.
8. As reviewer, request a correction or accept the submission. Verify that the VA can correct and resubmit.

For a first solo check, create a quick one-off task with no required reviewer. Do not enable self-review to get around a two-account review test.

## 6. Optional: unattended schedules and reminders

Manual scheduling works through **Generate due work**. To generate work and reminders while nobody has the app open, configure:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
CRON_SECRET=A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
```

Generate a secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Configure your host or external scheduler to call the deployed endpoint regularly with a bearer token:

```bash
curl --fail-with-body -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://YOUR_APP_DOMAIN/api/cron
```

The endpoint supports GET and POST.

### Vercel setup

The checked-in `vercel.json` schedules `/api/cron` daily at 00:00 UTC (08:00 Asia/Manila). On Hobby, invocation can occur anywhere within that hour. Cron runs on production deployments, not your local development server.

1. In the Vercel project's environment variables, add `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` for **Production**, using the values from your private local configuration. Keep both server-only. `.env.local` is not uploaded automatically.
2. Set the public Supabase URL/key for that same project and `NEXT_PUBLIC_APP_URL` to your deployed HTTPS origin. Update the Supabase authentication redirect allowlist for that origin.
3. Deploy with `vercel.json`. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` to the cron endpoint.
4. Check Vercel's Cron Jobs logs and the app's Settings → Automation health → Last worker run after execution. A successful build alone does not prove automation ran.

The daily default works within Hobby limits but can delay generation/reminders by approximately a day; it is unsuitable for precise same-day deadlines. For Pro or Enterprise, change the schedule to `*/15 * * * *` for checks every 15 minutes (as shown in `vercel.example.json`) and redeploy. More-frequent expressions fail deployment on Hobby. Alternatively, use an external scheduler with the same bearer authentication. Resend configuration is needed only for notification emails.

References: [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [cron authentication](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

The worker uses the latest published process for new runs and never overwrites an existing run's snapshot. A unique schedule/occurrence constraint prevents duplicate occurrences. Catch-up is capped at 31 occurrences per schedule per invocation; repeat generation or correct stale schedules deliberately. Pausing does not delete already-created work. Resuming preserves the prior next due date, so missed occurrences may be generated.

Settings → Automation health shows the last successful worker run, pending/failed mail jobs and unconfirmed uploads. Without a worker, the interface remains usable but reminders are not delivered unattended.

## 7. Optional: application notification emails

```dotenv
RESEND_API_KEY=YOUR_RESEND_KEY
EMAIL_FROM=VA Relay <notifications@YOUR_VERIFIED_DOMAIN>
```

Verify your sending domain with the provider. Run the cron endpoint and inspect a real delivered message. The worker sends generic workspace-update messages; confidential task contents are not placed in email bodies. No provider key means no message is marked sent. Pending notices remain available inside the app.

This does not automatically send team invitations or schedule a weekly summary email. Those are deliberately manual in this V1.

## 8. Run QA before a pilot

```bash
npm test
npm run check:syntax
npm run typecheck
npm run lint
npm run build
```

Read `CODEX_CLEANUP_QA_PROMPT.md` and let Codex fix actual failures without rebuilding the product.

### Disposable local database QA

The Supabase local stack requires its normal prerequisites, including Docker. From this project folder:

```bash
npx supabase start
npx supabase db reset
```

Use only the local database URL displayed by the CLI, for example:

```dotenv
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Then:

```bash
npm run test:db
```

The harness refuses non-local hosts, creates fixtures inside a transaction, and rolls them back. It tests actual database/RPC permissions under simulated SQL session identities. Its storage case uses object-metadata fixtures; **it does not replace a real authenticated Storage API upload/download test**.

### Browser QA

Use a disposable staging/local account, not a real customer's account:

```dotenv
E2E_EMAIL=YOUR_TEST_ACCOUNT_EMAIL
E2E_PASSWORD=YOUR_TEST_ACCOUNT_PASSWORD
```

```bash
npx playwright install chromium
npm run test:e2e
```

The authenticated smoke test creates a workspace and task; it does not delete them. Use the same Supabase project as `.env.local`. Without credentials, that test explicitly skips and must not be reported as a successful authenticated test.

## 9. Deploy

Deploy as a standard Node.js Next.js application with Node 22.16+. Set the same environment variables in the host, replace `NEXT_PUBLIC_APP_URL` with the production origin, update Supabase URL settings, and redeploy after changing public variables. Build command: `npm run build`; self-hosted start command: `npm run start`.

Use separate staging and production projects. Confirm login, password recovery, invites, role boundaries, two-account review, real storage access, cron and email after deployment. Configure backups and complete a restore rehearsal before storing live client files. See `docs/OPERATIONS.md`.

## Troubleshooting

| Symptom                                   | Check                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Setup screen instead of workspace         | Required public variables are missing. Restart/redeploy after changes.                                                        |
| Relation or RPC not found                 | All migrations must be applied to the project named in `.env.local`.                                                          |
| Save rejected for origin                  | Browser origin and `NEXT_PUBLIC_APP_URL` must match.                                                                          |
| Session/confirmation problems             | Supabase URL allowlist, email template, expired link, and project auth email delivery.                                        |
| Invite rejected                           | Sign in with the exact invited verified email; check expiry, revocation and inviter authority.                                |
| Reviewer cannot be selected               | Invite a separate active owner, manager or client. A VA role is not a reviewer role.                                          |
| No recurring runs                         | Publish the process, assign active users, check timezone/lead time, then configure cron or generate manually.                 |
| Evidence never attaches                   | Check private bucket policies, allowed MIME/size, browser upload error and exact object metadata. Do not bypass confirmation. |
| Draft changes do not appear in an old run | Intended: runs retain the published snapshot with which they started.                                                         |
| Stale-save warning                        | Reload to inspect the newer saved state; do not force an overwrite.                                                           |

## Reproducible local integration/browser QA

Use a dedicated disposable local Supabase stack. Install the CLI (`npx supabase --version`) and start it with this project's config. If another project uses ports 54320–54324, copy `supabase/` into a temporary workdir, choose a unique project ID and unused ports, and set `QA_SUPABASE_WORKDIR` to that directory. Never reuse another product's database. Include **all seven** migrations in the copy.

The local runner reads `supabase status -o json` without printing credentials, overrides the hosted `.env.local` settings in memory, disables outgoing notification email, and redacts auth/invitation links from server logs. Use Node 22.16+ and the same workdir in both terminals:

```bash
# Terminal 1 (default QA origin is http://localhost:3107)
node scripts/local-qa.mjs npm run dev -- --port 3107
# Terminal 2
node scripts/local-qa.mjs npm run test:db
node scripts/local-qa.mjs npm run test:services
npx playwright install chromium
node scripts/local-qa.mjs npm run test:e2e
```

`test:db` rolls back its fixtures. The service and local-browser suites generate synthetic users/workspaces and leave them in the disposable stack. They refuse hosted Supabase URLs; `test:services` also requires the runner's explicit `QA_DISPOSABLE=va-relay` flag. Browser tests exercise separate real sessions; the older credential-based smoke case still skips without `E2E_EMAIL`/`E2E_PASSWORD`.

QA uses `.next-qa` through `NEXT_DIST_DIR` so it can coexist with a normal dev server. Do not run builds and TypeScript checks concurrently: Next regenerates files consumed by TypeScript. Playwright output is under `test-results/browser`; keep command logs/screenshots under `artifacts/qa` so Playwright does not erase them. Traces are disabled because auth/invitation requests contain secrets.

The recovery callback test uses a real token generated by the **local** Auth admin fixture. It verifies the app's token exchange and password change, not production SMTP delivery or every email-template variant. See `docs/QA_REPORT.md` for the executed coverage and limitations.

## Operations template catalog

Processes & SOPs → Start with a template includes the three starter templates plus 20 operations templates (113 additional steps). Use template opens the existing editor; Save draft creates an unpublished process. An owner/manager must complete the client setup placeholders, approve any entered resource links and publish deliberately. No schedules, assignments or runs are created by installing the catalog. The supplied JSON is developer reference data, not an import feature.

09A requires before-action permission; 15 requires both before-action permission and final review. Both require a separate authorized reviewer. Only the two requested B2B document stages permit N/A, with a reason. Configured change steps require separate before and after evidence. Completion checks enforce required answers, evidence and permission records; they do not verify external actions or interpret adverse answers as new issues. Create and assign issues explicitly when needed. Existing runs retain their published SOP snapshots.
