import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ShopPage } from '../pages/ShopPage';
import { TEST_DATA } from './test-data';

type AppFixtures = {
  loginPage: LoginPage;
  shopPage: ShopPage;
};

// Wires the page objects into test(). shopPage logs in first: the app keeps
// no auth state in storage or cookies, so a saved-session (storageState)
// setup can't work here, every test does a real login of its own.
export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  shopPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login(TEST_DATA.validUser.email, TEST_DATA.validUser.password);
    const shop = new ShopPage(page);
    await shop.waitForCatalogLoaded();
    await use(shop);
  },
});

export { expect } from '@playwright/test';
