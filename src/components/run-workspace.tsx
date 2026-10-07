"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCommand } from "@/lib/client-api";
import {
  EDITABLE,
  completionProblems,
  displayStatus,
  hasWritableRole,
  isOverdue,
} from "@/lib/domain.mjs";
import { formatTime, inputToUtc, localInput } from "@/lib/time";
import type { RunBundle } from "@/lib/types";
import { StepEditor } from "./run-step";
import {
  Badge,
  Empty,
  Field,
  Form,
  MemberSelect,
  Modal,
  Notice,
  checked,
  memberName,
  text,
} from "./ui";
import { WorkflowRead } from "./workflow-read";
export function RunWorkspace({ data }: { data: RunBundle }) {
  const router = useRouter();
  const { execute, busy, error } = useCommand(data.workspace.id);
  const [refreshing, startRefresh] = useTransition();
  const [message, setMessage] = useState("");
  const [dirtySteps, setDirtySteps] = useState<Record<string, boolean>>({});
  const markDirty = useCallback(
    (id: string, dirty: boolean) => setDirtySteps((s) => ({ ...s, [id]: dirty })),
    [],
  );
  const dirty = Object.values(dirtySteps).some(Boolean);
  const run = data.run;
  const manage = hasWritableRole(data.role);
  const editable =
    !data.workspace.archived_at &&
    EDITABLE.includes(run.status) &&
    (run.assignee_id === data.userId || manage);
  const refresh = () => startRefresh(() => router.refresh());
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("va-relay:unsaved", { detail: dirty }));
    return () => {
      window.dispatchEvent(new CustomEvent("va-relay:unsaved", { detail: false }));
    };
  }, [dirty]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (
        target &&
        target.getAttribute("href") &&
        target.getAttribute("target") !== "_blank" &&
        !target.getAttribute("href")?.startsWith("#") &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !window.confirm("There are unsaved changes or an unfinished upload. Leave this page?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    // Modern browsers expose cancelable same-document history traversals.
    // Cross-document exits remain covered by beforeunload; older browsers may
    // not expose a cancelable traversal and must not be described as loss-proof.
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const traverse = (event: Event) => {
      if (
        (event as Event & { navigationType?: string }).navigationType === "traverse" &&
        event.cancelable &&
        !window.confirm("There are unsaved changes or an unfinished upload. Leave this page?")
      )
        event.preventDefault();
    };
    navigation?.addEventListener("navigate", traverse);
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      navigation?.removeEventListener("navigate", traverse);
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  const doAction = async (action: string, payload: Record<string, unknown>, success = "Saved.") => {
    setMessage("");
    await execute(action, { run_id: run.id, ...payload });
    setMessage(success);
    refresh();
  };
  const done = run.snapshot.steps.filter((step) => {
    const answer = data.responses.find((r) => r.step_id === step.id);
    return (
      answer &&
      (answer.not_applicable ||
        (answer.value !== null &&
          (typeof answer.value !== "string" || Boolean(answer.value.trim())) &&
          (step.kind !== "checkbox" || answer.value === true)))
    );
  }).length;
  return (
    <>
      <div className="row between">
        <Link className="btn link" href={`/workspaces/${data.workspace.id}/tasks`}>
          ← All work
        </Link>
        <span className="hint">
          {data.workspace.name} · {run.reference || "No reference"}
        </span>
      </div>
      <header className="page-intro">
        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <Badge status={run.status} />
            {isOverdue(run) && <Badge status="overdue" />}
            {run.priority === "high" && <Badge status="high priority" />}
          </div>
          <h1>{run.title}</h1>
          <p>
            Assigned to {memberName(data.members, run.assignee_id)} ·{" "}
            {run.process_version ? `SOP version ${run.process_version}` : "One-off task"}
          </p>
        </div>
        <div className="row">
          <Modal
            id="view-run-sop"
            label="View SOP"
            title={`Run instructions${run.process_version ? ` · v${run.process_version}` : ""}`}
            wide
          >
            {() => <WorkflowRead flow={run.snapshot} />}
          </Modal>
          {manage && !data.workspace.archived_at && (
            <Modal
              id="reassign-run"
              label="Reassign / deadline"
              title="Reassign work or adjust the deadline"
            >
              {(close) => (
                <Form
                  id="reassign-run-form"
                  busy={busy}
                  error={error}
                  onSubmit={async (f) => {
                    await doAction(
                      "reassign_run",
                      {
                        expected_version: run.version,
                        assignee_id: text(f, "assignee_id"),
                        reviewer_id: text(f, "reviewer_id") || null,
                        due_at: inputToUtc(text(f, "due_at"), data.workspace.timezone),
                        note: text(f, "note"),
                      },
                      "Handover recorded.",
                    );
                    close();
                  }}
                >
                  <div className="grid-2">
                    <Field label="Assignee">
                      <MemberSelect
                        members={data.members}
                        name="assignee_id"
                        defaultValue={run.assignee_id}
                      />
                    </Field>
                    <Field label="Reviewer">
                      <MemberSelect
                        members={data.members}
                        name="reviewer_id"
                        reviewer
                        required={false}
                        defaultValue={run.reviewer_id}
                      />
                    </Field>
                  </div>
                  <Field label={`Deadline · ${data.workspace.timezone}`}>
                    <input
                      id="reassign-deadline"
                      name="due_at"
                      type="datetime-local"
                      defaultValue={localInput(run.due_at, data.workspace.timezone)}
                    />
                  </Field>
                  <Field label="Handover / change reason">
                    <textarea id="reassign-note" name="note" required />
                  </Field>
                  <p className="hint">
                    Previous assignments and deadline changes remain in the audit log. Completed
                    work must be reopened first.
                  </p>
                </Form>
              )}
            </Modal>
          )}
        </div>
      </header>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {dirty && (
        <div className="notice warning">
          You have unsaved work or an unfinished upload. Save each changed step before submitting or
          leaving.
        </div>
      )}
      {run.handover_note && (
        <Notice>
          <strong>Handover note:</strong> {run.handover_note}
        </Notice>
      )}
      {run.review_note && (
        <div className={`notice ${run.status === "changes_requested" ? "warning" : ""}`}>
          <strong>Reviewer feedback:</strong> {run.review_note}
        </div>
      )}
      {run.status === "for_review" &&
        run.assignee_id !== data.userId &&
        (run.reviewer_id === data.userId || manage) &&
        !data.workspace.archived_at && (
          <section className="panel pad stack">
            <h2>Review submitted work</h2>
            <Form
              id="review-run-form"
              busy={busy}
              error={error}
              submit="Record review"
              onSubmit={async (f) => {
                await doAction(
                  "review_run",
                  {
                    expected_version: run.version,
                    decision: text(f, "decision"),
                    note: text(f, "note"),
                  },
                  "Review recorded.",
                );
              }}
            >
              <div className="grid-2">
                <Field label="Decision">
                  <select name="decision" id="run-review-decision">
                    <option value="completed">Accept and complete</option>
                    <option value="changes_requested">Request corrections</option>
                  </select>
                </Field>
                <Field label="Feedback (required for corrections)">
                  <textarea name="note" id="run-review-note" rows={2} />
                </Field>
              </div>
            </Form>
          </section>
        )}
      <div className="run-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Execution checklist</h2>
                <p>Save each step. Uploaded files count only after successful confirmation.</p>
              </div>
              <Badge status={`${done}/${run.snapshot.steps.length} answered`} />
            </div>
            {run.snapshot.steps.map((step, index) => {
              const answer = data.responses.find((r) => r.step_id === step.id);
              return (
                <StepEditor
                  key={step.id}
                  step={step}
                  index={index}
                  saved={answer}
                  data={data}
                  editable={editable}
                  refreshing={refreshing}
                  dirtyChanged={markDirty}
                  refresh={refresh}
                />
              );
            })}
            <div className="pad stack-sm" style={{ borderTop: "1px solid var(--line)" }}>
              {editable && (
                <>
                  <div className="row between">
                    <small className="muted">
                      Required answers, evidence, permission gates and blocking issues are verified
                      again by the database.
                    </small>
                    <button
                      id="submit-run"
                      className="btn primary"
                      disabled={busy || refreshing || dirty}
                      onClick={async () => {
                        try {
                          const problems = completionProblems(
                            run.snapshot.steps,
                            data.responses,
                            data.evidence,
                            data.approvals,
                          );
                          if (problems.length) {
                            setMessage(problems.join(" "));
                            return;
                          }
                          await doAction(
                            "submit_run",
                            { expected_version: run.version },
                            run.snapshot.review_required
                              ? "Submitted for review."
                              : "Work completed.",
                          );
                        } catch {
                          /* Hook displays failure. */
                        }
                      }}
                    >
                      {busy || refreshing
                        ? "Saving…"
                        : run.snapshot.review_required
                          ? "Submit for review"
                          : "Complete work"}
                    </button>
                  </div>
                </>
              )}
              {!editable && (
                <p className="hint">
                  This checklist is read-only for your role or its current status.
                </p>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Issues & exceptions</h2>
              {!data.workspace.archived_at && !["completed", "cancelled"].includes(run.status) && (
                <Modal
                  id="new-issue"
                  label="+ Report issue"
                  title="Report an issue and assign a next action"
                >
                  {(close) => (
                    <Form
                      id="issue-form"
                      busy={busy}
                      error={error}
                      submit="Create issue"
                      onSubmit={async (f) => {
                        await doAction(
                          "create_issue",
                          {
                            title: text(f, "title"),
                            detail: text(f, "detail"),
                            recommendation: text(f, "recommendation"),
                            owner_id: text(f, "owner_id"),
                            follow_up_at: inputToUtc(
                              text(f, "follow_up_at"),
                              data.workspace.timezone,
                            ),
                            blocking: checked(f, "blocking"),
                          },
                          "Issue created.",
                        );
                        close();
                      }}
                    >
                      <Field label="Issue title">
                        <input id="issue-title" name="title" required maxLength={200} />
                      </Field>
                      <Field label="What happened / what did you investigate?">
                        <textarea id="issue-detail" name="detail" required />
                      </Field>
                      <Field label="Recommended next action">
                        <textarea id="issue-recommendation" name="recommendation" required />
                      </Field>
                      <div className="grid-2">
                        <Field label="Next-action owner">
                          <MemberSelect members={data.members} name="owner_id" />
                        </Field>
                        <Field label={`Follow up · ${data.workspace.timezone}`}>
                          <input
                            id="issue-follow-up"
                            name="follow_up_at"
                            type="datetime-local"
                            required
                          />
                        </Field>
                      </div>
                      <label className="check-label">
                        <input id="issue-blocking" name="blocking" type="checkbox" defaultChecked />
                        Must be resolved before this run can be submitted
                      </label>
                    </Form>
                  )}
                </Modal>
              )}
            </div>
            <div className="pad stack-sm">
              {data.issues.length ? (
                data.issues.map((issue) => (
                  <div className="step-details stack-sm" key={issue.id}>
                    <div className="row between">
                      <h3>{issue.title}</h3>
                      <Badge status={issue.status} />
                    </div>
                    <p className="text-block">{issue.detail}</p>
                    <p>
                      <strong>Next action:</strong> {issue.recommendation}
                    </p>
                    <small>
                      {memberName(data.members, issue.owner_id)} ·{" "}
                      {formatTime(issue.follow_up_at, data.workspace.timezone)}
                      {issue.blocking ? " · Blocks submission" : ""}
                    </small>
                    {issue.resolution && (
                      <p>
                        <strong>Resolution:</strong> {issue.resolution}
                      </p>
                    )}
                    {issue.status === "open" &&
                      (issue.owner_id === data.userId || manage) &&
                      !data.workspace.archived_at && (
                        <Modal
                          id={`resolve-issue-${issue.id}`}
                          label="Resolve issue"
                          title="Record issue resolution"
                        >
                          {(close) => (
                            <Form
                              id="resolve-issue-form"
                              busy={busy}
                              error={error}
                              submit="Resolve"
                              onSubmit={async (f) => {
                                await doAction(
                                  "resolve_issue",
                                  { id: issue.id, resolution: text(f, "resolution") },
                                  "Issue resolved.",
                                );
                                close();
                              }}
                            >
                              <Field label="Resolution / what changed">
                                <textarea id="issue-resolution" name="resolution" required />
                              </Field>
                            </Form>
                          )}
                        </Modal>
                      )}
                  </div>
                ))
              ) : (
                <Empty title="No issues recorded" />
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Task discussion</h2>
              <p>Keep decisions attached to the work.</p>
            </div>
            <div className="pad stack">
              {!data.workspace.archived_at && (
                <Form
                  id="comment-form"
                  busy={busy}
                  error={error}
                  submit="Post comment"
                  onSubmit={async (f) => {
                    await doAction("comment", { body: text(f, "body") }, "Comment posted.");
                    (document.getElementById("comment-form") as HTMLFormElement | null)?.reset();
                  }}
                >
                  <Field label="Comment">
                    <textarea
                      id="comment-body"
                      name="body"
                      required
                      maxLength={5000}
                      placeholder="Ask a question or clarify the next action."
                    />
                  </Field>
                </Form>
              )}
              <div>
                {data.comments.length ? (
                  data.comments.map((c) => (
                    <div className="event" key={c.id}>
                      <strong>{memberName(data.members, c.author_id)}</strong>
                      <p className="text-block">{c.body}</p>
                      <small>
                        {formatTime(
                          c.created_at,
                          data.members.find((m) => m.user_id === data.userId)?.profile?.timezone ||
                            data.workspace.timezone,
                        )}
                      </small>
                    </div>
                  ))
                ) : (
                  <p className="hint">No comments yet.</p>
                )}
              </div>
              <p className="hint">
                Most recent 200 comments are shown. Full records are available in the workspace
                export.
              </p>
            </div>
          </section>
        </div>
        <aside className="run-side stack">
          <section className="panel pad stack-sm">
            <h3>Work details</h3>
            <div>
              <p className="label-line">Client deadline</p>
              <p>{formatTime(run.due_at, data.workspace.timezone)}</p>
            </div>
            <div>
              <p className="label-line">Your time</p>
              <p>
                {formatTime(
                  run.due_at,
                  data.members.find((m) => m.user_id === data.userId)?.profile?.timezone ||
                    data.workspace.timezone,
                )}
              </p>
            </div>
            <div>
              <p className="label-line">Reviewer</p>
              <p>{memberName(data.members, run.reviewer_id)}</p>
            </div>
            {run.source_url && (
              <a
                id="open-work-source"
                className="btn"
                href={run.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source ↗
              </a>
            )}
            {run.waiting_on_id && (
              <div className="notice warning">
                <strong>Waiting on {memberName(data.members, run.waiting_on_id)}</strong>
                <p>{run.waiting_reason}</p>
                <small>
                  Follow-up owner: {memberName(data.members, run.follow_up_owner_id)}
                  <br />
                  {formatTime(run.follow_up_at, data.workspace.timezone)}
                </small>
              </div>
            )}
            {(editable || manage) && !data.workspace.archived_at && (
              <Modal
                id="change-work-status"
                label="Update status / follow-up"
                title="Set status and next action"
              >
                {(close) => (
                  <Form
                    id="work-status-form"
                    busy={busy}
                    error={error}
                    submit="Update status"
                    onSubmit={async (f) => {
                      const status = text(f, "status");
                      const waiting = ["blocked", "waiting_on_client"].includes(status);
                      await doAction(
                        "set_status",
                        {
                          expected_version: run.version,
                          status,
                          reason: text(f, "reason"),
                          waiting_on_id: waiting ? text(f, "waiting_on_id") || null : null,
                          follow_up_owner_id: waiting
                            ? text(f, "follow_up_owner_id") || null
                            : null,
                          follow_up_at: waiting
                            ? inputToUtc(text(f, "follow_up_at"), data.workspace.timezone)
                            : null,
                        },
                        "Status and follow-up saved.",
                      );
                      close();
                    }}
                  >
                    <Field label="Work status">
                      <select
                        id="work-status"
                        name="status"
                        defaultValue={
                          ["blocked", "waiting_on_client"].includes(run.status)
                            ? run.status
                            : "in_progress"
                        }
                      >
                        <option value="in_progress">In progress / reopen</option>
                        <option value="blocked">Blocked</option>
                        <option value="waiting_on_client">Waiting on client</option>
                        {manage && <option value="cancelled">Cancel run</option>}
                      </select>
                    </Field>
                    <Field label="Reason / what is needed">
                      <textarea
                        id="work-status-reason"
                        name="reason"
                        defaultValue={run.waiting_reason}
                        required
                      />
                    </Field>
                    <div className="grid-2">
                      <Field label="Waiting on (required for blocked/waiting)">
                        <MemberSelect
                          name="waiting_on_id"
                          members={data.members}
                          defaultValue={run.waiting_on_id}
                          required={false}
                        />
                      </Field>
                      <Field label="Follow-up owner">
                        <MemberSelect
                          name="follow_up_owner_id"
                          members={data.members}
                          defaultValue={run.follow_up_owner_id || run.assignee_id}
                          required={false}
                        />
                      </Field>
                    </div>
                    <Field label={`Follow-up date · ${data.workspace.timezone}`}>
                      <input
                        id="work-follow-up-date"
                        name="follow_up_at"
                        type="datetime-local"
                        defaultValue={localInput(run.follow_up_at, data.workspace.timezone)}
                      />
                    </Field>
                    <Notice>
                      The original business deadline is unchanged. Waiting on someone is not a
                      reason to hide an overdue deadline.
                    </Notice>
                  </Form>
                )}
              </Modal>
            )}
            <p className="hint">
              This record shows submitted evidence and decisions. It does not independently verify
              actions in external marketplaces.
            </p>
          </section>
          <section className="panel pad stack-sm">
            <h3>Permission history</h3>
            {data.approvals.length ? (
              data.approvals.map((a) => (
                <div className="event stack-sm" key={a.id}>
                  <div className="row between">
                    <strong>
                      {run.snapshot.steps.find((s) => s.id === a.step_id)?.title || a.step_id}
                    </strong>
                    <Badge status={a.status} />
                  </div>
                  <p className="hint">{a.reason}</p>
                  {a.decision_note && <p className="hint">Decision: {a.decision_note}</p>}
                  {a.status === "pending" &&
                    data.userId !== run.assignee_id &&
                    data.userId !== a.requested_by &&
                    (a.reviewer_id === data.userId || manage) &&
                    !data.workspace.archived_at && (
                      <Modal
                        id={`decide-permission-${a.id}`}
                        label="Make decision"
                        title="Approve or reject permission"
                      >
                        {(close) => (
                          <Form
                            id="permission-decision-form"
                            busy={busy}
                            error={error}
                            submit="Record decision"
                            onSubmit={async (f) => {
                              await doAction(
                                "decide_approval",
                                { id: a.id, decision: text(f, "decision"), note: text(f, "note") },
                                "Permission decision recorded.",
                              );
                              close();
                            }}
                          >
                            <p>{a.reason}</p>
                            <Field label="Decision">
                              <select id="permission-decision" name="decision">
                                <option value="approved">Approve this action</option>
                                <option value="rejected">Reject / request clarification</option>
                              </select>
                            </Field>
                            <Field label="Decision note">
                              <textarea id="permission-note" name="note" required />
                            </Field>
                          </Form>
                        )}
                      </Modal>
                    )}
                </div>
              ))
            ) : (
              <p className="hint">No permission requests for this run.</p>
            )}
          </section>
          <section className="panel pad stack-sm">
            <h3>Activity</h3>
            {data.activity.slice(0, 20).map((e) => (
              <div className="event" key={e.id}>
                <p>{displayStatus(e.event)}</p>
                <small>
                  {e.actor_id ? memberName(data.members, e.actor_id) : "Automation"} ·{" "}
                  {formatTime(e.created_at, data.workspace.timezone)}
                </small>
                <details>
                  <summary className="hint">Details</summary>
                  <pre className="text-block hint">{JSON.stringify(e.detail, null, 2)}</pre>
                </details>
              </div>
            ))}
            <Link className="btn small" href={`/workspaces/${data.workspace.id}/activity`}>
              Workspace activity
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
