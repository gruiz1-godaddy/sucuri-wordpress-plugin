const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Settings - API Service", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can toggle api service communication", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#apiservice");

    await page.click("[data-cy=sucuriscan_api_status_toggle]");
    await expect(
      page.locator("[data-cy=sucuriscan_api_status_toggle]"),
    ).toContainText("Enable");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The status of the API service has been changed",
    );

    await page.click("[data-cy=sucuriscan_api_status_toggle]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The status of the API service has been changed",
    );
    await expect(
      page.locator("[data-cy=sucuriscan_api_status_toggle]"),
    ).toContainText("Disable");
  });

  test("can update the wordpress checksum api ", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#apiservice");

    await page.fill(
      "[data-cy=sucuriscan_wordpress_checksum_api_input]",
      "https://api.wordpress.org/core/checksums/1.0/?version=5.5.1&locale=es_ES",
    );
    await page.click("[data-cy=sucuriscan_wordpress_checksum_api_submit]");

    await expect(page.locator(".updated")).toContainText(
      "The URL to retrieve the WordPress checksums has been changed",
    );
  });
});
