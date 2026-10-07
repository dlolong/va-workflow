# Codex — Add the Operations Template Pack

Act as the Developer only. Integrate this content pack into the existing VA Relay app; do not rebuild the app or add a new feature phase.

## Inspect first

Read `AGENTS.md`, the current `src/lib/templates.ts`, `src/lib/types.ts`, the process form, template renderer, validation and relevant tests. Inspect the supplied `va-operations-templates.ts` and setup guide. Preserve user changes and existing entries. Treat this as catalog data, not a request for migrations or database seeding.

## Implement

1. Copy the supplied module into `src/lib/va-operations-templates.ts`, adapting only types if the repository has genuinely changed.
2. Import its `OPERATIONS_TEMPLATES` array and append it once to the existing `TEMPLATES` array. Preserve all current entries and `EMPTY_WORKFLOW`.
3. Confirm that the existing Use template action loads each process into the editor as a draft and retains instructions, step IDs, kinds, evidence, N/A, review and permission settings.
4. Do not auto-create client processes, schedules, users, invitations, handovers or runs. Do not overwrite existing processes or historical SOP snapshots.
5. Keep role placeholders and empty resources. Do not invent client URLs, due times, tax rules, prices or member IDs. Do not add personal names or source-document references to customer-facing text.
6. No JSON import feature is requested. Do not imply one exists. The companion JSON is developer data.
7. Do not add marketing, payroll, CRM, integrations, AI, permission-bypass or unrelated UI work.

## Verify

- The existing catalog plus exactly 20 additional entries appears, without duplicates after reload.
- Stable unique step IDs within each process; 113 total steps in this pack.
- Each Workflow matches the current validated schema and allowed enum values.
- All empty required answers prevent completion as intended.
- Both before/after labels are required for the configured change steps.
- The 09A and 15 before-action gates remain present and never allow N/A. A separate authorized reviewer is required.
- N/A only applies to the two optional requested B2B document stages and needs a reason. It must not become a workaround for mandatory work.
- Only resources entered and approved by the client are saved; never fill empty arrays with invented URLs.
- Creating a process stays a draft until an authorized owner/manager publishes it.
- Existing runs keep their SOP snapshots after template installation or later process publication.
- Report the distinction between client-agreed completion criteria and what automated validation can actually check. A saved adverse answer does not create an issue automatically.

Run the repository's tests, typecheck, lint and build. Use disposable credentials for available browser tests. Where no live environment or credentials exist, state that the authenticated flow remains unverified rather than reporting it as passed. Never bypass RLS or expose service-role keys for a test.

## Deliver

Summarize changed files, exact checks executed, pass/fail/blocked results, and any current-schema adaptation. Stop when the catalog addition is integrated and validated. Do not publish or execute operational processes for real clients.
