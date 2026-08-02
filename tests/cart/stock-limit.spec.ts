import { test, expect } from '../../src/fixtures/base';

// Targets whichever product shows "Only N left", the one case where the
// real stock limit is known up front.
test.describe('Stock-limit enforcement', () => {
  test('cart quantity cannot be incremented past the advertised stock limit', async ({ shopPage }) => {
    test.fail(true, 'the app currently allows incrementing past the advertised stock');
    const cards = await shopPage.getAllProductCards();
    let lowStockCard: (typeof cards)[number] | null = null;
    let stockLimit: number | null = null;
    for (const card of cards) {
      const count = await card.getLowStockCount();
      if (count !== null) {
        lowStockCard = card;
        stockLimit = count;
        break;
      }
    }
    test.skip(
      !lowStockCard || stockLimit === null,
      'No "Only N left" product currently in the catalog to exercise this case.',
    );

    const name = await lowStockCard!.getName();
    await lowStockCard!.addToCart(); // quantity starts at 1

    const drawer = await shopPage.openCart();
    for (let i = 1; i < stockLimit!; i++) {
      await drawer.increment(name);
    }
    expect(await drawer.getQuantity(name), 'should be able to reach exactly the advertised stock limit').toBe(stockLimit);

    // One more click should be refused, not silently allowed.
    await drawer.increment(name);
    expect(
      await drawer.getQuantity(name),
      `stepper allowed ordering more than the ${stockLimit} units in stock`,
    ).toBe(stockLimit);
  });
});
