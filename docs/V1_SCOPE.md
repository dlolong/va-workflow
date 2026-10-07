# V1 scope and honest boundaries

## Core implementation

The starter implements one owner per client workspace, managers, clients and VAs. A person may belong to several client workspaces; membership is never inferred from being assigned elsewhere. Within a workspace, active members can read its operational records and attachments. **This is client-level isolation, not per-task confidential compartments within the same client.**

VAs can draft SOPs and execute their assigned work. Owners/managers publish SOP versions, manage recurring schedules, reassign/offboard members and manage workspace operations. Clients can request work and review when authorized. Only the owner can grant manager roles or archive/restore the workspace. Publishing and training sign-off are separate recorded actions.

Drafts are shared workspace documents. Editing a draft does not alter its published version. Draft collaboration is not real-time and does not have merge/conflict resolution; avoid simultaneous draft edits during the pilot. Each run snapshots the version used at creation. Publishing a newer version applies to newly created runs, not in-flight work.

## What is configurable versus automatic

| Item | V1 behavior |
|---|---|
| Save/resume | Explicit step save; visible unsaved indicators. Successfully saved responses reload from the database. |
| Offline work | Not implemented. No financial/client data is intentionally cached in browser localStorage as offline work. |
| Approvals | Before-action gate and final run review are separate. Evidence cannot prove an external operation unless independently verified. |
| Required proof | File or before/after files, configurable per step; URL/text evidence may be represented by required typed steps. |
| Recurrence | Fixed daily, weekdays, weekly, monthly; no business-holiday calendar, quarterly option or completion-relative schedule builder. |
| DST | Named timezone calculations. PostgreSQL recurrence resolves ambiguous/nonexistent local times using its timezone rules; choose ordinary daytime times. One-off datetime input rejects ambiguous/nonexistent wall times. |
| Deadline register | A view of open runs with deadlines, plus separately visible issue/follow-up queues; not a duplicate compliance database. |
| Manual scheduling | Owner/manager presses Generate due work. |
| Unattended scheduling | Requires server-only worker key, cron secret and a configured scheduler. |
| Notifications | In-app records are created with events; reminder creation and email dispatch depend on cron. No realtime websocket feed; refresh after remote changes. |
| Email | Optional Resend adapter for generic event/reminder notifications. Supabase auth emails are separate. |
| Invitations | Seven-day verified-email-bound copyable links. No automatic invite email dispatch. |
| Weekly summary | On-demand counters and copy action. No automatic weekly digest or AI narrative. |
| Export | Task CSV or workspace JSON; attachment references only, not the files themselves; no restore/import UI. |
| Training | Stages, trainer, note and sign-off; not examinations, HR records or automatic competency enforcement. |
| Decision boundaries | Human-readable can/ask/never instructions plus configured app approval gates. The app cannot block actions directly in external systems. |
| Issue handling | Owned issue, recommendation, follow-up and resolution. No external-ticket synchronization or complex incident workflow. |
| User exit | Manual reassignment/offboarding, retaining history. No owner-transfer or account-erasure self-service UI. |

## Pilot-scale limits

Run lists are paginated in pages of 50. Supporting process/schedule/approval/issue/training lists are capped at 200 and display a warning when the cap is reached. Activity/notification lists show the most recent 100; run comments show 200. Use export for older supported records. These caps are not represented as complete historical lists.

The CSV/JSON application export refuses tables reaching its 100,000-record limit rather than silently truncating. It is assembled over multiple queries and is **not a transaction-consistent backup**. Metadata export excludes auth secrets and the private job/receipt tables. Do not infer a full account backup from it.

Uploads allow PNG, JPEG, WebP, PDF, text and CSV, up to 10 MB. There is no antivirus/file-content scanning or automatic evidence redaction. Downloads are authorized before issuing a 60-second signed URL; a previously issued URL can outlive membership revocation briefly. Files already downloaded cannot be revoked.

The initial migrations target a new project. Hosting limits, volume limits, abuse controls, recovery objectives and data retention need deployment-specific validation. This is a controlled-pilot starter, not an audited platform for sensitive regulated records.

## Explicitly outside V1

Billing/subscription enforcement, payments/payroll, attendance or screen monitoring, full chat, CRM/accounting, secrets/password storage, marketplace/Google Drive/Slack integrations, AI agents, advanced workflow branching, multi-party approval chains, agency-wide analytics, white-label domains, comprehensive localization, mobile native apps and offline sync.

The provided tests are not proof of production security until the database, storage, browser and deployment tests actually execute. See `DELIVERY_QA.md` and `QA_CHECKLIST.md`.
