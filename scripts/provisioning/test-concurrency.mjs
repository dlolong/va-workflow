/** Real concurrent local Auth/RPC test. Creates disposable synthetic records only. */
import "../load-env.mjs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (
  process.env.QA_DISPOSABLE !== "va-relay" ||
  !url ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error(
    "Blocked: explicit disposable local Auth/RPC environment required. Concurrency test not run.",
  );
async function actor() {
  const db = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `synthetic-setup-${randomUUID()}@example.test`;
  const a = await db.auth.signUp({ email, password: randomUUID() + randomUUID() });
  if (a.error || !a.data.session) throw new Error("Disposable account/session creation failed");
  return { db, id: a.data.user.id, email };
}
async function cmd(a, w, action, payload) {
  const r = await a.db.rpc("app_command", {
    p_workspace: w,
    p_action: action,
    p_payload: { ...payload, request_id: randomUUID() },
  });
  assert.equal(r.error, null);
  return r.data;
}
const owner = await actor(),
  va = await actor();
const w = (
  await cmd(owner, null, "create_workspace", {
    name: "Synthetic concurrency setup",
    timezone: "Europe/Amsterdam",
  })
).id;
const invitation = await cmd(owner, w, "invite_member", { email: va.email, role: "va" });
await cmd(va, null, "accept_invitation", { token: invitation.token });
const content = {
  title: "Synthetic concurrent draft",
  description: "",
  sop: "Synthetic test",
  can_do: "Read",
  ask_first: "Changes",
  never_do: "Payments",
  resources: [],
  review_required: false,
  steps: [
    {
      id: "read",
      title: "Read scope",
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
const payload = {
  p_workspace: w,
  p_target: va.id,
  p_owner: owner.id,
  p_setup_key: "synthetic-concurrency",
  p_items: [
    { key: "draft", kind: "process", content },
    {
      key: "prep",
      kind: "preparation",
      process_keys: ["draft"],
      content: { ...content, title: "Synthetic prep" },
    },
  ],
  p_apply: true,
};
const results = await Promise.all([
  owner.db.rpc("provision_workspace_setup", payload),
  owner.db.rpc("provision_workspace_setup", payload),
]);
for (const r of results) assert.equal(r.error, null);
const read = await owner.db.rpc("provision_workspace_setup", { ...payload, p_apply: false });
assert.equal(read.error, null);
assert.ok(read.data.items.every((i) => i.state === "reuse_preserved"));
for (const table of ["processes", "runs"]) {
  const r = await owner.db.from(table).select("id", { count: "exact" }).eq("workspace_id", w);
  assert.equal(r.error, null);
  assert.equal(r.count, 1);
}
console.log(
  "PASS real concurrent provisioning: exactly one process and one preparation run. Synthetic local fixtures retained; not actual-user browser verification.",
);
