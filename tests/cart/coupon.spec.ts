import { test, expect } from '../../src/fixtures/base';
import { TEST_DATA } from '../../src/fixtures/test-data';
import { expectMoneyEqual, round2 } from '../../src/utils/money';

// The coupon renders as its own "Discount (SAVE10)" row, so:
// Total = Subtotal - Discount + Shipping + Tax. Carts stay at 2 items here;
// bigger carts are covered in subtotal.spec.ts.
test.describe('Coupons', () => {
  // Cart setup shared by every test in this file.
  test.beforeEach(async ({ shopPage }) => {
    const cards = await shopPage.getAllProductCards();
    await cards[0].addToCart();
    await cards[1].addToCart();
  });

  test('discount equals the advertised percentage of the actual subtotal', async ({ shopPage }) => {
    const drawerBefore = await shopPage.openCart();
    const lineItemsTotal = await drawerBefore.getLineItemsTotal();
    await drawerBefore.close();

    await shopPage.applyCoupon(TEST_DATA.coupons.valid);

    const drawerAfter = await shopPage.openCart();
    const discount = await drawerAfter.getDiscount();

    expectMoneyEqual(discount, round2(lineItemsTotal * TEST_DATA.coupons.validDiscountFraction), /* toleranceCents */ 1);
  });

  test('total reconciles as subtotal - discount + shipping + tax', async ({ shopPage }) => {
    await shopPage.applyCoupon(TEST_DATA.coupons.valid);

    const drawer = await shopPage.openCart();
    const [subtotal, discount, shipping, tax, total] = await Promise.all([
      drawer.getSubtotal(),
      drawer.getDiscount(),
      drawer.getShipping(),
      drawer.getTax(),
      drawer.getTotal(),
    ]);

    expectMoneyEqual(total, round2(subtotal - discount + shipping + tax));
  });

  test('an invalid coupon does not change the total or add a discount row', async ({ shopPage }) => {
    const drawer = await shopPage.openCart();
    const totalBefore = await drawer.getTotal();
    await drawer.close();

    await shopPage.applyCoupon(TEST_DATA.coupons.invalid);

    const drawerAfter = await shopPage.openCart();
    expect(await drawerAfter.getDiscount()).toBe(0);
    expectMoneyEqual(await drawerAfter.getTotal(), totalBefore);
  });
});
