import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";
import { toCsv } from "@/lib/domain.mjs";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
    }>;
  },
) {
  const { workspaceId: w } = await params;
  if (!z.string().uuid().safeParse(w).success) return jsonError("Not found.", 404);
  const db = await serverSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return jsonError("Sign in.", 401);
  const { data: role } = await db.rpc("workspace_role", { w });
  if (!["owner", "manager", "client"].includes(role))
    return jsonError("Client or manager permission required.", 403);
  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "json";
  const tables =
    format === "csv"
      ? ["runs"]
      : [
          "workspaces",
          "memberships",
          "processes",
          "process_versions",
          "schedules",
          "runs",
          "step_responses",
          "evidence",
          "approvals",
          "issues",
          "comments",
          "training",
          "audit_events",
        ];
  const exported: Record<string, unknown[]> = {};
  for (const table of tables) {
    const records: unknown[] = [];
    for (let offset = 0; offset < 100000; offset += 500) {
      let query = db
        .from(table)
        .select("*")
        .eq(table === "workspaces" ? "id" : "workspace_id", w);
      query = query.order(
        table === "step_responses"
          ? "run_id"
          : table === "process_versions"
            ? "process_id"
            : table === "memberships"
              ? "user_id"
              : "id",
      );
      if (table === "step_responses") query = query.order("step_id");
      if (table === "process_versions") query = query.order("version");
      const { data, error } = await query.range(offset, offset + 499);
      if (error) return jsonError("Export failed; no complete export was produced.", 500);
      records.push(...(data || []));
      if ((data?.length || 0) < 500) break;
      if (offset === 99500)
        return jsonError(
          "Export exceeds the pilot limit. Use a database backup for a complete export.",
          413,
        );
    }
    exported[table] = records;
  }
  const rows = exported.runs as Record<string, unknown>[];
  const columns = [
    "id",
    "title",
    "reference",
    "status",
    "assignee_id",
    "reviewer_id",
    "due_at",
    "submitted_at",
    "completed_at",
    "waiting_reason",
    "follow_up_at",
  ];
  const content =
    format === "csv"
      ? toCsv([columns, ...rows.map((r) => columns.map((c) => r[c]))])
      : JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            workspace_id: w,
            attachment_bytes_included: false,
            note: "Point-in-time application export; not a transaction-consistent database backup.",
            tables: exported,
          },
          null,
          2,
        );
  return new NextResponse(content, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json",
      "Content-Disposition": `attachment; filename="va-relay-${w}.${format}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
