const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Post-Hack - Keys", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can update the secret keys", async ({ page }) => {
    await page.goto(
      "http://localhost:8889/wp-admin/admin.php?page=sucuriscan_post_hack_actions",
    );

    await page.click("[data-cy=sucuriscan_security_keys_checkbox]");
    await page.click("[data-cy=sucuriscan_security_keys_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Secret keys updated successfully (summary of the operation bellow).",
    );

    await page.waitForTimeout(3000);
    await page.reload();

    await page.context().clearCookies();
    await login(page);

    await page.goto(
      "http://localhost:8889/wp-admin/admin.php?page=sucuriscan_post_hack_actions",
    );

    await expect(
      page.locator("[data-cy=sucuriscan_security_keys_autoupdater]"),
    ).toContainText("Automatic Secret Keys Updater — Disabled");

    await page.selectOption(
      "[data-cy=sucuriscan_security_keys_autoupdater_select]",
      {
        label: "Quarterly",
      },
    );
    await page.click("[data-cy=sucuriscan_security_keys_autoupdater_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Automatic Secret Keys Updater enabled.",
    );
    await expect(
      page.locator("[data-cy=sucuriscan_security_keys_autoupdater]"),
    ).toContainText("Automatic Secret Keys Updater — Enabled");

    await page.selectOption(
      "[data-cy=sucuriscan_security_keys_autoupdater_select]",
      {
        label: "Disabled",
      },
    );
    await page.click("[data-cy=sucuriscan_security_keys_autoupdater_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Automatic Secret Keys Updater disabled.",
    );
  });
});
