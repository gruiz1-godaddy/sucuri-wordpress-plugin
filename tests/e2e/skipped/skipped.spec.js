const { test } = require("@playwright/test");

test.describe("Skipped Cypress parity", () => {
  test.skip("can toggle hardening options", async () => {});

  test.skip("can reset installed plugins", async () => {});

  test.skip("can see last logins tab and delete last logins file", async () => {});
});
