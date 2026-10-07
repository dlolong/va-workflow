import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { workerSupabase } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
type MailJob = {
  id: string;
  notification_id: string;
  email: string;
  workspace_id: string;
  run_id: string | null;
  attempts: number;
};
function authorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return false;
  const actual = Buffer.from(header || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
async function run(request: Request) {
  if (!authorized(request.headers.get("authorization"))) return jsonError("Unauthorized.", 401);
  try {
    const db = workerSupabase();
    const { data, error } = await db.rpc("run_automation");
    if (error) throw error;
    let sent = 0,
      failed = 0;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (apiKey && from && process.env.NEXT_PUBLIC_APP_URL) {
      const jobs = await db.rpc("claim_notification_emails", { batch_size: 10 });
      if (jobs.error) throw jobs.error;
      await Promise.all(
        ((jobs.data || []) as MailJob[]).map(async (job) => {
          try {
            const path = job.run_id
              ? `/workspaces/${job.workspace_id}/runs/${job.run_id}`
              : `/workspaces/${job.workspace_id}/notifications`;
            // Generic subject/body: avoid sending sensitive client/task details through email.
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `va-relay/${job.notification_id}`,
              },
              body: JSON.stringify({
                from,
                to: [job.email],
                subject: "VA Relay: a workspace update needs your attention",
                text: `Sign in to view your workspace notification:\n${new URL(path, process.env.NEXT_PUBLIC_APP_URL!).href}\n\nManage email preferences in Settings.`,
              }),
              signal: AbortSignal.timeout(15000),
            });
            if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
            const result = await db.rpc("finish_notification_email", {
              job_id: job.id,
              successful: true,
              error_message: null,
            });
            if (result.error) throw result.error;
            sent++;
          } catch (e) {
            failed++;
            await db.rpc("finish_notification_email", {
              job_id: job.id,
              successful: false,
              error_message: e instanceof Error ? e.message : "Delivery failed",
            });
          }
        }),
      );
    }
    return NextResponse.json(
      { automation: data, email: { sent, failed, configured: Boolean(apiKey && from) } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("Automation failed", e instanceof Error ? e.name : "WorkerError");
    return jsonError("Automation failed. Inspect server logs and configuration.", 500);
  }
}
export const GET = run;
export const POST = run;
