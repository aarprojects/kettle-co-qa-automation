import { test, expect } from '../../src/fixtures/base';
import { expectMoneyEqual, round2 } from '../../src/utils/money';

// Core cart math on completely normal usage. No beforeEach: the shopPage
// fixture already logs in and lands on a loaded catalog.
test.describe('Add to cart', () => {
  test('adding an item shows the correct quantity and line total in the cart', async ({ shopPage }) => {
    const inStock = await shopPage.getInStockProductCards();
    expect(inStock.length, 'need at least one in-stock product to run this test').toBeGreaterThan(0);

    const card = inStock[0];
    const name = await card.getName();
    const price = await card.getPrice();
    await card.addToCart();

    const drawer = await shopPage.openCart();
    expect(await drawer.getQuantity(name)).toBe(1);
    expectMoneyEqual(await drawer.getSubtotal(), round2(price));
  });

  test('cart total always equals subtotal + shipping + tax', async ({ shopPage }) => {
    const cards = await shopPage.getAllProductCards();
    await cards[0].addToCart();
    await cards[1].addToCart();

    const drawer = await shopPage.openCart();
    const [subtotal, shipping, tax, total] = await Promise.all([
      drawer.getSubtotal(),
      drawer.getShipping(),
      drawer.getTax(),
      drawer.getTotal(),
    ]);

    expectMoneyEqual(total, round2(subtotal + shipping + tax));
  });
});
