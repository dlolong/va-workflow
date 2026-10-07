"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommand } from "@/lib/client-api";
import { EMPTY_WORKFLOW } from "@/lib/templates";
import { STAGES } from "@/lib/config";
import { inputToUtc, localInput } from "@/lib/time";
import type { DataBundle, Workflow, Process, Step, Schedule, Training } from "@/lib/types";
import { Form, Field, MemberSelect, Notice, text, checked } from "./ui";
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
export function TaskForm({
  data,
  close,
  processId = "",
}: {
  data: DataBundle;
  close: () => void;
  processId?: string;
}) {
  const { execute, busy, error } = useCommand(data.workspace.id);
  const router = useRouter();
  const [selected, setSelected] = useState(processId);
  const [quickStepId] = useState(() => crypto.randomUUID());
  const [assignee, setAssignee] = useState(data.me.id);
  const process = data.processes.find((p) => p.id === selected);
  return (
    <Form
      id="new-task-form"
      busy={busy}
      error={error}
      submit="Create work"
      onSubmit={async (f) => {
        const flow: Workflow = {
          ...EMPTY_WORKFLOW,
          title: text(f, "title"),
          description: text(f, "instructions"),
          sop: text(f, "instructions"),
          review_required: checked(f, "review_required"),
          steps: [
            {
              ...blankStep("Complete the requested outcome"),
              id: quickStepId,
              evidence: checked(f, "evidence_required") ? "file" : "none",
            },
          ],
        };
        const result = await execute("create_run", {
          process_id: selected || null,
          ...(!selected ? { content: flow } : {}),
          title: text(f, "title"),
          assignee_id: assignee,
          reviewer_id: text(f, "reviewer_id") || null,
          due_at: inputToUtc(text(f, "due_at"), data.workspace.timezone),
          reference: text(f, "reference"),
          source_url: text(f, "source_url"),
          priority: text(f, "priority"),
        });
        close();
        router.push(`/workspaces/${data.workspace.id}/runs/${result.id}`);
      }}
    >
      <Field label="Start from">
        <select id="task-process" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Quick one-off task</option>
          {data.processes
            .filter((p) => p.published_version && !p.archived)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} · v{p.published_version}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Task title">
        <input
          id="task-title"
          name="title"
          required={!selected}
          maxLength={200}
          placeholder={process?.title || "e.g. Prepare invoice for order B2B-1042"}
        />
      </Field>
      {!selected && (
        <>
          <Field label="Instructions and acceptance criteria">
            <textarea
              id="task-instructions"
              name="instructions"
              required
              placeholder="What should be done? What does a correct result look like?"
            />
          </Field>
          <div className="row">
            <label className="check-label">
              <input id="task-review-required" name="review_required" type="checkbox" />
              Review required
            </label>
            <label className="check-label">
              <input id="task-evidence-required" name="evidence_required" type="checkbox" />
              Evidence file required
            </label>
          </div>
        </>
      )}
      {selected && (
        <Notice>
          Uses the published SOP, not its unpublished draft. Existing runs retain their original
          version.
        </Notice>
      )}
      <div className="grid-2">
        <Field label="Assignee">
          <select
            id="task-assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            required
          >
            {data.members
              .filter((m) => m.active && (data.role !== "va" || m.user_id === data.me.id))
              .map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profile?.display_name || m.user_id} · {m.role}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Reviewer">
          <MemberSelect
            members={data.members}
            name="reviewer_id"
            required={false}
            reviewer
            exclude={assignee}
          />
        </Field>
        <Field label={`Due date · ${data.workspace.timezone}`}>
          <input id="task-due" name="due_at" type="datetime-local" />
        </Field>
        <Field label="Priority">
          <select id="task-priority" name="priority">
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </Field>
        <Field label="Order / invoice / product reference">
          <input id="task-reference" name="reference" maxLength={200} />
        </Field>
        <Field label="Source link">
          <input id="task-source" name="source_url" type="url" placeholder="https://…" />
        </Field>
      </div>
      <p className="hint">
        Dates use the client timezone shown above. A reviewer is mandatory for processes with review
        or pre-action approval gates.
      </p>
    </Form>
  );
}
export function ScheduleForm({
  data,
  close,
  initial,
  processId,
}: {
  data: DataBundle;
  close: () => void;
  initial?: Schedule;
  processId?: string;
}) {
  const { execute, busy, error } = useCommand(data.workspace.id);
  const router = useRouter();
  const [frequency, setFrequency] = useState(initial?.frequency || "weekly");
  return (
    <Form
      id="schedule-form"
      busy={busy}
      error={error}
      submit="Save schedule"
      onSubmit={async (f) => {
        await execute("save_schedule", {
          id: initial?.id || null,
          process_id: text(f, "process_id"),
          assignee_id: text(f, "assignee_id"),
          reviewer_id: text(f, "reviewer_id") || null,
          frequency,
          weekday: Number(text(f, "weekday") || 1),
          monthday: Number(text(f, "monthday") || 1),
          local_time: text(f, "local_time"),
          timezone: text(f, "timezone"),
          lead_minutes: Number(text(f, "lead_minutes")),
          starts_after: null,
        });
        close();
        router.refresh();
      }}
    >
      <Field label="Published process">
        <select
          id="schedule-process"
          name="process_id"
          defaultValue={initial?.process_id || processId || ""}
          required
        >
          <option value="">Select a process</option>
          {data.processes
            .filter((p) => p.published_version && !p.archived)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
        </select>
      </Field>
      <div className="grid-2">
        <Field label="Assignee">
          <MemberSelect
            members={data.members}
            name="assignee_id"
            defaultValue={initial?.assignee_id || data.me.id}
          />
        </Field>
        <Field label="Reviewer">
          <MemberSelect
            members={data.members}
            name="reviewer_id"
            defaultValue={initial?.reviewer_id}
            reviewer
            required={false}
          />
        </Field>
        <Field label="Repeat">
          <select
            id="schedule-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Schedule["frequency"])}
          >
            <option value="daily">Every day</option>
            <option value="weekdays">Every weekday</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
          </select>
        </Field>
        <Field label="Deadline time">
          <input
            id="schedule-time"
            type="time"
            name="local_time"
            defaultValue={initial?.local_time?.slice(0, 5) || "17:00"}
            required
          />
        </Field>
        {frequency === "weekly" && (
          <Field label="Day of week">
            <select id="schedule-weekday" name="weekday" defaultValue={initial?.weekday ?? 1}>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                (day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ),
              )}
            </select>
          </Field>
        )}
        {frequency === "monthly" && (
          <Field
            label="Day of month"
            hint="Days beyond the end of a month use that month's last day."
          >
            <input
              id="schedule-monthday"
              name="monthday"
              type="number"
              min={1}
              max={31}
              defaultValue={initial?.monthday ?? 1}
              required
            />
          </Field>
        )}
        <Field label="Schedule timezone">
          <input
            id="schedule-timezone"
            name="timezone"
            defaultValue={initial?.timezone || data.workspace.timezone}
            required
          />
        </Field>
        <Field label="Create work ahead of deadline">
          <select
            id="schedule-lead"
            name="lead_minutes"
            defaultValue={initial?.lead_minutes ?? 1440}
          >
            <option value={0}>At deadline (not recommended)</option>
            <option value={60}>1 hour before</option>
            <option value={480}>8 hours before</option>
            <option value={1440}>1 day before</option>
            <option value={10080}>7 days before</option>
          </select>
        </Field>
      </div>
      <Notice>
        Automatic generation requires the configured cron job. The manual “Generate due work” button
        runs the same duplicate-safe scheduler. Editing affects future generation, not
        already-created runs.
      </Notice>
    </Form>
  );
}
export function TrainingForm({
  data,
  close,
  initial,
}: {
  data: DataBundle;
  close: () => void;
  initial?: Training;
}) {
  const { execute, busy, error } = useCommand(data.workspace.id);
  const router = useRouter();
  return (
    <Form
      id="training-form"
      busy={busy}
      error={error}
      onSubmit={async (f) => {
        await execute("save_training", {
          process_id: text(f, "process_id"),
          user_id: text(f, "user_id"),
          trainer_id: text(f, "trainer_id"),
          stage: text(f, "stage"),
          note: text(f, "note"),
        });
        close();
        router.refresh();
      }}
    >
      <Field label="Process">
        <select
          id="training-process"
          name="process_id"
          required
          defaultValue={initial?.process_id || ""}
        >
          <option value="">Choose a process</option>
          {data.processes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid-2">
        <Field label="VA / trainee">
          <MemberSelect members={data.members} name="user_id" defaultValue={initial?.user_id} />
        </Field>
        <Field label="Trainer">
          <MemberSelect
            members={data.members}
            name="trainer_id"
            defaultValue={initial?.trainer_id || data.me.id}
          />
        </Field>
      </div>
      <Field label="Handover stage">
        <select id="training-stage" name="stage" defaultValue={initial?.stage || "not_started"}>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Progress / sign-off note">
        <textarea id="training-note" name="note" defaultValue={initial?.note || ""} />
      </Field>
      <p className="hint">
        SOP approval and ownership require a published SOP, a separate reviewer and a written
        sign-off.
      </p>
    </Form>
  );
}
// Kept as a utility for dialogs that edit an existing due date.
export { inputToUtc, localInput };
export type { Process };

export { ProcessForm } from "./process-form";
