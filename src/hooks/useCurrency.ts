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
  JPY: 41.0,
  CHF: 0.24,
  SGD: 0.36,
  HKD: 2.12,
  KRW: 370.0,
  TRY: 9.5,
  QAR: 0.99,
  KWD: 0.083,
  BHD: 0.103,
  OMR: 0.105,
  EGP: 13.3,
  ZAR: 4.95,
  BRL: 1.55,
  MXN: 4.7,
  NZD: 0.45,
  SEK: 2.85,
  NOK: 2.95,
  DKK: 1.88,
  PLN: 1.10,
  THB: 9.5,
  MYR: 1.27,
  IDR: 4350.0,
  PHP: 15.6,
  PKR: 76.0,
  NGN: 410.0,
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
  JPY: '¥',
  CHF: 'CHF',
  SGD: 'S$',
  HKD: 'HK$',
  KRW: '₩',
  TRY: '₺',
  QAR: 'QAR',
  KWD: 'KWD',
  BHD: 'BHD',
  OMR: 'OMR',
  EGP: 'E£',
  ZAR: 'R',
  BRL: 'R$',
  MXN: 'Mex$',
  NZD: 'NZ$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  PKR: '₨',
  NGN: '₦',
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
    const storageHandler = (e: StorageEvent) => {
      if (e.key === CURRENCY_KEY && e.newValue) setCurrency(e.newValue);
    };
    window.addEventListener('currencyChange', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('currencyChange', handler);
      window.removeEventListener('storage', storageHandler);
    };
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

  const formatPriceRangeFull = useCallback((minAED: number | null | undefined, maxAED: number | null | undefined): string => {
    const hasMin = typeof minAED === 'number' && minAED > 0;
    const hasMax = typeof maxAED === 'number' && maxAED > 0 && maxAED !== minAED;
    if (hasMin && hasMax) return `${formatPrice(minAED)} to ${formatPrice(maxAED)}`;
    if (hasMin) return `From ${formatPrice(minAED)}`;
    if (hasMax) return `Up to ${formatPrice(maxAED)}`;
    return 'Price on request';
  }, [formatPrice]);

  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];

  return { currency, formatPrice, formatPriceFull, formatPriceRangeFull, currencyInfo };
}
