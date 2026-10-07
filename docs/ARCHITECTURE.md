# Architecture and command boundaries

## Request path

```text
React form → /api/command → getUser + Zod + same-origin validation
           → authenticated Supabase RPC app_command
           → membership/role checks + locked transaction + database rules
           → domain rows + audit + notification/outbox
```

Server Components and authorized GET routes read via the current user's Supabase session. `src/proxy.ts` refreshes SSR cookies with the Next.js proxy convention; it is not the only authorization layer. No normal business action uses the service-role client. The worker module is server-only and imported only by `/api/cron`.

Every exposed application table has RLS. Authenticated users receive SELECT access with workspace policies, not direct INSERT/UPDATE/DELETE grants. Database functions validate authorized changes explicitly with a fixed `search_path`. The private schema holds retry receipts and worker state and is not an exposed REST schema.

## Data model

Workspace → Memberships / Processes / Schedules / Runs.

Process → mutable draft → immutable process_versions.

Run → immutable snapshot + version → responses / evidence / approvals / issues / comments / audit events.

Training links a process, trainee and trainer. Invitations are workspace-scoped, expire, and are bound to a verified account email. Raw invitation tokens are returned to the creator for sharing; only the hash is in the invitation table. A private idempotency receipt temporarily retains the response (including a raw invitation link token), so protect backups and keep the private schema unexposed.

## Concurrency and retries

Workspace row locking serializes permission-changing operations with writes. Run row locks and optimistic `expected_version` protect response/status/review/reassignment operations from stale overwrites. An actor/request-ID receipt, scoped to action/workspace and hashed payload, returns the original result on an identical retry. Reusing a request ID for a different payload is rejected. Receipts are pruned after 30 days by the worker.

The client retains failed request IDs within the current mounted form. A reload does not recover unsaved local form state. Do not describe the client as an offline queue or claim perfect duplicate elimination after browser state has been discarded.

Scheduled occurrences use `(schedule_id, occurrence_at)` uniqueness. Generation snapshots the latest published process and validates active assignee/reviewer membership. Archiving a process pauses its schedules; restoring it does not automatically resume them. Schedule edits affect future generation, not runs already created.

## Work lifecycle

`not_started → in_progress → for_review → completed` when review is required; non-review work completes after successful database validation. A reviewer may request changes, which allows correction/resubmission. Blocking/waiting states retain deadlines. Cancellation/reopening requires manager authority; cancellation rejects pending permission requests without granting authority. Self-review is prohibited.

Before-action permissions are stored separately from final review. An approved gate authorizes the stated action in that run. Required answers, configured N/A, proof requirements and unresolved blocking issues are checked again in SQL at submission and acceptance. A URL or screenshot remains user-supplied evidence, not an external-system confirmation.

## Commands

- Identity: `update_profile`, `create_workspace`, `update_workspace`.
- Team: `invite_member`, `accept_invitation`, `revoke_invitation`, `change_role`, `remove_member`.
- Processes: `save_process`, `publish_process`, `archive_process`.
- Scheduling: `save_schedule`, `toggle_schedule`, `generate_schedules`.
- Work: `create_run`, `save_response`, `set_status`, `submit_run`, `review_run`, `reassign_run`.
- Permissions: `request_approval`, `decide_approval`.
- Evidence: `register_evidence`, `confirm_evidence`.
- Issues: `create_issue`, `resolve_issue`; collaboration: `comment`.
- Training/notifications: `save_training`, `mark_read`.

Read RPCs: `workspace_stats`, `automation_health`, and scoped authorization helpers. Service-role-only RPCs: `run_automation`, `claim_notification_emails`, `finish_notification_email`.

## Storage lifecycle

Register an evidence row → upload to that exact permitted object path → confirm only after the object exists with matching MIME/size → expose as attached proof. Failed/pending uploads never satisfy required evidence. File records preserve provenance and are not overwritten. Cleanup of abandoned pending uploads is an operator procedure described in `OPERATIONS.md`.

## UI conventions

Compact left navigation on desktop and select navigation on mobile; one primary page scroll plus dialogs; semantic form controls; stable IDs for critical actions; clear empty, saving, failure and readonly states. Step saves are explicit. The runner warns about unsaved changes on supported navigation paths. Browser-history/back behavior and device upload behavior need the supplied live QA checks.

## Sources for implementation conventions

- Next.js App Router installation/proxy: https://nextjs.org/docs/app/getting-started/installation and https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Supabase server-side auth: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Resend API: https://resend.com/docs/api-reference/emails/send-email

These references inform integration patterns, not a claim that the generated app has passed live platform verification.
