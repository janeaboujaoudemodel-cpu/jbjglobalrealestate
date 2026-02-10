/**
 * Formats a number with thousand separators (commas)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string with commas
 */
export const formatNumber = (value: number | string | null | undefined, decimals: number = 0): string => {
  if (value === null || value === undefined || value === '') return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formats a price value with currency and comma separators
 * @param value - The price value
 * @param currency - Currency code (default: 'AED')
 * @param showSymbol - Whether to show currency symbol (default: true)
 * @returns Formatted price string
 */
export const formatPrice = (
  value: number | string | null | undefined,
  currency: string = 'AED',
  showSymbol: boolean = true
): string => {
  // Guardrail: prevent legally-risky “AED 2” type displays caused by bad scraping/parsing.
  // Treat obviously invalid values as unavailable pricing.
  const MIN_REASONABLE_PRICE_AED = 50_000;

  if (value === null || value === undefined || value === '') return showSymbol ? `${currency} 0` : '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return showSymbol ? `${currency} 0` : '0';

  if (currency === 'AED' && num > 0 && num < MIN_REASONABLE_PRICE_AED) {
    return showSymbol ? `${currency} On request` : 'On request';
  }
  
  const rounded = Math.round(num);
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return showSymbol ? `${currency} ${formatted}` : formatted;
};

/**
 * Formats a price with abbreviated suffix (K, M, B)
 * @param value - The price value
 * @param currency - Currency symbol/code
 * @returns Formatted abbreviated price
 */
export const formatPriceAbbreviated = (
  value: number | string | null | undefined,
  currency: string = 'AED'
): string => {
  if (value === null || value === undefined || value === '') return `${currency} 0`;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return `${currency} 0`;
  
  if (num >= 1000000000) {
    return `${currency} ${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${currency} ${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${currency} ${(num / 1000).toFixed(0)}K`;
  }
  
  return `${currency} ${num.toLocaleString('en-US')}`;
};

/**
 * Formats a compact number with K/M/B suffix
 * @param value - The number to format
 * @returns Formatted compact string
 */
export const formatCompactNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toLocaleString('en-US');
};

/**
 * Formats a percentage
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number | string | null | undefined,
  decimals: number = 1
): string => {
  if (value === null || value === undefined || value === '') return '0%';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0%';
  
  return `${num.toFixed(decimals)}%`;
};

/**
 * Formats square footage/meters with comma separators
 * @param value - The size value
 * @param unit - Unit type ('sqft' or 'sqm')
 * @returns Formatted size string
 */
export const formatSize = (
  value: number | string | null | undefined,
  unit: 'sqft' | 'sqm' = 'sqft'
): string => {
  if (value === null || value === undefined || value === '') return `0 ${unit}`;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return `0 ${unit}`;
  
  return `${num.toLocaleString('en-US')} ${unit}`;
};
