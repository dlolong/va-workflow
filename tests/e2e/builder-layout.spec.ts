import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Exercise the actual stylesheet without requiring Auth or database fixtures.
const css = readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', "");

test("toolbar dialogs retain stacked, full-width forms", async ({ page }) => {
  await page.setContent(`
    <style>${css}</style>
    <div class="toolbar">
      <form id="search"><input aria-label="Search"><button>Search</button></form>
      <div class="row">
        <dialog class="wide">
          <div class="dialog-title"><h2>Process and SOP builder</h2><button>Close</button></div>
          <div class="dialog-body">
            <form id="process-form" class="stack">
              <div class="grid-2">
                <label class="field"><span>Process title</span><input></label>
                <label class="field"><span>Short description</span><input></label>
              </div>
              <label class="field"><span>SOP / how to perform the work</span><textarea></textarea></label>
              <div class="grid-3">
                <label class="field"><span>VA can do</span><textarea></textarea></label>
                <label class="field"><span>Ask first</span><textarea></textarea></label>
                <label class="field"><span>Never do</span><textarea></textarea></label>
              </div>
              <section class="step-editor stack-sm"><h3>Execution checklist</h3><input aria-label="Step title"></section>
              <div class="form-actions"><button>Save draft</button></div>
            </form>
          </div>
        </dialog>
      </div>
    </div>
  `);
  await page.locator("dialog").evaluate((el: HTMLDialogElement) => el.showModal());
  await expect(page.locator("#search")).toHaveCSS("display", "flex");
  await expect(page.locator("#process-form")).toHaveCSS("display", "grid");
  const layout = await page.locator("#process-form").evaluate((el) => {
    const body = el.parentElement!;
    const style = getComputedStyle(body);
    const children = Array.from(el.children).map((child) => child.getBoundingClientRect());
    const dialog = el.closest("dialog")!;
    return {
      width: el.getBoundingClientRect().width,
      available: body.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      stacked: children.every((rect, i) => i === 0 || rect.top >= children[i - 1]!.bottom),
      overflow: dialog.scrollWidth - dialog.clientWidth,
    };
  });
  expect(Math.abs(layout.width - layout.available)).toBeLessThanOrEqual(1);
  expect(layout.stacked).toBe(true);
  expect(layout.overflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Save draft" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Save draft" })).toBeInViewport();
});

for (const frequency of ["daily", "weekdays", "weekly", "monthly"]) {
  test(`recurring deadline ${frequency} layout fits its dialog`, async ({ page }) => {
    await page.setContent(`
      <style>${css}</style>
      <div class="toolbar"><div class="row"><dialog>
        <div class="dialog-title"><h2>Set a recurring deadline</h2><button>Close</button></div>
        <div class="dialog-body"><form id="schedule-form" class="stack">
          <label class="field"><span>Published process</span><select><option>QA published process</option></select></label>
          <div class="grid-2">
            <label class="field"><span>Assignee</span><select><option>Select a team member</option></select></label>
            <label class="field"><span>Reviewer</span><select><option>No reviewer</option></select></label>
            <label class="field"><span>Repeat</span><select><option>${frequency}</option></select></label>
            <label class="field"><span>Deadline time</span><input type="time" value="17:00"></label>
            ${frequency === "weekly" ? '<label class="field"><span>Day of week</span><select><option>Wednesday</option></select></label>' : ""}
            ${frequency === "monthly" ? '<label class="field"><span>Day of month</span><input type="number" value="1"><small class="hint">Days beyond the end of a month use that month\'s last day.</small></label>' : ""}
            <label class="field"><span>Schedule timezone</span><input value="Asia/Manila"></label>
            <label class="field"><span>Create work ahead of deadline</span><select><option>At deadline (not recommended)</option><option selected>1 day before</option></select></label>
          </div>
          <div class="notice">Automatic generation requires the configured cron job. Editing affects future generation, not already-created runs.</div>
          <div class="form-actions"><button>Save schedule</button></div>
        </form></div>
      </dialog></div></div>
    `);
    await page.locator("dialog").evaluate((el: HTMLDialogElement) => el.showModal());
    await expect(page.locator("#schedule-form")).toHaveCSS("display", "grid");
    expect(
      await page.locator("dialog").evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);
    const columns = await page.locator(".grid-2").evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return Array.from(el.querySelectorAll("input, select")).every((field) => {
        const bounds = field.getBoundingClientRect();
        return bounds.left >= rect.left && bounds.right <= rect.right + 1;
      });
    });
    expect(columns).toBe(true);
    await page.getByRole("button", { name: "Save schedule" }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Save schedule" })).toBeInViewport();
  });
}
