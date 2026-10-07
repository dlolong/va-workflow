import { configured } from "@/lib/supabase/server";
import { getWorkspaces } from "@/lib/data";
import { Setup } from "@/components/setup";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!configured()) return <Setup />;
  const { workspaces, profile } = await getWorkspaces();
  return (
    <Shell workspaces={workspaces} profile={profile}>
      {children}
    </Shell>
  );
}
