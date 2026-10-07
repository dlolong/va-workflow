import { notFound } from "next/navigation";
import { z } from "zod";
import { getWorkspaceBundle, signedIn, rows } from "@/lib/data";
import { SECTIONS } from "@/lib/config";
import { WorkspaceSection } from "@/components/workspace-section";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{
    workspaceId: string;
    section: string;
  }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}) {
  const { workspaceId, section } = await params;
  const q = await searchParams;
  if (!z.string().uuid().safeParse(workspaceId).success || !SECTIONS.some((s) => s[0] === section))
    notFound();
  const page = Math.max(1, Number.parseInt(q.page || "1", 10) || 1);
  const search = (q.q || "").slice(0, 120);
  const data = await getWorkspaceBundle(workspaceId, section, page, search);
  const { db } = await signedIn();
  const stats = rows<Record<string, number | string | null>>(
    await db.rpc("workspace_stats", { p_workspace: workspaceId }),
  );
  let health: Record<string, number | string | null> | undefined;
  if (section === "settings" && ["owner", "manager"].includes(data.role))
    health = rows<Record<string, number | string | null>>(
      await db.rpc("automation_health", { p_workspace: workspaceId }),
    );
  return (
    <WorkspaceSection data={data} section={section} stats={stats} health={health} search={search} />
  );
}
