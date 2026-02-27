const { test, expect } = require("@playwright/test");
const { adminUser } = require("../fixtures/users");
const { login } = require("../helpers/wp-auth");

test.describe("Dashboard WAF Modal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("WAF API Key modal appears only on Dashboard, dismisses once, and CTA navigates to WAF", async ({
    page,
  }) => {
    const wafModalSelector = ".sucuriscan-activate-your-waf-key-modal-modal";

    await page.context().clearCookies();
    await login(page, adminUser);
    await page.context().addCookies([
      {
        name: "sucuriscan_waf_dismissed",
        value: "0",
        url: page.url() || "http://localhost:8889/",
      },
    ]);

    await page.goto("/wp-admin/admin.php?page=sucuriscan");
    await page.context().addCookies([
      {
        name: "sucuriscan_waf_dismissed",
        value: "0",
        url: page.url() || "http://localhost:8889/",
      },
    ]);

    await expect(page.locator(wafModalSelector)).toBeVisible();
    await page.click('[data-cy="sucuriscan-waf-modal-main-action"]');
    await expect(page).toHaveURL(/page=sucuriscan_firewall/);

    await page.goto("/wp-admin/admin.php?page=sucuriscan_2fa");
    await page.reload();
    await expect(page.locator(wafModalSelector)).toHaveCount(0);

    await page.goto("/wp-admin/admin.php?page=sucuriscan_firewall");
    await page.reload();
    await expect(page.locator(wafModalSelector)).toHaveCount(0);

    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings");
    await page.reload();
    await expect(page.locator(wafModalSelector)).toHaveCount(0);

    await page.goto("/wp-admin/admin.php?page=sucuriscan");
    await expect(page.locator(wafModalSelector)).toHaveCount(0);
  });
});
