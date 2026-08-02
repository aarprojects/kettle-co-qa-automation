# Kettle & Co QA Automation

Playwright + TypeScript suite for [demo-shop-pearl.vercel.app](https://demo-shop-pearl.vercel.app/), built as a first pass at stability/reliability coverage for a team with no existing QA process.

## Scope

10 tests covering the money path: login, cart math, coupons including `SAVE10`, and stock limits. All 10 run on desktop (Chromium/Firefox/WebKit) and mobile device emulation (Pixel 7, iPhone 14), since the brief calls out mobile-specific interactions.

There's a longer list of things I deliberately didn't automate: search,
favorites, checkout (it's not actually implemented in the app), the
free-shipping progress bar (partly impossible to automate - more on that
below), and anything that crosses multiple features. The way I drew the
line: one simple test per money invariant, one guard per real bug
I found, nothing that duplicates a test I already have, and no multi-feature
flows in this first pass. I'm happy to walk through the reasoning behind
each of those calls in the review - a lot of it came down to "would this
actually catch something, or am I just adding tests for the sake of
coverage."

## Why these 10

My bar for including a test: does it block someone from checking out, cost
real money if it's wrong, or block login entirely. Two of the ten currently
fail against the live app (see Known issues below), so I marked them with
`test.fail()` - the run still shows green overall, each shows up as an
"expected failure," and if that behavior ever gets fixed the test flips red,
which is my signal to go remove the marker.

| # | File | Test |
|---|---|---|
| 1 | `tests/auth/login.spec.ts` | valid credentials reach the catalog |
| 2 | `tests/auth/login.spec.ts` | invalid credentials are denied |
| 3 | `tests/cart/add-to-cart.spec.ts` | correct quantity and line total on add |
| 4 | `tests/cart/add-to-cart.spec.ts` | total = subtotal + shipping + tax |
| 5 | `tests/cart/cart-management.spec.ts` | removing an item recalculates the total |
| 6 | `tests/cart/subtotal.spec.ts` | displayed subtotal equals the sum of every line item |
| 7 | `tests/cart/stock-limit.spec.ts` | cart qty can't exceed advertised stock |
| 8 | `tests/cart/coupon.spec.ts` | total reconciles as subtotal - discount + shipping + tax |
| 9 | `tests/cart/coupon.spec.ts` | discount matches the advertised % of the actual subtotal |
| 10 | `tests/cart/coupon.spec.ts` | invalid coupon changes nothing |

Run them with `npm test`.

## Manual coverage
Some things I checked by hand instead of automating, since they work correctly, don't
touch money, and don't stop anyone from reaching checkout - so there's no real
regression risk that would justify a repeatable test:

- Category filtering, search, the favorites toggle, and the out-of-stock "Notify Me"
flow
- The product image zoom modal - the Zoom In/Out buttons work, though I did find
one bug there (see Known issues)
- Whether the catalog supports a long-press interaction
- Removing an applied coupon - the discount and total both revert correctly
- The modal close button - confirmed it closes the overlay on its own rather than
just happening to close as a side effect of something else
- Logout - turns out there's no logout control anywhere in the app, so there's
nothing to test there

## Framework

A few decisions worth calling out:

- Page objects (`LoginPage`, `ShopPage`) plus component objects
  (`ProductCard`, `CartDrawer`) that are scoped to a Locator instead of the
  whole page - keeps them reusable wherever that component shows up.
- The app doesn't use `data-testid` anywhere, so my locators are role- and
  text-based instead.
- Every money assertion checks a relationship (subtotal equals the sum of
  line items, total equals subtotal minus discount plus shipping plus tax)
  rather than a hard-coded dollar amount, so the tests don't break the
  moment a price changes.
- No persistent login setup. I checked, and the app doesn't keep any auth
  state in localStorage, sessionStorage, or cookies - there's genuinely
  nothing to save and reuse across tests. So instead of a shared login step,
  every test just logs in for itself through the `shopPage` fixture (see
  `src/fixtures/base.ts`).

```
├── playwright.config.ts        # 5 projects: chromium/firefox/webkit + Pixel 7/iPhone 14
├── .github/workflows/
│   └── playwright.yml          # 2-project gate on PR, full matrix on main + nightly
├── src/                        # framework - all DOM knowledge lives here
│   ├── pages/                  # BasePage, LoginPage, ShopPage
│   ├── components/             # ProductCard, CartDrawer (Locator-scoped)
│   ├── fixtures/               # base.ts (per-test login), test-data.ts
│   └── utils/                  # money.ts: parseMoney, expectMoneyEqual
└── tests/                      # specs only - business language, zero selectors
    ├── auth/                   # login.spec.ts
    └── cart/                   # add-to-cart, cart-management, coupon,
                                # subtotal, stock-limit
```

## Running it

```bash
npm install
npx playwright install --with-deps   # first time only

npm test                # everything, all 5 projects
npm run test:ui         # interactive mode
```

`BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, and `VALID_COUPON` are
all overridable through env vars (see `src/fixtures/test-data.ts`) - they
default to the live demo app.

## CI

The workflow at `.github/workflows/playwright.yml` runs a fast 2-project
gate (chromium + mobile-chrome) on every push and PR, then a full
regression across all 5 projects on pushes to main plus a nightly run.

## Known issues

These are bugs I found while building and running the suite against the
live app. The first two are why two of the ten tests report as expected
failures:

- With 3 or more distinct products in the cart, the displayed Subtotal
  stops summing correctly after the first two ($19.90 shown vs. $44.90
  actual). Tax and free-shipping eligibility inherit the same wrong number.
- The quantity stepper lets you increment past the advertised stock - a
  product listed as "Only 3 left" let me get to a quantity of 4.
- Zooming into the product image modal repeatedly pushes the Zoom In/Out
  controls and the title underneath the enlarged image, so only the close
  button stays reachable. Found this by hand - it's a layering bug, not
  something that risks money, so I didn't add a test for it.
- With a coupon applied, tax gets computed on the pre-discount subtotal
  instead of the discounted one. I confirmed this live: a $34.95 subtotal
  with `SAVE10` applied showed $2.80 in tax, which is 8% of $34.95 - not 8%
  of the discounted $31.45, which would be $2.52. My existing coupon
  reconciliation test doesn't catch this because it only checks that the
  total balances against whatever tax figure the app reports, not which
  subtotal that tax was actually computed from.
