"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCommand } from "@/lib/client-api";
import type { Workspace } from "@/lib/types";
import { Modal, Form, Field, text, Empty, Badge } from "./ui";
export function WorkspaceList({ workspaces }: { workspaces: Workspace[] }) {
  const router = useRouter();
  const command = useCommand(null);
  return (
    <>
      <header className="page-intro">
        <div>
          <p className="eyebrow">Your operations hub</p>
          <h1>Client workspaces</h1>
          <p>Each client has separate people, processes and work records.</p>
        </div>
        <Modal
          id="create-workspace"
          label="+ New workspace"
          title="Create a client workspace"
          primary
        >
          {(close) => (
            <Form
              id="workspace-form"
              busy={command.busy}
              error={command.error}
              submit="Create workspace"
              onSubmit={async (f) => {
                const result = await command.execute("create_workspace", {
                  name: text(f, "name"),
                  timezone: text(f, "timezone"),
                });
                close();
                router.push(`/workspaces/${result.id}/today`);
                router.refresh();
              }}
            >
              <Field label="Client / business name">
                <input
                  id="workspace-name"
                  name="name"
                  required
                  maxLength={120}
                  placeholder="e.g. Northstar Commerce"
                />
              </Field>
              <Field
                label="Client timezone"
                hint="Use an IANA timezone. Each VA also has their own display timezone."
              >
                <input
                  id="workspace-timezone"
                  name="timezone"
                  required
                  defaultValue="Asia/Manila"
                  list="workspace-timezones"
                />
                <datalist id="workspace-timezones">
                  <option>Asia/Manila</option>
                  <option>Europe/Amsterdam</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                  <option>Australia/Sydney</option>
                </datalist>
              </Field>
            </Form>
          )}
        </Modal>
      </header>
      {workspaces.length ? (
        <div className="grid-3">
          {workspaces.map((w) => (
            <Link
              id={`workspace-${w.id}`}
              key={w.id}
              href={`/workspaces/${w.id}/today`}
              className="panel workspace-card"
            >
              <div className="row between">
                <span className="eyebrow">Client workspace</span>
                {w.archived_at && <Badge status="archived" />}
              </div>
              <h2>{w.name}</h2>
              <p className="muted">{w.timezone}</p>
              <span className="arrow">Open workspace →</span>
            </Link>
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty title="Start with your first client">
            Create a workspace, install a process template and invite a VA.
          </Empty>
        </section>
      )}
      <div className="notice">
        Only workspaces you explicitly belong to appear here. A VA can work for multiple clients
        without granting those clients access to each other.
      </div>
    </>
  );
}
