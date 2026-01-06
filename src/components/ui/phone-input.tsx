import * as React from "react";
import { useState } from "react";
import { CheckCircle, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Country codes grouped by region with dial codes and valid number lengths
export const COUNTRY_CODES_BY_REGION = {
  "GCC": [
    { code: "+971", country: "UAE", flag: "🇦🇪", minLen: 9, maxLen: 9 },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", minLen: 9, maxLen: 9 },
    { code: "+974", country: "Qatar", flag: "🇶🇦", minLen: 8, maxLen: 8 },
    { code: "+965", country: "Kuwait", flag: "🇰🇼", minLen: 8, maxLen: 8 },
    { code: "+973", country: "Bahrain", flag: "🇧🇭", minLen: 8, maxLen: 8 },
    { code: "+968", country: "Oman", flag: "🇴🇲", minLen: 8, maxLen: 8 },
  ],
  "Middle East & North Africa": [
    { code: "+20", country: "Egypt", flag: "🇪🇬", minLen: 10, maxLen: 10 },
    { code: "+961", country: "Lebanon", flag: "🇱🇧", minLen: 7, maxLen: 8 },
    { code: "+962", country: "Jordan", flag: "🇯🇴", minLen: 9, maxLen: 9 },
    { code: "+90", country: "Turkey", flag: "🇹🇷", minLen: 10, maxLen: 10 },
    { code: "+98", country: "Iran", flag: "🇮🇷", minLen: 10, maxLen: 10 },
    { code: "+972", country: "Israel", flag: "🇮🇱", minLen: 9, maxLen: 9 },
    { code: "+964", country: "Iraq", flag: "🇮🇶", minLen: 10, maxLen: 10 },
    { code: "+963", country: "Syria", flag: "🇸🇾", minLen: 9, maxLen: 9 },
    { code: "+967", country: "Yemen", flag: "🇾🇪", minLen: 9, maxLen: 9 },
    { code: "+212", country: "Morocco", flag: "🇲🇦", minLen: 9, maxLen: 9 },
    { code: "+213", country: "Algeria", flag: "🇩🇿", minLen: 9, maxLen: 9 },
    { code: "+216", country: "Tunisia", flag: "🇹🇳", minLen: 8, maxLen: 8 },
    { code: "+218", country: "Libya", flag: "🇱🇾", minLen: 9, maxLen: 9 },
  ],
  "Europe": [
    { code: "+44", country: "UK", flag: "🇬🇧", minLen: 10, maxLen: 10 },
    { code: "+49", country: "Germany", flag: "🇩🇪", minLen: 10, maxLen: 11 },
    { code: "+33", country: "France", flag: "🇫🇷", minLen: 9, maxLen: 9 },
    { code: "+39", country: "Italy", flag: "🇮🇹", minLen: 9, maxLen: 10 },
    { code: "+34", country: "Spain", flag: "🇪🇸", minLen: 9, maxLen: 9 },
    { code: "+41", country: "Switzerland", flag: "🇨🇭", minLen: 9, maxLen: 9 },
    { code: "+7", country: "Russia", flag: "🇷🇺", minLen: 10, maxLen: 10 },
    { code: "+31", country: "Netherlands", flag: "🇳🇱", minLen: 9, maxLen: 9 },
    { code: "+32", country: "Belgium", flag: "🇧🇪", minLen: 9, maxLen: 9 },
    { code: "+43", country: "Austria", flag: "🇦🇹", minLen: 10, maxLen: 11 },
    { code: "+46", country: "Sweden", flag: "🇸🇪", minLen: 9, maxLen: 9 },
    { code: "+47", country: "Norway", flag: "🇳🇴", minLen: 8, maxLen: 8 },
    { code: "+45", country: "Denmark", flag: "🇩🇰", minLen: 8, maxLen: 8 },
    { code: "+358", country: "Finland", flag: "🇫🇮", minLen: 9, maxLen: 10 },
    { code: "+48", country: "Poland", flag: "🇵🇱", minLen: 9, maxLen: 9 },
    { code: "+351", country: "Portugal", flag: "🇵🇹", minLen: 9, maxLen: 9 },
    { code: "+30", country: "Greece", flag: "🇬🇷", minLen: 10, maxLen: 10 },
    { code: "+353", country: "Ireland", flag: "🇮🇪", minLen: 9, maxLen: 9 },
    { code: "+420", country: "Czech Republic", flag: "🇨🇿", minLen: 9, maxLen: 9 },
    { code: "+36", country: "Hungary", flag: "🇭🇺", minLen: 9, maxLen: 9 },
    { code: "+40", country: "Romania", flag: "🇷🇴", minLen: 9, maxLen: 9 },
    { code: "+380", country: "Ukraine", flag: "🇺🇦", minLen: 9, maxLen: 9 },
  ],
  "Asia Pacific": [
    { code: "+86", country: "China", flag: "🇨🇳", minLen: 11, maxLen: 11 },
    { code: "+852", country: "Hong Kong", flag: "🇭🇰", minLen: 8, maxLen: 8 },
    { code: "+91", country: "India", flag: "🇮🇳", minLen: 10, maxLen: 10 },
    { code: "+92", country: "Pakistan", flag: "🇵🇰", minLen: 10, maxLen: 10 },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩", minLen: 10, maxLen: 10 },
    { code: "+94", country: "Sri Lanka", flag: "🇱🇰", minLen: 9, maxLen: 9 },
    { code: "+977", country: "Nepal", flag: "🇳🇵", minLen: 10, maxLen: 10 },
    { code: "+61", country: "Australia", flag: "🇦🇺", minLen: 9, maxLen: 9 },
    { code: "+64", country: "New Zealand", flag: "🇳🇿", minLen: 9, maxLen: 10 },
    { code: "+65", country: "Singapore", flag: "🇸🇬", minLen: 8, maxLen: 8 },
    { code: "+60", country: "Malaysia", flag: "🇲🇾", minLen: 9, maxLen: 10 },
    { code: "+63", country: "Philippines", flag: "🇵🇭", minLen: 10, maxLen: 10 },
    { code: "+62", country: "Indonesia", flag: "🇮🇩", minLen: 10, maxLen: 12 },
    { code: "+66", country: "Thailand", flag: "🇹🇭", minLen: 9, maxLen: 9 },
    { code: "+84", country: "Vietnam", flag: "🇻🇳", minLen: 9, maxLen: 10 },
    { code: "+81", country: "Japan", flag: "🇯🇵", minLen: 10, maxLen: 10 },
    { code: "+82", country: "South Korea", flag: "🇰🇷", minLen: 10, maxLen: 10 },
    { code: "+886", country: "Taiwan", flag: "🇹🇼", minLen: 9, maxLen: 9 },
  ],
  "Americas": [
    { code: "+1", country: "US/Canada", flag: "🇺🇸", minLen: 10, maxLen: 10 },
    { code: "+52", country: "Mexico", flag: "🇲🇽", minLen: 10, maxLen: 10 },
    { code: "+55", country: "Brazil", flag: "🇧🇷", minLen: 10, maxLen: 11 },
    { code: "+54", country: "Argentina", flag: "🇦🇷", minLen: 10, maxLen: 10 },
    { code: "+56", country: "Chile", flag: "🇨🇱", minLen: 9, maxLen: 9 },
    { code: "+57", country: "Colombia", flag: "🇨🇴", minLen: 10, maxLen: 10 },
    { code: "+58", country: "Venezuela", flag: "🇻🇪", minLen: 10, maxLen: 10 },
    { code: "+51", country: "Peru", flag: "🇵🇪", minLen: 9, maxLen: 9 },
    { code: "+506", country: "Costa Rica", flag: "🇨🇷", minLen: 8, maxLen: 8 },
    { code: "+507", country: "Panama", flag: "🇵🇦", minLen: 8, maxLen: 8 },
  ],
  "Africa": [
    { code: "+27", country: "South Africa", flag: "🇿🇦", minLen: 9, maxLen: 9 },
    { code: "+234", country: "Nigeria", flag: "🇳🇬", minLen: 10, maxLen: 10 },
    { code: "+254", country: "Kenya", flag: "🇰🇪", minLen: 9, maxLen: 9 },
    { code: "+233", country: "Ghana", flag: "🇬🇭", minLen: 9, maxLen: 9 },
    { code: "+251", country: "Ethiopia", flag: "🇪🇹", minLen: 9, maxLen: 9 },
    { code: "+255", country: "Tanzania", flag: "🇹🇿", minLen: 9, maxLen: 9 },
    { code: "+256", country: "Uganda", flag: "🇺🇬", minLen: 9, maxLen: 9 },
    { code: "+263", country: "Zimbabwe", flag: "🇿🇼", minLen: 9, maxLen: 9 },
    { code: "+230", country: "Mauritius", flag: "🇲🇺", minLen: 8, maxLen: 8 },
  ],
};

// Flat list for lookups
export const COUNTRY_CODES = Object.values(COUNTRY_CODES_BY_REGION).flat();

export type CountryCode = typeof COUNTRY_CODES[0];

// Get validation info for a phone number
export const getPhoneValidation = (phone: string): { isValid: boolean; message: string; country?: CountryCode } => {
  if (!phone) return { isValid: false, message: "Phone number is required" };
  
  const countryCode = COUNTRY_CODES.find(c => phone.startsWith(c.code));
  if (!countryCode) return { isValid: false, message: "Please select a valid country code" };
  
  const localNumber = phone.replace(countryCode.code, '').replace(/\D/g, '');
  const digitCount = localNumber.length;
  
  if (digitCount < countryCode.minLen) {
    return { 
      isValid: false, 
      message: `${countryCode.country} numbers need ${countryCode.minLen === countryCode.maxLen ? countryCode.minLen : `${countryCode.minLen}-${countryCode.maxLen}`} digits (${digitCount} entered)`,
      country: countryCode
    };
  }
  
  if (digitCount > countryCode.maxLen) {
    return { 
      isValid: false, 
      message: `${countryCode.country} numbers have max ${countryCode.maxLen} digits`,
      country: countryCode
    };
  }
  
  return { isValid: true, message: "", country: countryCode };
};

// Format phone number for display (digits only, spaced)
export const formatLocalNumber = (value: string, maxLen: number = 10): string => {
  const digits = value.replace(/\D/g, '').slice(0, maxLen);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder, className, disabled = false, showValidation = true }, ref) => {
    const [codeOpen, setCodeOpen] = useState(false);
    
    // Extract country code and local number from value
    const currentCountry = COUNTRY_CODES.find(c => value?.startsWith(c.code)) || COUNTRY_CODES[0];
    const currentCode = currentCountry.code;
    const localNumber = value?.replace(currentCode, '').replace(/^\s+/, '') || '';
    const validation = getPhoneValidation(value || '');
    
    const handleCodeChange = (newCode: string) => {
      const newCountry = COUNTRY_CODES.find(c => c.code === newCode) || COUNTRY_CODES[0];
      const cleanLocal = localNumber.replace(/\D/g, '').slice(0, newCountry.maxLen);
      onChange(cleanLocal ? `${newCode} ${formatLocalNumber(cleanLocal, newCountry.maxLen)}` : newCode);
      setCodeOpen(false);
    };
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, currentCountry.maxLen);
      const formatted = formatLocalNumber(digits, currentCountry.maxLen);
      onChange(digits ? `${currentCode} ${formatted}` : '');
    };

    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex gap-2">
          <Popover open={codeOpen} onOpenChange={setCodeOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={codeOpen}
                disabled={disabled}
                className="w-[130px] h-12 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 hover:text-white justify-between shrink-0"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{currentCountry.flag}</span>
                  <span>{currentCode}</span>
                </span>
                <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0 bg-zinc-900 border-zinc-700 z-50" align="start">
              <Command className="bg-zinc-900">
                <CommandInput 
                  placeholder="Search country..." 
                  className="h-10 text-white border-zinc-700"
                />
                <CommandList className="max-h-[280px]">
                  <CommandEmpty className="text-zinc-400 text-sm py-4 text-center">
                    No country found.
                  </CommandEmpty>
                  {Object.entries(COUNTRY_CODES_BY_REGION).map(([region, countries]) => (
                    <CommandGroup key={region} heading={region} className="text-gold">
                      {countries.map((country) => (
                        <CommandItem
                          key={country.code}
                          value={`${region} ${country.country} ${country.code}`}
                          onSelect={() => handleCodeChange(country.code)}
                          className="text-white hover:bg-zinc-800 cursor-pointer"
                        >
                          <span className="flex items-center gap-2 w-full">
                            <span>{country.flag}</span>
                            <span className="font-medium">{country.code}</span>
                            <span className="text-zinc-400 text-xs truncate">{country.country}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="relative flex-1">
            <Input 
              ref={ref}
              type="tel"
              value={localNumber}
              onChange={handleNumberChange}
              disabled={disabled}
              className={cn(
                "h-12 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold pr-10",
                localNumber && validation.isValid && "border-green-500"
              )}
              placeholder={placeholder || `${currentCountry.minLen} digits`}
            />
            {showValidation && localNumber && validation.isValid && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
        {showValidation && localNumber && !validation.isValid && (
          <p className="text-amber-400 text-xs">{validation.message}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
