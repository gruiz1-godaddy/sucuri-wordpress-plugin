const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/alerts/alerts.spec.js"],
  timeout: 30000,
  expect: {
    timeout: 30000,
  },
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:8889/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  reporter: [["list"]],
});
