import { DollarSign, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CURRENCIES = [
  { code: 'AED', symbol: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
];

const CURRENCY_KEY = 'jj_currency';

interface CurrencySwitcherProps {
  variant?: 'default' | 'mobile' | 'icon-only';
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

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const isMobile = variant === 'mobile';
  const isIconOnly = variant === 'icon-only';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isMobile ? (
          <button className="flex flex-col items-center gap-1.5 text-black hover:text-gold py-2 px-3 transition-colors">
            <DollarSign className="w-5 h-5 text-black" />
            <span className="text-[9px] text-black font-medium">Currency</span>
          </button>
        ) : isIconOnly ? (
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/10 group">
            <DollarSign className="w-4 h-4 text-gold group-hover:text-white group-hover:scale-110 transition-all" />
          </button>
        ) : (
          <button className="h-10 px-3 text-gold hover:text-gold-light rounded-full border border-gold/20 hover:border-gold/50 hover:bg-gold/10 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">{currentCurrency.code}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={12}
        className="z-[9999] min-w-[240px] rounded-xl shadow-2xl p-0 border-2 border-gold/40"
        style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}
      >
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
        <div className="p-3">
          {CURRENCIES.map((curr) => (
            <DropdownMenuItem 
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`flex items-center justify-between cursor-pointer rounded-lg px-4 py-3 my-0.5 ${
                currency === curr.code 
                  ? 'bg-gold/15 border border-gold/30' 
                  : 'hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8]'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{curr.flag}</span>
                <span className={`text-sm font-semibold ${
                  currency === curr.code ? 'text-gold' : 'text-black'
                }`}>{curr.name} ({curr.symbol})</span>
              </span>
              {currency === curr.code && <Check className="w-4 h-4 text-gold" />}
            </DropdownMenuItem>
          ))}
        </div>
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;
