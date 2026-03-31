export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export const BASE_CURRENCY: SupportedCurrency = 'INR';
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['INR', 'USD', 'EUR', 'GBP'];

const DEFAULT_CURRENCY: SupportedCurrency = BASE_CURRENCY;

const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

// Used when live rates are unavailable (offline / API failure).
const FALLBACK_EXCHANGE_RATES_FROM_BASE: Record<SupportedCurrency, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
};

export type ExchangeRatesFromBase = Record<SupportedCurrency, number>;

export interface MoneyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'compact';
}

export function normalizeCurrency(currency: string | null | undefined): SupportedCurrency {
  if (!currency) return DEFAULT_CURRENCY;
  const upper = currency.toUpperCase();
  if (upper === 'INR' || upper === 'USD' || upper === 'EUR' || upper === 'GBP') {
    return upper;
  }
  return DEFAULT_CURRENCY;
}

export function getCurrencyLocale(currency: string | null | undefined): string {
  return CURRENCY_LOCALES[normalizeCurrency(currency)];
}

export function getFallbackExchangeRatesFromBase(): ExchangeRatesFromBase {
  return { ...FALLBACK_EXCHANGE_RATES_FROM_BASE };
}

export function normalizeExchangeRatesFromBase(
  rawRates?: Partial<Record<string, number>> | null
): ExchangeRatesFromBase {
  const normalized = getFallbackExchangeRatesFromBase();

  if (!rawRates) {
    return normalized;
  }

  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === BASE_CURRENCY) {
      continue;
    }

    const rate = rawRates[currency];
    if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
      normalized[currency] = rate;
    }
  }

  normalized[BASE_CURRENCY] = 1;
  return normalized;
}

export function convertAmountBetweenCurrencies(
  amount: number,
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined,
  ratesFromBase?: Partial<Record<string, number>> | null
): number {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (from === to) {
    return amount;
  }

  const rates = normalizeExchangeRatesFromBase(ratesFromBase);
  const amountInBase = from === BASE_CURRENCY ? amount : amount / rates[from];

  return to === BASE_CURRENCY ? amountInBase : amountInBase * rates[to];
}

export function convertFromBaseCurrency(
  amount: number,
  toCurrency: string | null | undefined,
  ratesFromBase?: Partial<Record<string, number>> | null
): number {
  return convertAmountBetweenCurrencies(amount, BASE_CURRENCY, toCurrency, ratesFromBase);
}

export function convertToBaseCurrency(
  amount: number,
  fromCurrency: string | null | undefined,
  ratesFromBase?: Partial<Record<string, number>> | null
): number {
  return convertAmountBetweenCurrencies(amount, fromCurrency, BASE_CURRENCY, ratesFromBase);
}

export function getCurrencySymbol(currency: string | null | undefined): string {
  const normalized = normalizeCurrency(currency);
  const locale = getCurrencyLocale(normalized);

  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalized,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0);

  return parts.find((part) => part.type === 'currency')?.value || normalized;
}

export function formatMoney(
  amount: number,
  currency: string | null | undefined,
  options: MoneyFormatOptions = {}
): string {
  const normalized = normalizeCurrency(currency);
  const locale = getCurrencyLocale(normalized);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalized,
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
    notation: options.notation,
  }).format(amount);
}

export function formatMoneyCompact(amount: number, currency: string | null | undefined): string {
  return formatMoney(amount, currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    notation: 'compact',
  });
}

export function formatNumberByCurrencyLocale(
  amount: number,
  currency: string | null | undefined,
  options: Omit<MoneyFormatOptions, 'notation'> = {}
): string {
  const normalized = normalizeCurrency(currency);
  const locale = getCurrencyLocale(normalized);

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
  }).format(amount);
}
