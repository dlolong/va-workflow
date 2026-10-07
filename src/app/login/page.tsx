import { AuthForm } from "@/components/auth-form";
import { Setup } from "@/components/setup";
import { configured } from "@/lib/supabase/server";
import { safeNext } from "@/lib/domain.mjs";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
  }>;
}) {
  if (!configured()) return <Setup />;
  const q = await searchParams;
  return <AuthForm nextPath={safeNext(q.next)} />;
}
