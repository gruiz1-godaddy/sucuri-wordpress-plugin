const { test, expect } = require("@playwright/test");
const { adminUser, testAdminUser, extraUser } = require("../fixtures/users");
const {
  login,
  loginExpecting2fa,
  finishWithCode,
  extractSecretFromSetupPage,
  cacheTotpSecret,
} = require("../helpers/wp-auth");
const { totpNow } = require("../helpers/totp");

async function go2faPage(page) {
  await page.goto("/wp-admin/admin.php?page=sucuriscan_2fa");
}

async function setModeAllUsers(page, mode = "activate_all") {
  await go2faPage(page);
  await page.selectOption(
    "[data-cy=sucuriscan_twofactor_bulk_control] select",
    mode,
  );
  await page.click(
    "[data-cy=sucuriscan_twofactor_bulk_control] input[type=submit]",
  );
  await expect(
    page.locator(".sucuriscan-alert, .updated, .notice"),
  ).toContainText("Two-Factor");
}

async function setModeSelectedUsersFor(
  page,
  users,
  mode = "activate_selected",
) {
  await go2faPage(page);

  await page.check('[data-cy="twofactor-user-checkbox-1"]', { force: true });
  await page.selectOption(
    "[data-cy=sucuriscan_twofactor_bulk_control] select",
    "deactivate_all",
  );
  await page.click(
    "[data-cy=sucuriscan_twofactor_bulk_control] input[type=submit]",
  );

  for (const user of users) {
    await page
      .locator("table tr", { hasText: user.login })
      .locator('input[name="sucuriscan_twofactor_users[]"]')
      .check({ force: true });
  }

  await page.selectOption(
    "[data-cy=sucuriscan_twofactor_bulk_control] select",
    mode,
  );
  await page.click(
    "[data-cy=sucuriscan_twofactor_bulk_control] input[type=submit]",
  );
}

async function resetForSelectedUsers(page, users) {
  await go2faPage(page);
  for (const user of users) {
    await page
      .locator("table tr", { hasText: user.login })
      .locator('input[name="sucuriscan_twofactor_users[]"]')
      .check({ force: true });
  }
  await page.selectOption(
    "[data-cy=sucuriscan_twofactor_bulk_control] select",
    "reset_selected",
  );
  await page.click(
    "[data-cy=sucuriscan_twofactor_bulk_control] input[type=submit]",
  );
}

async function completeSetupWithGeneratedCode(page, userLogin) {
  await expect(page.locator("code").first()).toBeVisible();
  const secret = await extractSecretFromSetupPage(page);
  const code = totpNow(secret);
  expect(code).toMatch(/^\d{6}$/);
  cacheTotpSecret(userLogin, secret);
  await finishWithCode(page, code);
  await expect(page).toHaveURL(/\/wp-admin\//);
  return secret;
}

test.describe.serial("Two-Factor Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("enforces 2FA for all users and completes verify with a valid code", async ({
    page,
  }) => {
    await login(page);

    await setModeAllUsers(page);

    await page
      .locator("table tr", { hasText: testAdminUser.login })
      .locator('input[name="sucuriscan_twofactor_users[]"]')
      .check({ force: true });
    await page.selectOption(
      "[data-cy=sucuriscan_twofactor_bulk_control] select",
      "reset_selected",
    );
    await page.click(
      "[data-cy=sucuriscan_twofactor_bulk_control] input[type=submit]",
    );

    await loginExpecting2fa(page, testAdminUser, "setup");
    await completeSetupWithGeneratedCode(page, testAdminUser.login);

    await loginExpecting2fa(page, testAdminUser, "verify");
    await loginExpecting2fa(page, extraUser, "setup");

    await login(page);

    await go2faPage(page);
    await setModeAllUsers(page, "deactivate_all");
    await resetForSelectedUsers(page, [testAdminUser]);
  });

  test("enforces 2FA for selected users and completes setup for a non-admin user", async ({
    page,
  }) => {
    await login(page);

    await setModeSelectedUsersFor(page, [extraUser]);

    await loginExpecting2fa(page, extraUser, "setup");
    await completeSetupWithGeneratedCode(page, extraUser.login);

    await loginExpecting2fa(page, extraUser, "verify");
    await finishWithCode(page, "000000");
    await expect(page.locator("#login_error")).toContainText("Invalid");

    await login(page);

    await go2faPage(page);

    await setModeAllUsers(page, "deactivate_all");
    await resetForSelectedUsers(page, [extraUser]);

    await login(page, extraUser);
  });

  test("resets 2FA from Profile page for non-admin user", async ({ page }) => {
    await login(page);

    await setModeSelectedUsersFor(page, [extraUser], "activate_selected");

    await loginExpecting2fa(page, extraUser, "setup");
    await completeSetupWithGeneratedCode(page, extraUser.login);

    await page.goto("/wp-admin/profile.php");
    await expect(
      page.locator('[data-cy="sucuriscan-2fa-status-text"]'),
    ).toContainText("Two-Factor Authentication is enabled for this account.");

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain(
        "This will disable two-factor for this user. Continue?",
      );
      await dialog.accept();
    });

    await page.click('[data-cy="sucuriscan-2fa-reset-btn"]');

    await expect(page.locator("code").first()).toBeVisible();
    await expect(page.locator("#sucuriscan-topt-qr")).toBeVisible();

    await login(page);

    await setModeAllUsers(page, "reset_all");
  });

  test("reset_selected forces re-setup only for the chosen user (selected mode)", async ({
    page,
  }) => {
    await login(page);

    await setModeSelectedUsersFor(
      page,
      [extraUser, testAdminUser],
      "activate_selected",
    );

    await loginExpecting2fa(page, extraUser, "setup");
    await completeSetupWithGeneratedCode(page, testAdminUser.login);

    await loginExpecting2fa(page, testAdminUser, "setup");
    await completeSetupWithGeneratedCode(page, testAdminUser.login);

    await login(page);

    await go2faPage(page);

    await page
      .locator("table tr", { hasText: extraUser.login })
      .locator('input[name="sucuriscan_twofactor_users[]"]')
      .check({ force: true });
    await page.selectOption(
      "[data-cy=sucuriscan_twofactor_bulk_control] select",
      "reset_selected",
    );
    await page.click(
      "[data-cy=sucuriscan_twofactor_bulk_control] input[type=submit]",
    );

    await loginExpecting2fa(page, extraUser, "setup");
    await loginExpecting2fa(page, testAdminUser, "verify");

    await login(page);

    await setModeAllUsers(page, "reset_all");
  });

  test("non-selected user bypasses 2FA when only another user is enforced", async ({
    page,
  }) => {
    await login(page);

    await setModeAllUsers(page, "reset_all");
    await setModeSelectedUsersFor(page, [extraUser], "activate_selected");

    await login(page, adminUser);

    await loginExpecting2fa(page, extraUser, "setup");
  });

  test("activates 2fa for all users and disables it again", async ({
    page,
  }) => {
    await login(page);

    await setModeAllUsers(page);

    await loginExpecting2fa(page, adminUser, "verify");

    await completeSetupWithGeneratedCode(page, adminUser.login);

    await setModeAllUsers(page, "deactivate_all");
    await resetForSelectedUsers(page, [adminUser]);

    await login(page, adminUser);
  });

  test("locks out after 5 invalid verification attempts", async ({ page }) => {
    await login(page);

    await setModeAllUsers(page, "reset_all");
    await setModeSelectedUsersFor(page, [extraUser], "activate_selected");

    await loginExpecting2fa(page, extraUser, "setup");

    const secret = await extractSecretFromSetupPage(page);
    const code = totpNow(secret);
    await finishWithCode(page, code);
    await expect(page).toHaveURL(/\/wp-admin\//);

    await loginExpecting2fa(page, extraUser, "verify");

    for (let i = 0; i < 5; i += 1) {
      await finishWithCode(page, "111111");
      if (i < 4) {
        await expect(page.locator("#login_error")).toContainText("Invalid");
        await expect(page).toHaveURL(/action=sucuri-2fa/);
      }
    }

    await expect(page).toHaveURL(/wp-login\.php/);
    expect(page.url()).not.toContain("action=sucuri-2fa");
    await expect(page.locator("#user_login")).toBeVisible();

    await login(page);

    await setModeAllUsers(page, "reset_all");
  });

  test("verify flow rejects a replayed TOTP code in same timestep", async ({
    page,
  }) => {
    await login(page);

    await setModeSelectedUsersFor(page, [testAdminUser], "activate_selected");

    await loginExpecting2fa(page, testAdminUser, "setup");

    const secret = await extractSecretFromSetupPage(page);
    const code = totpNow(secret);
    await finishWithCode(page, code);
    await expect(page).toHaveURL(/\/wp-admin\//);

    await loginExpecting2fa(page, testAdminUser, "verify");
    await finishWithCode(page, code);

    await expect(page.locator("#login_error")).toContainText("Invalid");
    await expect(page).toHaveURL(/action=sucuri-2fa/);

    await login(page);

    await setModeAllUsers(page, "deactivate_all");
  });

  test("reset_everything wipes all 2FA secrets and disables enforcement (no challenges after)", async ({
    page,
  }) => {
    await login(page);

    await setModeAllUsers(page, "reset_all");
    await setModeAllUsers(page);

    await loginExpecting2fa(page, testAdminUser, "setup");
    await completeSetupWithGeneratedCode(page, testAdminUser.login);

    await loginExpecting2fa(page, extraUser, "setup");
    await completeSetupWithGeneratedCode(page, extraUser.login);

    await login(page);
    await go2faPage(page);

    await page.selectOption(
      "[data-cy=sucuriscan_twofactor_bulk_control] select",
      "reset_everything",
    );
    await page.click(
      "[data-cy=sucuriscan_twofactor_bulk_control] input[type=submit]",
    );
    await expect(
      page.locator(".sucuriscan-alert, .updated, .notice"),
    ).toContainText("All Two-Factor data deleted");

    async function expectNormalLogin(user) {
      await page.context().clearCookies();

      await page.goto("/wp-login.php");
      await page.fill("#user_login", user.login);
      await page.fill("#user_pass", user.pass);
      await page.click("#wp-submit");

      await expect(page).toHaveURL(/\/wp-admin\//);
      expect(page.url()).not.toContain("sucuri-2fa");
    }

    await expectNormalLogin(testAdminUser);
    await expectNormalLogin(extraUser);

    await login(page);
    await go2faPage(page);
    await expect(page.getByText("Deactivated")).toBeVisible();
  });

  test("enforces 2FA for all users from sucuri dashboard", async ({ page }) => {
    await login(page, testAdminUser);

    await setModeAllUsers(page, "reset_all");

    await go2faPage(page);

    const secret = await extractSecretFromSetupPage(page);
    const code = totpNow(secret);
    expect(code).toMatch(/^\d{6}$/);
    await page.click("[name=sucuriscan_2fa_enforce_all]", { force: true });
    await finishWithCode(page, code);
    await expect(page).toHaveURL(/\/wp-admin\//);

    await loginExpecting2fa(page, testAdminUser, "verify");
    await loginExpecting2fa(page, extraUser, "setup");
    await loginExpecting2fa(page, adminUser, "setup");
  });
});
