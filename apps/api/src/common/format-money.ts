export function formatMoney(amountInSmallestUnit: number, currency = 'TZS'): string {
  const major = amountInSmallestUnit / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(major);
}
