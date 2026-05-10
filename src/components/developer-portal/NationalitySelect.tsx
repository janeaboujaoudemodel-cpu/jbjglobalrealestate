
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NATIONALITIES = [
  { value: 'Emirati', flag: '🇦🇪' },
  { value: 'Saudi', flag: '🇸🇦' },
  { value: 'Bahraini', flag: '🇧🇭' },
  { value: 'Qatari', flag: '🇶🇦' },
  { value: 'Kuwaiti', flag: '🇰🇼' },
  { value: 'Omani', flag: '🇴🇲' },
  { value: 'Jordanian', flag: '🇯🇴' },
  { value: 'Lebanese', flag: '🇱🇧' },
  { value: 'Egyptian', flag: '🇪🇬' },
  { value: 'Moroccan', flag: '🇲🇦' },
  { value: 'Algerian', flag: '🇩🇿' },
  { value: 'Tunisian', flag: '🇹🇳' },
  { value: 'Iraqi', flag: '🇮🇶' },
  { value: 'Syrian', flag: '🇸🇾' },
  { value: 'Palestinian', flag: '🇵🇸' },
  { value: 'Indian', flag: '🇮🇳' },
  { value: 'Pakistani', flag: '🇵🇰' },
  { value: 'Bangladeshi', flag: '🇧🇩' },
  { value: 'Sri Lankan', flag: '🇱🇰' },
  { value: 'Filipino', flag: '🇵🇭' },
  { value: 'Indonesian', flag: '🇮🇩' },
  { value: 'Malaysian', flag: '🇲🇾' },
  { value: 'Singaporean', flag: '🇸🇬' },
  { value: 'Thai', flag: '🇹🇭' },
  { value: 'Vietnamese', flag: '🇻🇳' },
  { value: 'Chinese', flag: '🇨🇳' },
  { value: 'Japanese', flag: '🇯🇵' },
  { value: 'South Korean', flag: '🇰🇷' },
  { value: 'British', flag: '🇬🇧' },
  { value: 'Irish', flag: '🇮🇪' },
  { value: 'French', flag: '🇫🇷' },
  { value: 'German', flag: '🇩🇪' },
  { value: 'Italian', flag: '🇮🇹' },
  { value: 'Spanish', flag: '🇪🇸' },
  { value: 'Portuguese', flag: '🇵🇹' },
  { value: 'Dutch', flag: '🇳🇱' },
  { value: 'Belgian', flag: '🇧🇪' },
  { value: 'Swiss', flag: '🇨🇭' },
  { value: 'Austrian', flag: '🇦🇹' },
  { value: 'Swedish', flag: '🇸🇪' },
  { value: 'Norwegian', flag: '🇳🇴' },
  { value: 'Danish', flag: '🇩🇰' },
  { value: 'Finnish', flag: '🇫🇮' },
  { value: 'Polish', flag: '🇵🇱' },
  { value: 'Czech', flag: '🇨🇿' },
  { value: 'Greek', flag: '🇬🇷' },
  { value: 'Turkish', flag: '🇹🇷' },
  { value: 'Israeli', flag: '🇮🇱' },
  { value: 'Iranian', flag: '🇮🇷' },
  { value: 'Russian', flag: '🇷🇺' },
  { value: 'Ukrainian', flag: '🇺🇦' },
  { value: 'American', flag: '🇺🇸' },
  { value: 'Canadian', flag: '🇨🇦' },
  { value: 'Mexican', flag: '🇲🇽' },
  { value: 'Brazilian', flag: '🇧🇷' },
  { value: 'Argentine', flag: '🇦🇷' },
  { value: 'Colombian', flag: '🇨🇴' },
  { value: 'Chilean', flag: '🇨🇱' },
  { value: 'Peruvian', flag: '🇵🇪' },
  { value: 'Australian', flag: '🇦🇺' },
  { value: 'New Zealander', flag: '🇳🇿' },
  { value: 'South African', flag: '🇿🇦' },
  { value: 'Nigerian', flag: '🇳🇬' },
  { value: 'Kenyan', flag: '🇰🇪' },
  { value: 'Ghanaian', flag: '🇬🇭' },
  { value: 'Ethiopian', flag: '🇪🇹' },
  { value: 'Ugandan', flag: '🇺🇬' },
  { value: 'Tanzanian', flag: '🇹🇿' },
];

interface NationalitySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const NationalitySelect: React.FC<NationalitySelectProps> = ({ value, onChange, className = '' }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`border-2 border-[#B89555]/30 ${className}`}>
        <SelectValue placeholder="Select nationality">
          {value && (
            <span className="flex items-center gap-2">
              <span className="text-lg">{NATIONALITIES.find(n => n.value === value)?.flag}</span>
              <span>{value}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 max-h-[300px] overflow-y-auto z-[9999]">
        {NATIONALITIES.map(nat => (
          <SelectItem
            key={nat.value}
            value={nat.value}
            className="text-[#1A1A1A] hover:bg-[#EFE6D6]/20 focus:bg-[#EFE6D6]/20"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{nat.flag}</span>
              <span>{nat.value}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default NationalitySelect;
