"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommand } from "@/lib/client-api";
import { EMPTY_WORKFLOW } from "@/lib/templates";
import { parsePastedSteps } from "@/lib/domain.mjs";
import type { Workflow, Step } from "@/lib/types";
import { Form, Field, Notice, text, checked } from "./ui";
function blankStep(title = ""): Step {
  return {
    id: crypto.randomUUID(),
    title,
    instructions: "",
    kind: "checkbox",
    required: true,
    allow_na: false,
    evidence: "none",
    approval_before: false,
    options: [],
  };
}
export function ProcessForm({
  workspaceId,
  close,
  initial,
  processId,
}: {
  workspaceId: string;
  close: () => void;
  initial?: Workflow;
  processId?: string;
}) {
  const source = initial || { ...EMPTY_WORKFLOW, steps: [blankStep("First step")] };
  const [steps, setSteps] = useState<Step[]>(source.steps.map((s) => ({ ...s })));
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState("");
  const { execute, busy, error } = useCommand(workspaceId);
  const router = useRouter();
  const update = (i: number, patch: Partial<Step>) =>
    setSteps((items) => items.map((s, index) => (index === i ? { ...s, ...patch } : s)));
  const move = (i: number, delta: number) =>
    setSteps((items) => {
      const copy = [...items];
      const to = i + delta;
      if (to < 0 || to >= copy.length) return copy;
      [copy[i], copy[to]] = [copy[to]!, copy[i]!];
      return copy;
    });
  return (
    <Form
      id="process-form"
      busy={busy}
      error={error}
      submit="Save draft"
      onSubmit={async (f) => {
        const resources = text(f, "resources")
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => {
            const split = line.indexOf("|");
            return split < 0
              ? { label: "Resource", url: line.trim() }
              : { label: line.slice(0, split).trim(), url: line.slice(split + 1).trim() };
          });
        const content: Workflow = {
          title: text(f, "title"),
          description: text(f, "description"),
          sop: text(f, "sop"),
          can_do: text(f, "can_do"),
          ask_first: text(f, "ask_first"),
          never_do: text(f, "never_do"),
          resources,
          steps,
          review_required: checked(f, "review_required"),
        };
        await execute("save_process", { id: processId || null, content });
        close();
        router.refresh();
      }}
    >
      <div className="grid-2">
        <Field label="Process title">
          <input
            id="process-title"
            name="title"
            defaultValue={source.title}
            required
            maxLength={200}
          />
        </Field>
        <Field label="Short description">
          <input id="process-description" name="description" defaultValue={source.description} />
        </Field>
      </div>
      <Field label="SOP / how to perform the work">
        <textarea id="process-sop" name="sop" defaultValue={source.sop} rows={5} />
      </Field>
      <div className="grid-3">
        <Field label="VA can do">
          <textarea id="process-can-do" name="can_do" defaultValue={source.can_do} />
        </Field>
        <Field label="Ask first">
          <textarea id="process-ask-first" name="ask_first" defaultValue={source.ask_first} />
        </Field>
        <Field label="Never do">
          <textarea id="process-never-do" name="never_do" defaultValue={source.never_do} />
        </Field>
      </div>
      <Field label="Resources · one Label | https://link per line">
        <textarea
          id="process-resources"
          name="resources"
          defaultValue={source.resources.map((r) => `${r.label} | ${r.url}`).join("\n")}
          rows={2}
        />
      </Field>
      <label className="check-label">
        <input
          id="process-review-required"
          name="review_required"
          type="checkbox"
          defaultChecked={source.review_required}
        />
        Require review after submission
      </label>
      <details className="step-details">
        <summary>Paste an existing checklist</summary>
        <div className="stack-sm" style={{ marginTop: 10 }}>
          <textarea
            id="paste-checklist"
            aria-label="Paste one checklist step per line"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="One step per line"
          />
          <button
            id="append-pasted-steps"
            className="btn"
            type="button"
            onClick={() => {
              const lines = parsePastedSteps(paste);
              if (steps.length + lines.length > 100) {
                setPasteError("A process supports up to 100 steps.");
                return;
              }
              setSteps((s) => [...s, ...lines.map((line: string) => blankStep(line))]);
              setPaste("");
              setPasteError("");
            }}
          >
            Append as steps
          </button>
          {pasteError && <Notice error>{pasteError}</Notice>}
        </div>
      </details>
      <div className="row between">
        <h3>Execution checklist</h3>
        <button
          id="add-process-step"
          type="button"
          className="btn small"
          disabled={steps.length >= 100}
          onClick={() => setSteps((s) => [...s, blankStep()])}
        >
          + Add step
        </button>
      </div>
      {steps.map((s, i) => (
        <section className="step-editor stack-sm" key={s.id}>
          <div className="row between">
            <span className="step-index">Step {i + 1}</span>
            <div className="row">
              <button
                id={`step-${s.id}-up`}
                type="button"
                className="btn small"
                disabled={i === 0}
                aria-label={`Move step ${i + 1} up`}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                id={`step-${s.id}-down`}
                type="button"
                className="btn small"
                disabled={i === steps.length - 1}
                aria-label={`Move step ${i + 1} down`}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button
                id={`step-${s.id}-remove`}
                type="button"
                className="btn small danger"
                disabled={steps.length === 1}
                onClick={() => setSteps((items) => items.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </div>
          </div>
          <Field label="Step title">
            <input
              id={`step-${s.id}-title`}
              required
              value={s.title}
              onChange={(e) => update(i, { title: e.target.value })}
              maxLength={200}
            />
          </Field>
          <Field label="Instructions and expected result">
            <textarea
              id={`step-${s.id}-instructions`}
              value={s.instructions}
              onChange={(e) => update(i, { instructions: e.target.value })}
              rows={2}
            />
          </Field>
          <div className="grid-2">
            <Field label="Input type">
              <select
                id={`step-${s.id}-kind`}
                value={s.kind}
                onChange={(e) => update(i, { kind: e.target.value as Step["kind"] })}
              >
                {["checkbox", "text", "number", "amount", "date", "url", "yes_no", "select"].map(
                  (k) => (
                    <option key={k} value={k}>
                      {k.replaceAll("_", " ")}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Evidence requirement">
              <select
                id={`step-${s.id}-evidence`}
                value={s.evidence}
                onChange={(e) => update(i, { evidence: e.target.value as Step["evidence"] })}
              >
                <option value="none">None</option>
                <option value="file">File / screenshot</option>
                <option value="before_after">Before and after files</option>
              </select>
            </Field>
          </div>
          {s.kind === "select" && (
            <Field label="Dropdown choices · one per line">
              <textarea
                id={`step-${s.id}-choices`}
                value={s.options.join("\n")}
                onChange={(e) => update(i, { options: e.target.value.split("\n") })}
              />
            </Field>
          )}
          <div className="row">
            <label className="check-label">
              <input
                id={`step-${s.id}-required`}
                type="checkbox"
                checked={s.required}
                onChange={(e) => update(i, { required: e.target.checked })}
              />
              Required answer
            </label>
            <label className="check-label">
              <input
                id={`step-${s.id}-na`}
                type="checkbox"
                checked={s.allow_na}
                onChange={(e) => update(i, { allow_na: e.target.checked })}
              />
              Allow N/A with reason
            </label>
            <label className="check-label">
              <input
                id={`step-${s.id}-approval`}
                type="checkbox"
                checked={s.approval_before}
                onChange={(e) => update(i, { approval_before: e.target.checked })}
              />
              Permission before action
            </label>
          </div>
        </section>
      ))}
      <Notice>
        Save a draft, then publish it from the process list. New runs use the latest published
        version; existing work is never silently rewritten.
      </Notice>
    </Form>
  );
}
