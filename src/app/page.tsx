import { redirect } from "next/navigation";
import { configured } from "@/lib/supabase/server";
import { Setup } from "@/components/setup";
export default function Home() {
  if (!configured()) return <Setup />;
  redirect("/dashboard");
}
