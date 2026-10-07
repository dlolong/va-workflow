import "server-only";
import { createClient } from "@supabase/supabase-js";
/** Only the automation worker may import this client. Normal requests use the user's JWT. */
export function workerSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) throw new Error("Worker configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
