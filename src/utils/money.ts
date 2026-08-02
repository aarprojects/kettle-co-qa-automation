// Money helpers. Tests read amounts off the screen and assert the
// relationships between them, never hard-coded dollar values.

/** "$1,234.56" -> 1234.56 */
export function parseMoney(text: string): number {
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!match) {
    throw new Error(`Could not parse a money value out of "${text}"`);
  }
  return Number.parseFloat(match[0]);
}

// Equal to the cent by default; pass a tolerance only where rounding
// genuinely applies (e.g. a percentage discount).
export function expectMoneyEqual(actual: number, expected: number, toleranceCents = 0): void {
  const diffCents = Math.round(Math.abs(actual - expected) * 100);
  if (diffCents > toleranceCents) {
    throw new Error(
      `Money mismatch: expected ${expected.toFixed(2)}, got ${actual.toFixed(2)} ` +
        `(diff ${(diffCents / 100).toFixed(2)}, tolerance ${(toleranceCents / 100).toFixed(2)})`
    );
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
