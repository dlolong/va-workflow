import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { Invitation } from "@/components/invitation";
export default async function Invite({
  params,
}: {
  params: Promise<{
    token: string;
  }>;
}) {
  const { token } = await params;
  const db = await serverSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  return (
    <main id="main-content" className="setup-wrap">
      <Invitation token={token} />
    </main>
  );
}
