import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { completionProblems } from "../../src/lib/domain.mjs";

// Load the real TypeScript data/schema under the repository's native Node test runner.
function moduleUrl(path, imports = {}) {
  let source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const [specifier, url] of Object.entries(imports))
    source = source.replaceAll(JSON.stringify(specifier), JSON.stringify(url));
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const packUrl = moduleUrl("../../src/lib/va-operations-templates.ts");
const catalogUrl = moduleUrl("../../src/lib/templates.ts", {
  "./va-operations-templates": packUrl,
});
const { OPERATIONS_TEMPLATES: pack } = await import(packUrl);
const { TEMPLATES, EMPTY_WORKFLOW } = await import(catalogUrl);
const { workflowSchema } = await import(
  moduleUrl("../../src/lib/schemas.ts", {
    zod: import.meta.resolve("zod"),
    "./domain.mjs": new URL("../../src/lib/domain.mjs", import.meta.url).href,
  })
);
const steps = pack.flatMap((flow) => flow.steps);
const response = (step) => ({
  step_id: step.id,
  value:
    step.kind === "checkbox"
      ? true
      : step.kind === "select"
        ? step.options[0]
        : step.kind === "url"
          ? "https://example.test/approved-reference"
          : ["number", "amount"].includes(step.kind)
            ? 0
            : step.kind === "yes_no"
              ? false
              : step.kind === "date"
                ? "2026-10-07"
                : "Recorded result",
});
const evidence = (step) =>
  step.evidence === "none"
    ? []
    : (step.evidence === "before_after" ? ["before", "after"] : ["general"]).map((label) => ({
        step_id: step.id,
        label,
        state: "attached",
      }));
const approvals = (step) =>
  step.approval_before ? [{ step_id: step.id, status: "approved" }] : [];

test("catalog preserves three starters and appends exactly 20 unchanged operations templates", async () => {
  assert.equal(pack.length, 20);
  assert.equal(steps.length, 113);
  assert.equal(TEMPLATES.length, 23);
  for (const workflow of TEMPLATES) workflowSchema.parse(workflow);
  assert.equal(new Set(TEMPLATES.map((f) => f.title)).size, 23);
  assert.deepEqual(
    TEMPLATES.slice(0, 3).map((f) => f.title),
    ["Daily marketplace mail review", "Invoice collection and handoff", "Weekly listing check"],
  );
  assert.deepEqual(TEMPLATES.slice(3), pack);
  assert.deepEqual(
    pack,
    JSON.parse(
      readFileSync(
        new URL(
          "../../public/VA_Relay_Operations_Template_Pack/VA_Relay_Operations_Templates.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  );
  assert.deepEqual((await import(catalogUrl + "#reload")).TEMPLATES, TEMPLATES);
  assert.deepEqual(EMPTY_WORKFLOW, {
    title: "",
    description: "",
    sop: "",
    can_do: "",
    ask_first: "",
    never_do: "",
    resources: [],
    steps: [],
    review_required: false,
  });
});

for (const flow of pack) {
  test(`${flow.title}: schema, IDs, empty answers and positive completion`, () => {
    assert.deepEqual(workflowSchema.parse(flow), flow);
    assert.equal(new Set(flow.steps.map((s) => s.id)).size, flow.steps.length);
    assert.deepEqual(flow.resources, []);
    assert.match(flow.sop, /CLIENT SETUP/);
    for (const step of flow.steps) {
      assert.equal(step.required, true);
      assert.match(step.id, /^operations-[a-z0-9]+-step-\d{2}$/);
      for (const value of [null, "", "   "])
        assert.ok(
          completionProblems([step], [{ step_id: step.id, value }], evidence(step), approvals(step))
            .length,
        );
      assert.deepEqual(
        completionProblems([step], [response(step)], evidence(step), approvals(step)),
        [],
      );
      for (const item of evidence(step)) {
        const remaining = evidence(step).filter((e) => e.label !== item.label);
        assert.ok(completionProblems([step], [response(step)], remaining, approvals(step)).length);
        assert.ok(
          completionProblems(
            [step],
            [response(step)],
            [...remaining, { ...item, state: "pending" }],
            approvals(step),
          ).length,
        );
      }
      const na = {
        step_id: step.id,
        not_applicable: true,
        na_reason: "Client did not request this document stage",
      };
      assert.equal(completionProblems([step], [na], [], []).length === 0, step.allow_na);
      assert.ok(completionProblems([step], [{ ...na, na_reason: " " }], [], []).length);
    }
  });
}

test("only two optional B2B document stages allow N/A; 09A and 15 gates cannot be bypassed", () => {
  const optional = steps.filter((s) => s.allow_na);
  assert.equal(optional.length, 2);
  assert.ok(optional.every((s) => s.id.startsWith("operations-06-")));
  const gated = pack.filter((f) => f.steps.some((s) => s.approval_before));
  assert.deepEqual(
    gated.map((f) => f.title.split(" | ")[0]),
    ["09A", "15"],
  );
  for (const flow of gated) {
    // Before-action permission is separate from optional final submission review.
    assert.equal(flow.review_required, flow.title.startsWith("15 |"));
    for (const step of flow.steps.filter((s) => s.approval_before)) {
      assert.equal(step.allow_na, false);
      for (const status of ["pending", "rejected"])
        assert.ok(
          completionProblems([step], [response(step)], evidence(step), [
            { step_id: step.id, status },
          ]).length,
        );
      assert.ok(completionProblems([step], [response(step)], evidence(step), []).length);
    }
  }
});
