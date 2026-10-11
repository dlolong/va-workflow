/** Disposable local PostgreSQL only. Every fixture rolls back. */
import "../load-env.mjs";
import pg from "pg";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const url = process.env.TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
  throw new Error("Local disposable database required");
const db = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
await db.connect();
const owner = randomUUID(),
  va = randomUUID(),
  outsider = randomUUID();
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
const cmd = async (workspace, action, payload) =>
  (
    await db.query("select public.app_command($1,$2,$3) result", [
      workspace,
      action,
      JSON.stringify({ ...payload, request_id: randomUUID() }),
    ])
  ).rows[0].result;
const content = {
  title: "M01 Synthetic reconciliation draft",
  description: "",
  sop: "Original",
  can_do: "Read",
  ask_first: "Changes",
  never_do: "Real actions",
  resources: [],
  review_required: false,
  steps: [
    {
      id: "read",
      title: "Read",
      instructions: "",
      kind: "text",
      required: true,
      allow_na: false,
      evidence: "none",
      approval_before: false,
      options: [],
    },
  ],
};
const original = [
  { key: "M01", kind: "process", content },
  {
    key: "SETUP",
    kind: "preparation",
    process_keys: ["M01"],
    content: { ...content, title: "Synthetic configuration task" },
  },
];
const proposed = structuredClone(original);
proposed[0].content.sop = "Improved instructions";
const legacy = async (items = original, key = "synthetic-v1") =>
  (
    await db.query("select public.provision_workspace_setup($1,$2,$3,$4,$5,true) result", [
      w,
      va,
      owner,
      key,
      JSON.stringify(items),
    ])
  ).rows[0].result;
const reconcile = async (apply = false, items = proposed, previous = ["synthetic-v1"]) =>
  (
    await db.query("select public.reconcile_workspace_setup($1,$2,$3,$4,$5,$6,$7) result", [
      w,
      va,
      owner,
      "synthetic-v2",
      JSON.stringify(items),
      previous,
      apply,
    ])
  ).rows[0].result;
const denied = async (fn) => {
  await db.query("savepoint rejection");
  let error;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  await db.query("rollback to savepoint rejection");
  assert.ok(error, "Expected rejection");
};
const check = async (name, fn) => {
  await fn();
  count++;
  console.log(`PASS ${name}`);
};
try {
  await db.query("begin");
  await db.query("set local statement_timeout='10s'");
  for (const id of [owner, va, outsider])
    await db.query(
      "insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2,now(),'{}','{}',now(),now())",
      [id, `synthetic-${id}@example.test`],
    );
  for (const id of [owner, va, outsider]) {
    await identity(id);
    await cmd(null, "update_profile", {
      display_name: "Synthetic QA",
      timezone: "UTC",
      email_notifications: true,
    });
  }
  await identity(owner);
  w = (await cmd(null, "create_workspace", { name: "Synthetic reconciliation", timezone: "UTC" }))
    .id;
  await db.query("reset role");
  await db.query("insert into public.memberships(workspace_id,user_id,role) values($1,$2,'va')", [
    w,
    va,
  ]);
  await identity(owner);
  await legacy();
  const process = (await db.query("select * from public.processes where workspace_id=$1", [w]))
    .rows[0];
  const run = (await db.query("select * from public.runs where workspace_id=$1", [w])).rows[0];
  await check("v2 dry run resolves v1 IDs without mutations", async () => {
    const r = await reconcile();
    assert.equal(r.conflicts, 0);
    assert.equal(r.items[0].id, process.id);
    assert.equal(r.items[0].state, "update_draft");
    assert.equal(r.items[1].state, "reuse_preserved");
    assert.equal(
      (await db.query("select draft from public.processes where id=$1", [process.id])).rows[0].draft
        .sop,
      "Original",
    );
  });
  await check(
    "v2 upgrades untouched draft in place and retains original run snapshot",
    async () => {
      await reconcile(true);
      assert.equal(
        (await db.query("select draft from public.processes where id=$1", [process.id])).rows[0]
          .draft.sop,
        "Improved instructions",
      );
      assert.deepEqual(
        (await db.query("select * from public.runs where id=$1", [run.id])).rows[0],
        run,
      );
    },
  );
  await check("repeat v2 and old v1 reuse one process and one task", async () => {
    await reconcile(true);
    await legacy();
    const r = await reconcile();
    assert.ok(r.items.every((i) => i.state === "reuse_preserved"));
    for (const table of ["processes", "runs"])
      assert.equal(
        (await db.query(`select count(*)::int n from public.${table} where workspace_id=$1`, [w]))
          .rows[0].n,
        1,
      );
  });
  await check("completed setup and saved answers survive upgrade", async () => {
    await cmd(w, "save_response", {
      run_id: run.id,
      expected_version: run.version,
      step_id: "read",
      value: "Synthetic actual result",
      not_applicable: false,
      na_reason: "",
    });
    const version = (await db.query("select version from public.runs where id=$1", [run.id]))
      .rows[0].version;
    await cmd(w, "submit_run", { run_id: run.id, expected_version: version });
    const revision = structuredClone(proposed);
    revision[1].content.sop = "New setup wording";
    await reconcile(true, revision);
    assert.equal(
      (await db.query("select status from public.runs where id=$1", [run.id])).rows[0].status,
      "completed",
    );
    assert.equal(
      (await db.query("select value from public.step_responses where run_id=$1", [run.id])).rows[0]
        .value,
      "Synthetic actual result",
    );
  });
  await check("human-edited draft is deferred without blocking safe reuse", async () => {
    await cmd(w, "save_process", { id: process.id, content: { ...content, sop: "Human edit" } });
    const r = await reconcile(true);
    assert.equal(r.deferred, 1);
    assert.equal(
      (await db.query("select draft from public.processes where id=$1", [process.id])).rows[0].draft
        .sop,
      "Human edit",
    );
  });
  await check("published versions and archived drafts are preserved", async () => {
    await cmd(w, "publish_process", { id: process.id });
    const before = (
      await db.query("select * from public.process_versions where process_id=$1", [process.id])
    ).rows;
    await cmd(w, "archive_process", { id: process.id, archived: true });
    assert.equal((await reconcile(true)).deferred, 1);
    assert.deepEqual(
      (await db.query("select * from public.process_versions where process_id=$1", [process.id]))
        .rows,
      before,
    );
  });
  await check(
    "unledgered logical-key match blocks duplicates and all partial creates",
    async () => {
      await db.query("savepoint duplicate");
      await cmd(w, "save_process", { id: null, content: { ...content, title: "M02 Human draft" } });
      const items = [
        ...proposed,
        { key: "M02", kind: "process", content: { ...content, title: "M02 New generated title" } },
        { key: "M03", kind: "process", content: { ...content, title: "M03 New draft" } },
      ];
      assert.equal((await reconcile(false, items)).conflicts, 1);
      await denied(() => reconcile(true, items));
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from public.processes where workspace_id=$1 and title='M03 New draft'",
            [w],
          )
        ).rows[0].n,
        0,
      );
      await db.query("rollback to savepoint duplicate");
    },
  );
  await check("foreign child references fail and unrelated records remain unchanged", async () => {
    const other = (
      await cmd(null, "create_workspace", { name: "Synthetic unrelated", timezone: "UTC" })
    ).id;
    const foreign = (await cmd(other, "save_process", { id: null, content })).id;
    const before = (await db.query("select * from public.processes where workspace_id=$1", [other]))
      .rows;
    await db.query("savepoint foreign_record");
    await db.query("reset role");
    await db.query(
      "update private.provisioning_items set record_id=$1 where workspace_id=$2 and item_key='M01'",
      [foreign, w],
    );
    await identity(owner);
    const r = await reconcile();
    assert.equal(r.conflicts, 1);
    assert.match(r.items[0].reason, /foreign/);
    await denied(() => reconcile(true));
    assert.deepEqual(
      (await db.query("select * from public.processes where workspace_id=$1", [other])).rows,
      before,
    );
    await db.query("rollback to savepoint foreign_record");
    await identity(owner);
  });
  await check(
    "different records across namespaces conflict rather than selecting one",
    async () => {
      await db.query("savepoint namespace_conflict");
      await legacy(
        [
          {
            key: "M01",
            kind: "process",
            content: { ...content, title: "Alternative synthetic draft" },
          },
        ],
        "synthetic-other",
      );
      assert.equal(
        (await reconcile(false, proposed, ["synthetic-v1", "synthetic-other"])).conflicts,
        1,
      );
      await denied(() => reconcile(true, proposed, ["synthetic-v1", "synthetic-other"]));
      await db.query("rollback to savepoint namespace_conflict");
    },
  );
  await check("VA and unrelated actors cannot reconcile", async () => {
    for (const id of [va, outsider]) {
      await identity(id);
      await denied(() => reconcile(true));
    }
    await identity(owner);
  });
  await check("invalid predecessor namespaces reject before writes", async () => {
    for (const previous of [[], ["synthetic-v2"], ["synthetic-v1", "synthetic-v1"], [null]])
      await denied(() => reconcile(true, proposed, previous));
  });
  await check("workspace and memberships remain unchanged; no new outbox mail", async () => {
    assert.equal(
      (await db.query("select owner_id from public.workspaces where id=$1", [w])).rows[0].owner_id,
      owner,
    );
    assert.equal(
      (
        await db.query("select role from public.memberships where workspace_id=$1 and user_id=$2", [
          w,
          va,
        ])
      ).rows[0].role,
      "va",
    );
    await db.query("reset role");
    const outbox = async () =>
      (
        await db.query(
          "select o.* from private.email_outbox o join public.notifications n on n.id=o.notification_id where n.workspace_id=$1 order by o.notification_id",
          [w],
        )
      ).rows;
    const before = await outbox();
    await identity(owner);
    await reconcile(true);
    await db.query("reset role");
    // Publishing via a human command may legitimately queue mail; reconciliation preserves it.
    assert.deepEqual(await outbox(), before);
  });
  await check(
    "fresh v2 creates one draft and preparation, links IDs and cannot duplicate through v1",
    async () => {
      await identity(owner);
      const priorWorkspace = w;
      w = (
        await cmd(null, "create_workspace", { name: "Synthetic fresh upgrade", timezone: "UTC" })
      ).id;
      await db.query("reset role");
      await db.query(
        "insert into public.memberships(workspace_id,user_id,role) values($1,$2,'va')",
        [w, va],
      );
      await identity(owner);
      assert.ok((await reconcile()).items.every((i) => i.state === "create"));
      await reconcile(true);
      assert.ok((await reconcile()).items.every((i) => i.state === "reuse_preserved"));
      const created = (await db.query("select id from public.processes where workspace_id=$1", [w]))
        .rows;
      const tasks = (await db.query("select * from public.runs where workspace_id=$1", [w])).rows;
      assert.equal(created.length, 1);
      assert.equal(tasks.length, 1);
      assert.ok(tasks[0].snapshot.sop.includes(created[0].id));
      assert.equal(tasks[0].due_at, null);
      assert.equal(tasks[0].status, "not_started");
      await denied(() => legacy());
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
      w = priorWorkspace;
    },
  );
  await check("owner provisions and completes assigned work while remaining owner", async () => {
    await identity(owner);
    const owned = (
      await cmd(null, "create_workspace", { name: "Synthetic owner execution", timezone: "UTC" })
    ).id;
    const payload = [
      {
        key: "OWNER_SETUP",
        kind: "preparation",
        content: { ...content, title: "Synthetic owner work" },
      },
    ];
    const provisionOwner = async (apply) =>
      (
        await db.query("select public.reconcile_workspace_setup($1,$2,$2,$3,$4,$5,$6) result", [
          owned,
          owner,
          "synthetic-owner-v2",
          JSON.stringify(payload),
          ["synthetic-owner-v1"],
          apply,
        ])
      ).rows[0].result;
    assert.equal((await provisionOwner(false)).items[0].state, "create");
    await provisionOwner(true);
    assert.equal((await provisionOwner(false)).items[0].state, "reuse_preserved");
    const r = (await db.query("select * from public.runs where workspace_id=$1", [owned])).rows[0];
    assert.equal(r.assignee_id, owner);
    await cmd(owned, "save_response", {
      run_id: r.id,
      expected_version: r.version,
      step_id: "read",
      value: "Owner performed the synthetic task",
      not_applicable: false,
      na_reason: "",
    });
    await cmd(owned, "submit_run", { run_id: r.id, expected_version: r.version + 1 });
    assert.equal(
      (await db.query("select status from public.runs where id=$1", [r.id])).rows[0].status,
      "completed",
    );
    assert.equal(
      (
        await db.query("select role from public.memberships where workspace_id=$1 and user_id=$2", [
          owned,
          owner,
        ])
      ).rows[0].role,
      "owner",
    );
  });
  await check("owner execution supports a separately assigned reviewer", async () => {
    await identity(owner);
    await db.query("reset role");
    await db.query(
      "insert into public.memberships(workspace_id,user_id,role) values($1,$2,'client')",
      [w, outsider],
    );
    await identity(owner);
    const gated = {
      ...content,
      review_required: true,
      steps: [{ ...content.steps[0], approval_before: true }],
    };
    const id = (
      await cmd(w, "create_run", { content: gated, assignee_id: owner, reviewer_id: outsider })
    ).id;
    const version = async () =>
      (await db.query("select version from public.runs where id=$1", [id])).rows[0].version;
    const save = async () =>
      cmd(w, "save_response", {
        run_id: id,
        expected_version: await version(),
        step_id: "read",
        value: "Synthetic action",
        not_applicable: false,
        na_reason: "",
      });
    await denied(save);
    await cmd(w, "request_approval", {
      run_id: id,
      step_id: "read",
      reason: "Synthetic permission request",
    });
    const approval = (await db.query("select id from public.approvals where run_id=$1", [id]))
      .rows[0].id;
    const approve = () =>
      cmd(w, "decide_approval", {
        run_id: id,
        id: approval,
        decision: "approved",
        note: "Synthetic decision",
      });
    await identity(outsider);
    await approve();
    await identity(owner);
    await save();
    await cmd(w, "submit_run", { run_id: id, expected_version: await version() });
    const review = async () =>
      cmd(w, "review_run", {
        run_id: id,
        expected_version: await version(),
        decision: "completed",
        note: "Synthetic review",
      });
    await identity(outsider);
    await review();
    assert.equal(
      (await db.query("select status from public.runs where id=$1", [id])).rows[0].status,
      "completed",
    );
  });
  console.log(`${count} reconciliation database checks passed; all fixtures rolled back.`);
} catch (error) {
  console.error("Reconciliation QA failed:", error.message);
  process.exitCode = 1;
} finally {
  await db.query("rollback");
  await db.end();
}
