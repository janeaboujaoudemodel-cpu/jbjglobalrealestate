import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Globe } from 'lucide-react';

// Language → flag emoji mapping
const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇬🇧',
  'Arabic': '🇸🇦',
  'Hindi': '🇮🇳',
  'Urdu': '🇵🇰',
  'Bengali': '🇧🇩',
  'Punjabi': '🇮🇳',
  'Tamil': '🇮🇳',
  'Telugu': '🇮🇳',
  'Malayalam': '🇮🇳',
  'Kannada': '🇮🇳',
  'Marathi': '🇮🇳',
  'Gujarati': '🇮🇳',
  'Tagalog': '🇵🇭',
  'Cebuano': '🇵🇭',
  'Ilocano': '🇵🇭',
  'French': '🇫🇷',
  'German': '🇩🇪',
  'Spanish': '🇪🇸',
  'Portuguese': '🇵🇹',
  'Italian': '🇮🇹',
  'Dutch': '🇳🇱',
  'Polish': '🇵🇱',
  'Romanian': '🇷🇴',
  'Greek': '🇬🇷',
  'Swedish': '🇸🇪',
  'Norwegian': '🇳🇴',
  'Danish': '🇩🇰',
  'Finnish': '🇫🇮',
  'Russian': '🇷🇺',
  'Ukrainian': '🇺🇦',
  'Belarusian': '🇧🇾',
  'Chinese (Mandarin)': '🇨🇳',
  'Chinese (Cantonese)': '🇭🇰',
  'Japanese': '🇯🇵',
  'Korean': '🇰🇷',
  'Vietnamese': '🇻🇳',
  'Thai': '🇹🇭',
  'Indonesian': '🇮🇩',
  'Malay': '🇲🇾',
  'Burmese': '🇲🇲',
  'Khmer': '🇰🇭',
  'Turkish': '🇹🇷',
  'Persian (Farsi)': '🇮🇷',
  'Kurdish': '🇮🇶',
  'Pashto': '🇦🇫',
  'Dari': '🇦🇫',
  'Hebrew': '🇮🇱',
  'Amharic': '🇪🇹',
  'Swahili': '🇰🇪',
  'Somali': '🇸🇴',
  'Hausa': '🇳🇬',
  'Yoruba': '🇳🇬',
  'Igbo': '🇳🇬',
  'Zulu': '🇿🇦',
  'Afrikaans': '🇿🇦',
  'Nepali': '🇳🇵',
  'Sinhala': '🇱🇰',
  'Serbian': '🇷🇸',
  'Croatian': '🇭🇷',
  'Bosnian': '🇧🇦',
  'Slovenian': '🇸🇮',
  'Czech': '🇨🇿',
  'Slovak': '🇸🇰',
  'Hungarian': '🇭🇺',
  'Bulgarian': '🇧🇬',
  'Macedonian': '🇲🇰',
  'Albanian': '🇦🇱',
  'Armenian': '🇦🇲',
  'Georgian': '🇬🇪',
  'Azerbaijani': '🇦🇿',
  'Kazakh': '🇰🇿',
  'Uzbek': '🇺🇿',
  'Mongolian': '🇲🇳',
  'Tibetan': '🇨🇳',
  'Sign Language (ASL)': '🤟',
  'Sign Language (BSL)': '🤟',
  'Sign Language (Arabic)': '🤟',
};

const LANGUAGES = Object.keys(LANGUAGE_FLAGS);

const getFlag = (lang: string): string => {
  return LANGUAGE_FLAGS[lang] || '';
};

interface LanguageMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export const LanguageMultiSelect: React.FC<LanguageMultiSelectProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggle = (language: string) => {
    if (value.includes(language)) {
      onChange(value.filter(l => l !== language));
    } else {
      onChange([...value, language]);
    }
  };

  const handleAddOther = () => {
    if (otherValue.trim() && !value.includes(otherValue.trim())) {
      onChange([...value, otherValue.trim()]);
      setOtherValue('');
      setShowOtherInput(false);
    }
  };

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search languages..."
        className="bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#B89555]"
      />

      {/* Selected languages */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-[#EFE6D6]/10 rounded-lg border border-[#B89555]/20">
          {value.map(lang => (
            <span 
              key={lang}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EFE6D6] text-[#1A1A1A] text-sm rounded-md"
            >
              <span className="text-base leading-none">{getFlag(lang)}</span>
              {!getFlag(lang) && <Globe className="w-3.5 h-3.5" />}
              {lang}
              <button
                type="button"
                onClick={() => handleToggle(lang)}
                className="hover:text-red-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Language buttons */}
      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
        {filteredLanguages.map(lang => (
          <Button
            key={lang}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleToggle(lang)}
            className={`border-2 border-[#B89555]/30 transition-all ${
              value.includes(lang)
                ? 'bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90 border-[#B89555]'
                : 'text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:border-[#B89555]'
            }`}
          >
            <span className="mr-1.5 text-base leading-none">{getFlag(lang)}</span>
            {!getFlag(lang) && <Globe className="w-3.5 h-3.5 mr-1" />}
            {lang}
          </Button>
        ))}
      </div>

      {/* Other input */}
      {showOtherInput ? (
        <div className="flex gap-2">
          <Input
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            placeholder="Type language name..."
            className="flex-1 bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#B89555]"
            onKeyDown={(e) => e.key === 'Enter' && handleAddOther()}
          />
          <Button
            type="button"
            onClick={handleAddOther}
            className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
          >
            Add
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowOtherInput(false);
              setOtherValue('');
            }}
            className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowOtherInput(true)}
          className="border-2 border-dashed border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:border-[#B89555] w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Other Language
        </Button>
      )}
    </div>
  );
};

export default LanguageMultiSelect;
