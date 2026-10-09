import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { TEMPLATES } from "../../src/lib/templates";
const local =
  process.env.QA_DISPOSABLE === "va-relay" &&
  ["localhost", "127.0.0.1"].includes(
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.test").hostname,
  );
test.skip(
  !local,
  "Requires explicit disposable local Auth/Storage stack; never runs against hosted data.",
);
test.setTimeout(180000);
type Actor = { client: SupabaseClient; id: string; email: string; password: string };
async function actor(name: string): Promise<Actor> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const email = `qa-browser-${randomUUID()}@example.test`,
    password = randomUUID() + randomUUID();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: `QA ${name}` } },
  });
  if (error) throw error;
  return { client, id: data.user!.id, email, password };
}
async function cmd(
  u: Actor,
  w: string | null,
  action: string,
  payload: Record<string, unknown> = {},
) {
  const { data, error } = await u.client.rpc("app_command", {
    p_workspace: w,
    p_action: action,
    p_payload: { ...payload, request_id: randomUUID() },
  });
  if (error) throw new Error(error.message);
  return data;
}
async function login(page: Page, u: Actor) {
  await page.goto("/login");
  await page.locator("#auth-email").fill(u.email);
  await page.locator("#auth-password").fill(u.password);
  await page.locator("#auth-submit").click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator("#create-workspace")).toBeVisible();
  await page.waitForLoadState("networkidle");
}
const step = (id: string, patch: Record<string, unknown> = {}) => ({
  id,
  title: id,
  instructions: "Synthetic QA instruction",
  kind: "checkbox",
  required: true,
  allow_na: false,
  evidence: "none",
  approval_before: false,
  options: [],
  ...patch,
});
const flow = (steps: ReturnType<typeof step>[], review_required = false) => ({
  title: "QA browser SOP",
  description: "",
  sop: "Synthetic QA procedure",
  can_do: "Check",
  ask_first: "Changes",
  never_do: "Real transactions",
  resources: [],
  steps,
  review_required,
});
async function save(page: Page, id: string) {
  await page.locator(`#save-step-${id}`).click();
  await expect(page.locator(`#run-step-${id}`).getByText("Saved to workspace.")).toBeVisible();
}

test("workspace, draft/publish, modal focus, quick task, archive and screenshots", async ({
  page,
}, info) => {
  const owner = await actor("owner");
  await login(page, owner);
  await page.locator("#create-workspace").click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#create-workspace")).toBeFocused();
  await page.locator("#create-workspace").click();
  await page.locator("#workspace-name").fill("QA browser workspace");
  await page.locator("#workspace-form-submit").click();
  await expect(page).toHaveURL(/workspaces\/.+\/today/);
  const w = page.url().split("/workspaces/")[1]!.split("/")[0]!;
  await page.goto(`/workspaces/${w}/processes`);
  await page.locator("#new-process").click();
  await expect(page.locator("#process-form")).toHaveCSS("display", "grid");
  expect(await page.locator("dialog").evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(
    true,
  );
  await page.locator("#process-title").fill("QA published SOP");
  await page.locator('input[id^="step-"][id$="-title"]').fill("Check result");
  await page.locator("#process-form-submit").click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await page.locator('button[id^="publish-process-"]').click();
  await expect(
    page.getByText("New SOP version published. Existing runs are unchanged."),
  ).toBeVisible();
  await expect(page.getByText("published v1", { exact: true })).toBeVisible();
  await page.locator("#new-work").click();
  await page.locator("#task-title").fill("QA quick task");
  await page.locator("#task-instructions").fill("Synthetic action only");
  let lostCreation = false;
  const requestIds: string[] = [];
  await page.route("**/api/command", async (route) => {
    const body = route.request().postDataJSON();
    if (body.action === "create_run") {
      requestIds.push(body.payload.request_id);
      if (!lostCreation) {
        lostCreation = true;
        await route.fetch();
        await route.fulfill({ status: 200, contentType: "application/json", body: '{"data":' });
        return;
      }
    }
    await route.continue();
  });
  await page.locator("#new-task-form-submit").click();
  await expect(page.getByText(/server response was interrupted/)).toBeVisible();
  await page.locator("#new-task-form-submit").click();
  await page.unroute("**/api/command");
  expect(requestIds).toHaveLength(2);
  expect(requestIds[0]).toBe(requestIds[1]);

  await expect(page).toHaveURL(/runs\//);
  const id = await page.locator('input[id^="step-value-"]').getAttribute("id");
  const sid = id!.replace("step-value-", "");
  await page.locator(`#${id}`).check();
  await save(page, sid);
  await page.reload();
  await expect(page.locator(`#${id}`)).toBeChecked();
  await page.locator("#submit-run").click();
  await expect(page.getByText("Work completed.")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `artifacts/qa/${info.project.name}-completed.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await cmd(owner, w, "update_workspace", {
    name: "QA browser workspace",
    timezone: "Asia/Manila",
    archived: true,
  });
  await page.goto(`/workspaces/${w}/processes`);
  await expect(page.locator("#new-work")).toHaveCount(0);
  await expect(page.locator('button[id^="publish-process-"]')).toHaveCount(0);
  await expect(page.locator('button[id^="start-process-"]')).toHaveCount(0);
  await page.goto(`/workspaces/${w}/team`);
  await expect(page.locator("#invite-member")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Invitation history" })).toBeVisible();
  await expect(page.locator('button[id^="revoke-invite-"]')).toHaveCount(0);
  await page.goto(`/workspaces/${w}/settings`);
  await expect(page.getByRole("heading", { name: "Automation health" })).toBeVisible();
  await cmd(owner, w, "update_workspace", {
    name: "QA browser workspace",
    timezone: "Asia/Manila",
    archived: false,
  });
  await page.goto(`/workspaces/${w}/reports`);
  const csv = await page.request.get(`/api/export/${w}?format=csv`);
  expect(csv.status()).toBe(200);
  const json = await page.request.get(`/api/export/${w}`);
  expect((await json.json()).attachment_bytes_included).toBe(false);
});

test("two real sessions: permission, typed answers, upload retention, correction and isolation", async ({
  page,
  browser,
}, info) => {
  const owner = await actor("owner"),
    va = await actor("VA"),
    reviewer = await actor("reviewer"),
    other = await actor("other client");
  const w = (
    await cmd(owner, null, "create_workspace", { name: "QA approval workspace", timezone: "UTC" })
  ).id;
  for (const [u, role] of [
    [va, "va"],
    [reviewer, "client"],
  ] as const) {
    const inv = await cmd(owner, w, "invite_member", { email: u.email, role });
    await cmd(u, null, "accept_invitation", { token: inv.token });
  }
  const run = (
    await cmd(owner, w, "create_run", {
      content: flow(
        [
          step("gate", { approval_before: true, evidence: "file" }),
          step("zero", { kind: "number" }),
          step("no", { kind: "yes_no" }),
          step("text", { kind: "text" }),
        ],
        true,
      ),
      assignee_id: va.id,
      reviewer_id: reviewer.id,
    })
  ).id;
  await login(page, va);
  await page.goto(`/workspaces/${w}/runs/${run}`);
  const reviewContext = await browser.newContext();
  const reviewPage = await reviewContext.newPage();
  await login(reviewPage, reviewer);
  await expect(page.locator("#step-value-gate")).toBeDisabled();
  await page.locator("#request-permission-gate").click();
  await page.locator("#permission-reason-gate").fill("Synthetic QA permission request");
  await page.locator("#permission-request-gate-submit").click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await reviewPage.goto(`/workspaces/${w}/runs/${run}`);
  await reviewPage.locator('button[id^="decide-permission-"]').click();
  await reviewPage.locator("#permission-note").fill("Approved for synthetic QA");
  await reviewPage.locator("#permission-decision-form-submit").click();
  await expect(reviewPage.locator("dialog[open]")).toHaveCount(0);
  await page.reload();
  await page.locator("#run-step-gate summary").filter({ hasText: "Attach evidence" }).click();
  await page.locator("#evidence-file-gate").setInputFiles({
    name: "synthetic.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Synthetic QA evidence"),
  });
  await page.locator("#step-value-gate").check();
  await save(page, "gate");
  // Saving used to remount this input and silently discard the selected file.
  await expect(page.locator("#upload-evidence-gate")).toBeEnabled();
  expect(
    await page.locator("#evidence-file-gate").evaluate((el: HTMLInputElement) => el.files?.length),
  ).toBe(1);
  // The real upload succeeds; lose only the command response, then retry the same registration.
  let interrupted = false;
  await page.route("**/api/command", async (route) => {
    if (route.request().postDataJSON().action === "confirm_evidence" && !interrupted) {
      interrupted = true;
      await route.fetch();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"data":' });
    } else await route.continue();
  });
  await page.locator("#upload-evidence-gate").click();
  await expect(page.getByText(/server response was interrupted/).first()).toBeVisible();
  await page.locator("#upload-evidence-gate").click();
  await expect(page.locator('a[id^="evidence-"]')).toBeVisible();
  await page.unroute("**/api/command");
  await page.locator("#step-value-zero").fill("0");
  await save(page, "zero");
  await page.locator("#step-value-no").selectOption("no");
  await save(page, "no");
  await page.locator("#step-value-text").fill("Unsaved QA answer");
  page.once("dialog", (d) => d.dismiss());
  await page.locator("#workspace-switcher").selectOption("");
  await expect(page).toHaveURL(new RegExp(run));
  await expect(page.locator("#step-value-text")).toHaveValue("Unsaved QA answer");
  await page.context().setOffline(true);
  await page.locator("#save-step-text").click();
  await expect(page.locator("#run-step-text").getByRole("alert")).toBeVisible();
  await page.context().setOffline(false);
  await save(page, "text");
  await page.locator("#submit-run").click();
  await expect(page.getByText("Submitted for review.")).toBeVisible();
  await reviewPage.reload();
  await reviewPage.locator("#run-review-decision").selectOption("changes_requested");
  await reviewPage.locator("#run-review-note").fill("Please correct the synthetic note");
  await reviewPage.locator("#review-run-form-submit").click();
  await expect(reviewPage.getByText("Review recorded.")).toBeVisible();
  await page.reload();
  await page.locator("#step-value-text").fill("Corrected synthetic note");
  await save(page, "text");
  await page.locator("#submit-run").click();
  await expect(page.getByText("Submitted for review.")).toBeVisible();
  await reviewPage.reload();
  await reviewPage.locator("#run-review-note").fill("Accepted after correction");
  await reviewPage.locator("#review-run-form-submit").click();
  await expect(reviewPage.getByText("Review recorded.")).toBeVisible();
  await page.reload();
  await expect(page.locator("#step-value-zero")).toHaveValue("0");
  await expect(page.locator("#step-value-no")).toHaveValue("no");
  await expect(page.locator("#step-value-gate")).toBeDisabled();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `artifacts/qa/${info.project.name}-reviewed.png`, fullPage: true });
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await login(otherPage, other);
  await otherPage.goto(`/workspaces/${w}/runs/${run}`);
  // Next.js streams notFound UI with HTTP 200 after headers have been sent.
  await expect(otherPage.getByRole("heading", { name: "Page unavailable." })).toBeVisible();
  await expect(otherPage.locator("#run-step-gate")).toHaveCount(0);
  expect((await otherPage.request.get(`/api/export/${w}`)).status()).toBe(403);
  await otherContext.close();
  await reviewContext.close();
});

test("cron rejects missing and incorrect bearer tokens", async ({ request }) => {
  for (const headers of [{}, { Authorization: "Bearer wrong" }] as Record<string, string>[]) {
    const r = await request.post("/api/cron", { headers });
    expect(r.status()).toBe(401);
  }
});

test("invitation, schedule, issue follow-up, discussion, handover and reassignment", async ({
  page,
  browser,
}) => {
  const owner = await actor("owner"),
    member = await actor("member");
  const w = (await cmd(owner, null, "create_workspace", { name: "QA operations", timezone: "UTC" }))
    .id;
  await login(page, owner);
  await page.goto(`/workspaces/${w}/team`);
  await page.locator("#invite-member").click();
  await page.locator("#invite-email").fill(member.email);
  await page.locator("#invite-role").selectOption("va");
  await page.locator("#invite-member-form-submit").click();
  await expect(page.locator("#created-invitation-link")).toBeVisible();
  const link = await page.locator("#created-invitation-link").inputValue();
  const context = await browser.newContext();
  const memberPage = await context.newPage();
  await login(memberPage, member);
  await memberPage.goto(link);
  await memberPage.locator("#accept-invitation").click();
  await expect(memberPage).toHaveURL(new RegExp(`/workspaces/${w}/today`));
  const proc = (await cmd(owner, w, "save_process", { content: flow([step("check")]) })).id;
  await cmd(owner, w, "publish_process", { id: proc });
  await page.goto(`/workspaces/${w}/processes`);
  await page.locator("#new-schedule").click();
  await expect(page.locator("#schedule-form")).toHaveCSS("display", "grid");
  expect(await page.locator("dialog").evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(
    true,
  );
  await page.locator("#schedule-process").selectOption(proc);
  await page.locator("dialog #assignee_id").selectOption(member.id);
  await page.locator("#schedule-frequency").selectOption("daily");
  await page.locator("#schedule-form-submit").click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await page.locator("#generate-due-work").click();
  await expect(
    page.getByText("Due schedules checked. Already-created occurrences were not duplicated."),
  ).toBeVisible();
  const { data: runs } = await owner.client.from("runs").select("id").eq("workspace_id", w);
  expect(runs!.length).toBeGreaterThan(0);
  const run = runs![0]!.id;
  await memberPage.goto(`/workspaces/${w}/runs/${run}`);
  await memberPage.locator("#new-issue").click();
  await memberPage.locator("#issue-title").fill("Synthetic exception");
  await memberPage.locator("#issue-detail").fill("Needs synthetic verification");
  await memberPage.locator("#issue-recommendation").fill("Review test result");
  await memberPage.locator("dialog #owner_id").selectOption(member.id);
  await memberPage.locator("#issue-follow-up").fill("2026-10-08T10:00");
  await memberPage.locator("#issue-form-submit").click();
  await expect(memberPage.locator("dialog")).toHaveCount(0);
  await memberPage.locator("#change-work-status").click();
  await memberPage.locator("#work-status").selectOption("waiting_on_client");
  await memberPage.locator("#work-status-reason").fill("Awaiting synthetic input");
  await memberPage.locator("dialog #waiting_on_id").selectOption(owner.id);
  await memberPage.locator("dialog #follow_up_owner_id").selectOption(member.id);
  await memberPage.locator("#work-follow-up-date").fill("2026-10-08T10:00");
  await memberPage.locator("#work-status-form-submit").click();
  await expect(memberPage.locator("dialog")).toHaveCount(0);
  await memberPage.locator("#comment-body").fill("Synthetic QA discussion");
  await memberPage.locator("#comment-form-submit").click();
  await expect(memberPage.getByText("Comment posted.")).toBeVisible();
  await memberPage.locator('button[id^="resolve-issue-"]').click();
  await memberPage.locator("#issue-resolution").fill("Synthetic result verified");
  await memberPage.locator("#resolve-issue-form-submit").click();
  await expect(memberPage.locator("dialog")).toHaveCount(0);
  await page.goto(`/workspaces/${w}/training`);
  await page.locator("#add-handover").click();
  await page.locator("#training-process").selectOption(proc);
  await page.locator("dialog #user_id").selectOption(member.id);
  await page.locator("dialog #trainer_id").selectOption(owner.id);
  await page.locator("#training-stage").selectOption("owned");
  await page.locator("#training-note").fill("Independent synthetic checklist verified");
  await page.locator("#training-form-submit").click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.getByText("owned", { exact: true })).toBeVisible();
  await page.goto(`/workspaces/${w}/runs/${run}`);
  await page.locator("#reassign-run").click();
  await page.locator("dialog #assignee_id").selectOption(owner.id);
  await page.locator("#reassign-note").fill("QA handover to owner");
  await page.locator("#reassign-run-form-submit").click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await page.goto(`/workspaces/${w}/notifications`);
  await page.locator("#mark-all-read").click();
  await expect(page.locator('button[id^="read-notification-"]')).toHaveCount(0);
  await page.goto(`/workspaces/${w}/team`);
  await page.locator("#invite-member").click();
  await page.locator("#invite-email").fill(`unused-${randomUUID()}@example.test`);
  await page.locator("#invite-member-form-submit").click();
  await expect(page.locator("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.locator('button[id^="revoke-invite-"]').click();
  await expect(page.locator('button[id^="revoke-invite-"]')).toHaveCount(0);
  await context.close();
});

test("unsaved answers survive cancelled history, workspace, mobile and sign-out navigation", async ({
  page,
}, info) => {
  const owner = await actor("owner");
  const w = (await cmd(owner, null, "create_workspace", { name: "QA navigation", timezone: "UTC" }))
    .id;
  const run = (
    await cmd(owner, w, "create_run", {
      content: flow([step("text", { kind: "text" })]),
      assignee_id: owner.id,
    })
  ).id;
  await login(page, owner);
  await page.goto(`/workspaces/${w}/tasks`);
  await page.locator(`#run-${run}`).click();
  await page.locator("#step-value-text").fill("Unsaved synthetic draft");
  page.once("dialog", (d) => d.dismiss());
  await page.evaluate(() => history.back());
  await expect(page.locator("#step-value-text")).toHaveValue("Unsaved synthetic draft");
  await expect(page).toHaveURL(new RegExp(run));
  page.once("dialog", (d) => d.dismiss());
  await page.locator("#workspace-switcher").selectOption("");
  await expect(page.locator("#step-value-text")).toHaveValue("Unsaved synthetic draft");
  if (info.project.name === "mobile") {
    page.once("dialog", (d) => d.dismiss());
    await page.locator("#main-menu-toggle").click();
    await page.locator("#mobile-nav-tasks").click();
    await page.getByRole("button", { name: "Close menu", exact: true }).click();
    await expect(page.locator("#step-value-text")).toHaveValue("Unsaved synthetic draft");
  }
  page.once("dialog", (d) => d.dismiss());
  await page.locator("#sign-out").click();
  await expect(page.locator("#step-value-text")).toHaveValue("Unsaved synthetic draft");
  await save(page, "text");
  if (info.project.name === "mobile") {
    await page.locator("#main-menu-toggle").click();
    await page.locator("#mobile-nav-reports").click();
  } else await page.locator("#nav-reports").click();
  await expect(page).toHaveURL(/reports/);
  await page.goBack();
  await page.locator("#step-value-text").click();
  await page.locator("#step-value-text").fill("Draft before forward");
  page.once("dialog", (d) => d.dismiss());
  await page.evaluate(() => history.forward());
  await expect(page.locator("#step-value-text")).toHaveValue("Draft before forward");
  await expect(page).toHaveURL(new RegExp(run));
  const reloadDialog = page.waitForEvent("dialog");
  await page.evaluate(() => {
    setTimeout(() => location.reload(), 0);
  });
  await (await reloadDialog).dismiss();
  await expect(page.locator("#step-value-text")).toHaveValue("Draft before forward");
  await save(page, "text");

  await page.locator("#sign-out").click();
  await expect(page).toHaveURL(/login/);
  await page.waitForLoadState("networkidle");
});

test("signup, confirmation callback and password recovery against local Auth", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#auth-mode").click();
  await page.locator("#auth-name").fill("QA signup");
  const email = `qa-signup-${randomUUID()}@example.test`,
    password = randomUUID() + randomUUID();
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.locator("#auth-submit").click();
  await expect(page).toHaveURL(/dashboard/);
  await page.waitForLoadState("networkidle");
  await page.locator("#sign-out").click();
  await expect(page).toHaveURL(/login/);
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("networkidle");
  await page.locator("#auth-forgot").click();
  await expect(
    page.getByRole("heading", { name: "Reset your password", exact: true }),
  ).toBeVisible();
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-submit").click();
  await expect(page.getByText(/Check your email for a password reset link/)).toBeVisible();
  // Admin generates only a local fixture link; the real app callback verifies it
  // with the public client. This does not assert production SMTP delivery.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const recovery = await admin.auth.admin.generateLink({ type: "recovery", email });
  expect(recovery.error).toBeNull();
  try {
    await page.goto(
      `/auth/confirm?token_hash=${recovery.data.properties!.hashed_token}&type=recovery`,
    );
  } catch {
    throw new Error("Local recovery callback failed");
  }
  await expect(page).toHaveURL(/reset-password/);
  const replacement = randomUUID() + randomUUID();
  await page.locator("#auth-password").fill(replacement);
  await page.locator("#auth-submit").click();
  await expect(page).toHaveURL(/dashboard/);
  await page.waitForLoadState("networkidle");
  await page.locator("#sign-out").click();
  await expect(page).toHaveURL(/login/);
  await page.waitForLoadState("networkidle");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(replacement);
  await page.locator("#auth-submit").click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/auth/confirm?token_hash=invalid&type=email");
  await expect(page).toHaveURL(/auth\/error/);
});

test("two tabs preserve a dirty answer and selected file through remote refresh", async ({
  page,
}) => {
  const owner = await actor("owner");
  const w = (
    await cmd(owner, null, "create_workspace", { name: "QA simultaneous tabs", timezone: "UTC" })
  ).id;
  const run = (
    await cmd(owner, w, "create_run", {
      content: flow([step("text", { kind: "text", allow_na: true })]),
      assignee_id: owner.id,
    })
  ).id;
  await login(page, owner);
  await page.goto(`/workspaces/${w}/runs/${run}`);
  const second = await page.context().newPage();
  await second.goto(`/workspaces/${w}/runs/${run}`);
  await page.locator("#step-value-text").fill("Local unsaved draft");
  await page.locator("#run-step-text summary").filter({ hasText: "Attach evidence" }).click();
  await page.locator("#evidence-file-text").setInputFiles({
    name: "synthetic.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Synthetic QA"),
  });
  await page.locator("#step-na-text").check();
  await page.locator("#step-na-text").uncheck();
  expect(
    await page.locator("#evidence-file-text").evaluate((el: HTMLInputElement) => el.files?.length),
  ).toBe(1);
  await second.locator("#step-value-text").fill("Remote saved answer");
  await save(second, "text");
  await page.locator("#comment-body").fill("Trigger an authorized refresh");
  await page.locator("#comment-form-submit").click();
  await expect(page.getByText(/This answer changed in another session/)).toBeVisible();
  await expect(page.locator("#step-value-text")).toHaveValue("Local unsaved draft");
  await expect(page.locator("#save-step-text")).toBeDisabled();
  expect(
    await page.locator("#evidence-file-text").evaluate((el: HTMLInputElement) => el.files?.length),
  ).toBe(1);
  const { data } = await owner.client
    .from("step_responses")
    .select("value")
    .eq("run_id", run)
    .eq("step_id", "text")
    .single();
  expect(data!.value).toBe("Remote saved answer");
  await second.close();
});

test("centered dialogs, grouped navigation and persistent header", async ({ page }, info) => {
  const owner = await actor("Navigation");
  const w = (
    await cmd(owner, null, "create_workspace", { name: "Synthetic navigation QA", timezone: "UTC" })
  ).id;
  await login(page, owner);
  await page.goto(`/workspaces/${w}/today`);
  await expect(page.locator("#header-user-email")).toHaveText(owner.email);
  await expect(page.locator("#header-user-email")).toBeVisible();
  await expect(page.locator("#header-user-email")).toHaveCSS("font-size", "11px");
  if (info.project.name === "mobile") {
    await page.locator("#main-menu-toggle").click();
    const menu = page.locator("#mobile-navigation");
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Daily work", { exact: true })).toBeVisible();
    await expect(menu.getByRole("link")).toHaveCount(13);
    await page.keyboard.press("Escape");
    await expect(page.locator("#main-menu-toggle")).toBeFocused();
    await page.locator("#main-menu-toggle").click();
    await page.locator("#mobile-nav-tasks").click();
    await expect(page).toHaveURL(/tasks/);
    await expect(menu).not.toBeVisible();
  } else {
    await expect(page.getByText("Processes & people", { exact: true }).first()).toBeVisible();
  }
  await page.locator("#new-work").click();
  const dialog = page.locator("dialog[open]");
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(Math.abs(box!.x + box!.width / 2 - viewport.width / 2)).toBeLessThan(3);
  expect(Math.abs(box!.y + box!.height / 2 - viewport.height / 2)).toBeLessThan(3);
  await page.keyboard.press("Escape");
  await expect(page.locator("#new-work")).toBeFocused();
  await page.evaluate(() => {
    document.querySelector("main")!.style.minHeight = "200vh";
    window.scrollTo(0, 500);
  });
  expect((await page.locator(".topbar").boundingBox())!.y).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("operations catalog reload and all template drafts preserve their settings", async ({
  page,
}) => {
  const owner = await actor("template owner");
  const w = (
    await cmd(owner, null, "create_workspace", {
      name: "QA template catalog",
      timezone: "Asia/Manila",
    })
  ).id;
  await login(page, owner);
  await page.goto(`/workspaces/${w}/processes`);
  await expect(page.locator('button[id^="template-"]')).toHaveCount(23);
  await page.reload();
  await expect(page.locator('button[id^="template-"]')).toHaveCount(23);
  for (const [index, template] of TEMPLATES.entries()) {
    if (index < 3) continue;
    await page.locator(`#template-${index}`).click();
    await expect(page.locator("#process-title")).toHaveValue(template.title);
    await expect(page.locator("#process-sop")).toHaveValue(template.sop);
    await expect(page.locator("#process-resources")).toHaveValue("");
    await expect(page.locator("#process-review-required")).toBeChecked({
      checked: template.review_required,
    });
    for (const step of template.steps) {
      await expect(page.locator(`#step-${step.id}-instructions`)).toHaveValue(step.instructions);
      await expect(page.locator(`#step-${step.id}-kind`)).toHaveValue(step.kind);
      await expect(page.locator(`#step-${step.id}-evidence`)).toHaveValue(step.evidence);
      await expect(page.locator(`#step-${step.id}-na`)).toBeChecked({ checked: step.allow_na });
      await expect(page.locator(`#step-${step.id}-approval`)).toBeChecked({
        checked: step.approval_before,
      });
    }
    await page.locator("#process-form-submit").click();
    await expect(page.locator("dialog")).toHaveCount(0);
    const { data, error } = await owner.client
      .from("processes")
      .select("draft,published_version")
      .eq("workspace_id", w)
      .eq("title", template.title)
      .single();
    expect(error).toBeNull();
    expect(data?.draft).toEqual({
      ...template,
      title: template.title.trim(),
      description: template.description.trim(),
      sop: template.sop.trim(),
      can_do: template.can_do.trim(),
      ask_first: template.ask_first.trim(),
      never_do: template.never_do.trim(),
    });
    expect(data?.published_version).toBeNull();
  }
});

test("provisioned drafts and preparation remain honest in VA workspace views", async ({ page }) => {
  const owner = await actor("setup owner"),
    va = await actor("setup VA");
  const w = (
    await cmd(owner, null, "create_workspace", {
      name: "Synthetic setup workspace",
      timezone: "Europe/Amsterdam",
    })
  ).id;
  const invite = await cmd(owner, w, "invite_member", { email: va.email, role: "va" });
  await cmd(va, null, "accept_invitation", { token: invite.token });
  const items = [
    {
      key: "draft",
      kind: "process",
      content: { ...flow([step("scope")]), title: "Synthetic setup draft" },
    },
    {
      key: "prepare",
      kind: "preparation",
      process_keys: ["draft"],
      content: { ...flow([step("read")]), title: "Synthetic handover preparation" },
    },
    { key: "training", kind: "training", process_key: "draft", trainer_id: owner.id },
  ];
  const { error } = await owner.client.rpc("provision_workspace_setup", {
    p_workspace: w,
    p_target: va.id,
    p_owner: owner.id,
    p_setup_key: "synthetic-browser",
    p_items: items,
    p_apply: true,
  });
  expect(error).toBeNull();
  await login(page, va);
  await page.goto(`/workspaces/${w}/today`);
  const preparation = page.getByRole("link", {
    name: "Synthetic handover preparation",
    exact: true,
  });
  await expect(preparation).toBeVisible();
  await preparation.click();
  await expect(page.locator("#run-step-read")).toBeVisible();
  await expect(page.locator("#run-step-read input[type=checkbox]")).not.toBeChecked();
  await page.goto(`/workspaces/${w}/processes`);
  const draft = page.getByRole("row").filter({ hasText: "Synthetic setup draft" });
  await expect(draft.locator(".badge")).toHaveText(/draft/i);
  await expect(draft.getByRole("button", { name: "Publish draft" })).toHaveCount(0);
  await expect(draft.getByRole("button", { name: "Start run" })).toHaveCount(0);
  await page.goto(`/workspaces/${w}/training`);
  await expect(page.getByRole("row").filter({ hasText: "Synthetic setup draft" })).toContainText(
    /not started/i,
  );
});
