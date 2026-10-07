"use client";
import { useState } from "react";
import { useCommand } from "@/lib/client-api";
import { browserSupabase } from "@/lib/supabase/browser";
import { APP } from "@/lib/config";
import { displayStatus } from "@/lib/domain.mjs";
import type { Evidence, RunBundle, Step, ResponseRow } from "@/lib/types";
import { Badge, Field, Form, Modal, Notice, memberName, text } from "./ui";
export function StepEditor({
  step,
  index,
  saved,
  data,
  editable,
  dirtyChanged,
  refresh,
}: {
  step: Step;
  index: number;
  saved?: ResponseRow;
  data: RunBundle;
  editable: boolean;
  dirtyChanged: (id: string, dirty: boolean) => void;
  refresh: () => void;
}) {
  const { execute, busy, error } = useCommand(data.workspace.id);
  const [value, setValue] = useState<string | number | boolean | null>(saved?.value ?? null);
  const [na, setNa] = useState(saved?.not_applicable || false);
  const [reason, setReason] = useState(saved?.na_reason || "");
  const [dirty, setDirty] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [previousSaved, setPreviousSaved] = useState(saved);
  // Refresh confirmed answers without remounting selected/in-flight uploads.
  // Keep a local draft when another session changes its saved response.
  if (saved !== previousSaved) {
    setPreviousSaved(saved);
    if (!dirty) {
      setValue(saved?.value ?? null);
      setNa(saved?.not_applicable || false);
      setReason(saved?.na_reason || "");
    }
  }
  const approved = data.approvals.some((a) => a.step_id === step.id && a.status === "approved");
  const pending = data.approvals.some((a) => a.step_id === step.id && a.status === "pending");
  const locked = step.approval_before && !approved;
  const change = (v: string | number | boolean | null) => {
    setValue(v);
    setDirty(true);
    dirtyChanged(step.id, true);
    setSavedNotice("");
  };
  const files = data.evidence.filter((e) => e.step_id === step.id && e.state === "attached");
  return (
    <section className="run-step" id={`run-step-${step.id}`}>
      <div className="row">
        <span
          className={`step-number ${saved && (saved.not_applicable || (saved.value !== null && (typeof saved.value !== "string" || Boolean(saved.value.trim())) && (step.kind !== "checkbox" || saved.value === true))) ? "done" : ""}`}
        >
          {index + 1}
        </span>
        <div className="grow">
          <h3>{step.title}</h3>
          <div className="row">
            <small className="hint">
              {step.required ? "Required" : "Optional"} · {displayStatus(step.kind)}
            </small>
            {step.approval_before && (
              <Badge status={approved ? "permission approved" : "permission required"} />
            )}
          </div>
        </div>
        {dirty ? (
          <span className="badge warn">Not saved</span>
        ) : (
          saved && <span className="saved">Saved</span>
        )}
      </div>
      <div className="run-step-body">
        {step.instructions && (
          <details className="step-details">
            <summary>How to do this / expected result</summary>
            <p className="text-block">{step.instructions}</p>
          </details>
        )}
        {locked && (
          <div className="notice warning">
            Permission is required before this action.{" "}
            {pending ? "Your request is awaiting review." : "Request it below before proceeding."}
            {editable && !pending && (
              <div style={{ marginTop: 10 }}>
                <Modal
                  id={`request-permission-${step.id}`}
                  label="Request permission"
                  title="Explain the action requiring permission"
                >
                  {(close) => (
                    <Form
                      id={`permission-request-${step.id}`}
                      busy={busy}
                      error={error}
                      submit="Request permission"
                      onSubmit={async (f) => {
                        await execute("request_approval", {
                          run_id: data.run.id,
                          step_id: step.id,
                          reason: text(f, "reason"),
                        });
                        close();
                        refresh();
                      }}
                    >
                      <Field label="Proposed action and reason">
                        <textarea name="reason" id={`permission-reason-${step.id}`} required />
                      </Field>
                      <p className="hint">
                        The request goes to {memberName(data.members, data.run.reviewer_id)}. The
                        app cannot prevent direct actions in external systems.
                      </p>
                    </Form>
                  )}
                </Modal>
              </div>
            )}
          </div>
        )}
        <form
          id={`step-form-${step.id}`}
          className="stack-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await execute("save_response", {
                run_id: data.run.id,
                expected_version: data.run.version,
                step_id: step.id,
                value,
                not_applicable: na,
                na_reason: reason,
              });
              setDirty(false);
              dirtyChanged(step.id, false);
              setSavedNotice("Saved to workspace.");
              refresh();
            } catch {
              /* Error stays visible. */
            }
          }}
        >
          {step.allow_na && (
            <label className="check-label">
              <input
                id={`step-na-${step.id}`}
                type="checkbox"
                checked={na}
                disabled={!editable || busy}
                onChange={(e) => {
                  setNa(e.target.checked);
                  setDirty(true);
                  dirtyChanged(step.id, true);
                }}
              />
              Not applicable
            </label>
          )}
          {na ? (
            <Field label="Explain why this step does not apply">
              <textarea
                id={`step-na-reason-${step.id}`}
                value={reason}
                required
                disabled={!editable || busy}
                onChange={(e) => {
                  setReason(e.target.value);
                  setDirty(true);
                  dirtyChanged(step.id, true);
                }}
              />
            </Field>
          ) : (
            <fieldset
              disabled={!editable || busy || locked}
              style={{ border: 0, padding: 0, margin: 0 }}
            >
              {step.kind === "checkbox" ? (
                <label className="check-label">
                  <input
                    id={`step-value-${step.id}`}
                    type="checkbox"
                    checked={value === true}
                    onChange={(e) => change(e.target.checked)}
                  />
                  I completed and checked this step
                </label>
              ) : step.kind === "yes_no" ? (
                <Field label="Result">
                  <select
                    id={`step-value-${step.id}`}
                    value={value === true ? "yes" : value === false ? "no" : ""}
                    onChange={(e) =>
                      change(e.target.value === "" ? null : e.target.value === "yes")
                    }
                  >
                    <option value="">Select a result</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
              ) : step.kind === "select" ? (
                <Field label="Result">
                  <select
                    id={`step-value-${step.id}`}
                    value={value == null ? "" : String(value)}
                    onChange={(e) => change(e.target.value)}
                  >
                    <option value="">Select a result</option>
                    {step.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              ) : step.kind === "text" ? (
                <Field label="Result / notes">
                  <textarea
                    id={`step-value-${step.id}`}
                    value={value == null ? "" : String(value)}
                    onChange={(e) => change(e.target.value)}
                    rows={3}
                  />
                </Field>
              ) : (
                <Field
                  label={
                    step.kind === "amount"
                      ? "Amount (record currency in notes/reference)"
                      : "Result"
                  }
                >
                  <input
                    id={`step-value-${step.id}`}
                    type={
                      ["amount", "number"].includes(step.kind)
                        ? "number"
                        : step.kind === "date"
                          ? "date"
                          : "url"
                    }
                    step={["amount", "number"].includes(step.kind) ? "any" : undefined}
                    value={value == null ? "" : String(value)}
                    onChange={(e) =>
                      change(
                        e.target.value === ""
                          ? null
                          : ["amount", "number"].includes(step.kind)
                            ? Number(e.target.value)
                            : e.target.value,
                      )
                    }
                  />
                </Field>
              )}
            </fieldset>
          )}
          {error && <Notice error>{error}</Notice>}
          {savedNotice && (
            <p className="saved" role="status">
              {savedNotice}
            </p>
          )}
          {editable && (!locked || na) && (
            <div className="row">
              <button
                id={`save-step-${step.id}`}
                type="submit"
                className="btn small"
                disabled={busy}
              >
                {busy ? "Saving…" : dirty ? "Save step" : "Save answer"}
              </button>
              <small className="hint">Only successfully saved answers survive a reload.</small>
            </div>
          )}
        </form>
        {files.length > 0 && (
          <div className="stack-sm">
            {files.map((file) => (
              <EvidenceLink key={file.id} file={file} />
            ))}
          </div>
        )}
        {!na && step.evidence !== "none" && (
          <p className="hint">
            Required:{" "}
            {step.evidence === "before_after"
              ? "one before file and one after file"
              : "at least one file or screenshot"}
            .
          </p>
        )}
        {editable && !na && !locked && (
          <EvidenceUpload step={step} data={data} dirtyChanged={dirtyChanged} refresh={refresh} />
        )}
      </div>
    </section>
  );
}
function EvidenceLink({ file }: { file: Evidence }) {
  return (
    <div className="file-item">
      <span>
        {file.filename} <Badge status={file.label} />
        <small className="muted"> · {Math.ceil(file.size_bytes / 1024)} KB</small>
      </span>
      <a
        id={`evidence-${file.id}`}
        href={`/api/evidence/${file.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open ↗
      </a>
    </div>
  );
}
function EvidenceUpload({
  step,
  data,
  dirtyChanged,
  refresh,
}: {
  step: Step;
  data: RunBundle;
  dirtyChanged: (id: string, dirty: boolean) => void;
  refresh: () => void;
}) {
  const { execute, busy, error } = useCommand(data.workspace.id);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [failure, setFailure] = useState("");
  const [registration, setRegistration] = useState<{
    id: string;
    path: string;
    key: string;
  } | null>(null);
  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setFailure("");
    dirtyChanged(`upload-${step.id}`, true);
    try {
      if (file.size < 1 || file.size > APP.maxUploadBytes)
        throw new Error("Choose a non-empty file no larger than 10 MB.");
      const type = /\.csv$/i.test(file.name)
        ? "text/csv"
        : file.type || (/\.txt$/i.test(file.name) ? "text/plain" : "");
      if (
        ![
          "image/png",
          "image/jpeg",
          "image/webp",
          "application/pdf",
          "text/plain",
          "text/csv",
        ].includes(type)
      )
        throw new Error(
          "Use PNG, JPEG, WebP, PDF, plain text or CSV. SVG and executable files are not accepted.",
        );
      const key = `${file.name}:${file.size}:${file.lastModified}:${label}`;
      let reg = registration;
      if (!reg || reg.key !== key) {
        const result = await execute("register_evidence", {
          run_id: data.run.id,
          step_id: step.id,
          filename: file.name.slice(0, 150),
          content_type: type,
          size_bytes: file.size,
          label,
        });
        reg = { id: String(result.id), path: String(result.path), key };
        setRegistration(reg);
      }
      const result = await browserSupabase()
        .storage.from(APP.evidenceBucket)
        .upload(reg.path, file, { contentType: type, upsert: false, cacheControl: "0" });
      if (result.error && !["409", "400"].includes(String(result.error.statusCode)))
        throw new Error(result.error.message);
      // If a previous attempt uploaded but its response was lost, confirm the same immutable object.
      // SQL checks existence, exact size and MIME; a generic 400 is not treated as success on its own.
      await execute("confirm_evidence", { run_id: data.run.id, id: reg.id });
      setFile(null);
      setRegistration(null);
      dirtyChanged(`upload-${step.id}`, false);
      refresh();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Upload failed. Retry this file.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <details className="step-details">
      <summary>Attach evidence</summary>
      <div className="stack-sm" style={{ marginTop: 10 }}>
        <input
          id={`evidence-file-${step.id}`}
          type="file"
          aria-label={`Evidence file for ${step.title}`}
          accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv,.csv"
          disabled={uploading || busy}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setRegistration(null);
            dirtyChanged(`upload-${step.id}`, Boolean(e.target.files?.[0]));
          }}
        />
        <Field label="Evidence label">
          <select
            id={`evidence-label-${step.id}`}
            value={label}
            disabled={uploading || busy}
            onChange={(e) => setLabel(e.target.value)}
          >
            <option value="general">General</option>
            <option value="before">Before</option>
            <option value="after">After</option>
          </select>
        </Field>
        {(failure || error) && <Notice error>{failure || error}</Notice>}
        <div className="row">
          <button
            id={`upload-evidence-${step.id}`}
            className="btn small"
            disabled={!file || uploading || busy}
            onClick={upload}
          >
            {uploading
              ? "Uploading and confirming…"
              : failure
                ? "Retry upload"
                : "Upload and attach"}
          </button>
          {file && !uploading && (
            <button
              id={`discard-upload-${step.id}`}
              className="btn small"
              onClick={() => {
                setFile(null);
                setRegistration(null);
                setFailure("");
                dirtyChanged(`upload-${step.id}`, false);
              }}
            >
              Discard selection
            </button>
          )}
        </div>
        <p className="hint">
          Private storage · maximum 10 MB. Upload failures do not satisfy the checklist. Do not
          upload passwords or unnecessary customer data.
        </p>
      </div>
    </details>
  );
}
