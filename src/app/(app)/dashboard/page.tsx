import { getWorkspaces } from "@/lib/data";
import { WorkspaceList } from "@/components/workspaces";
export default async function Dashboard() {
  const { workspaces } = await getWorkspaces();
  return <WorkspaceList workspaces={workspaces} />;
}
