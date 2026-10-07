export type Role = "owner" | "manager" | "client" | "va";
export type WorkStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "waiting_on_client"
  | "for_review"
  | "changes_requested"
  | "completed"
  | "cancelled";
export type StepKind =
  "checkbox" | "text" | "number" | "amount" | "date" | "url" | "yes_no" | "select";
export type Step = {
  id: string;
  title: string;
  instructions: string;
  kind: StepKind;
  required: boolean;
  allow_na: boolean;
  evidence: "none" | "file" | "before_after";
  approval_before: boolean;
  options: string[];
};
export type Workflow = {
  title: string;
  description: string;
  sop: string;
  can_do: string;
  ask_first: string;
  never_do: string;
  resources: {
    label: string;
    url: string;
  }[];
  steps: Step[];
  review_required: boolean;
};
export type Workspace = {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
  archived_at: string | null;
};
export type Profile = {
  id: string;
  display_name: string;
  timezone: string;
  email_notifications: boolean;
};
export type Member = {
  workspace_id: string;
  user_id: string;
  role: Role;
  active: boolean;
  profile: Profile | null;
};
export type Process = {
  id: string;
  workspace_id: string;
  title: string;
  draft: Workflow;
  published_content: Workflow | null;
  published_version: number | null;
  archived: boolean;
  updated_at: string;
};
export type ProcessVersion = {
  process_id: string;
  version: number;
  workspace_id: string;
  content: Workflow;
  published_at: string;
};
export type Schedule = {
  id: string;
  workspace_id: string;
  process_id: string;
  assignee_id: string;
  reviewer_id: string | null;
  frequency: "daily" | "weekdays" | "weekly" | "monthly";
  weekday: number;
  monthday: number;
  local_time: string;
  timezone: string;
  lead_minutes: number;
  next_due_at: string;
  active: boolean;
};
export type Run = {
  id: string;
  workspace_id: string;
  process_id: string | null;
  process_version: number | null;
  title: string;
  snapshot: Workflow;
  assignee_id: string;
  reviewer_id: string | null;
  created_by: string | null;
  status: WorkStatus;
  due_at: string | null;
  reference: string;
  source_url: string;
  priority: "normal" | "high";
  waiting_on_id: string | null;
  waiting_reason: string;
  follow_up_at: string | null;
  follow_up_owner_id: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  review_note: string;
  handover_note: string;
  version: number;
  created_at: string;
  updated_at: string;
};
export type ResponseRow = {
  run_id: string;
  workspace_id: string;
  step_id: string;
  value: string | number | boolean | null;
  not_applicable: boolean;
  na_reason: string;
  updated_by: string;
  updated_at: string;
};
export type Evidence = {
  id: string;
  workspace_id: string;
  run_id: string;
  step_id: string;
  object_path: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  label: "general" | "before" | "after";
  state: "pending" | "attached";
  created_by: string;
  created_at: string;
};
export type Approval = {
  id: string;
  workspace_id: string;
  run_id: string;
  step_id: string;
  requested_by: string;
  reviewer_id: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  decision_note: string;
  decided_at: string | null;
};
export type Issue = {
  id: string;
  workspace_id: string;
  run_id: string;
  title: string;
  detail: string;
  recommendation: string;
  owner_id: string;
  follow_up_at: string;
  blocking: boolean;
  status: "open" | "resolved";
  resolution: string;
  created_at: string;
};
export type Comment = {
  id: string;
  workspace_id: string;
  run_id: string;
  author_id: string;
  body: string;
  created_at: string;
};
export type Audit = {
  id: number;
  workspace_id: string;
  run_id: string | null;
  actor_id: string | null;
  event: string;
  detail: Record<string, unknown>;
  created_at: string;
};
export type Notification = {
  id: string;
  workspace_id: string;
  recipient_id: string;
  title: string;
  body: string;
  run_id: string | null;
  read_at: string | null;
  created_at: string;
};
export type Training = {
  id: string;
  workspace_id: string;
  process_id: string;
  user_id: string;
  trainer_id: string;
  stage: string;
  note: string;
  signed_off_at: string | null;
  updated_at: string;
};
export type Invitation = {
  id: string;
  workspace_id: string;
  email: string;
  role: Role;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};
export type DataBundle = {
  workspace: Workspace;
  me: Profile;
  role: Role;
  members: Member[];
  processes: Process[];
  schedules: Schedule[];
  runs: Run[];
  approvals: Approval[];
  issues: Issue[];
  training: Training[];
  notifications: Notification[];
  invitations: Invitation[];
  activity: Audit[];
  totalRuns: number;
  page: number;
  pageSize: number;
};
export type RunBundle = {
  run: Run;
  responses: ResponseRow[];
  evidence: Evidence[];
  approvals: Approval[];
  issues: Issue[];
  comments: Comment[];
  activity: Audit[];
  members: Member[];
  workspace: Workspace;
  userId: string;
  role: Role;
};
export type CommandResult = {
  id?: string;
  token?: string;
  [key: string]: unknown;
};
