"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SECTIONS } from "@/lib/config";
import { TEMPLATES } from "@/lib/templates";
import { useCommand } from "@/lib/client-api";
import { displayStatus, hasWritableRole, isOverdue } from "@/lib/domain.mjs";
import { formatTime } from "@/lib/time";
import type { DataBundle, Run } from "@/lib/types";
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
import { ProcessForm, ScheduleForm, TaskForm, TrainingForm } from "./work-forms";
import { WorkflowRead } from "./workflow-read";
type Stats = Record<string, number | string | null>;
export function RunTable({ runs, data }: { runs: Run[]; data: DataBundle }) {
  if (!runs.length)
    return (
      <Empty title="No work in this view">
        Create a task or start a published process to get going.
      </Empty>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Work / reference</th>
            <th>Status</th>
            <th>Assigned to</th>
            <th>Deadline · client time</th>
            <th className="hide-mobile">Next action</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td>
                <Link
                  id={`run-${r.id}`}
                  className="task-link"
                  href={`/workspaces/${data.workspace.id}/runs/${r.id}`}
                >
                  {r.title}
                </Link>
                <p>
                  {r.reference || "No reference"}
                  {r.process_version ? ` · SOP v${r.process_version}` : " · One-off"}
                  {r.priority === "high" ? " · High priority" : ""}
                </p>
              </td>
              <td>
                <div className="stack-sm">
                  <Badge status={r.status} />
                  {isOverdue(r) && <Badge status="overdue" />}
                </div>
              </td>
              <td>{memberName(data.members, r.assignee_id)}</td>
              <td>
                <span className="nowrap">{formatTime(r.due_at, data.workspace.timezone)}</span>
                {r.due_at && data.me.timezone !== data.workspace.timezone && (
                  <p>Your time: {formatTime(r.due_at, data.me.timezone)}</p>
                )}
              </td>
              <td className="hide-mobile">
                {r.waiting_on_id ? (
                  <>
                    <span>Waiting on {memberName(data.members, r.waiting_on_id)}</span>
                    <p>{r.waiting_reason}</p>
                    <p>Follow up: {formatTime(r.follow_up_at, data.me.timezone)}</p>
                  </>
                ) : r.status === "for_review" ? (
                  `Review: ${memberName(data.members, r.reviewer_id)}`
                ) : (
                  "Execute checklist"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function WorkspaceSection({
  data,
  section,
  stats,
  health,
  search = "",
}: {
  data: DataBundle;
  section: string;
  stats: Stats;
  health?: Stats;
  search?: string;
}) {
  const router = useRouter();
  const { execute, busy, error } = useCommand(data.workspace.id);
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const manage = hasWritableRole(data.role) && !data.workspace.archived_at;
  const canDraft = !data.workspace.archived_at && (manage || data.role === "va");
  const title = SECTIONS.find((s) => s[0] === section)?.[1] || "Workspace";
  const base = `/workspaces/${data.workspace.id}`;
  const action = async (name: string, payload: Record<string, unknown>, success = "Saved.") => {
    setMessage("");
    try {
      await execute(name, payload);
      setMessage(success);
      router.refresh();
    } catch {
      /* Hook displays the error. */
    }
  };
  const processTitle = (id: string) => data.processes.find((p) => p.id === id)?.title || "Process";
  const pagination = (
    <div className="pagination">
      <span className="hint">
        {data.totalRuns
          ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.totalRuns)} of ${data.totalRuns}`
          : "0 items"}
      </span>
      <div className="row">
        {data.page > 1 && (
          <Link
            id="previous-page"
            className="btn small"
            href={`${base}/${section}?page=${data.page - 1}&q=${encodeURIComponent(search)}`}
          >
            Previous
          </Link>
        )}
        {data.page * data.pageSize < data.totalRuns && (
          <Link
            id="next-page"
            className="btn small"
            href={`${base}/${section}?page=${data.page + 1}&q=${encodeURIComponent(search)}`}
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
  return (
    <>
      <header className="page-intro">
        <div>
          <p className="eyebrow">
            {data.workspace.name} · {data.role}
          </p>
          <h1>{title}</h1>
          <p>
            {section === "today"
              ? "Your assigned work and follow-ups, with the earliest deadlines first."
              : section === "reviews"
                ? "Decisions, corrections and blocked work that need attention."
                : section === "processes"
                  ? "Teach the process once. Run it consistently."
                  : `Client timezone: ${data.workspace.timezone} · Your timezone: ${data.me.timezone}`}
          </p>
        </div>
        <div className="row">
          {!data.workspace.archived_at && (
            <Modal id="new-work" label="+ New work" title="Create a task / checklist run" primary>
              {(close) => <TaskForm data={data} close={close} />}
            </Modal>
          )}
        </div>
      </header>
      {data.workspace.archived_at && (
        <div className="notice warning">
          This workspace is archived. History and exports remain available. The owner can restore it
          in Settings.
        </div>
      )}
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {["today", "reviews", "reports"].includes(section) && (
        <div className="metric-grid">
          {[
            ["Open work", stats.open],
            ["Overdue", stats.overdue],
            ["Waiting / blocked", stats.waiting],
            ["Completed this week", stats.completed_week],
          ].map(([label, value]) => (
            <section key={String(label)} className="panel metric">
              <small>{label}</small>
              <strong>{value ?? 0}</strong>
            </section>
          ))}
        </div>
      )}
      {["today", "tasks", "deadlines", "reviews"].includes(section) && (
        <>
          {section === "today" && data.processes.length === 0 && (
            <div className="notice">
              Start here:{" "}
              <Link className="btn link" href={`${base}/processes`}>
                Install a process template
              </Link>
              , then{" "}
              <Link className="btn link" href={`${base}/team`}>
                invite your VA
              </Link>
              .
            </div>
          )}
          {section === "reviews" && (
            <div className="grid-2">
              <section className="panel">
                <div className="panel-heading">
                  <h2>Permission before action</h2>
                  <Badge status={`${data.approvals.length} pending`} />
                </div>
                <div className="pad stack-sm">
                  {data.approvals.length ? (
                    data.approvals.map((a) => (
                      <Link
                        id={`pending-approval-${a.id}`}
                        key={a.id}
                        className="file-item"
                        href={`${base}/runs/${a.run_id}`}
                      >
                        <span>
                          <strong>Step: {a.step_id}</strong>
                          <br />
                          <span className="muted">{a.reason}</span>
                          <br />
                          <small>Reviewer: {memberName(data.members, a.reviewer_id)}</small>
                        </span>
                        <span>Review →</span>
                      </Link>
                    ))
                  ) : (
                    <Empty title="No pending permissions" />
                  )}
                </div>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Open issues</h2>
                  <Badge status={`${data.issues.length} open`} />
                </div>
                <div className="pad stack-sm">
                  {data.issues.length ? (
                    data.issues.map((i) => (
                      <Link
                        id={`pending-issue-${i.id}`}
                        key={i.id}
                        className="file-item"
                        href={`${base}/runs/${i.run_id}`}
                      >
                        <span>
                          <strong>{i.title}</strong>
                          <br />
                          <small>
                            {memberName(data.members, i.owner_id)} ·{" "}
                            {formatTime(i.follow_up_at, data.me.timezone)}
                          </small>
                        </span>
                        <Badge status={i.blocking ? "blocking" : "open"} />
                      </Link>
                    ))
                  ) : (
                    <Empty title="No open issues" />
                  )}
                </div>
              </section>
            </div>
          )}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  {section === "today"
                    ? "Your work queue"
                    : section === "reviews"
                      ? "Review and waiting queue"
                      : section === "deadlines"
                        ? "Deadline register"
                        : "All checklist runs"}
                </h2>
                <p>
                  Waiting does not erase a business deadline. Completed and cancelled work is
                  excluded from overdue counts.
                </p>
              </div>
              <form className="row" action={`${base}/${section}`}>
                <input
                  id="search-work"
                  name="q"
                  defaultValue={search}
                  placeholder="Search task titles…"
                  aria-label="Search task titles"
                  style={{ width: 190 }}
                />
                <button id="search-submit" className="btn small" type="submit">
                  Search
                </button>
              </form>
            </div>
            <RunTable runs={data.runs} data={data} />
            {pagination}
          </section>
          {section === "today" &&
            data.issues.filter((i) => i.owner_id === data.me.id).length > 0 && (
              <section className="panel pad stack-sm">
                <h2>Issues assigned to you</h2>
                {data.issues
                  .filter((i) => i.owner_id === data.me.id)
                  .map((i) => (
                    <Link key={i.id} className="file-item" href={`${base}/runs/${i.run_id}`}>
                      {i.title}
                      <span>{formatTime(i.follow_up_at, data.me.timezone)} →</span>
                    </Link>
                  ))}
              </section>
            )}
        </>
      )}
      {section === "processes" && (
        <>
          {canDraft && (
            <div className="toolbar">
              <div className="row">
                <Modal
                  id="new-process"
                  label="+ Create process"
                  title="Process and SOP builder"
                  wide
                >
                  {(close) => <ProcessForm workspaceId={data.workspace.id} close={close} />}
                </Modal>
                {manage && (
                  <Modal
                    id="new-schedule"
                    label="+ Recurring schedule"
                    title="Set a recurring deadline"
                  >
                    {(close) => <ScheduleForm data={data} close={close} />}
                  </Modal>
                )}
              </div>
              {manage && (
                <button
                  id="generate-due-work"
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    action(
                      "generate_schedules",
                      {},
                      "Due schedules checked. Already-created occurrences were not duplicated.",
                    )
                  }
                >
                  Generate due work
                </button>
              )}
            </div>
          )}
          {canDraft && (
            <section className="panel pad stack">
              <div>
                <h2>Start with a template</h2>
                <p className="hint">
                  Generic starting points. Review client-specific instructions before publishing.
                </p>
              </div>
              <div className="grid-3">
                {TEMPLATES.map((flow, i) => (
                  <div key={flow.title} className="stack-sm">
                    <h3>{flow.title}</h3>
                    <p className="hint">{flow.description}</p>
                    <Modal
                      id={`template-${i}`}
                      label="Use template"
                      title="Review and save template"
                      wide
                    >
                      {(close) => (
                        <ProcessForm workspaceId={data.workspace.id} initial={flow} close={close} />
                      )}
                    </Modal>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="panel">
            <div className="panel-heading">
              <h2>Processes & SOPs</h2>
              <span className="hint">
                VAs may draft; only managers publish. Published versions remain unchanged until
                then.
              </span>
            </div>
            {data.processes.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Process</th>
                      <th>Version</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.processes.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.title}</strong>
                          <p>{p.published_content?.description || p.draft.description}</p>
                          {p.archived && <Badge status="archived" />}
                        </td>
                        <td>
                          {p.published_version ? (
                            <Badge status={`published v${p.published_version}`} />
                          ) : (
                            <Badge status="draft" />
                          )}
                        </td>
                        <td>
                          <div className="row">
                            {p.published_content && (
                              <Modal
                                id={`read-process-${p.id}`}
                                label="View SOP"
                                title={`${p.title} · Published v${p.published_version}`}
                                wide
                              >
                                {() => <WorkflowRead flow={p.published_content!} />}
                              </Modal>
                            )}
                            {!data.workspace.archived_at && !p.archived && p.published_version && (
                              <Modal
                                id={`start-process-${p.id}`}
                                label="Start run"
                                title="Start a checklist run"
                              >
                                {(close) => <TaskForm data={data} close={close} processId={p.id} />}
                              </Modal>
                            )}
                            {canDraft && (
                              <>
                                <Modal
                                  id={`edit-process-${p.id}`}
                                  label="Edit draft"
                                  title="Edit process draft"
                                  wide
                                >
                                  {(close) => (
                                    <ProcessForm
                                      workspaceId={data.workspace.id}
                                      close={close}
                                      initial={p.draft}
                                      processId={p.id}
                                    />
                                  )}
                                </Modal>
                                <Modal
                                  id={`duplicate-process-${p.id}`}
                                  label="Duplicate"
                                  title="Duplicate as a new process"
                                  wide
                                >
                                  {(close) => (
                                    <ProcessForm
                                      workspaceId={data.workspace.id}
                                      close={close}
                                      initial={{ ...p.draft, title: `${p.title} (copy)` }}
                                    />
                                  )}
                                </Modal>
                              </>
                            )}
                            {manage && (
                              <>
                                {!p.archived && (
                                  <button
                                    id={`publish-process-${p.id}`}
                                    className="btn small"
                                    disabled={busy}
                                    onClick={() =>
                                      action(
                                        "publish_process",
                                        { id: p.id },
                                        "New SOP version published. Existing runs are unchanged.",
                                      )
                                    }
                                  >
                                    Publish draft
                                  </button>
                                )}
                                <button
                                  id={`archive-process-${p.id}`}
                                  className="btn small"
                                  disabled={busy}
                                  onClick={() =>
                                    action(
                                      "archive_process",
                                      { id: p.id, archived: !p.archived },
                                      p.archived
                                        ? "Process restored. Resume schedules separately."
                                        : "Process archived and schedules paused.",
                                    )
                                  }
                                >
                                  {p.archived ? "Restore" : "Archive"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No processes yet">
                Use a starter template or create a checklist from scratch.
              </Empty>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Recurring schedules</h2>
              <p>Fixed deadlines, independent of whether the previous run is finished.</p>
            </div>
            {data.schedules.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Process / assignee</th>
                      <th>Recurrence</th>
                      <th>Next deadline to generate</th>
                      <th>Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schedules.map((s) => (
                      <tr key={s.id}>
                        <td>
                          {processTitle(s.process_id)}
                          <p>{memberName(data.members, s.assignee_id)}</p>
                        </td>
                        <td>
                          <Badge status={s.active ? s.frequency : "paused"} />
                          <p>
                            {s.local_time} · {s.timezone}
                          </p>
                        </td>
                        <td>
                          {formatTime(s.next_due_at, s.timezone)}
                          <p>Create {s.lead_minutes} minutes beforehand</p>
                        </td>
                        <td>
                          {manage && (
                            <div className="row">
                              <Modal
                                id={`edit-schedule-${s.id}`}
                                label="Edit"
                                title="Edit recurring schedule"
                              >
                                {(close) => <ScheduleForm data={data} close={close} initial={s} />}
                              </Modal>
                              <button
                                id={`toggle-schedule-${s.id}`}
                                className="btn small"
                                disabled={busy}
                                onClick={() =>
                                  action("toggle_schedule", { id: s.id, active: !s.active })
                                }
                              >
                                {s.active ? "Pause" : "Resume"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No recurring schedules">
                Publish a process, then add its recurring deadline.
              </Empty>
            )}
          </section>
        </>
      )}
      {section === "training" && (
        <>
          {manage && (
            <div className="row">
              <Modal
                id="add-handover"
                label="+ Add handover"
                title="Training and process ownership"
              >
                {(close) => <TrainingForm data={data} close={close} />}
              </Modal>
            </div>
          )}
          <section className="panel">
            <div className="panel-heading">
              <h2>Teach → Practice → Approve → Own</h2>
            </div>
            {data.training.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Process</th>
                      <th>VA / trainer</th>
                      <th>Stage</th>
                      <th>Sign-off</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.training.map((t) => (
                      <tr key={t.id}>
                        <td>{processTitle(t.process_id)}</td>
                        <td>
                          {memberName(data.members, t.user_id)}
                          <p>Trainer: {memberName(data.members, t.trainer_id)}</p>
                        </td>
                        <td>
                          <Badge status={t.stage} />
                        </td>
                        <td>
                          {t.signed_off_at
                            ? formatTime(t.signed_off_at, data.me.timezone)
                            : "Not signed off"}
                          <p>{t.note}</p>
                        </td>
                        <td>
                          {!data.workspace.archived_at &&
                            (manage || t.trainer_id === data.me.id) && (
                              <Modal
                                id={`edit-handover-${t.id}`}
                                label="Update"
                                title="Update handover progress"
                              >
                                {(close) => <TrainingForm data={data} close={close} initial={t} />}
                              </Modal>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No handovers yet">
                Track demonstration, guided work, independent execution and SOP approval.
              </Empty>
            )}
          </section>
        </>
      )}
      {section === "team" && (
        <>
          {manage && (
            <div className="row">
              <Modal
                id="invite-member"
                label="+ Invite a team member"
                title="Create a secure workspace invitation"
              >
                {(close) => (
                  <Form
                    id="invite-member-form"
                    busy={busy}
                    error={error}
                    submit="Create invitation link"
                    onSubmit={async (f) => {
                      const result = await execute("invite_member", {
                        email: text(f, "email"),
                        role: text(f, "role"),
                      });
                      setInviteLink(`${window.location.origin}/invite/${result.token}`);
                      close();
                      router.refresh();
                    }}
                  >
                    <Field label="Invitee email">
                      <input id="invite-email" name="email" type="email" required />
                    </Field>
                    <Field label="Workspace role">
                      <select id="invite-role" name="role">
                        <option value="va">VA · execute assigned work</option>
                        <option value="client">Client · request work and review</option>
                        {data.role === "owner" && (
                          <option value="manager">Manager · manage processes and team</option>
                        )}
                      </select>
                    </Field>
                    <p className="hint">
                      This creates a seven-day invitation link. Share it with the named person.
                      Acceptance requires signing in with that verified email; it does not send a
                      workspace invitation email automatically.
                    </p>
                  </Form>
                )}
              </Modal>
            </div>
          )}
          {inviteLink && (
            <section className="panel pad stack-sm">
              <h3>Invitation link</h3>
              <input
                id="created-invitation-link"
                value={inviteLink}
                readOnly
                aria-label="Invitation link"
              />
              <button
                id="copy-invitation-link"
                className="btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteLink);
                    setMessage("Invitation link copied.");
                  } catch {
                    setMessage("Select and copy the invitation link above.");
                  }
                }}
              >
                Copy link
              </button>
              <p className="hint">
                The raw invitation link is shown for this session only. Revoke and create another
                link when needed.
              </p>
            </section>
          )}
          <section className="panel">
            <div className="panel-heading">
              <h2>Workspace members</h2>
              <p>People are assigned explicitly to this client.</p>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Membership</th>
                    <th>Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((m) => (
                    <tr key={m.user_id}>
                      <td>
                        {m.profile?.display_name || "Team member"}
                        <p>{m.profile?.timezone}</p>
                      </td>
                      <td>
                        <Badge status={m.role} />
                      </td>
                      <td>
                        <Badge status={m.active ? "active" : "removed"} />
                      </td>
                      <td>
                        <div className="row">
                          {data.role === "owner" &&
                            m.active &&
                            m.user_id !== data.me.id &&
                            m.role !== "owner" && (
                              <Modal
                                id={`role-${m.user_id}`}
                                label="Change role"
                                title="Change workspace role"
                              >
                                {(close) => (
                                  <Form
                                    id="change-role-form"
                                    busy={busy}
                                    error={error}
                                    onSubmit={async (f) => {
                                      await execute("change_role", {
                                        user_id: m.user_id,
                                        role: text(f, "role"),
                                      });
                                      close();
                                      router.refresh();
                                    }}
                                  >
                                    <Field label="New role">
                                      <select
                                        name="role"
                                        id="member-new-role"
                                        defaultValue={m.role}
                                      >
                                        <option value="manager">Manager</option>
                                        <option value="client">Client</option>
                                        <option value="va">VA</option>
                                      </select>
                                    </Field>
                                    <p className="hint">
                                      Review duties must be transferred before demoting a reviewer
                                      to VA.
                                    </p>
                                  </Form>
                                )}
                              </Modal>
                            )}
                          {manage &&
                            m.active &&
                            m.user_id !== data.me.id &&
                            m.role !== "owner" &&
                            (m.role !== "manager" || data.role === "owner") && (
                              <Modal
                                id={`remove-${m.user_id}`}
                                label="Offboard"
                                title={`Offboard ${m.profile?.display_name || "team member"}`}
                              >
                                {(close) => (
                                  <Form
                                    id="remove-member-form"
                                    busy={busy}
                                    error={error}
                                    submit="Reassign work and remove access"
                                    onSubmit={async (f) => {
                                      await execute("remove_member", {
                                        user_id: m.user_id,
                                        replacement_id: text(f, "replacement_id"),
                                        note: text(f, "note"),
                                      });
                                      close();
                                      router.refresh();
                                    }}
                                  >
                                    <Notice>
                                      Open work, follow-ups, schedules and pending reviews are
                                      handed to the replacement. History remains intact. Their
                                      workspace access is then removed.
                                    </Notice>
                                    <Field label="Replacement / next-action owner">
                                      <MemberSelect
                                        members={data.members}
                                        name="replacement_id"
                                        exclude={m.user_id}
                                      />
                                    </Field>
                                    <Field label="Handover note">
                                      <textarea id="offboard-note" name="note" required />
                                    </Field>
                                    <p className="hint">
                                      The database rejects combinations that would create
                                      self-review. Existing short-lived file links may remain valid
                                      for up to 60 seconds.
                                    </p>
                                  </Form>
                                )}
                              </Modal>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {manage && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Invitation history</h2>
              </div>
              {data.invitations.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status / expiry</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.invitations.map((i) => (
                        <tr key={i.id}>
                          <td>{i.email}</td>
                          <td>{i.role}</td>
                          <td>
                            {i.revoked_at
                              ? "Revoked"
                              : i.accepted_at
                                ? "Accepted"
                                : new Date(i.expires_at) < new Date()
                                  ? "Expired"
                                  : "Pending"}
                            <p>{formatTime(i.expires_at, data.me.timezone)}</p>
                          </td>
                          <td>
                            {!i.accepted_at && !i.revoked_at && (
                              <button
                                id={`revoke-invite-${i.id}`}
                                className="btn small"
                                disabled={busy}
                                onClick={() => action("revoke_invitation", { id: i.id })}
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="No invitations yet" />
              )}
            </section>
          )}
        </>
      )}
      {section === "notifications" && (
        <section className="panel">
          <div className="panel-heading">
            <h2>Your notifications</h2>
            <button
              id="mark-all-read"
              className="btn small"
              disabled={busy}
              onClick={() => action("mark_read", {})}
            >
              Mark all read
            </button>
          </div>
          <div className="pad">
            {data.notifications.length ? (
              data.notifications.map((n) => (
                <div className="event row between" key={n.id}>
                  <div>
                    <div className="row">
                      <strong>{n.title}</strong>
                      {!n.read_at && <Badge status="new" />}
                    </div>
                    <p>{n.body}</p>
                    <small>{formatTime(n.created_at, data.me.timezone)}</small>
                  </div>
                  <div className="row">
                    {n.run_id && (
                      <Link className="btn small" href={`${base}/runs/${n.run_id}`}>
                        Open work
                      </Link>
                    )}
                    {!n.read_at && (
                      <button
                        id={`read-notification-${n.id}`}
                        className="btn small"
                        disabled={busy}
                        onClick={() => action("mark_read", { id: n.id })}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <Empty title="You are all caught up" />
            )}
          </div>
        </section>
      )}
      {section === "activity" && (
        <section className="panel">
          <div className="panel-heading">
            <h2>Recorded activity</h2>
            <p>Records actions observed inside VA Relay, not unverified external activity.</p>
          </div>
          <div className="pad">
            {data.activity.length ? (
              data.activity.map((e) => (
                <div className="event" key={e.id}>
                  <div className="row between">
                    <strong>{displayStatus(e.event)}</strong>
                    {e.run_id && (
                      <Link className="btn small" href={`${base}/runs/${e.run_id}`}>
                        Open work
                      </Link>
                    )}
                  </div>
                  <small>
                    {e.actor_id ? memberName(data.members, e.actor_id) : "Automation"} ·{" "}
                    {formatTime(e.created_at, data.me.timezone)}
                  </small>
                  <details>
                    <summary className="hint">Event details</summary>
                    <pre className="text-block hint">{JSON.stringify(e.detail, null, 2)}</pre>
                  </details>
                </div>
              ))
            ) : (
              <Empty title="No activity yet" />
            )}
          </div>
        </section>
      )}
      {section === "reports" && (
        <>
          <section className="panel pad stack">
            <div className="row between">
              <div>
                <h2>This week’s operational summary</h2>
                <p className="hint">
                  Since {formatTime(String(stats.week_start || ""), data.workspace.timezone)}.
                  Counts cover the entire workspace, not only the visible task page.
                </p>
              </div>
              <button
                id="copy-weekly-summary"
                className="btn"
                onClick={async () => {
                  const report = `${data.workspace.name} — Weekly summary\nWeek starting: ${formatTime(String(stats.week_start || ""), data.workspace.timezone)}\nCompleted: ${stats.completed_week || 0}\nSubmitted: ${stats.submitted_week || 0}\nOpen: ${stats.open || 0}\nOverdue: ${stats.overdue || 0}\nWaiting / blocked: ${stats.waiting || 0}\nAwaiting review: ${stats.reviews || 0}\nOn-time final submissions among accepted work with deadlines: ${stats.completed_week_on_time || 0}/${stats.completed_week_with_deadline || 0}\nClient timezone: ${data.workspace.timezone}`;
                  try {
                    await navigator.clipboard.writeText(report);
                    setMessage("Weekly summary copied.");
                  } catch {
                    setMessage("Clipboard unavailable. Use the CSV or JSON export below.");
                  }
                }}
              >
                Copy weekly summary
              </button>
            </div>
            <div className="grid-2">
              <div className="notice">
                <h3>On-time final submissions</h3>
                <p>
                  {Number(stats.completed_week_with_deadline) > 0
                    ? `${Math.round((Number(stats.completed_week_on_time) / Number(stats.completed_week_with_deadline)) * 100)}%`
                    : "Not enough data"}
                </p>
                <small>
                  Accepted work completed this week with a deadline. Uses its final submission
                  timestamp, not mouse activity or time online.
                </small>
              </div>
              <div className="notice warning">
                <h3>Still needs a decision</h3>
                <p>
                  {stats.reviews || 0} runs await review. {stats.waiting || 0} runs are blocked or
                  waiting.
                </p>
                <small>Waiting on a client never removes a missed business deadline.</small>
              </div>
            </div>
            {data.role !== "va" && (
              <div className="row">
                <a
                  id="download-csv"
                  className="btn"
                  href={`/api/export/${data.workspace.id}?format=csv`}
                >
                  Export task CSV
                </a>
                <a
                  id="download-json"
                  className="btn"
                  href={`/api/export/${data.workspace.id}?format=json`}
                >
                  Export workspace JSON
                </a>
              </div>
            )}
            <p className="hint">
              Application exports include records and attachment references, not attachment file
              bytes. They are not a substitute for a tested database and storage backup.
            </p>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Work records</h2>
              <p>Use the full export for a complete record set.</p>
            </div>
            <RunTable data={data} runs={data.runs} />
            {pagination}
          </section>
        </>
      )}
      {section === "settings" && (
        <>
          <ProfileForm data={data} />
          {data.role === "owner" && (
            <section className="panel pad stack">
              <h2>Workspace settings</h2>
              <Form
                id="workspace-settings"
                busy={busy}
                error={error}
                onSubmit={async (f) => {
                  await execute("update_workspace", {
                    name: text(f, "name"),
                    timezone: text(f, "timezone"),
                    archived: checked(f, "archived"),
                  });
                  setMessage(
                    "Workspace settings saved. Existing schedule timezones were not changed.",
                  );
                  router.refresh();
                }}
              >
                <div className="grid-2">
                  <Field label="Workspace name">
                    <input
                      id="settings-workspace-name"
                      name="name"
                      defaultValue={data.workspace.name}
                      required
                      maxLength={120}
                    />
                  </Field>
                  <Field label="Client timezone">
                    <input
                      id="settings-workspace-timezone"
                      name="timezone"
                      defaultValue={data.workspace.timezone}
                      required
                    />
                  </Field>
                </div>
                <label className="check-label">
                  <input
                    id="archive-workspace"
                    name="archived"
                    type="checkbox"
                    defaultChecked={Boolean(data.workspace.archived_at)}
                  />
                  Archive workspace (pause operations, retain history)
                </label>
                <p className="hint">
                  Changing this timezone does not rewrite existing deadlines or the timezones saved
                  on recurring schedules.
                </p>
              </Form>
            </section>
          )}
          {manage && (
            <section className="panel pad stack">
              <h2>Automation health</h2>
              <div className="grid-3">
                <div>
                  <p className="hint">Last worker run</p>
                  <p>
                    {health?.last_job_at
                      ? formatTime(String(health.last_job_at), data.me.timezone)
                      : "No worker run recorded"}
                  </p>
                </div>
                <div>
                  <p className="hint">Email queue</p>
                  <p>
                    {health?.pending_email ?? 0} pending · {health?.failed_email ?? 0} failed
                  </p>
                </div>
                <div>
                  <p className="hint">Unconfirmed uploads</p>
                  <p>{health?.pending_uploads ?? 0}</p>
                </div>
              </div>
              <Notice>
                Configure <code>CRON_SECRET</code>, the server-only Supabase key and a scheduler for
                automatic work and reminders. Resend is optional for notification emails; Supabase
                SMTP handles sign-up and password recovery separately.
              </Notice>
              <p className="hint">
                A missing email provider never marks a message as sent. Pending notifications remain
                visible in-app.
              </p>
            </section>
          )}
          {data.role !== "va" && (
            <section className="panel pad stack-sm">
              <h2>Data portability</h2>
              <div className="row">
                <a className="btn" href={`/api/export/${data.workspace.id}?format=json`}>
                  Export workspace metadata
                </a>
                <a className="btn" href={`/api/export/${data.workspace.id}?format=csv`}>
                  Export task CSV
                </a>
              </div>
              <p className="hint">
                Data deletion and owner transfer are deliberate operator procedures in V1. See the
                retention and backup runbooks; there is no destructive one-click delete.
              </p>
            </section>
          )}
        </>
      )}
      {(data.processes.length >= 200 ||
        data.schedules.length >= 200 ||
        data.training.length >= 200 ||
        data.issues.length >= 200 ||
        data.approvals.length >= 200) && (
        <div className="notice warning">
          A supporting list reached the 200-item pilot display limit. Use the workspace export for
          complete records. Task lists are paginated separately.
        </div>
      )}
      {["activity", "notifications"].includes(section) && (
        <p className="hint">
          Showing the most recent 100 entries. Complete activity is available in workspace exports.
        </p>
      )}
    </>
  );
}
function ProfileForm({ data }: { data: DataBundle }) {
  const { execute, busy, error } = useCommand(null);
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  return (
    <section className="panel pad stack">
      <h2>Your profile</h2>
      <Form
        id="profile-form"
        busy={busy}
        error={error}
        onSubmit={async (f) => {
          await execute("update_profile", {
            display_name: text(f, "display_name"),
            timezone: text(f, "timezone"),
            email_notifications: checked(f, "email_notifications"),
          });
          setSaved(true);
          router.refresh();
        }}
      >
        <div className="grid-2">
          <Field label="Display name">
            <input
              id="profile-name"
              name="display_name"
              required
              maxLength={120}
              defaultValue={data.me.display_name}
            />
          </Field>
          <Field label="Your display timezone">
            <input id="profile-timezone" name="timezone" required defaultValue={data.me.timezone} />
          </Field>
        </div>
        <label className="check-label">
          <input
            id="profile-email-notifications"
            name="email_notifications"
            type="checkbox"
            defaultChecked={data.me.email_notifications}
          />
          Receive notification emails when the email provider is configured
        </label>
        {saved && <Notice>Profile saved.</Notice>}
      </Form>
      <Link className="btn" href="/reset-password">
        Change your password
      </Link>
    </section>
  );
}
