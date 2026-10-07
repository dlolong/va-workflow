import { test, expect } from "@playwright/test";
test("setup or sign-in is reachable without credentials", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page).toHaveTitle(/VA Relay/);
  await expect(page.locator("body")).not.toContainText("Application error");
});
test("no horizontal overflow on the public screen", async ({ page }) => {
  await page.goto("/login");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
});
test("unauthenticated commands never accept writes", async ({ request }) => {
  const response = await request.post("/api/command", {
    headers: { Origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" },
    data: {
      workspace_id: null,
      action: "create_workspace",
      payload: { request_id: crypto.randomUUID(), name: "Unauthorized", timezone: "Asia/Manila" },
    },
  });
  expect(response.ok()).toBe(false);
});
test("configured account can create workspace and complete a quick task", async ({ page }) => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
    "Requires disposable staging credentials; not a passing authenticated test when skipped.",
  );
  await page.goto("/login");
  await page.locator("#auth-email").fill(process.env.E2E_EMAIL!);
  await page.locator("#auth-password").fill(process.env.E2E_PASSWORD!);
  await page.locator("#auth-submit").click();
  await expect(page).toHaveURL(/dashboard/);
  await page.locator("#create-workspace").click();
  await page.locator("#workspace-name").fill(`QA workspace ${Date.now()}`);
  await page.locator("#workspace-form-submit").click();
  await expect(page).toHaveURL(/workspaces\/.+\/today/);
  await page.locator("#new-work").click();
  await page.locator("#task-title").fill("QA one-off checklist");
  await page.locator("#task-instructions").fill("Confirm the test flow.");
  await page.locator("#new-task-form-submit").click();
  await expect(page).toHaveURL(/runs\//);
  await page.locator('input[id^="step-value-"]').check();
  await page.locator('button[id^="save-step-"]').click();
  await expect(page.locator(".run-step .saved").first()).toBeVisible();
  await page.locator("#submit-run").click();
  await expect(page.getByText("Work completed.")).toBeVisible();
});
