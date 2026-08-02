import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly emailInput = this.page.getByLabel('Email');
  private readonly passwordInput = this.page.getByLabel('Password');
  private readonly loginButton = this.page.getByRole('button', { name: /^login$/i });

  async open(): Promise<void> {
    await this.goto('/');
    await expect(this.loginButton).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
