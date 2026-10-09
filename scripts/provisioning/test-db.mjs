/** Rollback-only tests; actual role/RPC execution, never production. */
import "../load-env.mjs";
import pg from "pg";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { transferOwnership } from "./ownership.mjs";
const url = process.env.TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
  throw new Error("Blocked: disposable local TEST_DATABASE_URL required; tests not run.");
const db = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
await db.connect();
let passed = 0;
const owner = randomUUID(),
  target = randomUUID(),
  outsider = randomUUID(),
  trainer = randomUUID();
const identity = async (id) => {
  await db.query("reset role");
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
    [id, JSON.stringify({ sub: id, role: "authenticated" })],
  );
  await db.query("set local role authenticated");
};
const cmd = async (w, action, payload) =>
  (
    await db.query("select public.app_command($1,$2,$3::jsonb) result", [
      w,
      action,
      JSON.stringify({ ...payload, request_id: randomUUID() }),
    ])
  ).rows[0].result;
const content = {
  title: "Synthetic setup SOP",
  description: "Setup draft",
  sop: "Synthetic instructions",
  can_do: "Read",
  ask_first: "Changes",
  never_do: "Payments",
  resources: [],
  review_required: false,
  steps: [
    {
      id: "check",
      title: "Read scope",
      instructions: "Read",
      kind: "checkbox",
      required: true,
      allow_na: false,
      evidence: "none",
      approval_before: false,
      options: [],
    },
  ],
};
let w;
const items = [
  { key: "process", kind: "process", content },
  {
    key: "prep",
    kind: "preparation",
    process_keys: ["process"],
    content: { ...content, title: "Synthetic preparation" },
  },
  { key: "training", kind: "training", process_key: "process", trainer_id: trainer },
];
const provision = async (apply = false, values = items, workspace = w) =>
  (
    await db.query("select public.provision_workspace_setup($1,$2,$3,$4,$5::jsonb,$6) result", [
      workspace,
      target,
      owner,
      "synthetic-setup",
      JSON.stringify(values),
      apply,
    ])
  ).rows[0].result;
const check = async (name, fn) => {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
};
const denied = async (fn) => {
  await db.query("savepoint rejection");
  let error;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  await db.query("rollback to savepoint rejection");
  assert.ok(error);
};
try {
  await db.query("begin");
  await db.query("set local statement_timeout='10s'");
  for (const id of [owner, target, outsider, trainer]) {
    await db.query(
      "insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2,now(),'{}','{}',now(),now())",
      [id, `synthetic-${id}@example.test`],
    );
    await identity(id);
    await cmd(null, "update_profile", {
      display_name: "Synthetic test user",
      timezone: "UTC",
      email_notifications: true,
    });
    await db.query("reset role");
  }
  await identity(owner);
  w = (
    await cmd(null, "create_workspace", {
      name: "Synthetic provisioning workspace",
      timezone: "Europe/Amsterdam",
    })
  ).id;
  // Disposable fixture setup only; application paths below run under real SQL roles.
  await db.query("reset role");
  await db.query(
    "insert into public.memberships(workspace_id,user_id,role) values($1,$2,'va'),($1,$3,'manager')",
    [w, target, trainer],
  );
  await identity(owner);
  await check("dry run creates no business records", async () => {
    const p = await provision();
    assert.equal(p.conflicts, 0);
    assert.equal(p.items.length, 3);
    assert.equal(
      (await db.query("select count(*)::int n from public.processes where workspace_id=$1", [w]))
        .rows[0].n,
      0,
    );
  });
  await check("atomic create preserves draft/preparation/training semantics", async () => {
    await provision(true);
    const p = (await db.query("select * from public.processes where workspace_id=$1", [w])).rows[0];
    assert.equal(p.published_version, null);
    const r = (await db.query("select * from public.runs where workspace_id=$1", [w])).rows[0];
    assert.equal(r.assignee_id, target);
    assert.equal(r.status, "not_started");
    assert.equal(r.due_at, null);
    assert.equal(r.process_id, null);
    assert.match(r.snapshot.sop, new RegExp(p.id));
    const t = (await db.query("select * from public.training where workspace_id=$1", [w])).rows[0];
    assert.equal(t.stage, "not_started");
    assert.equal(t.signed_off_at, null);
  });
  await check("in-app notices retained without outbound setup mail", async () => {
    await db.query("reset role");
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from private.email_outbox o join public.notifications n on n.id=o.notification_id where n.workspace_id=$1",
          [w],
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await db.query("select count(*)::int n from public.notifications where workspace_id=$1", [
          w,
        ])
      ).rows[0].n,
      1,
    );
    await identity(owner);
  });
  await check("repeat after retry receipts removed reuses durable records", async () => {
    await db.query("reset role");
    await db.query("delete from private.command_receipts where workspace_id=$1", [w]);
    await identity(owner);
    await provision(true);
    const p = await provision();
    assert.ok(p.items.every((i) => i.state === "reuse_preserved"));
    assert.equal(
      (await db.query("select count(*)::int n from public.runs where workspace_id=$1", [w])).rows[0]
        .n,
      1,
    );
  });
  await check("changed manifest rejected without overwrite", async () => {
    const changed = structuredClone(items);
    changed[0].content.sop = "Changed";
    await denied(() => provision(true, changed));
  });
  await check("edited draft survives repeat", async () => {
    const p = (await db.query("select id from public.processes where workspace_id=$1", [w]))
      .rows[0];
    await cmd(w, "save_process", { id: p.id, content: { ...content, sop: "Human edit" } });
    await provision(true);
    assert.equal(
      (await db.query("select draft from public.processes where id=$1", [p.id])).rows[0].draft.sop,
      "Human edit",
    );
  });
  await check("completed preparation and its saved response survive repeat", async () => {
    const r = (await db.query("select * from public.runs where workspace_id=$1", [w])).rows[0];
    await cmd(w, "save_response", {
      run_id: r.id,
      expected_version: r.version,
      step_id: "check",
      value: true,
      not_applicable: false,
      na_reason: "",
    });
    const updated = (await db.query("select version from public.runs where id=$1", [r.id])).rows[0];
    await cmd(w, "submit_run", { run_id: r.id, expected_version: updated.version });
    await provision(true);
    assert.equal(
      (await db.query("select status from public.runs where id=$1", [r.id])).rows[0].status,
      "completed",
    );
    assert.equal(
      (await db.query("select value from public.step_responses where run_id=$1", [r.id])).rows[0]
        .value,
      true,
    );
  });
  await check(
    "foreign child ledger reference blocks apply; unrelated workspace stays unchanged",
    async () => {
      const other = (
        await cmd(null, "create_workspace", {
          name: "Synthetic unrelated workspace",
          timezone: "UTC",
        })
      ).id;
      const foreign = (await cmd(other, "save_process", { id: null, content })).id;
      const before = (
        await db.query(
          "select row_to_json(p) value from public.processes p where workspace_id=$1",
          [other],
        )
      ).rows;
      await db.query("savepoint foreign_reference");
      await db.query("reset role");
      await db.query(
        "update private.provisioning_items set record_id=$1 where workspace_id=$2 and item_key='process'",
        [foreign, w],
      );
      await identity(owner);
      const preview = await provision();
      assert.equal(preview.conflicts, 1);
      await denied(() => provision(true));
      await db.query("rollback to savepoint foreign_reference");
      await identity(owner);
      await provision(true);
      assert.deepEqual(
        (
          await db.query(
            "select row_to_json(p) value from public.processes p where workspace_id=$1",
            [other],
          )
        ).rows,
        before,
      );
    },
  );
  await check("VA and unrelated users cannot provision", async () => {
    for (const id of [target, outsider]) {
      await identity(id);
      await denied(() => provision(true));
    }
    await identity(owner);
  });
  await check("self-trainer rejected", async () => {
    const bad = structuredClone(items);
    bad[2].trainer_id = target;
    await denied(() => provision(true, bad));
  });
  await check("unrelated member cannot read scoped setup data", async () => {
    await identity(outsider);
    assert.equal(
      (await db.query("select count(*)::int n from public.runs where workspace_id=$1", [w])).rows[0]
        .n,
      0,
    );
    await denied(() => db.query("select * from private.provisioning_items"));
  });
  await db.query("reset role");
  const transfer = { workspaceId: w, previousOwnerId: owner, newOwnerId: outsider };
  await check(
    "ownership maintenance dry run and missing-target rejection make no writes",
    async () => {
      assert.equal((await transferOwnership(db, transfer)).state, "transfer_ready");
      await assert.rejects(
        transferOwnership(db, { ...transfer, workspaceId: randomUUID() }, true),
        /missing/,
      );
      assert.equal(
        (await db.query("select owner_id from public.workspaces where id=$1", [w])).rows[0]
          .owner_id,
        owner,
      );
    },
  );
  await check("ownership maintenance rejects outstanding review responsibilities", async () => {
    await db.query("savepoint review_conflict");
    await db.query(
      "update public.runs set reviewer_id=$2, status='in_progress' where workspace_id=$1",
      [w, owner],
    );
    await assert.rejects(transferOwnership(db, transfer, true), /review responsibilities/);
    await db.query("rollback to savepoint review_conflict");
  });
  await check(
    "ownership transfer preserves work and other memberships and is repeat safe",
    async () => {
      const otherBefore = (
        await db.query(
          "select row_to_json(m) value from public.memberships m where workspace_id<>$1 order by workspace_id,user_id",
          [w],
        )
      ).rows;
      const runsBefore = (
        await db.query("select row_to_json(r) value from public.runs r where workspace_id=$1", [w])
      ).rows;
      await db.query("savepoint ownership_transfer");
      assert.equal((await transferOwnership(db, transfer, true)).state, "transferred");
      assert.equal((await transferOwnership(db, transfer, true)).state, "reuse_preserved");
      assert.equal(
        (await db.query("select owner_id from public.workspaces where id=$1", [w])).rows[0]
          .owner_id,
        outsider,
      );
      assert.equal(
        (
          await db.query(
            "select role from public.memberships where workspace_id=$1 and user_id=$2",
            [w, owner],
          )
        ).rows[0].role,
        "va",
      );
      const audit = (
        await db.query(
          "select actor_id from public.audit_events where workspace_id=$1 and event='workspace_ownership_maintenance'",
          [w],
        )
      ).rows;
      assert.deepEqual(audit, [{ actor_id: null }]);
      assert.deepEqual(
        (
          await db.query(
            "select row_to_json(m) value from public.memberships m where workspace_id<>$1 order by workspace_id,user_id",
            [w],
          )
        ).rows,
        otherBefore,
      );
      assert.deepEqual(
        (
          await db.query("select row_to_json(r) value from public.runs r where workspace_id=$1", [
            w,
          ])
        ).rows,
        runsBefore,
      );
      await db.query("rollback to savepoint ownership_transfer");
    },
  );
  console.log(
    `${passed} provisioning database tests passed. Concurrent execution and actual-user browser access are separate checks.`,
  );
} catch (error) {
  console.error(`Provisioning database tests failed after ${passed} checks:`, error.message);
  process.exitCode = 1;
} finally {
  await db.query("rollback");
  await db.query("reset role");
  await db.end();
}
