import test from "node:test";
import assert from "node:assert/strict";
import { assessTarget, discover } from "../../scripts/provisioning/preflight.mjs";
const target = {
  userId: "synthetic-va",
  workspaceName: "Synthetic client",
  timezone: "Europe/Amsterdam",
};
const workspace = {
  id: "synthetic-workspace",
  name: target.workspaceName,
  owner_id: "synthetic-owner",
  timezone: target.timezone,
  archived_at: null,
};
const input = () => ({
  ...target,
  user: { id: target.userId },
  workspaces: [workspace],
  memberships: [
    { workspace_id: workspace.id, user_id: target.userId, role: "va", active: true },
    { workspace_id: workspace.id, user_id: workspace.owner_id, role: "owner", active: true },
  ],
  ownerUsers: [{ id: workspace.owner_id }],
});
test("preflight accepts verified distinct owner and active VA for review only", () =>
  assert.equal(assessTarget(input()).readyForReview, true));
for (const [name, mutate] of [
  [
    "missing account",
    (v) => {
      v.user = null;
    },
  ],
  [
    "ambiguous workspace",
    (v) => {
      v.workspaces.push({ ...workspace, id: "another" });
    },
  ],
  [
    "archived workspace",
    (v) => {
      v.workspaces = [{ ...workspace, archived_at: "2026-01-01" }];
    },
  ],
  [
    "wrong timezone",
    (v) => {
      v.workspaces = [{ ...workspace, timezone: "UTC" }];
    },
  ],
  [
    "target owner conflict",
    (v) => {
      v.workspaces = [{ ...workspace, owner_id: target.userId }];
      v.memberships[0].role = "owner";
    },
  ],
  [
    "inactive VA",
    (v) => {
      v.memberships[0].active = false;
    },
  ],
  [
    "unverified owner",
    (v) => {
      v.ownerUsers = [];
    },
  ],
  [
    "cross-workspace owner membership",
    (v) => {
      v.memberships[1].workspace_id = "unrelated";
    },
  ],
])
  test(`preflight blocks ${name}`, () => {
    const value = input();
    mutate(value);
    assert.equal(assessTarget(value).readyForReview, false);
  });
test("failed remote lookup cannot produce a successful assessment", async () => {
  // Only tests error handling; not presented as live Supabase validation.
  await assert.rejects(
    discover(
      { auth: { admin: { getUserById: async () => ({ error: new Error("offline") }) } } },
      target,
    ),
    /lookup failed/,
  );
});

const { validateManifest } = await import("../../scripts/provisioning/manifest.mjs");
const syntheticWorkflow = {
  title: "Synthetic preparation",
  description: "",
  sop: "Read scope",
  can_do: "Read",
  ask_first: "Changes",
  never_do: "Payments",
  resources: [],
  review_required: false,
  steps: [
    {
      id: "read",
      title: "Read",
      instructions: "",
      kind: "checkbox",
      required: true,
      allow_na: false,
      evidence: "none",
      approval_before: false,
      options: [],
    },
  ],
};
const manifest = () => ({
  setupKey: "synthetic",
  items: [
    { key: "sop", kind: "process", content: syntheticWorkflow },
    { key: "prep", kind: "preparation", process_keys: ["sop"], content: syntheticWorkflow },
  ],
});
test("manifest uses current workflow validation and valid draft references", () =>
  assert.equal(validateManifest(manifest()).items.length, 2));
test("manifest rejects duplicate keys", () => {
  const v = manifest();
  v.items.push(v.items[0]);
  assert.throws(() => validateManifest(v));
});
test("manifest rejects unrelated process references", () => {
  const v = manifest();
  v.items[1].process_keys = ["unrelated"];
  assert.throws(() => validateManifest(v));
});
test("manifest rejects operational approval hidden as preparation", () => {
  const v = structuredClone(manifest());
  v.items[1].content.steps[0].approval_before = true;
  assert.throws(() => validateManifest(v));
});
test("manifest rejects unsupported actions and malformed schema", () => {
  const v = manifest();
  v.items[0].kind = "publish_process";
  assert.throws(() => validateManifest(v));
});

const { assertFixedTarget } = await import("../../scripts/provisioning/target.mjs");
test("exact workspace ID wins over stale contextual name, never falls back", () => {
  const v = input();
  v.workspaceId = workspace.id;
  v.workspaceName = "Stale label";
  assert.equal(assessTarget(v).workspace.id, workspace.id);
  v.workspaceId = "missing";
  assert.equal(assessTarget(v).workspace, null);
  assert.equal(assessTarget(v).readyForReview, false);
});
test("unknown requested timezone allows stored timezone discovery, not activation", () => {
  const v = input();
  v.timezone = null;
  assert.equal(assessTarget(v).workspace.timezone, workspace.timezone);
});
const fixed = {
  workspaceId: "10000000-0000-4000-8000-000000000001",
  maryUserId: "10000000-0000-4000-8000-000000000002",
  setupKey: "synthetic-fixed",
};
const fixedConfig = () => ({ ...fixed, fixedTarget: { ...fixed } });
const fixedManifest = () => ({
  ...manifest(),
  setupKey: fixed.setupKey,
  fixedTarget: { ...fixed },
});
test("private target contract survives actual manifest validation", () => {
  assertFixedTarget(fixedConfig(), validateManifest(fixedManifest()), {}, fixed);
});
for (const field of ["workspaceId", "maryUserId", "setupKey"]) {
  test(`fixed private entry rejects redirected ${field}`, () => {
    const c = fixedConfig(),
      m = fixedManifest();
    c[field] = "another";
    c.fixedTarget[field] = "another";
    m.fixedTarget[field] = "another";
    if (field === "setupKey") m.setupKey = "another";
    assert.throws(() => assertFixedTarget(c, m, {}, fixed), /mismatch/);
  });
}
test("fixed setup rejects environment redirects and missing manifest contract", () => {
  for (const key of ["WORKSPACE_ID", "SETUP_WORKSPACE_ID"])
    assert.throws(
      () => assertFixedTarget(fixedConfig(), fixedManifest(), { [key]: "unrelated" }, fixed),
      /environment/,
    );
  const m = fixedManifest();
  delete m.fixedTarget;
  assert.throws(() => assertFixedTarget(fixedConfig(), m, {}, fixed), /mismatch/);
});
test("exact ID lookup queries primary key and scopes child reads", async () => {
  const calls = [];
  const db = {
    auth: { admin: { getUserById: async (id) => ({ data: { user: { id } } }) } },
    from(table) {
      const q = {
        select() {
          return q;
        },
        eq(k, v) {
          calls.push([table, k, v]);
          return q;
        },
        in() {
          return q;
        },
        then(resolve) {
          return Promise.resolve({
            data: table === "workspaces" ? [workspace] : input().memberships,
            error: null,
          }).then(resolve);
        },
      };
      return q;
    },
  };
  const result = await discover(db, {
    ...target,
    workspaceId: workspace.id,
    workspaceName: "Wrong label",
  });
  assert.equal(result.readyForReview, true);
  assert.deepEqual(calls, [
    ["workspaces", "id", workspace.id],
    ["memberships", "workspace_id", workspace.id],
  ]);
});
