// Env-overridable test data: credentials and coupon codes only. Prices and
// stock counts are read live from the UI.
export const TEST_DATA = {
  validUser: {
    email: process.env.TEST_USER_EMAIL ?? 'user@test.com',
    password: process.env.TEST_USER_PASSWORD ?? 'password123',
  },
  invalidUser: {
    email: 'nope@test.com',
    password: 'wrong-password',
  },
  coupons: {
    valid: process.env.VALID_COUPON ?? 'SAVE10',
    validDiscountFraction: 0.10,
    invalid: 'NOTAREALCODE99',
  },
};
