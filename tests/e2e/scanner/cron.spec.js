const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Scanner - Cron", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can modify scheduled tasks", async ({ page }) => {
    await page.goto("wp-admin/admin.php?page=sucuriscan_settings#scanner");

    await page.click('input[value="wp_update_plugins"]');
    await page.selectOption("[data-cy=sucuriscan_cronjobs_select]", {
      label: "Quarterly (every 7776000 seconds)",
    });
    await page.click("[data-cy=sucuriscan_cronjobs_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "1 tasks has been re-scheduled to run quarterly.",
    );

    await expect(
      page.locator(
        "[data-cy=sucuriscan_row_wp_update_plugins] td:nth-child(3)",
      ),
    ).toContainText("quarterly");
  });
});
