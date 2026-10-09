/** Read-only provisioning discovery. Never changes Auth, roles, or business records. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

export function assessTarget({
  userId,
  workspaceId,
  workspaceName,
  timezone,
  user,
  workspaces,
  memberships,
  ownerUsers,
}) {
  const blockers = [];
  if (!user || user.id !== userId)
    blockers.push("Target existing authentication account was not verified.");
  const matches = workspaces.filter((w) =>
    workspaceId ? w.id === workspaceId : w.name === workspaceName,
  );
  if (matches.length !== 1)
    blockers.push(
      "Exactly one matching workspace is required; missing/inaccessible targets never fall back.",
    );
  const workspace = matches.length === 1 ? matches[0] : null;
  if (workspace) {
    if (workspace.archived_at) blockers.push("Target workspace is archived.");
    if (timezone && workspace.timezone !== timezone)
      blockers.push("Workspace timezone differs from the requested timezone.");
    const targetMembership = memberships.find(
      (m) => m.workspace_id === workspace.id && m.user_id === userId,
    );
    if (!targetMembership?.active || targetMembership.role !== "va")
      blockers.push("Target must have verified active VA membership; no role change is inferred.");
    if (workspace.owner_id === userId)
      blockers.push(
        "Target user owns the workspace. A separate authorized owner and explicit ownership resolution are required.",
      );
    const ownerMembership = memberships.find(
      (m) => m.workspace_id === workspace.id && m.user_id === workspace.owner_id,
    );
    if (
      !ownerMembership?.active ||
      ownerMembership.role !== "owner" ||
      !ownerUsers.some((u) => u.id === workspace.owner_id)
    )
      blockers.push("Workspace owner account and active owner membership must both be verified.");
  }
  return { workspace, blockers, readyForReview: blockers.length === 0 };
}

export async function discover(db, target) {
  const auth = await db.auth.admin.getUserById(target.userId);
  if (auth.error) throw new Error("Target authentication lookup failed; no changes made.");
  let query = db.from("workspaces").select("id,name,owner_id,timezone,archived_at");
  query = target.workspaceId
    ? query.eq("id", target.workspaceId)
    : query.eq("name", target.workspaceName);
  const result = await query;
  if (result.error) throw new Error("Workspace lookup failed; no changes made.");
  // Stop before expanding scope when a name is ambiguous.
  const matches = result.data || [];
  const memberships = [],
    ownerUsers = [];
  if (matches.length === 1) {
    const workspace = matches[0];
    const members = await db
      .from("memberships")
      .select("workspace_id,user_id,role,active")
      .eq("workspace_id", workspace.id)
      .in("user_id", [target.userId, workspace.owner_id]);
    if (members.error) throw new Error("Scoped membership lookup failed; no changes made.");
    memberships.push(...members.data);
    const owner =
      workspace.owner_id === target.userId
        ? auth
        : await db.auth.admin.getUserById(workspace.owner_id);
    if (!owner.error && owner.data.user) ownerUsers.push({ id: owner.data.user.id });
  }
  return assessTarget({
    ...target,
    user: auth.data.user,
    workspaces: matches,
    memberships,
    ownerUsers,
  });
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2].startsWith("--"))
    throw new Error(
      "Usage: node scripts/provisioning/preflight.mjs <private-config.json>. Read-only; no apply mode.",
    );
  const config = JSON.parse(readFileSync(process.argv[2], "utf8"));
  for (const key of ["userId", "workspaceName", "timezone", "sourcePath", "promptPath"])
    if (typeof config[key] !== "string" || !config[key].trim())
      throw new Error(`Missing config field: ${key}`);
  if (!/^[a-f0-9-]{36}$/i.test(config.userId)) throw new Error("Invalid target user ID.");
  new Intl.DateTimeFormat("en", { timeZone: config.timezone });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Read-only account discovery requires server-only Supabase configuration.");
  const sourceChecks = {};
  const blockers = [];
  for (const field of ["sourcePath", "promptPath"]) {
    try {
      sourceChecks[field] = createHash("sha256").update(readFileSync(config[field])).digest("hex");
    } catch {
      blockers.push(`${field} is unavailable; source preparation cannot be finalized.`);
    }
  }
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const result = await discover(db, config);
  // Private review output only: no credentials, account emails, document text, or unrelated workspaces.
  console.log(
    JSON.stringify(
      {
        status: "IMPLEMENTED ONLY",
        mode: "read-only-preflight",
        project: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
        workspace: result.workspace,
        sourceChecks,
        blockers: [...blockers, ...result.blockers],
        databaseChanges: 0,
        note: "This is discovery, not a completed provisioning dry run or authorization to apply.",
      },
      null,
      2,
    ),
  );
  process.exitCode = blockers.length || result.blockers.length ? 2 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await import("../load-env.mjs");
  main().catch(() => {
    console.error(
      "Preflight failed. Check the private configuration, source files and service connectivity. No changes made.",
    );
    process.exitCode = 1;
  });
}
