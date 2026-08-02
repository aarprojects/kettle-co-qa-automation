import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProductCard } from '../components/ProductCard';
import { CartDrawer } from '../components/CartDrawer';

// The product catalog page (the landing page after login). The app has no
// data-testid hooks, so every locator here is role- or text-based.
export class ShopPage extends BasePage {
  private readonly cart: CartDrawer;

  constructor(page: Page) {
    super(page);
    this.cart = new CartDrawer(page);
  }

  // The coupon widget lives inside an iframe (#promo). Locators don't cross
  // into frames on their own, so these go through frameLocator.
  private readonly promoFrame = this.page.frameLocator('#promo');
  private readonly couponInput = this.promoFrame.getByPlaceholder('Coupon');
  private readonly applyCouponButton = this.promoFrame.getByRole('button', { name: /^apply$/i });
  private readonly productsFoundText = this.page.getByText(/\d+ products? found/i);
  private readonly viewCartButton = this.page.getByRole('button', { name: /view cart/i });

  async waitForCatalogLoaded(timeoutMs = 10_000): Promise<void> {
    await expect(this.productsFoundText).toBeVisible({ timeout: timeoutMs });
  }

  async applyCoupon(code: string): Promise<void> {
    await this.couponInput.fill(code);
    await this.applyCouponButton.click();
  }

  // Each product card is an <article> element.
  async getAllProductCards(): Promise<ProductCard[]> {
    const articles = await this.page.locator('article').all();
    return articles.map((a) => new ProductCard(a));
  }

  async getInStockProductCards(): Promise<ProductCard[]> {
    const cards = await this.getAllProductCards();
    const outOfStock = await Promise.all(cards.map((c) => c.isOutOfStock()));
    return cards.filter((_, i) => !outOfStock[i]);
  }

  // Header cart icon ("Open cart") is always there; the footer "View cart"
  // bar only shows once the cart has items.
  async openCart(): Promise<CartDrawer> {
    await this.page.getByRole('button', { name: 'Open cart' }).or(this.viewCartButton).first().click();
    await this.cart.waitForOpen();
    return this.cart;
  }
}
