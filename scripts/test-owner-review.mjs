/** Owner exception regression tests on disposable local PostgreSQL; all fixtures roll back. */
import "./load-env.mjs";
import pg from "pg";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const url = process.env.TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
  throw new Error("Disposable local database required");
const db = new pg.Client({ connectionString: url });
await db.connect();
const owner = randomUUID(),
  manager = randomUUID(),
  va = randomUUID(),
  client = randomUUID();
let w,
  count = 0;
const identity = async (id) => {
  await db.query("reset role");
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
    [id, JSON.stringify({ sub: id, role: "authenticated" })],
  );
  await db.query("set local role authenticated");
};
const cmd = async (action, payload = {}) =>
  (
    await db.query("select public.app_command($1,$2,$3) result", [
      w,
      action,
      JSON.stringify({ ...payload, request_id: randomUUID() }),
    ])
  ).rows[0].result;
const check = async (name, fn) => {
  await fn();
  count++;
  console.log(`PASS ${name}`);
};
const denied = async (fn, pattern = /review|permission|access|member|read.only|archived/i) => {
  await db.query("savepoint denial");
  let err;
  try {
    await fn();
  } catch (e) {
    err = e;
  }
  await db.query("rollback to savepoint denial");
  assert.ok(err, "Expected rejection");
  assert.match(err.message, pattern);
};
const flow = {
  title: "Synthetic owner review",
  description: "",
  sop: "Synthetic check",
  can_do: "Check",
  ask_first: "Exceptions",
  never_do: "Real actions",
  resources: [],
  review_required: true,
  steps: [
    {
      id: "check",
      title: "Check",
      instructions: "",
      kind: "checkbox",
      required: true,
      allow_na: false,
      evidence: "none",
      approval_before: true,
      options: [],
    },
  ],
};
const run = async (id) => (await db.query("select * from public.runs where id=$1", [id])).rows[0];
const save = async (id) =>
  cmd("save_response", {
    run_id: id,
    expected_version: (await run(id)).version,
    step_id: "check",
    value: true,
    not_applicable: false,
    na_reason: "",
  });
const submit = async (id) =>
  cmd("submit_run", { run_id: id, expected_version: (await run(id)).version });
const review = async (id) =>
  cmd("review_run", {
    run_id: id,
    expected_version: (await run(id)).version,
    decision: "completed",
    note: "Synthetic review",
  });
const request = async (id) => {
  await cmd("request_approval", { run_id: id, step_id: "check", reason: "Synthetic request" });
  return (
    await db.query("select id from public.approvals where run_id=$1 and status='pending'", [id])
  ).rows[0].id;
};
const approve = async (id, approval) =>
  cmd("decide_approval", {
    run_id: id,
    id: approval,
    decision: "approved",
    note: "Synthetic permission",
  });
try {
  await db.query("begin");
  for (const id of [owner, manager, va, client]) {
    await db.query("reset role");
    await db.query(
      "insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2,now(),'{}','{}',now(),now())",
      [id, `synthetic-${id}@example.test`],
    );
    await identity(id);
    await cmd("update_profile", {
      display_name: "Synthetic QA",
      timezone: "UTC",
      email_notifications: false,
    });
  }
  await identity(owner);
  w = (await cmd("create_workspace", { name: "Synthetic owner review", timezone: "UTC" })).id;
  await db.query("reset role");
  for (const [id, role] of [
    [manager, "manager"],
    [va, "va"],
    [client, "client"],
  ])
    await db.query("insert into public.memberships(workspace_id,user_id,role) values($1,$2,$3)", [
      w,
      id,
      role,
    ]);
  await identity(owner);
  await check(
    "owner explicitly approves own gate and reviews own submission with audit attribution",
    async () => {
      const id = (
        await cmd("create_run", { content: flow, assignee_id: owner, reviewer_id: owner })
      ).id;
      await denied(() => save(id));
      await denied(() => submit(id));
      const a = await request(id);
      await approve(id, a);
      await save(id);
      await submit(id);
      assert.equal((await run(id)).status, "for_review");
      await review(id);
      assert.equal((await run(id)).status, "completed");
      const events = (
        await db.query(
          "select actor_id,event,detail from public.audit_events where run_id=$1 and event in ('permission_decided','run_reviewed') order by id",
          [id],
        )
      ).rows;
      assert.equal(events.length, 2);
      assert.ok(events.every((e) => e.actor_id === owner));
      assert.equal(events[0].detail.self_approval, true);
      assert.equal(events[1].detail.self_review, true);
      await denied(() => approve(id, a), /closed/);
    },
  );
  await check("owner assigns another member and reviews their actual work", async () => {
    const id = (await cmd("create_run", { content: flow, assignee_id: va, reviewer_id: owner })).id;
    await identity(va);
    const a = await request(id);
    await denied(() => approve(id, a));
    await identity(owner);
    await approve(id, a);
    await identity(va);
    await save(id);
    await submit(id);
    await denied(() => review(id));
    await identity(owner);
    await review(id);
    assert.equal((await run(id)).assignee_id, va);
    assert.equal((await run(id)).status, "completed");
  });
  await check("manager and client cannot self-assign review or decide their own work", async () => {
    for (const person of [manager, client]) {
      await identity(owner);
      await denied(() =>
        cmd("create_run", { content: flow, assignee_id: person, reviewer_id: person }),
      );
      const id = (
        await cmd("create_run", { content: flow, assignee_id: person, reviewer_id: owner })
      ).id;
      await identity(person);
      const a = await request(id);
      await denied(() => approve(id, a));
      await identity(owner);
      await approve(id, a);
      await save(id);
      await submit(id);
      await identity(person);
      await denied(() => review(id));
    }
    await identity(owner);
  });
  await check("owner schedules generate once with owner as assignee and reviewer", async () => {
    const p = (await cmd("save_process", { content: flow })).id;
    await cmd("publish_process", { id: p });
    const s = (
      await cmd("save_schedule", {
        process_id: p,
        assignee_id: owner,
        reviewer_id: owner,
        frequency: "daily",
        weekday: 1,
        monthday: 1,
        local_time: "09:00",
        timezone: "UTC",
        lead_minutes: 0,
        starts_after: new Date(Date.now() - 86400000).toISOString(),
      })
    ).id;
    await cmd("generate_schedules");
    await cmd("generate_schedules");
    const rs = (await db.query("select * from public.runs where schedule_id=$1", [s])).rows;
    assert.equal(rs.length, 1);
    assert.equal(rs[0].reviewer_id, owner);
    assert.equal(rs[0].assignee_id, owner);
    await denied(() =>
      cmd("save_schedule", {
        process_id: p,
        assignee_id: manager,
        reviewer_id: manager,
        frequency: "daily",
        weekday: 1,
        monthday: 1,
        local_time: "09:00",
        timezone: "UTC",
        lead_minutes: 0,
      }),
    );
  });
  await check(
    "reassignment permits the owner exception but rejects other self-review",
    async () => {
      const id = (await cmd("create_run", { content: flow, assignee_id: va, reviewer_id: owner }))
        .id;
      const assign = async (person) =>
        cmd("reassign_run", {
          run_id: id,
          expected_version: (await run(id)).version,
          assignee_id: person,
          reviewer_id: person,
          note: "Synthetic handover",
        });
      await denied(() => assign(manager));
      await assign(owner);
      const a = await request(id);
      await approve(id, a);
      await save(id);
      await submit(id);
      await review(id);
    },
  );
  await check(
    "owner exception requires matching current ownership and active membership",
    async () => {
      const id = (
        await cmd("create_run", { content: flow, assignee_id: owner, reviewer_id: owner })
      ).id;
      const a = await request(id);
      await db.query("savepoint owner_context");
      await db.query("reset role");
      await db.query("update public.workspaces set owner_id=$1 where id=$2", [manager, w]);
      await identity(owner);
      await denied(() => approve(id, a));
      await denied(() =>
        cmd("create_run", { content: flow, assignee_id: owner, reviewer_id: owner }),
      );
      await db.query("rollback to savepoint owner_context");
      await db.query("reset role");
      await db.query(
        "update public.memberships set active=false where workspace_id=$1 and user_id=$2",
        [w, owner],
      );
      await identity(owner);
      await denied(() => approve(id, a));
      await db.query("rollback to savepoint owner_context");
      await identity(owner);
      await cmd("update_workspace", {
        name: "Synthetic owner review",
        timezone: "UTC",
        archived: true,
      });
      await denied(() => approve(id, a));
      await db.query("rollback to savepoint owner_context");
      await identity(owner);
    },
  );
  await check(
    "offboarding may transfer execution and review together only to the owner",
    async () => {
      const id = (await cmd("create_run", { content: flow, assignee_id: va, reviewer_id: manager }))
        .id;
      await denied(() =>
        cmd("remove_member", {
          user_id: va,
          replacement_id: manager,
          note: "Synthetic invalid handover",
        }),
      );
      await cmd("reassign_run", {
        run_id: id,
        expected_version: (await run(id)).version,
        assignee_id: va,
        reviewer_id: owner,
        note: "Synthetic reviewer change",
      });
      await cmd("remove_member", {
        user_id: va,
        replacement_id: owner,
        note: "Synthetic owner handover",
      });
      assert.equal((await run(id)).assignee_id, owner);
      assert.equal((await run(id)).reviewer_id, owner);
      const a = await request(id);
      await approve(id, a);
      await save(id);
      await submit(id);
      await review(id);
    },
  );
  console.log(`${count} owner review checks passed; all synthetic fixtures rolled back.`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await db.query("rollback");
  await db.end();
}
