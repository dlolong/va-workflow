import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { commandEnvelope, commandSchemas } from "@/lib/schemas";
import { jsonError, sameOrigin } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return jsonError("JSON is required.", 415);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 300000) return jsonError("Request is too large.", 413);
  try {
    const body = await request.text();
    if (body.length > 300000) return jsonError("Request is too large.", 413);
    const input = commandEnvelope.safeParse(JSON.parse(body));
    if (!input.success) return jsonError(input.error.issues[0]?.message || "Invalid request.");
    const schema = commandSchemas[input.data.action];
    if (!schema) return jsonError("Unknown command.");
    const payload = schema.safeParse(input.data.payload);
    if (!payload.success)
      return jsonError(
        payload.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      );
    const db = await serverSupabase();
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser();
    if (authError || !user) return jsonError("Sign in to continue.", 401);
    const { data, error } = await db.rpc("app_command", {
      p_workspace: input.data.workspace_id,
      p_action: input.data.action,
      p_payload: payload.data,
    });
    if (error)
      return jsonError(
        error.message,
        error.code === "42501" ? 403 : error.code === "40001" ? 409 : 400,
      );
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON.");
    console.error("Command request failed", error instanceof Error ? error.name : "UnknownError");
    return jsonError("Unable to save. Your work has not been confirmed. Retry or reload.", 500);
  }
}
