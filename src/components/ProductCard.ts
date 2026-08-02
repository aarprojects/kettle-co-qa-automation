import { Locator, expect } from '@playwright/test';
import { parseMoney } from '../utils/money';

// One product card. Each card is scoped to its own container, so a button
// on this card never matches the same button on another card.
export class ProductCard {
  constructor(private readonly root: Locator) {}

  private get name(): Locator {
    return this.root.getByRole('heading').first();
  }

  private get addToCartButton(): Locator {
    return this.root.getByRole('button', { name: /add to cart/i });
  }

  async getName(): Promise<string> {
    return (await this.name.textContent())?.trim() ?? '';
  }

  async getPrice(): Promise<number> {
    const text = await this.root.getByText(/^\$\d/).first().textContent();
    return parseMoney(text ?? '');
  }

  private async getStockLabel(): Promise<string> {
    const label = this.root.getByText(/^(in stock|only \d+ left|out of stock)$/i).first();
    if (!(await label.count())) return '';
    return (await label.textContent())?.trim() ?? '';
  }

  async isOutOfStock(): Promise<boolean> {
    return (await this.getStockLabel()).toLowerCase().includes('out of stock');
  }

  // "Only N left" is the only label that tells us the real stock number.
  async getLowStockCount(): Promise<number | null> {
    const label = await this.getStockLabel();
    const match = label.match(/only (\d+) left/i);
    return match ? Number.parseInt(match[1], 10) : null;
  }

  // The footer bar at the bottom of the screen can sit on top of a card
  // and steal its click. Scroll the button to the middle of the screen
  // first so nothing covers it.
  private async scrollToCenter(): Promise<void> {
    await this.addToCartButton.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  }

  async addToCart(): Promise<void> {
    await expect(this.addToCartButton, 'Expected an enabled Add to Cart button (item may be out of stock)').toBeEnabled();
    await this.scrollToCenter();
    await this.addToCartButton.click();
  }
}
