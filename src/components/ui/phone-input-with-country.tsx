import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Comprehensive country codes with flags
const COUNTRY_CODES = [
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
];

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  placeholder = 'Enter phone number',
  className = ''
}) => {
  const [countryCode, setCountryCode] = useState('+971');
  const [localNumber, setLocalNumber] = useState('');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const match = COUNTRY_CODES.find(c => value.startsWith(c.code));
      if (match) {
        setCountryCode(match.code);
        setLocalNumber(value.replace(match.code, '').trim());
      } else {
        setLocalNumber(value);
      }
    }
  }, []);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    onChange(localNumber ? `${code}${localNumber}` : '');
  };

  const handleNumberChange = (num: string) => {
    // Remove non-numeric characters except spaces
    const cleaned = num.replace(/[^\d\s]/g, '');
    setLocalNumber(cleaned);
    onChange(cleaned ? `${countryCode}${cleaned.replace(/\s/g, '')}` : '');
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[140px] bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A]">
          <SelectValue>
            {selectedCountry && (
              <span className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.code}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 max-h-[60vh] z-[9999]">
          {COUNTRY_CODES.map(country => (
            <SelectItem 
              key={country.code} 
              value={country.code}
              className="text-[#1A1A1A] hover:bg-[#EFE6D6]/20 focus:bg-[#EFE6D6]/20"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                <span>{country.country}</span>
                <span className="text-muted-foreground ml-auto">{country.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={localNumber}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#B89555]"
      />
    </div>
  );
};

export default PhoneInputWithCountry;
