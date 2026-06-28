import { DollarSign, Check, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
          <button
            data-surface="emerald"
            data-emerald-ok="button"
            data-emerald-action="true"
            data-header-control-family="pill"
            className="jj-header-selector-control jj-header-premium-control jj-emerald-action jj-surface-emerald h-11 inline-flex items-center gap-1.5 px-4 rounded-full border-0 transition-colors duration-150 hover:brightness-110"
            style={{ border: 0 }}
            aria-label="Currency"
          >
            <span className="text-sm leading-none" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{currentCurrency.flag}</span>
            <span className="text-[12px] font-semibold tracking-wide" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{currentCurrency.code}</span>
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.25} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          </button>
        ) : (
          <button className="h-11 px-4 text-[#1A1A1A] hover:text-[#1A1A1A]-light rounded-full border border-[#B89555]/20 hover:border-[#B89555]/50 hover:bg-[#EFE6D6]/10 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">{currentCurrency.code}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={12}
        className="z-[9999] min-w-[280px] rounded-xl shadow-2xl p-0 border border-[#B89555]/30 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F1E6 100%)' }}
      >
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider">Select Currency</p>
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          {SUPPORTED_CURRENCIES.map((curr) => (
            <DropdownMenuItem 
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`flex items-center justify-between cursor-pointer rounded-lg px-4 py-3 my-0.5 ${
                currency === curr.code 
                  ? 'bg-[#EFE6D6]/15 border border-[#B89555]/30' 
                  : 'hover:bg-gradient-to-r hover:from-[#F7F1E6] hover:to-[#ECE2D2]'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{curr.flag}</span>
                <span className={`text-sm font-semibold ${
                  currency === curr.code ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]'
                }`}>{curr.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#1A1A1A]/50 text-sm">{curr.symbol}</span>
                {currency === curr.code && <Check className="w-4 h-4 text-[#1A1A1A]" />}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;
