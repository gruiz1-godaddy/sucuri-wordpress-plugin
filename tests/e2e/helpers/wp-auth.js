const { expect } = require("@playwright/test");
const { adminUser } = require("../fixtures/users");
const { totpNow } = require("../helpers/totp");

function getBaseUrl() {
  return process.env.E2E_BASE_URL || "http://localhost:8889/";
}

const totpSecrets = new Map();

function cacheTotpSecret(username, secret) {
  if (username && secret) {
    totpSecrets.set(username, secret);
  }
}

async function login(page, user = adminUser) {
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "sucuriscan_waf_dismissed",
      value: "1",
      url: getBaseUrl(),
    },
  ]);
  await page.goto("/wp-login.php");
  await page.fill("#user_login", user.login);
  await page.fill("#user_pass", user.pass);
  await page.click("#wp-submit");

  await page.waitForURL(/\/wp-admin\//, { timeout: 30000 }).catch(() => {});
  if (page.url().includes("action=sucuri-2fa-setup")) {
    await expect(
      page.getByText("Set up Two-Factor Authentication"),
    ).toBeVisible();
    const secret = await extractSecretFromSetupPage(page);
    const code = totpNow(secret);
    cacheTotpSecret(user.login, secret);
    await finishWithCode(page, code);
    await expect(page).toHaveURL(/\/wp-admin\//);
    return;
  }

  if (page.url().includes("action=sucuri-2fa")) {
    const secret = totpSecrets.get(user.login);
    if (!secret) {
      throw new Error(
        `No cached TOTP secret for ${user.login}; cannot complete 2FA verify.`,
      );
    }
    const code = totpNow(secret);
    await finishWithCode(page, code);
    await expect(page).toHaveURL(/\/wp-admin\//);
    return;
  }

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
    await page.context().addCookies([
      {
        name: "sucuriscan_waf_dismissed",
        value: "1",
        url: getBaseUrl(),
      },
    ]);
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
  cacheTotpSecret,
  login,
  loginExpecting2fa,
  finishWithCode,
  extractSecretFromSetupPage,
};
