# Security assumptions and release checks

## Threat boundary

Treat browsers, request payloads and URL identifiers as untrusted. UI-hidden controls are not authorization. Supabase RPCs must reject unauthorized direct calls independently of the Next.js route. RLS scopes reads by active workspace membership. Foreign keys carry workspace identifiers to prevent cross-client relationships. Sensitive files remain in a private bucket.

Client-level isolation means all active members of a workspace can inspect its operational records, including evidence. Do not put two unrelated clients in one workspace. Sharing a VA account across people defeats the audit model; invite individual accounts instead.

Owners/managers are trusted to configure SOPs and authority boundaries; VAs can draft but cannot publish. A platform deployer holding the database credentials/service-role key can bypass ordinary RLS and must be treated as privileged infrastructure administration.

## Before using real client data

Run live tests with at least owner, VA, client-reviewer and unrelated-client users. Test every tenant-owned table, direct RPC misuse, forged run/workspace IDs, private file paths, expired/revoked invites, stale versions, offboarding, pre-action gates, self-review and post-completion writes. Include authenticated Storage REST tests, not only SQL helper tests. Verify SSR responses/cookies are not publicly cached. Keep security-definer function search paths fixed and grants explicit.

Do not log credentials, email tokens, entire request payloads or financial evidence. The command route logs an error type rather than private request contents. File links expire after 60 seconds; a signed URL already handed to a user can remain usable briefly after removal, and a downloaded file cannot be recalled.

Production must use HTTPS. Configure platform request/body limits, rate limiting/abuse controls, Supabase auth limits/CAPTCHA as appropriate, dependency vulnerability review, error monitoring and least-privilege staff access. The starter's same-origin check is not a substitute for per-user quotas or broader abuse prevention.

## Files

MIME/extension/size controls do not establish that a file is safe. There is no malware scanner in this V1. Do not upload passwords, API keys, full payment credentials, identity documents or unnecessary customer data. Review the client's permitted evidence policy. Add a scanning/quarantine provider before accepting arbitrary untrusted documents at scale. Do not preview arbitrary HTML or SVG.

## Secrets

Only public project URL and publishable/anon key belong in `NEXT_PUBLIC_` variables. `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, Resend keys and database URLs remain server-side. The service-role client belongs only in the worker path; do not use it to make browser permission errors disappear. Do not expose the `private` schema through the Supabase API. Invitation response receipts contain temporary secret material and must remain private.

## Account lifecycle and data retention

Offboarding deactivates membership after handing over open responsibilities. It does not erase historical attribution or remove the user from other clients. Workspace archive pauses operations but is not data deletion. Owner transfer, account erasure and contractual retention are operator procedures, not implemented self-service flows. Define and test them for the actual deployment before onboarding customers who require them.

No claim of GDPR, Philippine DPA, HIPAA or other regulatory compliance is made. Legal and contractual requirements need deployment-specific review; this file describes engineering assumptions only.
