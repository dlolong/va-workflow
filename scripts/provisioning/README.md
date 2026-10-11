# Workspace onboarding provisioning

This tooling is for reviewed setup on a confirmed disposable local/staging target. It does not modify Auth credentials, ownership, memberships, profile preferences, publications, schedules, responses or evidence. Reconciliation can improve untouched drafts as described below. The target must already be an active VA or the verified workspace owner with an active owner membership. Owners retain their owner role while executing assigned work; no second VA membership or ownership transfer is needed. Inconsistent ownership and inactive/missing membership require separate resolution; the utility never repairs them by privilege escalation.

Keep input, reports and source documents under gitignored `artifacts/provisioning/`, with restrictive file permissions. Do not put private setup files in `public/`. The tracked code/tests contain synthetic examples only.

## Private input structure

`config.json` contains `maryUserId` (the target account field retained for this setup contract), `workspaceId`, `workspaceName`, `ownerUserId`, `setupActorUserId`, `timezone`, `projectHost`, `environment` (`local` or `staging` only after verification), `trainerUserIds`, `manifestPath`, `confirmedManifestHash`, and `databaseQaVerified` (false until actual database/concurrency checks pass). No secrets belong in this file.

`manifest.json` contains `setupKey`, `items`, `unresolved` notes and deferred `schedules` proposals. Item kinds:

- `process`: stable `key` and current application `content` Workflow. Always creates a draft.
- `preparation`: stable `key`, standalone `content` Workflow and optional `process_keys`. No review/gates, operational process ID or due date. Related draft IDs are resolved within the same workspace and appended as internal reference paths to the SOP.
- `training`: stable `key`, `process_key` and explicitly verified `trainer_id`. Creates only `not_started`; never changes existing progress. Add only after identity mapping is verified. Trainer does not imply operational reviewer authority.

Do not regenerate a different setup key to bypass conflicts. Do not put historical dates in due-date fields. Preparation completion cannot certify training, approve an SOP or transfer ownership. All active workspace members can read operational records; assignment is not privacy.

## Commands

Run from the repository root with installed development dependencies (the CLI uses the current TypeScript/Zod validator):

```sh
node scripts/provisioning/setup.mjs artifacts/provisioning/config.json --dry-run
node scripts/provisioning/test-db.mjs
node scripts/provisioning/test-concurrency.mjs
```

`--dry-run` is also the default. Exit 0 means preflight completed without blockers; exit 2 means the report contains blockers; exit 1 means a failed/invalid invocation. Read-only discovery uses the existing server-only Supabase key to verify accounts and the explicitly scoped workspace. No account emails or documents are printed. Store output privately. Name matching is used only when no workspace ID is supplied, and ambiguity blocks discovery.

The authenticated RPC preflight and application require a verified owner/manager access token in `SETUP_ACTOR_ACCESS_TOKEN`, plus the project's public key. The authenticated owner may also be the target assignee. Do not paste session tokens into chat, commands, source files or logs. Set it through a secure environment mechanism. Never impersonate the target user. The service-role key cannot substitute for that user session.

For local development, run `npm run dev`, sign in as the intended owner/manager and click **Dev token** in the header. The button verifies the current session with Supabase Auth and copies only its access token. Paste it as the value of `SETUP_ACTOR_ACCESS_TOKEN` in `.env.local` (without a `Bearer ` prefix), then rerun the dry run. The setup still verifies the account against `setupActorUserId` and current workspace authority. Tokens expire; copy a current one when needed. The button is absent in production builds, does not display the token and cannot provide another user's session or a service-role credential. Do not put the copied token in chat, logs or commits.

Before applying, review the target/manifest hash and conflicts, verify the environment is disposable local/staging, test migration `202610070004_provisioning.sql` following all prior migrations, run database/concurrency tests, resolve membership/ownership conflicts and obtain explicit approval of the concrete target and changes. Record that approved hash in `confirmedManifestHash`; set `databaseQaVerified` only after actual tests pass. Then:

```sh
node scripts/provisioning/setup.mjs artifacts/provisioning/config.json --apply
```

Do not run this command on the unresolved current target. No migration or setup was automatically applied during implementation. Database tests require loopback `TEST_DATABASE_URL`; concurrency tests additionally require `QA_DISPOSABLE=va-relay` and a local Auth endpoint. The existing `scripts/local-qa.mjs` can supply a dedicated local stack's settings. Concurrency tests retain synthetic fixtures in that disposable stack. SQL tests roll back.

## Persistence and failure handling

Forward migration `202610090002_owner_execution_provisioning.sql` enables owner targets in both provisioning paths. Install it after the earlier migrations through the authorized migration path before using owner-target setup. Ordinary task assignment/execution already supports owners. In New work, select yourself as Assignee; your work appears in My Day. With the subsequent `202610090003_owner_self_review.sql` migration, the verified owner may also be their own reviewer and explicitly approve their own permission requests. Other roles need a different eligible reviewer, and training still needs a separate trainer. The migration changes only target eligibility, not RLS, reviewer authority or memberships.

The migration adds a private per-workspace/target/setup/item ledger. An owner/manager-only RPC takes the same workspace lock as ordinary commands, validates inputs, then creates the batch in one transaction using existing commands. Concurrent retries serialize. Ledger entries survive retry-receipt expiration. Repeated items are preserved without updating edited drafts, completed/cancelled runs or training progress. Missing/reassigned records and changed manifest inputs conflict. A same-title record without ledger identity conflicts rather than being adopted or overwritten. Manual adoption of pre-existing processes is not implemented; it needs an explicitly reviewed reconciliation, not a second setup key.

New run notifications stay in-app. Only corresponding email-outbox rows created inside that transaction are removed before commit; unrelated jobs are untouched. No invitations or notification email batches are sent. An audit records the authenticated setup actor and actual provisioning operation; it does not claim the target authored drafts or performed work.

An interrupted response is not evidence of either success or failure. Rerun dry run with the same setup key and manifest. The private ledger and record checks distinguish committed items from pending work. No blind retries with new identities. Post-apply verification is database-only; browser/RLS validation is separately reported.

## Rollback and limits

No automatic destructive rollback is supplied. A failed transaction rolls back its entire batch. For a committed batch, use ledger IDs to review only newly created records and their audit/history. Do not delete reused, edited, published, answered, completed or evidence-bearing records. Prefer retaining/archiving historical work through existing authorized workflows. Any removal of demonstrably untouched new setup records requires a separately reviewed, workspace-scoped maintenance procedure; never reset a workspace or database.

The migration and database/concurrency/browser checks passed on the disposable local stack in the October 8 QA follow-up. This does not establish hosted migration availability or authorize a different target. Application remains blocked until authenticated target preflight and explicit confirmation succeed. A successful build and synthetic preflight tests do not prove SQL execution, live RLS, real-user browser access or production readiness.

## Fixed private targets and authorized ownership maintenance

A supplied workspace ID selects by primary key even when the contextual name is stale. Unknown timezone permits discovery of the stored value; this does not approve schedule activation. For a non-redirectable setup, put matching `fixedTarget` (`workspaceId`, `maryUserId`, `setupKey`) objects in both config and manifest and call `assertFixedTarget` from a private entry point with fixed expected values before invoking the generic CLI. Conflicting environment target overrides fail. `example-config.json` contains synthetic identities only; it cannot be applied unchanged.

`ownership.mjs` is a narrowly scoped database maintenance helper, not a browser/RPC endpoint and not part of ordinary provisioning. Use it only after explicit authorization to transfer the exact workspace and demote the prior owner to VA. The caller must verify the project/environment and maintenance connection, begin a transaction, invoke the helper, then commit only for explicit apply (otherwise roll back). It locks the workspace, checks both existing Auth/profile identities, rejects archived/missing/conflicting ownership or active review obligations, preserves unrelated memberships/work, and records a truthful maintenance audit with no impersonated user. A private fixed-target wrapper supplies the approved IDs and reads a server-only database connection. No grants, RLS policies or schema changes are needed. The ordinary setup CLI still requires a verified owner/manager user session for application.

Synthetic rollback tests in `test-db.mjs` cover transfer preflight, missing targets, outstanding reviews, role/owner consistency, repeat preservation and unrelated memberships. No hosted transfer is implied by those tests.

## Reconciling a newer setup namespace

Forward migration `202610090001_provisioning_reconciliation.sql` adds `reconcile_workspace_setup`. Install it only after the existing provisioning migration, using the deployment's authorized migration path. It has been exercised on disposable local PostgreSQL; hosted availability must still be verified. No prior migration was rewritten.

A manifest with `previousSetupKeys: ["synthetic-setup-v1"]` and a distinct `setupKey` selects the new authenticated RPC automatically. The private entry point must pin both the current target and the expected predecessor namespaces. Existing v1 files should be retained; do not regenerate old reviewed content to force an upgrade.

The RPC takes the same workspace lock as ordinary commands and resolves each logical key across current/predecessor ledgers. It aliases the existing record ID into the new namespace. Only an unpublished, unarchived process draft still equal to its stored provisioning input may be updated through `app_command`. Human-edited, archived or published drafts are deferred and preserved. Every existing preparation snapshot, status, answer, due date and history is retained; changed preparation wording is reported as deferred for human review while reusing the task. No publication, scheduling or role change is part of reconciliation. Owners can execute assigned work; the later owner-self-review migration separately enables their own approval/review. Reconciliation never performs these actions.

Different durable IDs for one key, foreign/reassigned records and unledgered matching titles/logical prefixes produce conflicts before writes. They are never automatically adopted or overwritten. Missing records are not silently replaced. Conflict-free batches use the original atomic creation path and its narrowly scoped setup-email suppression. Existing unrelated notification jobs remain intact. Reports distinguish planned counts from actual returned apply counts; unknown ledger reuse is not inferred from title matching. A successful apply with deferred drafts is `PARTIALLY APPLIED`; reviewed/reconciled metadata alone is not proof of external execution.

Validation commands on the isolated local stack:

```sh
node scripts/local-qa.mjs node scripts/provisioning/test-reconciliation.mjs
node scripts/local-qa.mjs node scripts/provisioning/test-concurrency.mjs
```

The reconciliation suite rolls back synthetic fixtures. The concurrency suite uses real local Auth sessions and retains synthetic records. It requires the new migration, as do the provisioning browser tests. Do not run mutation QA on client records.
