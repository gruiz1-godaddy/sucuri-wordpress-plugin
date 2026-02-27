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
    await page.route(/\/wp-admin\/admin-ajax\.php/, async (route) => {
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
    });

    await page.goto(
      "/wp-admin/admin.php?page=sucuriscan_events_reporting#auditlogs",
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
    await page.route(/\/wp-admin\/admin-ajax\.php/, async (route) => {
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

      await route.fallback();
    });

    await page.goto(
      "/wp-admin/admin.php?page=sucuriscan_events_reporting#auditlogs",
    );

    await expect(page.locator(".sucuriscan-auditlog-response")).toBeVisible();
    await expect(page.locator(".sucuriscan-auditlog-entry")).toHaveCount(1);

    await page.selectOption("#plugins", { label: "Activated" });
    await page.click("[data-cy=sucuriscan_auditlogs_filter_button]");

    await expect(
      page.locator(".sucuriscan-auditlog-entry-title"),
    ).toContainText("Plugin activated");

    await page.click("[data-cy=sucuriscan_auditlogs_clear_filter_button]");
    await page.waitForTimeout(200);

    await page.selectOption("#logins", { label: "Succeeded" });
    await page.click("[data-cy=sucuriscan_auditlogs_filter_button]");

    await expect(
      page.locator(".sucuriscan-auditlog-entry-title"),
    ).toContainText("User authentication succeeded");

    await page.click("[data-cy=sucuriscan_auditlogs_clear_filter_button]");

    await page.selectOption("#plugins", { label: "Activated" });
    await page.selectOption("#logins", { label: "Succeeded" });
    await page.click("[data-cy=sucuriscan_auditlogs_filter_button]");

    await page.waitForTimeout(3000);

    const combinedText = await page
      .locator(".sucuriscan-auditlog-entry-title")
      .innerText();
    expect(combinedText).toMatch(
      /Plugin activated|User authentication succeeded/,
    );

    await page.click("[data-cy=sucuriscan_auditlogs_clear_filter_button]");

    await page.selectOption("#time", { label: "Last 7 Days" });
    await page.selectOption("#logins", { label: "Succeeded" });
    await page.click("[data-cy=sucuriscan_auditlogs_filter_button]");

    await expect(
      page.locator(".sucuriscan-auditlog-entry-title"),
    ).toContainText("User authentication succeeded");

    await page.click("[data-cy=sucuriscan_auditlogs_clear_filter_button]");
    await page.waitForTimeout(200);
  });
});
