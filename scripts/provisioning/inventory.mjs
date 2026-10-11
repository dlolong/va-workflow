/** Read-only, exact-workspace metadata. Never persist client descriptions, answers or emails. */
export async function inventory(db, workspaceId, items) {
  if (!workspaceId) throw new Error("An exact workspace ID is required");
  const result = { counts: {}, members: [], processes: [], runs: [], schedules: [], blockers: [] };
  const tables = [
    "memberships",
    "processes",
    "process_versions",
    "schedules",
    "runs",
    "step_responses",
    "comments",
    "issues",
    "training",
    "approvals",
    "evidence",
  ];
  const counts = await Promise.all(
    tables.map(async (table) => {
      const r = await db
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);
      return { table, ...r };
    }),
  );
  for (const r of counts) {
    if (r.error) result.blockers.push(`Scoped ${r.table} count failed`);
    else result.counts[r.table] = r.count;
  }
  const fields = {
    memberships: "user_id,role,active",
    processes: "id,title,published_version,archived",
    runs: "id,title,assignee_id,process_id,schedule_id,status,due_at,reviewer_id,reference",
    schedules: "id,process_id,assignee_id,reviewer_id,active,timezone,frequency",
  };
  const matchingKeys = (title) =>
    items
      .filter((i) => i.content?.title === title || title?.split(" ")[0] === i.key)
      .map((i) => i.key);
  for (const [table, select] of Object.entries(fields)) {
    const r = await db.from(table).select(select).eq("workspace_id", workspaceId).limit(1000);
    if (r.error || r.data.length !== result.counts[table]) {
      result.blockers.push(`Scoped ${table} inventory failed or was incomplete; no apply`);
      continue;
    }
    if (table === "memberships") result.members = r.data;
    if (table === "processes")
      result.processes = r.data.map(({ title, ...v }) => ({
        ...v,
        matchingKeys: matchingKeys(title),
      }));
    if (table === "runs")
      result.runs = r.data.map(({ title, reference, due_at, ...v }) => ({
        ...v,
        hasDueDate: !!due_at,
        hasSetupReference: reference.startsWith("setup:"),
        matchingKeys: matchingKeys(title),
      }));
    if (table === "schedules") {
      result.schedules = r.data;
      if (r.data.some((s) => !result.processes.some((p) => p.id === s.process_id)))
        result.blockers.push("Schedule process relationship not resolved in target workspace");
    }
  }
  return result;
}
