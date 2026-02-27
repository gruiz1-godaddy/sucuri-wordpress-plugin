const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Post-Hack - Password Reset", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can reset password", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");

    await page.goto("/wp-login.php");
    await page.fill("#user_login", "sucuri-reset");
    await page.fill("#user_pass", "password");
    await page.click("#wp-submit");

    await context.clearCookies();
    await login(page);

    await page.goto(
      "http://localhost:8889/wp-admin/admin.php?page=sucuriscan_post_hack_actions",
    );

    await page
      .locator(".sucuriscan-reset-password-table")
      .getByText("sucuri-reset")
      .locator("..")
      .locator('input[type="checkbox"]')
      .check({ force: true });
    await page.click("[data-cy=sucuriscan-reset-password-button]");

    await expect(
      page.locator("[data-cy=sucuriscan-reset-password-user-field]"),
    ).toContainText("sucuri-reset (Done)");

    await context.clearCookies();
    await page.goto("/wp-login.php");
    await page.fill("#user_login", "sucuri-reset");
    await page.fill("#user_pass", "password");
    await page.click("#wp-submit");

    await expect(page.locator("#login_error")).toContainText(
      "The password you entered for the username sucuri-reset is incorrect.",
    );
  });
});
