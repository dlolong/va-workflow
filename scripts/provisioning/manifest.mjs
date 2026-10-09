import ts from "typescript";
import { readFileSync } from "node:fs";
import { z } from "zod";
// Use the current application validator, not a second drifting workflow schema.
let code = ts.transpileModule(
  readFileSync(new URL("../../src/lib/schemas.ts", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  },
).outputText;
code = code
  .replace('"zod"', JSON.stringify(import.meta.resolve("zod")))
  .replace(
    '"./domain.mjs"',
    JSON.stringify(new URL("../../src/lib/domain.mjs", import.meta.url).href),
  );
const { workflowSchema } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);
const key = z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/);
const itemSchema = z.discriminatedUnion("kind", [
  z.strictObject({ key, kind: z.literal("process"), content: workflowSchema }),
  z.strictObject({
    key,
    kind: z.literal("preparation"),
    process_keys: z.array(key).optional(),
    content: workflowSchema.refine(
      (f) => !f.review_required && f.steps.every((s) => !s.approval_before),
      "Preparation cannot replace operational gates",
    ),
  }),
  z.strictObject({
    key,
    kind: z.literal("training"),
    process_key: key,
    trainer_id: z.string().uuid(),
  }),
]);
export function validateManifest(value) {
  const result = z
    .object({
      setupKey: key,
      fixedTarget: z
        .strictObject({
          workspaceId: z.string().uuid(),
          maryUserId: z.string().uuid(),
          setupKey: key,
        })
        .optional(),
      items: z.array(itemSchema).min(1).max(100),
      unresolved: z.array(z.string()).optional(),
      schedules: z.array(z.unknown()).optional(),
    })
    .parse(value);
  const keys = result.items.map((item) => item.key);
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate setup keys");
  const processKeys = new Set(result.items.filter((i) => i.kind === "process").map((i) => i.key));
  for (const item of result.items)
    for (const ref of item.kind === "training" ? [item.process_key] : item.process_keys || [])
      if (!processKeys.has(ref)) throw new Error("Unknown process reference");
  return result;
}
