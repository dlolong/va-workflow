/** Shared pure rules. SQL enforces the same rules authoritatively. No dependencies. */
export const TERMINAL = ["completed", "cancelled"];
export const WORK_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "waiting_on_client",
  "for_review",
  "changes_requested",
  "completed",
  "cancelled",
];
export const EDITABLE = [
  "not_started",
  "in_progress",
  "blocked",
  "waiting_on_client",
  "changes_requested",
];
export function isOverdue(run, now = new Date()) {
  return (
    !TERMINAL.includes(run.status) &&
    Boolean(run.due_at) &&
    new Date(run.due_at).getTime() < now.getTime()
  );
}
export function isDueToday(run, timeZone, now = new Date()) {
  const key = (d) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));
  return !TERMINAL.includes(run.status) && Boolean(run.due_at) && key(run.due_at) === key(now);
}
export function safeNext(value) {
  const unsafe = (s) => s.includes("\\") || s.includes("\r") || s.includes("\n");
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    unsafe(value)
  )
    return "/dashboard";
  // Reject encoded protocol-relative and backslash routes, including double encoding.
  let decoded = value;
  try {
    for (let i = 0; i < 3; i++) decoded = decodeURIComponent(decoded);
  } catch {
    return "/dashboard";
  }
  return decoded.startsWith("//") || unsafe(decoded) ? "/dashboard" : value;
}
export function safeUrl(value) {
  if (
    typeof value !== "string" ||
    value.length > 2000 ||
    !/^https?:\/\/(\[[0-9a-fA-F:]+\]|[a-zA-Z0-9][a-zA-Z0-9.-]*)(:[0-9]{1,5})?([/?#][^\s\\]*)?$/.test(
      value,
    )
  )
    return false;
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
export function completionProblems(steps, responses, evidence, approvals = []) {
  const result = [];
  for (const step of steps) {
    const answer = responses.find((r) => r.step_id === step.id);
    if (answer?.not_applicable) {
      if (!step.allow_na || !answer.na_reason?.trim())
        result.push(`${step.title}: explain why this is not applicable.`);
      continue;
    }
    if (
      step.approval_before &&
      !approvals.some((a) => a.step_id === step.id && a.status === "approved")
    )
      result.push(`${step.title}: permission is required first.`);
    const value = answer?.value;
    const missing =
      value == null ||
      (typeof value === "string" && !value.trim()) ||
      (step.kind === "checkbox" && value !== true);
    if (step.required && missing) result.push(`${step.title}: an answer is required.`);
    if (!missing && step.kind === "url" && !safeUrl(String(value)))
      result.push(`${step.title}: use a valid HTTP(S) URL.`);
    if (
      step.evidence === "file" &&
      !evidence.some((e) => e.step_id === step.id && e.state === "attached")
    )
      result.push(`${step.title}: attach evidence.`);
    if (step.evidence === "before_after")
      for (const label of ["before", "after"])
        if (
          !evidence.some(
            (e) => e.step_id === step.id && e.state === "attached" && e.label === label,
          )
        )
          result.push(`${step.title}: attach ${label} evidence.`);
  }
  return result;
}
export function cleanFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "attachment";
}
export function hasWritableRole(role) {
  return ["owner", "manager"].includes(role);
}
export function displayStatus(status) {
  return String(status).replaceAll("_", " ");
}
export function parsePastedSteps(text) {
  return text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*(?:[-*•☐☑]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 100);
}
