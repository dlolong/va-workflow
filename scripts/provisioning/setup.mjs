/** Owner-session, workspace-scoped provisioning. Dry run is the default. */
import "../load-env.mjs";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { discover } from "./preflight.mjs";
import { validateManifest } from "./manifest.mjs";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const configPath = args.find((a) => !a.startsWith("--"));
if (
  !configPath ||
  args.some((a) => a.startsWith("--") && !["--apply", "--dry-run"].includes(a)) ||
  (apply && args.includes("--dry-run"))
) {
  console.error(
    "Usage: node scripts/provisioning/setup.mjs <private-config.json> [--dry-run | --apply]",
  );
  process.exit(1);
}
try {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const manifest = validateManifest(JSON.parse(readFileSync(config.manifestPath, "utf8")));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const project = new URL(url).hostname;
  const hash = createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
  const blockers = [];
  if (config.projectHost !== project)
    blockers.push("Configured project does not match confirmed projectHost.");
  if (!["local", "staging"].includes(config.environment))
    blockers.push(
      "AGENTS.md permits provisioning mutation tests/application only on an explicitly authorized disposable local/staging target; production is blocked.",
    );
  if (!manifest.setupKey || !Array.isArray(manifest.items)) throw new Error("Invalid manifest");
  const keys = manifest.items.map((i) => i.key);
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate manifest keys");
  const allowed = new Set(["process", "preparation", "training"]);
  if (manifest.items.some((i) => !allowed.has(i.kind))) throw new Error("Unsupported item kind");
  const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const assessment = await discover(db, {
    userId: config.maryUserId,
    workspaceId: config.workspaceId,
    workspaceName: config.workspaceName,
    timezone: config.timezone,
  });
  blockers.push(...assessment.blockers);
  const workspace = assessment.workspace;
  if (
    !workspace ||
    workspace.id !== config.workspaceId ||
    workspace.owner_id !== config.ownerUserId
  )
    blockers.push("Explicit workspace/owner confirmation does not match discovery.");
  const counts = Object.fromEntries(
    [...allowed].map((kind) => [kind, manifest.items.filter((i) => i.kind === kind).length]),
  );
  const candidateCounts = {
    create: 0,
    reuse: null,
    conflict: 0,
    status: "Ledger reuse cannot be established without authorized RPC preflight",
  };
  if (workspace && workspace.id === config.workspaceId) {
    for (const [kind, table] of [
      ["process", "processes"],
      ["preparation", "runs"],
    ]) {
      const requested = manifest.items.filter((i) => i.kind === kind);
      if (!requested.length) continue;
      let query = db
        .from(table)
        .select("id,title")
        .eq("workspace_id", workspace.id)
        .in(
          "title",
          requested.map((i) => i.content.title),
        );
      if (kind === "preparation") query = query.eq("assignee_id", config.maryUserId);
      const existing = await query;
      if (existing.error) blockers.push("Scoped existing-record lookup failed.");
      else {
        const titles = new Set(existing.data.map((i) => i.title));
        candidateCounts.conflict += requested.filter((i) => titles.has(i.content.title)).length;
        candidateCounts.create += requested.filter((i) => !titles.has(i.content.title)).length;
      }
    }
  }
  let plan = null;
  let session = null;
  if (!process.env.SETUP_ACTOR_ACCESS_TOKEN)
    blockers.push(
      "Missing authenticated setup actor access token; service-role credentials are read-only discovery, not a user identity.",
    );
  else {
    session = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${process.env.SETUP_ACTOR_ACCESS_TOKEN}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const actor = await session.auth.getUser(process.env.SETUP_ACTOR_ACCESS_TOKEN);
    if (
      actor.error ||
      actor.data.user?.id !== config.setupActorUserId ||
      actor.data.user?.id === config.maryUserId
    )
      blockers.push("Separate setup actor identity not verified.");
  }
  const payload = {
    p_workspace: config.workspaceId,
    p_target: config.maryUserId,
    p_owner: config.ownerUserId,
    p_setup_key: manifest.setupKey,
    p_items: manifest.items,
    p_apply: false,
  };
  if (!blockers.length) {
    const preview = await session.rpc("provision_workspace_setup", payload);
    if (preview.error)
      blockers.push(
        "Provisioning RPC preflight failed: verify migration/permissions on disposable staging.",
      );
    else {
      plan = preview.data;
      if (plan.conflicts)
        blockers.push("Existing records or ledger content conflict; no overwrites permitted.");
    }
  }
  const report = {
    result: "DRY RUN COMPLETE",
    project,
    environment: config.environment || "unconfirmed",
    workspace,
    intendedMembership: "active va; no automatic ownership change",
    proposed: counts,
    candidateCounts,
    manifestHash: hash,
    unresolved: manifest.unresolved || [],
    deferredSchedules: manifest.schedules || [],
    blockers,
    databasePreflight: plan,
    applied: false,
  };
  if (apply) {
    if (config.databaseQaVerified !== true)
      blockers.push(
        "Apply blocked until the new migration passes disposable database and concurrency QA.",
      );
    if (config.confirmedManifestHash !== hash)
      blockers.push("Apply requires confirmedManifestHash from the reviewed dry run.");
    if (blockers.length) {
      report.result = "IMPLEMENTED ONLY";
      console.log(JSON.stringify(report, null, 2));
      process.exitCode = 2;
    } else {
      const result = await session.rpc("provision_workspace_setup", { ...payload, p_apply: true });
      if (result.error)
        throw new Error(
          "Apply RPC failed; transaction is atomic. If response was interrupted, rerun dry run to inspect durable ledger.",
        );
      const verified = await session.rpc("provision_workspace_setup", payload);
      if (
        verified.error ||
        verified.data.conflicts ||
        verified.data.items.some((i) => i.state !== "reuse_preserved")
      ) {
        report.result = "PARTIALLY APPLIED";
        report.applied = true;
        report.blockers.push(
          "Commit returned successfully, but post-apply ledger verification is incomplete.",
        );
        process.exitCode = 2;
      } else {
        report.result = "APPLIED AND VERIFIED";
        report.applied = true;
        report.databasePreflight = verified.data;
        report.browserVerified = false;
      }
      console.log(JSON.stringify(report, null, 2));
    }
  } else {
    console.log(JSON.stringify(report, null, 2));
    if (blockers.length) process.exitCode = 2;
  }
} catch (error) {
  console.error("Failure category:", error.name);
  console.error(
    "Setup could not complete. No successful application is claimed. Check private config, connection and source manifest; rerun dry run after an interrupted response.",
  );
  process.exitCode = 1;
}
