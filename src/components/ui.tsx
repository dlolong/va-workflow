"use client";
import { useEffect, useId, useRef, useState } from "react";
import { displayStatus } from "@/lib/domain.mjs";
import type { Member } from "@/lib/types";
export function Badge({ status }: { status: string }) {
  const good = ["completed", "approved", "owned", "published"].includes(status);
  const bad = ["overdue", "rejected", "cancelled"].includes(status);
  const warn = ["blocked", "waiting_on_client", "changes_requested", "pending"].includes(status);
  return (
    <span className={`badge ${good ? "good" : bad ? "bad" : warn ? "warn" : ""}`}>
      {displayStatus(status)}
    </span>
  );
}
export function Notice({ error, children }: { error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`notice ${error ? "error" : ""}`} role={error ? "alert" : "status"}>
      {children}
    </div>
  );
}
export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small className="hint">{hint}</small>}
    </label>
  );
}
export function MemberSelect({
  members,
  name,
  defaultValue,
  required = true,
  reviewer = false,
  exclude,
  disabled = false,
}: {
  members: Member[];
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  reviewer?: boolean;
  exclude?: string;
  disabled?: boolean;
}) {
  return (
    <select
      name={name}
      id={name}
      required={required}
      defaultValue={defaultValue || ""}
      disabled={disabled}
    >
      <option value="">{required ? "Select a team member" : "No reviewer"}</option>
      {members
        .filter(
          (m) =>
            m.active &&
            m.user_id !== exclude &&
            (!reviewer || ["owner", "manager", "client"].includes(m.role)),
        )
        .map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.profile?.display_name || "Team member"} · {m.role}
          </option>
        ))}
    </select>
  );
}
export function Modal({
  label,
  title,
  children,
  wide = false,
  primary = false,
  id,
}: {
  label: string;
  title: string;
  children: (close: () => void) => React.ReactNode;
  wide?: boolean;
  primary?: boolean;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const labelId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const trigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [open]);
  const close = () => {
    setOpen(false);
  };
  return (
    <>
      <button id={id} className={`btn ${primary ? "primary" : ""}`} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <dialog
          ref={ref}
          className={wide ? "wide" : ""}
          aria-labelledby={labelId}
          onClose={() => setOpen(false)}
        >
          <div className="dialog-title">
            <h2 id={labelId}>{title}</h2>
            <button
              id={`${id}-close`}
              type="button"
              className="btn small"
              onClick={close}
              aria-label="Close dialog"
            >
              Close
            </button>
          </div>
          <div className="dialog-body">{children(close)}</div>
        </dialog>
      )}
    </>
  );
}
export function Form({
  id,
  onSubmit,
  children,
  submit = "Save",
  busy = false,
  error,
  secondary,
}: {
  id: string;
  onSubmit: (data: FormData) => Promise<void>;
  children: React.ReactNode;
  submit?: string;
  busy?: boolean;
  error?: string;
  secondary?: React.ReactNode;
}) {
  const [localError, setLocalError] = useState("");
  return (
    <form
      id={id}
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setLocalError("");
        try {
          await onSubmit(new FormData(e.currentTarget));
        } catch (err) {
          setLocalError(err instanceof Error ? err.message : "Unable to save.");
        }
      }}
    >
      {children}
      {(error || localError) && <Notice error>{error || localError}</Notice>}
      <div className="form-actions">
        {secondary}
        <button id={`${id}-submit`} className="btn primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : submit}
        </button>
      </div>
    </form>
  );
}
export function text(data: FormData, name: string) {
  return String(data.get(name) || "").trim();
}
export function checked(data: FormData, name: string) {
  return data.get(name) === "on";
}
export function memberName(members: Member[], id: string | null | undefined) {
  return (
    members.find((m) => m.user_id === id)?.profile?.display_name ||
    (id ? "Former team member" : "Not assigned")
  );
}
