# Operations and recovery runbook

## Launch checklist

Use isolated staging and production Supabase projects. Keep migrations tracked, use a lockfile after the first successful install, run the full QA plan, configure error monitoring and request/abuse limits, verify authentication emails, run a real upload/download and verify client isolation. Activate cron only after its endpoint secrets and workspace behavior are tested.

## Worker behavior

The worker acquires a transaction-scoped singleton lock; overlapping scheduler calls do not duplicate a generation pass. It catches up at most 31 occurrences per schedule per invocation. A missing/removed required assignee or reviewer prevents generation rather than silently granting access. Inspect and fix these schedules explicitly. Because paused schedules retain their next due date, resuming may generate missed work. Existing runs are never deleted by pausing.

Emails are claimed with a five-minute lease, use provider idempotency keys, and retry at increasing intervals up to five attempts. An exhausted lease is marked failed on a later claim pass rather than remaining silently stuck. Acknowledgements carry the claimed attempt number; expired/reclaimed leases reject stale acknowledgements. The cron endpoint returns HTTP 503 if acknowledgement fails. Database acknowledgement failure after a provider accepted mail still requires operational attention; do not claim exactly-once email delivery across every failure mode.

Without provider configuration, notifications remain in the application/outbox and are not marked sent. Review whether an old backlog should be sent before enabling email on an established workspace. Respect disabled email preferences and removed memberships. Settings shows counters, not a full delivery-management console.

Do not paste cron secrets into public dashboards, screenshots or tickets. Rotate exposed credentials, then redeploy/reconfigure the scheduler.

## Backup and restore rehearsal — required, NOT executed at delivery

1. Choose documented recovery point and recovery time objectives for this deployment. Document who owns recovery and where credentials are stored.
2. Configure supported Supabase database backups and a separate strategy for the actual Storage file bytes. Application JSON/CSV export is not sufficient.
3. Record the migration version and app release that correspond to the backup. Preserve required auth identities and storage metadata using the platform's supported backup process.
4. Restore into a **new isolated test project**, never over production as a rehearsal. Restore object bytes as well as metadata with the correct paths.
5. Configure a staging copy of the app for that project. Disable outgoing mail/cron initially to avoid contacting real users.
6. Verify record counts, login behavior, at least two client boundaries, reviewer permissions, historical snapshots, audit attribution and representative file downloads.
7. Record timestamps, observed recovery duration, missing data, failures and remediation. Only a completed rehearsal can be called a tested restore.

This starter includes the procedure, not a verified hosted backup service or a one-click restore implementation.

## Abandoned pending uploads

An upload registration may remain pending when its browser closes or upload fails. It never counts as required proof. The Settings counter makes this visible. After a documented grace period, inspect pending rows and corresponding objects using privileged operator tooling. Confirm that no upload is in progress and that no attached record references an object before deleting it via the supported Storage API. Keep an operator audit record. Do not bulk-delete `storage.objects` directly in production and assume file bytes were removed.

## Retention and deletion

Archiving preserves evidence/history. Define retention with each client and scope any erasure request before implementing destructive commands. Review dependent rows, backups, cached/signed links and storage bytes. The application does not provide a blanket destructive delete button. Do not perform owner transfers through arbitrary membership edits without maintaining the owner_id/owner-role invariant and existing review/assignment constraints.

## Migration discipline

For a never-deployed fresh starter, correct initial migrations before first use. Once migrations have been applied to shared/staging/production data, create a new forward migration; do not rewrite applied history. Back up and rehearse risky changes. Avoid `DROP ... CASCADE`, disabled RLS or service-role shortcuts as fixes for permission failures.

## Capacity

The scheduler serializes workspace modifications for safety; this design targets a small pilot, not high-volume parallel agency operations. Supporting UI lists have explicit caps; exports are not transaction-consistent. Observe actual workload, query latency, Storage usage, queue depth and host runtime limits before expanding. Add pagination/queue batching in response to validated usage rather than silently raising arbitrary limits.

## October 7 local rehearsal

A full custom-format PostgreSQL dump of the disposable VA Relay stack was restored into a separate database in the same local container using its infrastructure role. All 66 rollback-only database checks passed on the restored database. This was a database-only rehearsal: it did not restore Storage bytes to a separate Storage service or validate a hosted deployment's recovery time/retention. Keep the complete deployment-specific rehearsal above as a launch requirement. See `QA_REPORT.md` for commands and failures encountered before the successful restore.
