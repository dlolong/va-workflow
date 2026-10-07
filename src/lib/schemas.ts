import { z } from "zod";
const uuid = z.string().uuid();
const optionalId = z.union([uuid, z.literal(""), z.null()]).optional();
const short = z.string().trim().min(1).max(200);
const note = z.string().trim().min(1).max(5000);
const text = z.string().max(20000).default("");
const instant = z.string().datetime({ offset: true });
const optionalInstant = z.union([instant, z.literal(""), z.null()]).optional();
const timezone = z
  .string()
  .min(1)
  .max(100)
  .refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid timezone.");
const url = z
  .string()
  .max(2000)
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Use an HTTP(S) link.");
export const stepSchema = z
  .strictObject({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
    title: short,
    instructions: text,
    kind: z.enum(["checkbox", "text", "number", "amount", "date", "url", "yes_no", "select"]),
    required: z.boolean(),
    allow_na: z.boolean(),
    evidence: z.enum(["none", "file", "before_after"]),
    approval_before: z.boolean(),
    options: z.array(z.string().min(1).max(200)).max(50),
  })
  .refine((v) => v.kind !== "select" || v.options.length > 0, "Dropdown steps need choices.");
export const workflowSchema = z
  .strictObject({
    title: short,
    description: text,
    sop: text,
    can_do: text,
    ask_first: text,
    never_do: text,
    resources: z.array(z.strictObject({ label: short, url: url.refine(Boolean) })).max(30),
    steps: z.array(stepSchema).min(1).max(100),
    review_required: z.boolean(),
  })
  .refine(
    (v) => new Set(v.steps.map((s) => s.id)).size === v.steps.length,
    "Step IDs must be unique.",
  );
const base = { request_id: uuid };
const run = { ...base, run_id: uuid };
const versioned = { ...run, expected_version: z.number().int().positive() };
export const commandSchemas: Record<string, z.ZodType> = {
  update_profile: z.strictObject({
    ...base,
    display_name: z.string().trim().min(1).max(120),
    timezone,
    email_notifications: z.boolean(),
  }),
  create_workspace: z.strictObject({ ...base, name: z.string().trim().min(1).max(120), timezone }),
  update_workspace: z.strictObject({
    ...base,
    name: z.string().trim().min(1).max(120),
    timezone,
    archived: z.boolean(),
  }),
  invite_member: z.strictObject({
    ...base,
    email: z.string().email().max(254),
    role: z.enum(["manager", "client", "va"]),
  }),
  revoke_invitation: z.strictObject({ ...base, id: uuid }),
  accept_invitation: z.strictObject({ ...base, token: z.string().regex(/^[a-f0-9]{64}$/) }),
  remove_member: z.strictObject({ ...base, user_id: uuid, replacement_id: uuid, note }),
  change_role: z.strictObject({
    ...base,
    user_id: uuid,
    role: z.enum(["manager", "client", "va"]),
  }),
  save_process: z.strictObject({ ...base, id: optionalId, content: workflowSchema }),
  publish_process: z.strictObject({ ...base, id: uuid }),
  archive_process: z.strictObject({ ...base, id: uuid, archived: z.boolean() }),
  create_run: z
    .strictObject({
      ...base,
      process_id: optionalId,
      content: workflowSchema.optional(),
      title: z.string().max(200).optional(),
      assignee_id: uuid,
      reviewer_id: optionalId,
      due_at: optionalInstant,
      reference: z.string().max(200).default(""),
      source_url: url.default(""),
      priority: z.enum(["normal", "high"]).default("normal"),
    })
    .refine(
      (v) => Boolean(v.process_id || v.content),
      "Choose a process or supply task instructions.",
    ),
  save_schedule: z.strictObject({
    ...base,
    id: optionalId,
    process_id: uuid,
    assignee_id: uuid,
    reviewer_id: optionalId,
    frequency: z.enum(["daily", "weekdays", "weekly", "monthly"]),
    weekday: z.number().int().min(0).max(6),
    monthday: z.number().int().min(1).max(31),
    local_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
    timezone,
    lead_minutes: z.number().int().min(0).max(43200),
    starts_after: optionalInstant,
  }),
  toggle_schedule: z.strictObject({ ...base, id: uuid, active: z.boolean() }),
  generate_schedules: z.strictObject(base),
  save_response: z.strictObject({
    ...versioned,
    step_id: z.string().max(80),
    value: z.union([z.string().max(20000), z.number().finite(), z.boolean(), z.null()]),
    not_applicable: z.boolean(),
    na_reason: z.string().max(5000),
  }),
  set_status: z.strictObject({
    ...versioned,
    status: z.enum(["in_progress", "blocked", "waiting_on_client", "cancelled"]),
    reason: z.string().max(5000).default(""),
    waiting_on_id: optionalId,
    follow_up_owner_id: optionalId,
    follow_up_at: optionalInstant,
  }),
  submit_run: z.strictObject(versioned),
  review_run: z.strictObject({
    ...versioned,
    decision: z.enum(["completed", "changes_requested"]),
    note: z.string().max(5000).default(""),
  }),
  reassign_run: z.strictObject({
    ...versioned,
    assignee_id: uuid,
    reviewer_id: optionalId,
    due_at: optionalInstant,
    note,
  }),
  request_approval: z.strictObject({ ...run, step_id: z.string().max(80), reason: note }),
  decide_approval: z.strictObject({
    ...run,
    id: uuid,
    decision: z.enum(["approved", "rejected"]),
    note,
  }),
  register_evidence: z.strictObject({
    ...run,
    step_id: z.string().max(80),
    filename: z.string().min(1).max(150),
    content_type: z.enum([
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
    ]),
    size_bytes: z.number().int().min(1).max(10485760),
    label: z.enum(["general", "before", "after"]),
  }),
  confirm_evidence: z.strictObject({ ...run, id: uuid }),
  create_issue: z.strictObject({
    ...run,
    title: short,
    detail: note,
    recommendation: note,
    owner_id: uuid,
    follow_up_at: instant,
    blocking: z.boolean(),
  }),
  resolve_issue: z.strictObject({ ...run, id: uuid, resolution: note }),
  comment: z.strictObject({ ...run, body: note }),
  save_training: z.strictObject({
    ...base,
    process_id: uuid,
    user_id: uuid,
    trainer_id: uuid,
    stage: z.enum([
      "not_started",
      "demonstration",
      "guided_run",
      "independent_run",
      "sop_drafted",
      "sop_approved",
      "owned",
    ]),
    note: z.string().max(5000).default(""),
  }),
  mark_read: z.strictObject({ ...base, id: optionalId }),
};
export const commandEnvelope = z.strictObject({
  workspace_id: uuid.nullable(),
  action: z.string().min(1).max(50),
  payload: z.record(z.string(), z.unknown()),
});
