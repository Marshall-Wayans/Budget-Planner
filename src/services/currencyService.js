export const CURRENCIES = {
  KES: { symbol: 'KES', locale: 'en-KE', name: 'Kenyan Shilling' },
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
};

export const DEFAULT_CURRENCY = 'KES';

export function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY, opts = {}) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  const { compact = false, showSign = false } = opts;

  const formatter = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: compact ? 0 : 0,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? 'compact' : 'standard',
  });

  const sign = showSign && safeAmount > 0 ? '+' : '';
  const formatted = formatter.format(Math.round(safeAmount * 100) / 100);

  // KES conventionally prefixes with the code rather than a glyph.
  if (currencyCode === 'KES') {
    return `${sign}KES ${formatted}`;
  }
  return `${sign}${currency.symbol}${formatted}`;
}

export function formatPercent(value, digits = 0) {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(digits)}%`;
}
