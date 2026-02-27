const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Settings - Webinfo", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can load website info OK", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#webinfo");

    const abspathRow = page.locator("[data-cy=ABSPATH]");
    await expect(abspathRow.locator("td").first()).toContainText("ABSPATH");
    await expect(abspathRow.locator("td").last()).toContainText(
      "/var/www/html/",
    );

    await expect(
      page.locator("[data-cy=sucuriscan_access_file_integrity]"),
    ).toContainText(
      "Your website has no .htaccess file or it was not found in the default location.",
    );
  });
});
