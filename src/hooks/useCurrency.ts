import { useState, useEffect, useCallback } from 'react';
import { SUPPORTED_CURRENCIES } from '@/components/CurrencySwitcher';

const CURRENCY_KEY = 'jj_currency';

// Currency conversion rates relative to AED
export const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.21,
  INR: 22.5,
  SAR: 1.02,
  CNY: 1.98,
  RUB: 24.5,
  CAD: 0.37,
  AUD: 0.42,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  SAR: 'SAR',
  CNY: '¥',
  RUB: '₽',
  CAD: 'C$',
  AUD: 'A$',
};

/**
 * Global currency hook. Reads from localStorage and listens for currencyChange events.
 * All components using this hook will re-render when the user switches currency.
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENCY_KEY) || 'AED';
    }
    return 'AED';
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent).detail;
      if (code && typeof code === 'string') {
        setCurrency(code);
      }
    };
    window.addEventListener('currencyChange', handler);
    return () => window.removeEventListener('currencyChange', handler);
  }, []);

  const formatPrice = useCallback((priceAED: number | null | undefined): string => {
    if (!priceAED) return 'Price on request';
    const rate = CURRENCY_RATES[currency] || 1;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const converted = Math.round(Math.round(priceAED) * rate);
    if (converted >= 1000000) {
      const m = converted / 1000000;
      return `${symbol} ${m % 1 === 0 ? m : m.toFixed(1)}M`;
    }
    if (converted >= 1000) {
      return `${symbol} ${Math.round(converted / 1000)}K`;
    }
    return `${symbol} ${converted.toLocaleString('en-US')}`;
  }, [currency]);

  const formatPriceFull = useCallback((priceAED: number | null | undefined): string => {
    if (!priceAED) return 'Price on request';
    const rate = CURRENCY_RATES[currency] || 1;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const converted = Math.round(Math.round(priceAED) * rate);
    return `${symbol} ${converted.toLocaleString('en-US')}`;
  }, [currency]);

  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];

  return { currency, formatPrice, formatPriceFull, currencyInfo };
}
