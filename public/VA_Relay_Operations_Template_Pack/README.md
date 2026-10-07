# VA Relay — Operations Template Pack

## Included

- `VA_Relay_Operations_Template_Pack.pdf`: one-page process cards plus setup, index and handover guidance.
- `VA_Relay_Operations_Template_Pack.md`: editable instructions, paste-ready step titles and exact per-step settings.
- `va-operations-templates.ts`: 20 catalog entries shaped as the original V1 `Workflow[]`.
- `VA_Relay_Operations_Templates.json`: the same 20 workflow objects for developer use. **The current app has no JSON import UI.**
- `Template_Setup_Guide.json`: companion metadata; not a database payload.
- `CODEX_ADD_TEMPLATES.md`: limited integration and QA instructions.
- `VALIDATION.md`: checks performed on the template package.

The pack retains 18 work areas and splits promotion registration/start/end into 3 separately assignable checklists. There are 20 processes and 113 steps. Everything is role-based. No real accounts, member IDs, files or schedules are preconfigured.

## Use without code

Open the Markdown guide. Create a process, paste its checklist titles, and configure instructions/input/evidence/permissions. Replace all setup placeholders and have an owner/manager publish. Pasting text only creates default steps; it does not apply the typed fields or evidence rules automatically.

## Add to the original starter's catalog

1. Copy `va-operations-templates.ts` to `src/lib/va-operations-templates.ts`.
2. In the current `src/lib/templates.ts`, add:

```ts
import { OPERATIONS_TEMPLATES } from "./va-operations-templates";
```

3. Keep existing imports, helpers, entries, and `EMPTY_WORKFLOW`. Add the new entries to the current array:

```ts
export const TEMPLATES: Workflow[] = [
  // Keep all of your existing template objects here.
  ...OPERATIONS_TEMPLATES,
];
```

The snippet shows the insertion, not a replacement for the complete file. Keep all actual existing entries instead of replacing them with the comment. Add the spread once only. No other app change or migration is needed in the supplied starter: its template grid already reads this array.

4. Run your application checks and inspect **Processes & SOPs → Start with a template**. Choose a template and click **Use template**. Fill the client setup, save a draft and review before publishing. A template card itself does not create a workspace process or assign work.
5. Create runs and schedules deliberately. Keep product/channel/account scope in the run title, reference and resources. Never install operational defaults into all client workspaces automatically.

## Important setup choices

- Confirm cadence wherever it is unspecified. Do not manufacture daily tasks for every work area.
- Keep the campaign start and end as separate runs; create both intentionally.
- Pick an authorized separate reviewer for all review-required or permission-gated runs. The 09A gate needs the business owner's campaign decision.
- The 15 gate and selected final-review settings are suggested safeguards for client approval, not newly granted decision authority.
- For 12, do not convert an agreed “before the 10th” instruction to “on the 10th.” Confirm applicability and exact cutoff.
- Actual portal procedures, prices, tax instructions, stock thresholds and URLs must come from the client.
- New templates do not overwrite published processes or existing run snapshots.

For an app already modified by Codex, inspect its current type and template rendering first. Use `CODEX_ADD_TEMPLATES.md` rather than replacing a changed file blindly.
