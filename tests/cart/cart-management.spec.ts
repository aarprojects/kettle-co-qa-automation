import { test, expect } from '../../src/fixtures/base';
import { expectMoneyEqual, round2 } from '../../src/utils/money';

// No beforeEach: the shopPage fixture already logs in and loads the catalog.
test.describe('Cart management', () => {
  test('removing an item drops it from the cart and recalculates the total', async ({ shopPage }) => {
    const cards = await shopPage.getAllProductCards();
    const [first, second] = cards;
    const firstName = await first.getName();
    const secondPrice = await second.getPrice();

    await first.addToCart();
    await second.addToCart();

    const drawer = await shopPage.openCart();
    await drawer.remove(firstName);

    const remaining = await drawer.getLineItemNames();
    expect(remaining.some((l) => l.includes(firstName))).toBe(false);
    expectMoneyEqual(await drawer.getSubtotal(), round2(secondPrice));
  });
});
