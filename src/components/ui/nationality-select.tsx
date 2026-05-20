import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

// Comprehensive nationality list with flags
const NATIONALITIES = [
  { name: 'Emirati', flag: '🇦🇪' },
  { name: 'Saudi', flag: '🇸🇦' },
  { name: 'Bahraini', flag: '🇧🇭' },
  { name: 'Qatari', flag: '🇶🇦' },
  { name: 'Kuwaiti', flag: '🇰🇼' },
  { name: 'Omani', flag: '🇴🇲' },
  { name: 'Jordanian', flag: '🇯🇴' },
  { name: 'Lebanese', flag: '🇱🇧' },
  { name: 'Syrian', flag: '🇸🇾' },
  { name: 'Palestinian', flag: '🇵🇸' },
  { name: 'Iraqi', flag: '🇮🇶' },
  { name: 'Yemeni', flag: '🇾🇪' },
  { name: 'Egyptian', flag: '🇪🇬' },
  { name: 'Moroccan', flag: '🇲🇦' },
  { name: 'Algerian', flag: '🇩🇿' },
  { name: 'Tunisian', flag: '🇹🇳' },
  { name: 'Libyan', flag: '🇱🇾' },
  { name: 'Sudanese', flag: '🇸🇩' },
  { name: 'Indian', flag: '🇮🇳' },
  { name: 'Pakistani', flag: '🇵🇰' },
  { name: 'Bangladeshi', flag: '🇧🇩' },
  { name: 'Sri Lankan', flag: '🇱🇰' },
  { name: 'Nepali', flag: '🇳🇵' },
  { name: 'Afghan', flag: '🇦🇫' },
  { name: 'Filipino', flag: '🇵🇭' },
  { name: 'Indonesian', flag: '🇮🇩' },
  { name: 'Malaysian', flag: '🇲🇾' },
  { name: 'Singaporean', flag: '🇸🇬' },
  { name: 'Thai', flag: '🇹🇭' },
  { name: 'Vietnamese', flag: '🇻🇳' },
  { name: 'Chinese', flag: '🇨🇳' },
  { name: 'Hong Konger', flag: '🇭🇰' },
  { name: 'Taiwanese', flag: '🇹🇼' },
  { name: 'Japanese', flag: '🇯🇵' },
  { name: 'South Korean', flag: '🇰🇷' },
  { name: 'Iranian', flag: '🇮🇷' },
  { name: 'Turkish', flag: '🇹🇷' },
  { name: 'Israeli', flag: '🇮🇱' },
  { name: 'Russian', flag: '🇷🇺' },
  { name: 'Ukrainian', flag: '🇺🇦' },
  { name: 'Belarusian', flag: '🇧🇾' },
  { name: 'British', flag: '🇬🇧' },
  { name: 'Irish', flag: '🇮🇪' },
  { name: 'French', flag: '🇫🇷' },
  { name: 'German', flag: '🇩🇪' },
  { name: 'Italian', flag: '🇮🇹' },
  { name: 'Spanish', flag: '🇪🇸' },
  { name: 'Portuguese', flag: '🇵🇹' },
  { name: 'Dutch', flag: '🇳🇱' },
  { name: 'Belgian', flag: '🇧🇪' },
  { name: 'Swiss', flag: '🇨🇭' },
  { name: 'Austrian', flag: '🇦🇹' },
  { name: 'Swedish', flag: '🇸🇪' },
  { name: 'Norwegian', flag: '🇳🇴' },
  { name: 'Danish', flag: '🇩🇰' },
  { name: 'Finnish', flag: '🇫🇮' },
  { name: 'Polish', flag: '🇵🇱' },
  { name: 'Czech', flag: '🇨🇿' },
  { name: 'Hungarian', flag: '🇭🇺' },
  { name: 'Romanian', flag: '🇷🇴' },
  { name: 'Bulgarian', flag: '🇧🇬' },
  { name: 'Greek', flag: '🇬🇷' },
  { name: 'Serbian', flag: '🇷🇸' },
  { name: 'Croatian', flag: '🇭🇷' },
  { name: 'Bosnian', flag: '🇧🇦' },
  { name: 'Slovenian', flag: '🇸🇮' },
  { name: 'American', flag: '🇺🇸' },
  { name: 'Canadian', flag: '🇨🇦' },
  { name: 'Mexican', flag: '🇲🇽' },
  { name: 'Brazilian', flag: '🇧🇷' },
  { name: 'Argentine', flag: '🇦🇷' },
  { name: 'Colombian', flag: '🇨🇴' },
  { name: 'Chilean', flag: '🇨🇱' },
  { name: 'Peruvian', flag: '🇵🇪' },
  { name: 'Venezuelan', flag: '🇻🇪' },
  { name: 'Cuban', flag: '🇨🇺' },
  { name: 'Australian', flag: '🇦🇺' },
  { name: 'New Zealander', flag: '🇳🇿' },
  { name: 'South African', flag: '🇿🇦' },
  { name: 'Nigerian', flag: '🇳🇬' },
  { name: 'Kenyan', flag: '🇰🇪' },
  { name: 'Ghanaian', flag: '🇬🇭' },
  { name: 'Ethiopian', flag: '🇪🇹' },
  { name: 'Ugandan', flag: '🇺🇬' },
  { name: 'Tanzanian', flag: '🇹🇿' },
  { name: 'Rwandan', flag: '🇷🇼' },
  { name: 'Congolese', flag: '🇨🇩' },
  { name: 'Cameroonian', flag: '🇨🇲' },
  { name: 'Senegalese', flag: '🇸🇳' },
  { name: 'Ivorian', flag: '🇨🇮' },
  { name: 'Mauritanian', flag: '🇲🇷' },
  { name: 'Somali', flag: '🇸🇴' },
  { name: 'Eritrean', flag: '🇪🇷' },
  { name: 'Djiboutian', flag: '🇩🇯' },
  { name: 'Comoran', flag: '🇰🇲' },
  { name: 'Mauritian', flag: '🇲🇺' },
  { name: 'Seychellois', flag: '🇸🇨' },
  { name: 'Maldivian', flag: '🇲🇻' },
  { name: 'Bruneian', flag: '🇧🇳' },
  { name: 'Cambodian', flag: '🇰🇭' },
  { name: 'Burmese', flag: '🇲🇲' },
  { name: 'Laotian', flag: '🇱🇦' },
  { name: 'Mongolian', flag: '🇲🇳' },
  { name: 'Kazakh', flag: '🇰🇿' },
  { name: 'Uzbek', flag: '🇺🇿' },
  { name: 'Turkmen', flag: '🇹🇲' },
  { name: 'Tajik', flag: '🇹🇯' },
  { name: 'Kyrgyz', flag: '🇰🇬' },
  { name: 'Armenian', flag: '🇦🇲' },
  { name: 'Azerbaijani', flag: '🇦🇿' },
  { name: 'Georgian', flag: '🇬🇪' },
  { name: 'Cypriot', flag: '🇨🇾' },
  { name: 'Maltese', flag: '🇲🇹' },
  { name: 'Icelandic', flag: '🇮🇸' },
  { name: 'Luxembourgish', flag: '🇱🇺' },
  { name: 'Liechtenstein', flag: '🇱🇮' },
  { name: 'Monegasque', flag: '🇲🇨' },
  { name: 'Andorran', flag: '🇦🇩' },
  { name: 'Other', flag: '🌍' },
];

interface NationalitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowOther?: boolean;
}

export const NationalitySelect: React.FC<NationalitySelectProps> = ({
  value,
  onChange,
  placeholder = 'Select nationality',
  className = '',
  allowOther = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  const filteredNationalities = NATIONALITIES.filter(nat =>
    nat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    if (val === 'Other' && allowOther) {
      setShowOtherInput(true);
    } else {
      onChange(val);
      setShowOtherInput(false);
    }
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      onChange(otherValue.trim());
      setShowOtherInput(false);
    }
  };

  // Check if current value is custom (not in list)
  const isCustomValue = value && !NATIONALITIES.find(n => n.name === value);
  const displayValue = isCustomValue ? value : '';

  if (showOtherInput || isCustomValue) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Input
          value={otherValue || displayValue}
          onChange={(e) => setOtherValue(e.target.value)}
          placeholder="Type nationality..."
          className="flex-1 bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#B89555]"
          onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmit()}
        />
        <button
          type="button"
          onClick={handleOtherSubmit}
          className="px-4 py-2 bg-[#EFE6D6] text-[#1A1A1A] rounded-md hover:bg-[#EFE6D6]/90 transition-colors text-sm font-medium"
        >
          Set
        </button>
        <button
          type="button"
          onClick={() => {
            setShowOtherInput(false);
            setOtherValue('');
            if (isCustomValue) onChange('');
          }}
          className="px-3 py-2 border-2 border-[#B89555]/30 text-[#1A1A1A] rounded-md hover:bg-[#EFE6D6]/10 transition-colors text-sm"
        >
          ✕
        </button>
      </div>
    );
  }

  const selectedNat = NATIONALITIES.find(n => n.name === value);

  return (
    <Select value={value} onValueChange={handleSelect}>
      <SelectTrigger className={`bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] ${className}`}>
        <SelectValue placeholder={placeholder}>
          {selectedNat && (
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedNat.flag}</span>
              <span>{selectedNat.name}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 max-h-[60vh] z-[9999]">
        {/* Fixed search header - NOT sticky */}
        <div className="p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-b border-[#B89555]/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nationality..."
              className="pl-9 bg-[#FDFBF7]/80 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 h-9"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {/* Items render directly inside SelectContent so Radix's Viewport handles scroll */}
        {filteredNationalities.map(nat => (
          <SelectItem
            key={nat.name}
            value={nat.name}
            className="text-[#1A1A1A] hover:bg-[#EFE6D6]/20 focus:bg-[#EFE6D6]/20"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{nat.flag}</span>
              <span>{nat.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default NationalitySelect;
