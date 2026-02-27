const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");
const path = require("path");
const fs = require("fs");

function readFixtureJson(name) {
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "cypress",
    "fixtures",
    name,
  );
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test.describe("Audit Logs", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can send audit logs to sucuri servers", async ({ page }) => {
    await page.goto(
      "/wp-admin/admin.php?page=sucuriscan_events_reporting#auditlogs",
    );

    await page.route(
      /\/wp-admin\/admin-ajax\.php\?page=sucuriscan/,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }

        const postData = route.request().postData() || "";
        if (postData.includes("get_audit_logs")) {
          await route.fulfill({
            json: readFixtureJson("audit_logs.json"),
          });
          return;
        }

        if (postData.includes("auditlogs_send_logs")) {
          await route.fulfill({
            json: readFixtureJson("auditlogs_send_logs.json"),
          });
          return;
        }

        await route.fallback();
      },
    );

    await page.click("[data-cy=sucuriscan_dashboard_send_audit_logs_submit]");

    await expect(
      page.locator("[data-cy=sucuriscan_auditlog_response_loading]"),
    ).toContainText("Loading...");

    await expect(
      page.locator(".sucuriscan-auditlog-entry-title"),
    ).toContainText("User authentication succeeded: admin");
  });

  test("can filter auditlogs", async ({ page }) => {
    await page.goto(
      "/wp-admin/admin.php?page=sucuriscan_events_reporting#auditlogs",
    );

    await expect(page.locator(".sucuriscan-auditlog-response")).toBeVisible();
    const auditLogEntries = page.locator(".sucuriscan-auditlog-entry");
    const auditLogCount = await auditLogEntries.count();
    expect(auditLogCount).toBeGreaterThan(0);

    await page.selectOption("#plugins", { label: "Activated" });
    await page.click("[data-cy=sucuriscan_auditlogs_filter_button]");

    const pluginEntries = page.locator(".sucuriscan-auditlog-entry");
    const pluginCount = await pluginEntries.count();
    for (let i = 0; i < pluginCount; i += 1) {
      await expect(
        pluginEntries.nth(i).locator(".sucuriscan-auditlog-entry-title"),
      ).toContainText("Plugin activated");
    }

    await page.click("[data-cy=sucuriscan_auditlogs_clear_filter_button]");
    await page.waitForTimeout(200);

    await page.selectOption("#logins", { label: "Succeeded" });
    await page.click("[data-cy=sucuriscan_auditlogs_filter_button]");

    const loginEntries = page.locator(".sucuriscan-auditlog-entry");
    const loginCount = await loginEntries.count();
    for (let i = 0; i < loginCount; i += 1) {
      await expect(
        loginEntries.nth(i).locator(".sucuriscan-auditlog-entry-title"),
      ).toContainText("User authentication succeeded");
    }

    await page.click("[data-cy=sucuriscan_auditlogs_clear_filter_button]");

    await page.selectOption("#plugins", { label: "Activated" });
    await page.selectOption("#logins", { label: "Succeeded" });
    await page.click("[data-cy=sucuriscan_auditlogs_filter_button]");

    await page.waitForTimeout(3000);

    const combinedEntries = page.locator(".sucuriscan-auditlog-entry");
    const combinedCount = await combinedEntries.count();
    for (let i = 0; i < combinedCount; i += 1) {
      const text = await combinedEntries
        .nth(i)
        .locator(".sucuriscan-auditlog-entry-title")
        .innerText();
      expect(text).toMatch(/Plugin activated|User authentication succeeded/);
    }

    await page.click("[data-cy=sucuriscan_auditlogs_clear_filter_button]");

    await page.selectOption("#time", { label: "Last 7 Days" });
    await page.selectOption("#logins", { label: "Succeeded" });
    await page.click("[data-cy=sucuriscan_auditlogs_filter_button]");

    const timeEntries = page.locator(".sucuriscan-auditlog-entry");
    const timeCount = await timeEntries.count();
    for (let i = 0; i < timeCount; i += 1) {
      const text = await timeEntries
        .nth(i)
        .locator(".sucuriscan-auditlog-entry-title")
        .innerText();
      expect(text).toMatch(/User authentication succeeded/);
    }

    await page.click("[data-cy=sucuriscan_auditlogs_clear_filter_button]");
    await page.waitForTimeout(200);
  });
});
