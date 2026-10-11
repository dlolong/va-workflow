"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
import { useCommand } from "@/lib/client-api";
import { hasWritableRole } from "@/lib/domain.mjs";
import { formatTime } from "@/lib/time";
import type { DataBundle } from "@/lib/types";
import { Badge, Empty, Field, Modal, Notice, memberName } from "./ui";
import { ProcessForm, ScheduleForm, TaskForm } from "./work-forms";
import { WorkflowRead } from "./workflow-read";

export function ProcessesSection({ data }: { data: DataBundle }) {
  const router = useRouter();
  const { execute, busy, error } = useCommand(data.workspace.id);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("active");
  const [templateQuery, setTemplateQuery] = useState("");
  const manage = hasWritableRole(data.role) && !data.workspace.archived_at;
  const canDraft = !data.workspace.archived_at && (manage || data.role === "va");
  const changed = (p: DataBundle["processes"][number]) =>
    !!p.published_content && JSON.stringify(p.draft) !== JSON.stringify(p.published_content);
  const visible = data.processes.filter((p) => {
    const matches =
      `${p.title} ${p.draft.description} ${p.published_content?.title || ""} ${p.published_content?.description || ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    return (
      matches &&
      (filter === "all" ||
        (filter === "archived"
          ? p.archived
          : !p.archived &&
            (filter === "active" ||
              (filter === "draft"
                ? !p.published_version
                : filter === "changed"
                  ? changed(p)
                  : !!p.published_version))))
    );
  });
  const templates = TEMPLATES.map((flow, i) => ({ flow, i })).filter(({ flow }) =>
    `${flow.title} ${flow.description}`.toLowerCase().includes(templateQuery.trim().toLowerCase()),
  );
  const action = async (name: string, payload: Record<string, unknown>, success = "Saved.") => {
    setMessage("");
    try {
      await execute(name, payload);
      setMessage(success);
      router.refresh();
    } catch {
      /* Hook displays errors. */
    }
  };
  const processTitle = (id: string) => data.processes.find((p) => p.id === id)?.title || "Process";
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {canDraft && (
        <div className="toolbar">
          <div className="row">
            <Modal
              id="new-process"
              label="+ Create process"
              title="Process and SOP builder"
              primary
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
      <section className="panel process-library" aria-label="Saved processes">
        <div className="panel-heading">
          <div>
            <h2>Your processes</h2>
            <p>Create a draft → publish the instructions → start and assign a run.</p>
          </div>
          <span className="hint">
            Owners and managers publish. Draft edits take effect only after publishing.
          </span>
        </div>
        <div className="process-filters">
          <Field label="Find a process">
            <input
              id="process-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles or descriptions…"
            />
          </Field>
          <Field label="Show">
            <select id="process-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="active">Active processes</option>
              <option value="draft">Drafts</option>
              <option value="published">Published</option>
              <option value="changed">Unpublished changes</option>
              <option value="archived">Archived</option>
              <option value="all">All processes</option>
            </select>
          </Field>
          <p className="hint" role="status">
            {visible.length} of {data.processes.length} saved processes
          </p>
        </div>
        {visible.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} id={`process-row-${p.id}`}>
                    <td>
                      <strong>{p.title}</strong>
                      <p>{p.draft.description || p.published_content?.description}</p>
                      <p className="hint">
                        {p.published_content ? "Published" : "Draft"} ·{" "}
                        {(p.published_content || p.draft).steps.length}{" "}
                        {(p.published_content || p.draft).steps.length === 1 ? "step" : "steps"} ·{" "}
                        {(p.published_content || p.draft).review_required
                          ? "Final review required"
                          : "No final review"}
                      </p>
                      {p.published_content && p.title !== p.published_content.title && (
                        <p>Published as: {p.published_content.title}</p>
                      )}
                      {p.archived && <Badge status="archived" />}
                    </td>
                    <td>
                      {p.published_version ? (
                        <Badge status={`published v${p.published_version}`} />
                      ) : (
                        <Badge status="draft" />
                      )}
                      {changed(p) && <p className="hint">Unpublished changes</p>}
                      {!p.published_version && <p className="hint">Publish to start runs.</p>}
                    </td>
                    <td>
                      <div className="row">
                        {(p.published_content || !canDraft) && (
                          <Modal
                            id={`read-process-${p.id}`}
                            label="View SOP"
                            title={
                              p.published_content
                                ? `${p.published_content.title} · Published v${p.published_version}`
                                : `${p.title} · Draft`
                            }
                            wide
                          >
                            {() => <WorkflowRead flow={p.published_content || p.draft} />}
                          </Modal>
                        )}
                        {!data.workspace.archived_at && !p.archived && p.published_version && (
                          <Modal
                            id={`start-process-${p.id}`}
                            label="Start run"
                            title="Start a checklist run"
                            primary
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
          <Empty
            title={data.processes.length ? "No matching processes" : "Create your first process"}
          >
            {data.processes.length
              ? "Try another search or choose All processes, including archived work."
              : canDraft
                ? "Create a process from scratch, or browse the starter templates below. Save a draft before publishing."
                : "Your team has not saved any processes yet."}
          </Empty>
        )}
      </section>
      {canDraft && (
        <details id="process-templates" className="panel pad process-templates">
          <summary>Browse starter templates · {TEMPLATES.length}</summary>
          <div className="stack" style={{ marginTop: 16 }}>
            <div>
              <h2>Start with a template</h2>
              <p className="hint">
                Generic starting points. Review client-specific instructions before publishing.
              </p>
            </div>
            <Field label="Find a template">
              <input
                id="template-search"
                type="search"
                value={templateQuery}
                onChange={(e) => setTemplateQuery(e.target.value)}
                placeholder="Search templates…"
              />
            </Field>
            {!templates.length && (
              <Empty title="No matching templates">Try a different search.</Empty>
            )}
            <div className="grid-3">
              {templates.map(({ flow, i }) => (
                <div key={flow.title} className="stack-sm template-card">
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
          </div>
        </details>
      )}
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
  );
}
