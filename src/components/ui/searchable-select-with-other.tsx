import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';

interface SearchableSelectWithOtherProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  allowOther?: boolean;
  otherPlaceholder?: string;
}

export const SearchableSelectWithOther: React.FC<SearchableSelectWithOtherProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  allowOther = true,
  otherPlaceholder = 'Type custom value...'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    if (val === '__other__' && allowOther) {
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
      setOtherValue('');
    }
  };

  // Check if current value is custom (not in options)
  const isCustomValue = value && !options.find(o => o.value === value);
  const displayValue = isCustomValue ? value : '';

  if (showOtherInput || isCustomValue) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Input
          value={otherValue || displayValue}
          onChange={(e) => setOtherValue(e.target.value)}
          placeholder={otherPlaceholder}
          className="flex-1 bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#B89555]"
          onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmit()}
        />
        <Button
          type="button"
          onClick={handleOtherSubmit}
          className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
        >
          Set
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowOtherInput(false);
            setOtherValue('');
            if (isCustomValue) onChange('');
          }}
          className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
        >
          ✕
        </Button>
      </div>
    );
  }

  const selectedOption = options.find(o => o.value === value);

  return (
    <Select value={value} onValueChange={handleSelect}>
      <SelectTrigger className={`bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] ${className}`}>
        <SelectValue placeholder={placeholder}>
          {selectedOption?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 max-h-[300px] z-[9999]">
        {/* Fixed search header - NOT sticky, stays at top outside scroll area */}
        <div className="p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-b border-[#B89555]/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 bg-[#FDFBF7]/80 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 h-9"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {/* Scrollable options area */}
        <div className="max-h-[200px] overflow-y-auto">
          {filteredOptions.map(opt => (
            <SelectItem 
              key={opt.value} 
              value={opt.value}
              className="text-[#1A1A1A] hover:bg-[#EFE6D6]/20 focus:bg-[#EFE6D6]/20"
            >
              {opt.label}
            </SelectItem>
          ))}
          {allowOther && (
            <>
              <div className="h-px bg-[#EFE6D6]/20 my-1" />
              <SelectItem 
                value="__other__"
                className="text-[#1A1A1A] hover:bg-[#EFE6D6]/20 focus:bg-[#EFE6D6]/20"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Other (Type custom)
                </span>
              </SelectItem>
            </>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};

export default SearchableSelectWithOther;
