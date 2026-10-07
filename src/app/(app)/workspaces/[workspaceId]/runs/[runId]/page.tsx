import { notFound } from "next/navigation";
import { z } from "zod";
import { getRunBundle } from "@/lib/data";
import { RunWorkspace } from "@/components/run-workspace";
export default async function RunPage({
  params,
}: {
  params: Promise<{
    workspaceId: string;
    runId: string;
  }>;
}) {
  const { workspaceId, runId } = await params;
  if (
    !z.string().uuid().safeParse(workspaceId).success ||
    !z.string().uuid().safeParse(runId).success
  )
    notFound();
  const data = await getRunBundle(workspaceId, runId);
  return <RunWorkspace data={data} />;
}
