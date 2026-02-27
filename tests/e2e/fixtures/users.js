const adminUser = {
  login: process.env.WP_USER || "admin",
  pass: process.env.WP_PASS || "password",
};

const testAdminUser = {
  login: process.env.TEST_ADMIN_USER || "sucuri-admin",
  pass: process.env.TEST_ADMIN_PASS || "password",
};

const extraUser = {
  login: process.env.EXTRA_USER || "sucuri",
  pass: process.env.EXTRA_USER_PASS || "password",
};

module.exports = {
  adminUser,
  testAdminUser,
  extraUser,
};
