import { test, expect } from '../../src/fixtures/base';
import { TEST_DATA } from '../../src/fixtures/test-data';
import { ShopPage } from '../../src/pages/ShopPage';

// Drives LoginPage directly, the shopPage fixture does its own login and
// would layer a second one on top. Nothing is reachable if this breaks.
test.describe('Login', () => {
  test('valid credentials reach the product catalog', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.login(TEST_DATA.validUser.email, TEST_DATA.validUser.password);
    await new ShopPage(page).waitForCatalogLoaded();
  });

  test('invalid credentials do not grant access', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.login(TEST_DATA.invalidUser.email, TEST_DATA.invalidUser.password);
    // Error copy not pinned down yet, so assert the contract that matters:
    // the user must not reach the authenticated catalog.
    await expect(page.getByText(/products? found/i)).not.toBeVisible({ timeout: 5_000 });
  });
});
