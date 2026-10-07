import "server-only";
import { redirect, notFound } from "next/navigation";
import { serverSupabase } from "./supabase/server";
import type {
  DataBundle,
  RunBundle,
  Workspace,
  Profile,
  Member,
  Process,
  Schedule,
  Run,
  Approval,
  Issue,
  Training,
  Notification,
  Invitation,
  Audit,
  Evidence,
  ResponseRow,
  Comment,
} from "./types";
export function rows<T>(result: {
  data: unknown;
  error: {
    message: string;
  } | null;
}): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}
export async function signedIn() {
  const db = await serverSupabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  return { db, user };
}
export async function getWorkspaces() {
  const { db, user } = await signedIn();
  const workspaces = rows<Workspace[]>(
    await db.from("workspaces").select("*").order("created_at", { ascending: false }),
  );
  const result = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  const profile = (result.data as Profile | null) || {
    id: user.id,
    display_name: user.user_metadata?.display_name || "Team member",
    timezone: "Asia/Manila",
    email_notifications: true,
  };
  return { workspaces, profile, user };
}
async function getMembers(
  db: Awaited<ReturnType<typeof serverSupabase>>,
  w: string,
): Promise<Member[]> {
  return rows<Member[]>(
    await db
      .from("memberships")
      .select("*,profile:profiles(*)")
      .eq("workspace_id", w)
      .order("created_at"),
  );
}
export async function getWorkspaceBundle(
  w: string,
  section: string,
  page = 1,
  search = "",
): Promise<DataBundle> {
  const { db, user } = await signedIn();
  const workspaceResult = await db.from("workspaces").select("*").eq("id", w).maybeSingle();
  if (workspaceResult.error) throw new Error(workspaceResult.error.message);
  if (!workspaceResult.data) notFound();
  const workspace = workspaceResult.data as Workspace;
  const members = await getMembers(db, w);
  const membership = members.find((m) => m.user_id === user.id && m.active);
  if (!membership) notFound();
  const me = membership.profile || {
    id: user.id,
    display_name: "Team member",
    timezone: "Asia/Manila",
    email_notifications: true,
  };
  const pageSize = 50;
  page = Math.max(1, Math.min(100000, page));
  let query = db.from("runs").select("*", { count: "exact" }).eq("workspace_id", w);
  if (search) query = query.ilike("title", `%${search.replace(/[%,_\\]/g, " ")}%`);
  if (section === "today")
    query = query
      .not("status", "in", "(completed,cancelled)")
      .or(`assignee_id.eq.${user.id},follow_up_owner_id.eq.${user.id}`);
  if (section === "reviews")
    query = query.in("status", ["for_review", "waiting_on_client", "blocked"]);
  if (section === "deadlines")
    query = query.not("status", "in", "(completed,cancelled)").not("due_at", "is", null);
  query = query
    .order(section === "tasks" ? "created_at" : "due_at", {
      ascending: section !== "tasks",
      nullsFirst: false,
    })
    .order("id")
    .range((page - 1) * pageSize, page * pageSize - 1);
  const [
    runResult,
    processResult,
    scheduleResult,
    approvalResult,
    issueResult,
    trainingResult,
    notificationResult,
    auditResult,
  ] = await Promise.all([
    query,
    db.from("process_overview").select("*").eq("workspace_id", w).order("title").limit(200),
    db.from("schedules").select("*").eq("workspace_id", w).order("next_due_at").limit(200),
    db.from("approvals").select("*").eq("workspace_id", w).eq("status", "pending").limit(200),
    db
      .from("issues")
      .select("*")
      .eq("workspace_id", w)
      .eq("status", "open")
      .order("follow_up_at")
      .limit(200),
    db
      .from("training")
      .select("*")
      .eq("workspace_id", w)
      .order("updated_at", { ascending: false })
      .limit(200),
    db
      .from("notifications")
      .select("*")
      .eq("workspace_id", w)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("audit_events")
      .select("*")
      .eq("workspace_id", w)
      .order("id", { ascending: false })
      .limit(100),
  ]);
  let invitations: Invitation[] = [];
  if (["owner", "manager"].includes(membership.role))
    invitations = rows<Invitation[]>(
      await db
        .from("invitations")
        .select("id,workspace_id,email,role,expires_at,accepted_at,revoked_at")
        .eq("workspace_id", w)
        .order("created_at", { ascending: false })
        .limit(100),
    );
  return {
    workspace,
    me,
    role: membership.role,
    members,
    processes: rows<Process[]>(processResult),
    schedules: rows<Schedule[]>(scheduleResult),
    runs: rows<Run[]>(runResult),
    approvals: rows<Approval[]>(approvalResult),
    issues: rows<Issue[]>(issueResult),
    training: rows<Training[]>(trainingResult),
    notifications: rows<Notification[]>(notificationResult),
    invitations,
    activity: rows<Audit[]>(auditResult),
    totalRuns: runResult.count || 0,
    page,
    pageSize,
  };
}
export async function getRunBundle(w: string, id: string): Promise<RunBundle> {
  const { db, user } = await signedIn();
  const runResult = await db
    .from("runs")
    .select("*")
    .eq("workspace_id", w)
    .eq("id", id)
    .maybeSingle();
  if (runResult.error) throw new Error(runResult.error.message);
  if (!runResult.data) notFound();
  const run = runResult.data as Run;
  const members = await getMembers(db, w);
  const member = members.find((m) => m.user_id === user.id && m.active);
  if (!member) notFound();
  const [workspace, responses, evidence, approvals, issues, comments, activity] = await Promise.all(
    [
      db.from("workspaces").select("*").eq("id", w).single(),
      db.from("step_responses").select("*").eq("run_id", id),
      db.from("evidence").select("*").eq("run_id", id).order("created_at"),
      db.from("approvals").select("*").eq("run_id", id).order("created_at", { ascending: false }),
      db.from("issues").select("*").eq("run_id", id).order("created_at", { ascending: false }),
      db
        .from("comments")
        .select("*")
        .eq("run_id", id)
        .order("created_at", { ascending: false })
        .limit(200),
      db
        .from("audit_events")
        .select("*")
        .eq("run_id", id)
        .order("id", { ascending: false })
        .limit(100),
    ],
  );
  return {
    run,
    members,
    workspace: rows<Workspace>(workspace),
    responses: rows<ResponseRow[]>(responses),
    evidence: rows<Evidence[]>(evidence),
    approvals: rows<Approval[]>(approvals),
    issues: rows<Issue[]>(issues),
    comments: rows<Comment[]>(comments),
    activity: rows<Audit[]>(activity),
    userId: user.id,
    role: member.role,
  };
}
