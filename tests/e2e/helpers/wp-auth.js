const { expect } = require("@playwright/test");
const { adminUser } = require("../fixtures/users");

async function login(page, user = adminUser) {
  await page.context().clearCookies();
  await page.goto("/wp-login.php");
  await page.fill("#user_login", user.login);
  await page.fill("#user_pass", user.pass);
  await page.click("#wp-submit");
  await expect(page).toHaveURL(/\/wp-admin\//);
}

async function loginExpecting2fa(
  page,
  user,
  expected = "verify",
  { fresh = true } = {},
) {
  if (fresh) {
    await page.context().clearCookies();
  }

  await page.goto("/wp-login.php");
  await page.fill("#user_login", user.login);
  await page.fill("#user_pass", user.pass);
  await page.click("#wp-submit");

  if (expected === "setup") {
    await expect(page).toHaveURL(/action=sucuri-2fa-setup/);
    await expect(
      page.getByText("Set up Two-Factor Authentication"),
    ).toBeVisible();
  } else {
    await expect(page).toHaveURL(/action=sucuri-2fa/);
    await expect(page.getByText("Two-Factor Authentication")).toBeVisible();
  }
}

async function finishWithCode(page, code) {
  await page.fill('[name="sucuriscan_totp_code"]', code);
  await page.click("#sucuriscan-totp-submit");
}

async function extractSecretFromSetupPage(page) {
  const codeText = await page.locator("code").first().textContent();
  return (codeText || "").trim();
}

module.exports = {
  login,
  loginExpecting2fa,
  finishWithCode,
  extractSecretFromSetupPage,
};
