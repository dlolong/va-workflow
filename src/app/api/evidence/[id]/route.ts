import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { APP } from "@/lib/config";
import { jsonError } from "@/lib/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return jsonError("Not found.", 404);
  const db = await serverSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return jsonError("Sign in.", 401);
  const { data: e, error } = await db
    .from("evidence")
    .select("object_path,filename,state")
    .eq("id", id)
    .maybeSingle();
  if (error || !e || e.state !== "attached") return jsonError("Evidence not found.", 404);
  // Uses the user's session and storage RLS, not a service-role bypass.
  const { data, error: signError } = await db.storage
    .from(APP.evidenceBucket)
    .createSignedUrl(e.object_path, 60, { download: e.filename });
  if (signError || !data) return jsonError("Unable to open evidence.", 400);
  return NextResponse.redirect(data.signedUrl, {
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
