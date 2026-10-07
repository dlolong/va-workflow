import test from "node:test";
import assert from "node:assert/strict";
import {
  isOverdue,
  isDueToday,
  safeNext,
  safeUrl,
  csvCell,
  toCsv,
  completionProblems,
  parsePastedSteps,
  hasWritableRole,
  cleanFilename,
  displayStatus,
} from "../../src/lib/domain.mjs";
const now = new Date("2026-10-06T12:00:00Z");
const step = (patch = {}) => ({
  id: "one",
  title: "Check listing",
  kind: "checkbox",
  required: true,
  allow_na: false,
  evidence: "none",
  approval_before: false,
  ...patch,
});
const answer = (patch = {}) => ({
  step_id: "one",
  value: true,
  not_applicable: false,
  na_reason: "",
  ...patch,
});
test("waiting on client remains overdue", () =>
  assert.equal(
    isOverdue({ status: "waiting_on_client", due_at: "2026-10-05T00:00:00Z" }, now),
    true,
  ));
test("blocked remains overdue", () =>
  assert.equal(isOverdue({ status: "blocked", due_at: "2026-10-05T00:00:00Z" }, now), true));
test("accepted work is not in overdue backlog", () =>
  assert.equal(isOverdue({ status: "completed", due_at: "2026-10-05T00:00:00Z" }, now), false));
test("cancelled work is not overdue", () =>
  assert.equal(isOverdue({ status: "cancelled", due_at: "2026-10-05T00:00:00Z" }, now), false));
test("no deadline is not silently overdue", () =>
  assert.equal(isOverdue({ status: "in_progress", due_at: null }, now), false));
test("future deadline is not overdue", () =>
  assert.equal(isOverdue({ status: "in_progress", due_at: "2026-10-07T00:00:00Z" }, now), false));
test("local due-today respects Manila midnight", () =>
  assert.equal(
    isDueToday(
      { status: "in_progress", due_at: "2026-10-06T18:00:00Z" },
      "Asia/Manila",
      new Date("2026-10-06T20:00:00Z"),
    ),
    true,
  ));
test("local due-today differs from UTC day", () =>
  assert.equal(
    isDueToday(
      { status: "in_progress", due_at: "2026-10-06T18:00:00Z" },
      "Asia/Manila",
      new Date("2026-10-06T10:00:00Z"),
    ),
    false,
  ));
test("safe internal return path is retained", () =>
  assert.equal(safeNext("/invite/abc?x=1"), "/invite/abc?x=1"));
for (const bad of [
  "https://evil.example",
  "//evil.example",
  "/\\evil.example",
  "/%2f%2fevil.example",
  "/%255c%255cevil.example",
  "/\r\nLocation: evil",
  "/%ZZ",
]) {
  test(`reject redirect ${JSON.stringify(bad)}`, () => assert.equal(safeNext(bad), "/dashboard"));
}
test("missing redirect goes to dashboard", () => assert.equal(safeNext(null), "/dashboard"));
test("safe URLs allow HTTP(S)", () => {
  assert.equal(safeUrl("https://example.com"), true);
  assert.equal(safeUrl("http://localhost:3000"), true);
});
for (const bad of [
  "javascript:alert(1)",
  "data:text/html,hello",
  "ftp://example.com",
  "https://user:pass@example.com",
]) {
  test(`unsafe URL ${bad}`, () => assert.equal(safeUrl(bad), false));
}
test("CSV quotes embedded commas and quotes", () =>
  assert.equal(csvCell('Hello, "Mary"'), '"Hello, ""Mary"""'));
for (const formula of ["=1+1", "+SUM(A1)", "@SUM(1)", "-1+2", " \t=HYPERLINK(1)"]) {
  test(`CSV formula defense ${formula}`, () => assert.ok(csvCell(formula).startsWith("\"'")));
}
test("CSV has CRLF row breaks", () =>
  assert.equal(
    toCsv([
      ["a", "b"],
      [1, 2],
    ]),
    '"a","b"\r\n"1","2"',
  ));
test("missing required checkbox fails", () =>
  assert.equal(completionProblems([step()], [], []).length, 1));
test("unchecked required checkbox fails", () =>
  assert.equal(completionProblems([step()], [answer({ value: false })], []).length, 1));
test("valid checkbox completes", () =>
  assert.deepEqual(completionProblems([step()], [answer()], []), []));
test("numeric zero is a valid required answer", () =>
  assert.deepEqual(completionProblems([step({ kind: "number" })], [answer({ value: 0 })], []), []));
test("No is a valid yes/no answer", () =>
  assert.deepEqual(
    completionProblems([step({ kind: "yes_no" })], [answer({ value: false })], []),
    [],
  ));
test("N/A requires configured permission and explanation", () =>
  assert.equal(
    completionProblems([step()], [answer({ not_applicable: true, na_reason: "Not used" })], [])
      .length,
    1,
  ));
test("approved N/A skips proof requirements", () =>
  assert.deepEqual(
    completionProblems(
      [step({ allow_na: true, evidence: "file" })],
      [answer({ not_applicable: true, na_reason: "This channel has no listing" })],
      [],
    ),
    [],
  ));
test("pending upload is not evidence", () =>
  assert.equal(
    completionProblems(
      [step({ evidence: "file" })],
      [answer()],
      [{ step_id: "one", state: "pending" }],
    ).length,
    1,
  ));
test("attached evidence counts", () =>
  assert.deepEqual(
    completionProblems(
      [step({ evidence: "file" })],
      [answer()],
      [{ step_id: "one", state: "attached" }],
    ),
    [],
  ));
test("before/after needs both labels", () =>
  assert.equal(
    completionProblems(
      [step({ evidence: "before_after" })],
      [answer()],
      [{ step_id: "one", state: "attached", label: "before" }],
    ).length,
    1,
  ));
test("approved permission unlocks the gate", () =>
  assert.deepEqual(
    completionProblems(
      [step({ approval_before: true })],
      [answer()],
      [],
      [{ step_id: "one", status: "approved" }],
    ),
    [],
  ));
test("pending permission does not unlock the gate", () =>
  assert.equal(
    completionProblems(
      [step({ approval_before: true })],
      [answer()],
      [],
      [{ step_id: "one", status: "pending" }],
    ).length,
    1,
  ));
test("checklist paste strips list markers", () =>
  assert.deepEqual(parsePastedSteps("1. Open portal\n- Check price\n☐ Capture proof\n\n"), [
    "Open portal",
    "Check price",
    "Capture proof",
  ]));
test("manager role is explicit", () => {
  assert.equal(hasWritableRole("manager"), true);
  assert.equal(hasWritableRole("client"), false);
  assert.equal(hasWritableRole("va"), false);
});
test("filename cleanup removes separators", () =>
  assert.equal(cleanFilename("a/b:c.png"), "a_b_c.png"));
test("statuses read naturally", () =>
  assert.equal(displayStatus("waiting_on_client"), "waiting on client"));

test("whitespace alone does not satisfy a required text answer", () => {
  const step = {
    id: "whitespace",
    title: "Explanation",
    kind: "text",
    required: true,
    allow_na: false,
    evidence: "none",
    approval_before: false,
  };
  assert.equal(completionProblems([step], [{ step_id: step.id, value: "   " }], []).length, 1);
});
