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
          className="flex-1 bg-white border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold"
          onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmit()}
        />
        <Button
          type="button"
          onClick={handleOtherSubmit}
          className="bg-gold text-black hover:bg-gold/90"
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
          className="border-gold/30 text-black hover:bg-gold/10"
        >
          ✕
        </Button>
      </div>
    );
  }

  const selectedOption = options.find(o => o.value === value);

  return (
    <Select value={value} onValueChange={handleSelect}>
      <SelectTrigger className={`bg-white border-2 border-gold/30 text-black ${className}`}>
        <SelectValue placeholder={placeholder}>
          {selectedOption?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 max-h-[300px] overflow-y-auto z-[9999]">
        <div className="sticky top-0 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 bg-white/80 border-gold/30 text-black placeholder:text-black/40 h-9"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {filteredOptions.map(opt => (
          <SelectItem 
            key={opt.value} 
            value={opt.value}
            className="text-black hover:bg-gold/20 focus:bg-gold/20"
          >
            {opt.label}
          </SelectItem>
        ))}
        {allowOther && (
          <>
            <div className="h-px bg-gold/20 my-1" />
            <SelectItem 
              value="__other__"
              className="text-gold hover:bg-gold/20 focus:bg-gold/20"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Other (Type custom)
              </span>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
};

export default SearchableSelectWithOther;
