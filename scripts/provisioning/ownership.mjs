/** Narrow maintenance operation. Caller MUST hold a transaction and commit/rollback it.
 * No Auth/session impersonation, notification, content or cross-workspace mutations.
 */
export async function transferOwnership(
  db,
  { workspaceId, previousOwnerId, newOwnerId },
  apply = false,
) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    ![workspaceId, previousOwnerId, newOwnerId].every((x) => uuid.test(x)) ||
    previousOwnerId === newOwnerId
  )
    throw new Error("Distinct exact existing owner IDs and workspace ID required.");
  const w = (
    await db.query(
      "select id, owner_id, archived_at from public.workspaces where id=$1 for update",
      [workspaceId],
    )
  ).rows[0];
  if (!w || w.archived_at) throw new Error("Exact workspace missing or archived; no fallback.");
  const accounts = await db.query(
    "select p.id from public.profiles p join auth.users u on u.id=p.id where p.id=any($1::uuid[]) for update of p",
    [[previousOwnerId, newOwnerId]],
  );
  if (accounts.rows.length !== 2)
    throw new Error("Both existing Auth accounts and profiles must be verified.");
  const members = (
    await db.query(
      "select user_id, role, active from public.memberships where workspace_id=$1 for update",
      [workspaceId],
    )
  ).rows;
  const old = members.find((x) => x.user_id === previousOwnerId);
  const next = members.find((x) => x.user_id === newOwnerId);
  if (
    members.some(
      (x) => x.active && x.role === "owner" && ![previousOwnerId, newOwnerId].includes(x.user_id),
    )
  )
    throw new Error("Conflicting additional owner; resolve explicitly.");
  if (
    w.owner_id === newOwnerId &&
    next?.active &&
    next.role === "owner" &&
    old?.active &&
    old.role === "va"
  )
    return { state: "reuse_preserved", changed: 0 };
  if (w.owner_id !== previousOwnerId || !old?.active || old.role !== "owner")
    throw new Error("Previous owner/workspace membership conflict; no overwrite.");
  if (next && (!next.active || next.role === "owner"))
    throw new Error("New owner membership conflicts; no implicit reactivation.");
  const reviews = await db.query(
    `select exists(
    select 1 from public.runs where workspace_id=$1 and reviewer_id=$2 and status not in ('completed','cancelled')
    union all select 1 from public.schedules where workspace_id=$1 and reviewer_id=$2 and active
    union all select 1 from public.approvals where workspace_id=$1 and reviewer_id=$2 and status='pending'
  ) blocked`,
    [workspaceId, previousOwnerId],
  );
  if (reviews.rows[0].blocked)
    throw new Error(
      "Previous owner has active review responsibilities; resolve before VA demotion.",
    );
  if (!apply)
    return {
      state: "transfer_ready",
      changed: 0,
      proposed: { workspace: 1, memberships: 2, audit: 1 },
    };
  await db.query(
    "insert into public.memberships(workspace_id,user_id,role,active) values($1,$2,'owner',true) on conflict(workspace_id,user_id) do update set role='owner'",
    [workspaceId, newOwnerId],
  );
  await db.query("update public.memberships set role='va' where workspace_id=$1 and user_id=$2", [
    workspaceId,
    previousOwnerId,
  ]);
  await db.query("update public.workspaces set owner_id=$2 where id=$1", [workspaceId, newOwnerId]);
  // This is a database maintenance action, not an invented authenticated human action.
  await db.query(
    `insert into public.audit_events(workspace_id,actor_id,event,detail)
    values($1,null,'workspace_ownership_maintenance',jsonb_build_object(
    'previous_owner',$2::text,'new_owner',$3::text,'previous_owner_role','va',
    'mechanism','explicitly authorized database maintenance','database_role',current_user))`,
    [workspaceId, previousOwnerId, newOwnerId],
  );
  return { state: "transferred", changed: 4 };
}
