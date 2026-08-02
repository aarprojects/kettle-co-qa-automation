import { test } from '../../src/fixtures/base';
import { expectMoneyEqual } from '../../src/utils/money';

// The displayed Subtotal must equal the sum of the line items;
// getLineItemsTotal() recomputes that sum independently.
test.describe('Cart subtotal', () => {
  test('displayed Subtotal equals the sum of every line item', async ({ shopPage }) => {
    test.fail(true, 'the app currently under-counts the displayed Subtotal once the cart has 3+ products');
    const inStock = await shopPage.getInStockProductCards();
    test.skip(inStock.length < 3, 'Need at least 3 distinct in-stock products to exercise this case.');

    await inStock[0].addToCart();
    await inStock[1].addToCart();
    await inStock[2].addToCart();

    const drawer = await shopPage.openCart();
    const lineItemsTotal = await drawer.getLineItemsTotal();
    const displayedSubtotal = await drawer.getSubtotal();

    expectMoneyEqual(displayedSubtotal, lineItemsTotal, /* toleranceCents */ 0);
  });
});
