import { Page, Locator, expect } from '@playwright/test';
import { parseMoney } from '../utils/money';

// The "Shopping Cart" popup. Locators are getters so every call finds the
// element fresh, even after the drawer redraws.
export class CartDrawer {
  constructor(private readonly page: Page) {}

  // The app gives the drawer no dialog role, so start at the "Shopping Cart"
  // heading and walk up until we reach the box that holds the whole drawer,
  // not just the title bar.
  private get root(): Locator {
    return this.page
      .getByRole('heading', { name: /shopping cart/i })
      .locator('xpath=ancestor::*[position()<=4]')
      .filter({ hasText: /proceed to checkout|cart is empty/i })
      .last();
  }

  // A summary row like "Subtotal $9.95": the label and the amount sit
  // inside the same parent.
  private row(label: RegExp): Locator {
    return this.root.getByText(label).locator('xpath=..');
  }

  // One row per product in the cart. Each Remove button's parent is its row.
  private get lineItemRows(): Locator {
    return this.root.getByRole('button', { name: 'Remove' }).locator('xpath=..');
  }

  // Find a product by name, then step up to the row that wraps it.
  private lineItem(productName: string | RegExp): Locator {
    return this.root.getByText(productName).locator('xpath=ancestor::*[.//button][1]');
  }

  async waitForOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async close(): Promise<void> {
    await this.root.getByRole('button', { name: 'Close' }).click();
  }

  async increment(productName: string): Promise<void> {
    await this.lineItem(productName).getByRole('button', { name: '+' }).click();
  }

  async remove(productName: string): Promise<void> {
    await this.lineItem(productName).getByRole('button', { name: 'Remove' }).click();
  }

  async getQuantity(productName: string): Promise<number> {
    const text = await this.lineItem(productName).getByText(/^\d+$/).first().textContent();
    return Number.parseInt(text ?? '0', 10);
  }

  async getLineItemNames(): Promise<string[]> {
    return (await this.lineItemRows.allTextContents()).map((t) => t.trim()).filter(Boolean);
  }

  async getLineItemsTotal(): Promise<number> {
    const rows = await this.lineItemRows.all();
    const totals = await Promise.all(
      rows.map(async (r) => parseMoney((await r.getByText(/^\$[\d,.]+$/).last().textContent()) ?? '')),
    );
    return Math.round(totals.reduce((sum, n) => sum + n, 0) * 100) / 100;
  }

  // Row text runs together, like "Discount (SAVE10)−$2.00". Take the last
  // dollar amount so the 10 in SAVE10 isn't read as money. Note the minus
  // is the app's special "−" character, not a normal dash.
  private async amount(row: Locator): Promise<number> {
    const text = (await row.textContent())?.trim() ?? '';
    if (/free/i.test(text)) return 0;
    const matches = [...text.matchAll(/([−-])?\$\s*([\d,]+(?:\.\d+)?)/g)];
    if (matches.length === 0) throw new Error(`No $ amount found in row text "${text}"`);
    const [, sign, value] = matches[matches.length - 1];
    return (sign ? -1 : 1) * parseMoney(value);
  }

  async getSubtotal(): Promise<number> {
    return this.amount(this.row(/^subtotal$/i));
  }

  // Returns 0 when there's no discount row yet (no coupon applied).
  async getDiscount(): Promise<number> {
    const discountRow = this.row(/^discount/i);
    if (!(await discountRow.isVisible().catch(() => false))) return 0;
    return Math.abs(await this.amount(discountRow));
  }

  async getShipping(): Promise<number> {
    return this.amount(this.row(/^shipping$/i));
  }
  async getTax(): Promise<number> {
    return this.amount(this.row(/^tax$/i));
  }
  async getTotal(): Promise<number> {
    return this.amount(this.row(/^total$/i));
  }
}
