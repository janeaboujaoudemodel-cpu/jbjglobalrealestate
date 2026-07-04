import { DollarSign, Check, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HeaderControl } from '@/components/ui/ds';

// Unified currency list - same across the entire platform
export const SUPPORTED_CURRENCIES = [
  { code: 'AED', symbol: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
  { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'SAR', symbol: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'RUB', symbol: '₽', flag: '🇷🇺', name: 'Russian Ruble' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', flag: '🇨🇭', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', flag: '🇭🇰', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', flag: '🇰🇷', name: 'South Korean Won' },
  { code: 'TRY', symbol: '₺', flag: '🇹🇷', name: 'Turkish Lira' },
  { code: 'QAR', symbol: 'QAR', flag: '🇶🇦', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'KWD', flag: '🇰🇼', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'BHD', flag: '🇧🇭', name: 'Bahraini Dinar' },
  { code: 'OMR', symbol: 'OMR', flag: '🇴🇲', name: 'Omani Rial' },
  { code: 'EGP', symbol: 'E£', flag: '🇪🇬', name: 'Egyptian Pound' },
  { code: 'ZAR', symbol: 'R', flag: '🇿🇦', name: 'South African Rand' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'Mex$', flag: '🇲🇽', name: 'Mexican Peso' },
  { code: 'NZD', symbol: 'NZ$', flag: '🇳🇿', name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr', flag: '🇸🇪', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', flag: '🇳🇴', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', flag: '🇩🇰', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', flag: '🇵🇱', name: 'Polish Zloty' },
  { code: 'THB', symbol: '฿', flag: '🇹🇭', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', flag: '🇲🇾', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', flag: '🇮🇩', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', flag: '🇵🇭', name: 'Philippine Peso' },
  { code: 'PKR', symbol: '₨', flag: '🇵🇰', name: 'Pakistani Rupee' },
  { code: 'NGN', symbol: '₦', flag: '🇳🇬', name: 'Nigerian Naira' },
];

const CURRENCY_KEY = 'jj_currency';

interface CurrencySwitcherProps {
  variant?: 'default' | 'mobile' | 'icon-only' | 'flag';
}

const CurrencySwitcher = ({ variant = 'default' }: CurrencySwitcherProps) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENCY_KEY) || 'AED';
    }
    return 'AED';
  });

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    localStorage.setItem(CURRENCY_KEY, code);
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: code }));
  };

  const currentCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];
  const isMobile = variant === 'mobile';
  const isIconOnly = variant === 'icon-only';
  const isFlag = variant === 'flag';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isMobile ? (
          <button className="flex flex-col items-center justify-center gap-1.5 text-[#1A1A1A] hover:text-[#1A1A1A] py-2 w-16 transition-colors">
            <DollarSign className="w-5 h-5" />
            <span className="text-[9px] font-medium text-center">Currency</span>
          </button>
        ) : isIconOnly ? (
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EFE6D6]/10 group">
            <DollarSign className="w-4 h-4 text-[#1A1A1A] group-hover:text-white group-hover:scale-110 transition-all" />
          </button>
        ) : isFlag ? (
          <HeaderControl shape="pill" tone="emerald" aria-label="Currency" className="gap-1.5 px-4">
            <DollarSign className="w-3.5 h-3.5" strokeWidth={2.25} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            <span className="text-[12px] font-semibold tracking-wide" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{currentCurrency.code}</span>
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.25} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          </HeaderControl>
        ) : (
          <button className="h-11 px-4 text-[#1A1A1A] hover:text-[#1A1A1A]-light rounded-full border border-[#064E3B]/20 hover:border-[#064E3B]/50 hover:bg-[#064E3B]/10 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">{currentCurrency.code}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        data-currency-menu-content
        data-jbj-fast-dropdown="true"
        data-preserve-surface
        align="end" 
        side="bottom"
        sideOffset={22}
        collisionPadding={{ top: 104, bottom: 16, left: 16, right: 16 }}
        avoidCollisions={false}
        sticky="always"
        updatePositionStrategy="always"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="z-[120001] w-[280px] max-w-[calc(100vw-32px)] rounded-xl p-2 overflow-hidden"
      >
        <div className="px-2.5 py-2.5 border-b border-[#B89555]/25">
          <p className="text-xs font-semibold uppercase tracking-wider">Select Currency</p>
        </div>
        <div
          className="pt-1 max-h-[360px] overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {SUPPORTED_CURRENCIES.map((curr) => {
            const active = currency === curr.code;

            return (
              <DropdownMenuItem 
                key={curr.code}
                data-currency-row
                data-currency-active="false"
                onClick={() => setCurrency(curr.code)}
                unstyled
                className="flex items-center justify-between cursor-pointer rounded-md px-2.5 py-2 my-0.5 transition-none outline-none border border-transparent bg-transparent shadow-none"
              >
              <span className="flex items-center gap-3">
                <span className="text-lg leading-none">{curr.flag}</span>
                <span className="text-sm font-semibold">{curr.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm opacity-85">{curr.symbol}</span>
                {active && <Check className="w-4 h-4" strokeWidth={3} />}
              </span>
              </DropdownMenuItem>
            );
          })}
        </div>
        
      </DropdownMenuContent>

    </DropdownMenu>
  );
};

export default CurrencySwitcher;
