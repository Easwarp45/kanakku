import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import {
  BASE_CURRENCY,
  normalizeCurrency,
  getCurrencySymbol,
  formatMoney,
  formatMoneyCompact,
  formatNumberByCurrencyLocale,
  getFallbackExchangeRatesFromBase,
  normalizeExchangeRatesFromBase,
  convertFromBaseCurrency,
  convertToBaseCurrency,
  type ExchangeRatesFromBase,
  type MoneyFormatOptions,
  type SupportedCurrency,
} from '@/lib/currency';

const EXCHANGE_RATE_URL = 'https://api.frankfurter.app/latest?from=INR&to=USD,EUR,GBP';

interface ExchangeRateApiResponse {
  rates?: Record<string, number>;
  date?: string;
}

interface ExchangeRateData {
  rates: ExchangeRatesFromBase;
  date: string;
  usingFallback: boolean;
}

export function useCurrency() {
  const { data: profile } = useProfile();
  const fallbackRates = useMemo(() => getFallbackExchangeRatesFromBase(), []);

  const currency = useMemo<SupportedCurrency>(
    () => normalizeCurrency(profile?.currency),
    [profile?.currency]
  );

  const { data: exchangeRateData, isLoading: isRatesLoading } = useQuery<ExchangeRateData>({
    queryKey: ['exchange-rates', BASE_CURRENCY],
    queryFn: async () => {
      try {
        const response = await fetch(EXCHANGE_RATE_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch exchange rates: ${response.status}`);
        }

        const payload = (await response.json()) as ExchangeRateApiResponse;
        return {
          rates: normalizeExchangeRatesFromBase(payload.rates),
          date: typeof payload.date === 'string' ? payload.date : new Date().toISOString().split('T')[0],
          usingFallback: false,
        };
      } catch {
        return {
          rates: fallbackRates,
          date: new Date().toISOString().split('T')[0],
          usingFallback: true,
        };
      }
    },
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const symbol = useMemo(() => getCurrencySymbol(currency), [currency]);
  const exchangeRates = useMemo(
    () => exchangeRateData?.rates ?? fallbackRates,
    [exchangeRateData?.rates, fallbackRates]
  );

  const convertFromBase = useCallback(
    (amount: number) => convertFromBaseCurrency(amount, currency, exchangeRates),
    [currency, exchangeRates]
  );

  const convertToBase = useCallback(
    (amount: number) => convertToBaseCurrency(amount, currency, exchangeRates),
    [currency, exchangeRates]
  );

  const formatCurrency = useCallback(
    (amount: number, options: MoneyFormatOptions = {}) => {
      return formatMoney(convertFromBase(amount), currency, options);
    },
    [convertFromBase, currency]
  );

  const formatLocalCurrency = useCallback(
    (alreadyConvertedAmount: number, options: MoneyFormatOptions = {}) => {
      return formatMoney(alreadyConvertedAmount, currency, options);
    },
    [currency]
  );

  const formatCompactCurrency = useCallback(
    (amount: number) => {
      return formatMoneyCompact(convertFromBase(amount), currency);
    },
    [convertFromBase, currency]
  );

  const formatNumber = useCallback(
    (
      amount: number,
      options: Omit<MoneyFormatOptions, 'notation'> = {}
    ) => {
      return formatNumberByCurrencyLocale(convertFromBase(amount), currency, options);
    },
    [convertFromBase, currency]
  );

  const formatLocalNumber = useCallback(
    (
      alreadyConvertedAmount: number,
      options: Omit<MoneyFormatOptions, 'notation'> = {}
    ) => {
      return formatNumberByCurrencyLocale(alreadyConvertedAmount, currency, options);
    },
    [currency]
  );

  return {
    currency,
    symbol,
    exchangeRateDate: exchangeRateData?.date,
    usingFallbackRates: exchangeRateData?.usingFallback ?? true,
    isRatesLoading,
    convertFromBase,
    convertToBase,
    formatCurrency,
    formatLocalCurrency,
    formatCompactCurrency,
    formatNumber,
    formatLocalNumber,
  };
}
