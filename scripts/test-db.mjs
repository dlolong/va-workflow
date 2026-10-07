/** Real database integration tests. Disposable LOCAL Supabase only. All fixtures roll back. */
import "./load-env.mjs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    "Set TEST_DATABASE_URL for a disposable local Supabase database. This test was NOT run.",
  );
const url = new URL(connectionString);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  throw new Error("Refusing a non-local database. Do not run destructive QA against production.");
const db = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
await db.connect();
const actor = {
  owner: randomUUID(),
  va: randomUUID(),
  reviewer: randomUUID(),
  outsider: randomUUID(),
};
const emails = Object.fromEntries(
  Object.entries(actor).map(([name, id]) => [name, `${name}-${id}@example.test`]),
);
let total = 0;
async function test(name, fn) {
  await fn();
  total++;
  console.log(`PASS ${total}: ${name}`);
}
async function identity(id, role = "authenticated") {
  if (!["authenticated", "service_role"].includes(role)) throw new Error("Unexpected test role");
  await db.query("reset role");
  await db.query(
    "select set_config('request.jwt.claims',$1,true), set_config('request.jwt.claim.sub',$2,true), set_config('request.jwt.claim.role',$3,true)",
    [JSON.stringify({ sub: id, role }), id || "", role],
  );
  await db.query(`set local role ${role}`);
}
async function command(w, action, payload = {}, requestId = randomUUID()) {
  return (
    await db.query("select public.app_command($1,$2,$3::jsonb) as result", [
      w,
      action,
      JSON.stringify({ ...payload, request_id: requestId }),
    ])
  ).rows[0].result;
}
async function denied(
  fn,
  expected = /permission|denied|only|review|sign|complete|evidence|member|invitation|step|changed|before|read.only/i,
) {
  await db.query("savepoint expected_denial");
  let failure;
  try {
    await fn();
  } catch (error) {
    failure = error;
  }
  await db.query("rollback to savepoint expected_denial");
  await db.query("release savepoint expected_denial");
  assert.ok(failure, "Expected this operation to be rejected, but it succeeded.");
  assert.match(failure.message, expected);
}
async function run(id) {
  return (await db.query("select * from public.runs where id=$1", [id])).rows[0];
}
const step = (id, overrides = {}) => ({
  id,
  title: `Step ${id}`,
  instructions: "Test instruction",
  kind: "checkbox",
  required: true,
  allow_na: false,
  evidence: "none",
  approval_before: false,
  options: [],
  ...overrides,
});
const flow = (steps, review = false) => ({
  title: "QA process",
  description: "Disposable test",
  sop: "Check results",
  can_do: "Follow the approved steps",
  ask_first: "Exceptions",
  never_do: "External payments",
  resources: [],
  steps,
  review_required: review,
});
let workspace, processId, reviewRun;
try {
  await db.query("begin");
  await db.query("set local statement_timeout = '10s'");
  for (const [name, id] of Object.entries(actor)) {
    await db.query(
      "insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2,now(),'{}'::jsonb,$3::jsonb,now(),now())",
      [id, emails[name], JSON.stringify({ display_name: name })],
    );
  }
  for (const id of Object.values(actor)) {
    await identity(id);
    await command(null, "update_profile", {
      display_name: "QA member",
      timezone: "Asia/Manila",
      email_notifications: true,
    });
  }
  await identity(actor.owner);
  await test("workspace creation creates the owner membership", async () => {
    workspace = (
      await command(null, "create_workspace", {
        name: "QA workspace",
        timezone: "Europe/Amsterdam",
      })
    ).id;
    assert.equal(
      (await db.query("select public.workspace_role($1) as role", [workspace])).rows[0].role,
      "owner",
    );
  });
  await test("same command request ID returns the same result", async () => {
    const key = randomUUID();
    const first = await command(
      null,
      "create_workspace",
      { name: "Idempotency fixture", timezone: "UTC" },
      key,
    );
    const second = await command(
      null,
      "create_workspace",
      { name: "Idempotency fixture", timezone: "UTC" },
      key,
    );
    assert.equal(first.id, second.id);
  });
  await test("request IDs cannot be reused with a different payload", async () => {
    const key = randomUUID();
    await command(null, "create_workspace", { name: "Original", timezone: "UTC" }, key);
    await denied(() => command(null, "create_workspace", { name: "Changed", timezone: "UTC" }, key), /different payload/);
  });
  for (const [name, content] of [
    ["numeric title", { ...flow([step("one")]), title: 123 }],
    ["object SOP", { ...flow([step("one")]), sop: { unsafe: true } }],
    ["object instruction", flow([step("one", { instructions: {} })])],
    ["non-string option", flow([step("one", { kind: "select", options: [123] })])],
    ["oversized option", flow([step("one", { kind: "select", options: ["x".repeat(201)] })])],
    ["credential-bearing resource", { ...flow([step("one")]), resources: [{ label: "Resource", url: "https://user:pass@example.test" }] }],
    ["missing URL host", { ...flow([step("one")]), resources: [{ label: "Resource", url: "https://?query" }] }],
    ["missing steps", { ...flow([step("one")]), steps: null }],
    ["wrong boolean", flow([step("one", { required: "true" })])],
  ]) {
    await test(`direct RPC rejects ${name}`, () => denied(() => command(workspace, "save_process", { content }), /title|text|string|option|resource|link|steps|rules|HTTP|content/i));
  }
  const vaInvite = await command(workspace, "invite_member", { email: emails.va, role: "va" });
  const reviewInvite = await command(workspace, "invite_member", {
    email: emails.reviewer,
    role: "client",
  });
  await identity(actor.outsider);
  await test("unrelated user cannot read workspace rows", async () =>
    assert.equal(
      (await db.query("select * from public.workspaces where id=$1", [workspace])).rowCount,
      0,
    ));
  await test("unrelated user cannot invoke workspace commands", async () =>
    denied(() => command(workspace, "create_run", {}), /access denied/i));
  await test("invitation is bound to the verified invitee email", async () =>
    denied(() => command(null, "accept_invitation", { token: vaInvite.token }), /verified email/i));
  await identity(actor.va);
  await test("VA can accept their invitation", async () =>
    assert.equal(
      (await command(null, "accept_invitation", { token: vaInvite.token })).id,
      workspace,
    ));
  await identity(actor.reviewer);
  await command(null, "accept_invitation", { token: reviewInvite.token });
  await identity(actor.va);
  const reviewedFlow = flow([step("check")], true);
  await test("VA can author an unpublished SOP draft", async () => {
    processId = (await command(workspace, "save_process", { content: reviewedFlow })).id;
  });
  await test("VA cannot publish their own draft", async () =>
    denied(() => command(workspace, "publish_process", { id: processId }), /manager permission/i));
  await test("VA cannot grant membership", async () =>
    denied(
      () => command(workspace, "invite_member", { email: emails.outsider, role: "va" }),
      /manager permission/i,
    ));
  await test("direct table mutation is denied even within the same workspace", async () =>
    denied(
      () => db.query("update public.processes set title='tampered' where id=$1", [processId]),
      /permission denied/i,
    ));
  await identity(actor.owner);
  await command(workspace, "publish_process", { id: processId });
  reviewRun = (
    await command(workspace, "create_run", {
      process_id: processId,
      assignee_id: actor.va,
      reviewer_id: actor.reviewer,
      due_at: "2026-10-01T09:00:00Z",
      priority: "normal",
    })
  ).id;
  await test("run contains the published SOP snapshot", async () => {
    const r = await run(reviewRun);
    assert.equal(r.process_version, 1);
    assert.equal(r.snapshot.steps[0].id, "check");
  });
  await identity(actor.va);
  await test("required answers are enforced in SQL", async () =>
    denied(
      async () =>
        command(workspace, "submit_run", {
          run_id: reviewRun,
          expected_version: (await run(reviewRun)).version,
        }),
      /required step/i,
    ));
  const oldVersion = (await run(reviewRun)).version;
  await command(workspace, "save_response", {
    run_id: reviewRun,
    expected_version: oldVersion,
    step_id: "check",
    value: true,
    not_applicable: false,
    na_reason: "",
  });
  await test("stale-tab writes are rejected", async () =>
    denied(
      () =>
        command(workspace, "save_response", {
          run_id: reviewRun,
          expected_version: oldVersion,
          step_id: "check",
          value: false,
          not_applicable: false,
          na_reason: "",
        }),
      /changed in another session/i,
    ));
  await command(workspace, "set_status", {
    run_id: reviewRun,
    expected_version: (await run(reviewRun)).version,
    status: "waiting_on_client",
    reason: "Need client input",
    waiting_on_id: actor.reviewer,
    follow_up_owner_id: actor.va,
    follow_up_at: "2026-10-01T09:00:00Z",
  });
  await test("waiting does not change the original business deadline", async () =>
    assert.equal((await run(reviewRun)).due_at.toISOString(), "2026-10-01T09:00:00.000Z"));
  await command(workspace, "submit_run", {
    run_id: reviewRun,
    expected_version: (await run(reviewRun)).version,
  });
  await test("submission is distinct from final acceptance", async () =>
    assert.equal((await run(reviewRun)).status, "for_review"));
  await test("VA cannot accept their own submission", async () =>
    denied(
      async () =>
        command(workspace, "review_run", {
          run_id: reviewRun,
          expected_version: (await run(reviewRun)).version,
          decision: "completed",
          note: "Self approve",
        }),
      /separate reviewer/i,
    ));
  await identity(actor.reviewer);
  await command(workspace, "review_run", {
    run_id: reviewRun,
    expected_version: (await run(reviewRun)).version,
    decision: "changes_requested",
    note: "Please verify once more.",
  });
  await test("reviewer can request corrections with a recorded note", async () =>
    assert.equal((await run(reviewRun)).status, "changes_requested"));
  await identity(actor.va);
  await command(workspace, "submit_run", {
    run_id: reviewRun,
    expected_version: (await run(reviewRun)).version,
  });
  await identity(actor.reviewer);
  await command(workspace, "review_run", {
    run_id: reviewRun,
    expected_version: (await run(reviewRun)).version,
    decision: "completed",
    note: "Accepted",
  });
  await test("accepted work has a completion timestamp", async () =>
    assert.ok((await run(reviewRun)).completed_at));
  await identity(actor.va);
  await test("completed runs cannot be silently edited", async () =>
    denied(
      async () =>
        command(workspace, "save_response", {
          run_id: reviewRun,
          expected_version: (await run(reviewRun)).version,
          step_id: "check",
          value: false,
          not_applicable: false,
          na_reason: "",
        }),
      /read.only/i,
    ));
  await identity(actor.owner);
  await command(workspace, "save_process", { id: processId, content: flow([step("new_step")]) });
  await command(workspace, "publish_process", { id: processId });
  await test("publishing a new SOP does not mutate existing run snapshots", async () =>
    assert.equal((await run(reviewRun)).snapshot.steps[0].id, "check"));
  const gatedRun = (
    await command(workspace, "create_run", {
      content: flow([step("gate", { approval_before: true })]),
      assignee_id: actor.va,
      reviewer_id: actor.reviewer,
    })
  ).id;
  await identity(actor.va);
  await test("pre-action gates are enforced before answer saving", async () =>
    denied(
      async () =>
        command(workspace, "save_response", {
          run_id: gatedRun,
          expected_version: (await run(gatedRun)).version,
          step_id: "gate",
          value: true,
          not_applicable: false,
          na_reason: "",
        }),
      /permission is required/i,
    ));
  await command(workspace, "request_approval", {
    run_id: gatedRun,
    step_id: "gate",
    reason: "May I perform the approved change?",
  });
  const approvalId = (await db.query("select id from public.approvals where run_id=$1", [gatedRun]))
    .rows[0].id;
  await identity(actor.reviewer);
  await command(workspace, "decide_approval", {
    run_id: gatedRun,
    id: approvalId,
    decision: "approved",
    note: "Proceed only with the described action.",
  });
  await identity(actor.va);
  await test("approved gate allows its authorized step", async () => {
    await command(workspace, "save_response", {
      run_id: gatedRun,
      expected_version: (await run(gatedRun)).version,
      step_id: "gate",
      value: true,
      not_applicable: false,
      na_reason: "",
    });
  });
  await identity(actor.owner);
  const evidenceRun = (
    await command(workspace, "create_run", {
      content: flow([step("proof", { evidence: "file" })]),
      assignee_id: actor.va,
    })
  ).id;
  await identity(actor.va);
  await command(workspace, "save_response", {
    run_id: evidenceRun,
    expected_version: (await run(evidenceRun)).version,
    step_id: "proof",
    value: true,
    not_applicable: false,
    na_reason: "",
  });
  await test("answer alone is insufficient when evidence is required", async () =>
    denied(
      async () =>
        command(workspace, "submit_run", {
          run_id: evidenceRun,
          expected_version: (await run(evidenceRun)).version,
        }),
      /evidence required/i,
    ));
  const upload = await command(workspace, "register_evidence", {
    run_id: evidenceRun,
    step_id: "proof",
    filename: "proof.txt",
    content_type: "text/plain",
    size_bytes: 4,
    label: "general",
  });
  await test("pending upload cannot be falsely marked attached", async () =>
    denied(
      () => command(workspace, "confirm_evidence", { run_id: evidenceRun, id: upload.id }),
      /upload is incomplete/i,
    ));
  await test("storage upload policy permits only the exact registered path", async () => {
    assert.equal(
      (await db.query("select public.can_upload_evidence($1) as allowed", [upload.path])).rows[0]
        .allowed,
      true,
    );
    assert.equal(
      (await db.query("select public.can_upload_evidence($1) as allowed", [upload.path + "-other"]))
        .rows[0].allowed,
      false,
    );
  });
  await identity(actor.outsider);
  await test("another client cannot read evidence metadata or authorize its path", async () => {
    assert.equal(
      (await db.query("select * from public.evidence where id=$1", [upload.id])).rowCount,
      0,
    );
    assert.equal(
      (await db.query("select public.can_read_evidence($1) as allowed", [upload.path])).rows[0]
        .allowed,
      false,
    );
  });
  // Metadata fixture only. This is NOT a real Storage API upload test.
  await db.query("reset role");
  await db.query(
    "insert into storage.objects(bucket_id,name,metadata) values('evidence',$1,$2::jsonb)",
    [upload.path, JSON.stringify({ size: 4, mimetype: "text/plain" })],
  );
  await identity(actor.va);
  await command(workspace, "confirm_evidence", { run_id: evidenceRun, id: upload.id });
  await test("matching stored-object metadata permits evidence confirmation", async () =>
    assert.equal(
      (await db.query("select state from public.evidence where id=$1", [upload.id])).rows[0].state,
      "attached",
    ));
  await identity(actor.owner);
  const schedule = (
    await command(workspace, "save_schedule", {
      process_id: processId,
      assignee_id: actor.va,
      reviewer_id: null,
      frequency: "daily",
      weekday: 1,
      monthday: 1,
      local_time: "17:00",
      timezone: "Europe/Amsterdam",
      lead_minutes: 1440,
      starts_after: null,
    })
  ).id;
  await command(workspace, "generate_schedules");
  const before = (
    await db.query("select count(*)::int as n from public.runs where schedule_id=$1", [schedule])
  ).rows[0].n;
  await test("repeated schedule generation does not duplicate occurrences", async () => {
    await command(workspace, "generate_schedules");
    assert.ok(before >= 1);
    assert.equal(
      (
        await db.query("select count(*)::int as n from public.runs where schedule_id=$1", [
          schedule,
        ])
      ).rows[0].n,
      before,
    );
  });
  await test("self-review cannot be introduced through reassignment", async () =>
    denied(
      async () =>
        command(workspace, "reassign_run", {
          run_id: gatedRun,
          expected_version: (await run(gatedRun)).version,
          assignee_id: actor.reviewer,
          reviewer_id: actor.reviewer,
          note: "Unsafe reassignment",
        }),
      /self.review/i,
    ));
  await command(workspace, "remove_member", {
    user_id: actor.va,
    replacement_id: actor.owner,
    note: "QA handover with all open work transferred.",
  });
  await test("offboarding transfers unfinished tasks", async () =>
    assert.equal((await run(evidenceRun)).assignee_id, actor.owner));
  await identity(actor.va);
  await test("offboarded VA immediately loses future row access", async () =>
    assert.equal(
      (await db.query("select * from public.runs where workspace_id=$1", [workspace])).rowCount,
      0,
    ));
  await test("offboarded VA loses future file authorization", async () =>
    assert.equal(
      (await db.query("select public.can_read_evidence($1) as allowed", [upload.path])).rows[0]
        .allowed,
      false,
    ));
  await identity(actor.owner);
  await test("normal users cannot invoke service-role workers", async () =>
    denied(() => db.query("select public.run_automation()"), /permission denied/i));
  await db.query("reset role");
  await test("monthly day 31 clamps to February month-end", async () => {
    const r = await db.query(
      "select private.next_occurrence('monthly','UTC','17:00',1,31,'2026-02-01T00:00:00Z') as next",
    );
    assert.equal(r.rows[0].next.toISOString(), "2026-02-28T17:00:00.000Z");
  });
  await test("recurrence uses the named timezone after a DST transition", async () => {
    const r = await db.query(
      "select private.next_occurrence('daily','Europe/Amsterdam','17:00',1,1,'2026-10-24T15:00:00Z') as next",
    );
    assert.equal(r.rows[0].next.toISOString(), "2026-10-25T16:00:00.000Z");
  });
  console.log(
    `\n${total} database tests passed against local PostgreSQL. Storage API/browser/email delivery still need separate tests.`,
  );
} catch (error) {
  console.error(`DATABASE QA FAILED after ${total} passing checks:`, error.message);
  process.exitCode = 1;
} finally {
  await db.query("reset role").catch(() => {});
  await db.query("rollback").catch(() => {});
  await db.end();
}
