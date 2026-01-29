import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

// Comprehensive language list
const LANGUAGES = [
  'English', 'Arabic', 'Hindi', 'Urdu', 'Bengali', 'Punjabi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Gujarati',
  'Tagalog', 'Cebuano', 'Ilocano',
  'French', 'German', 'Spanish', 'Portuguese', 'Italian', 'Dutch', 'Polish', 'Romanian', 'Greek', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Russian', 'Ukrainian', 'Belarusian',
  'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Japanese', 'Korean', 'Vietnamese', 'Thai', 'Indonesian', 'Malay', 'Burmese', 'Khmer',
  'Turkish', 'Persian (Farsi)', 'Kurdish', 'Pashto', 'Dari',
  'Hebrew', 'Amharic', 'Swahili', 'Somali', 'Hausa', 'Yoruba', 'Igbo', 'Zulu', 'Afrikaans',
  'Nepali', 'Sinhala',
  'Serbian', 'Croatian', 'Bosnian', 'Slovenian', 'Czech', 'Slovak', 'Hungarian', 'Bulgarian', 'Macedonian', 'Albanian',
  'Armenian', 'Georgian', 'Azerbaijani', 'Kazakh', 'Uzbek',
  'Mongolian', 'Tibetan',
  'Sign Language (ASL)', 'Sign Language (BSL)', 'Sign Language (Arabic)',
];

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

  // Get custom languages (ones not in the default list)
  const customLanguages = value.filter(v => !LANGUAGES.includes(v));

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search languages..."
        className="bg-white border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold"
      />

      {/* Selected languages */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gold/10 rounded-lg border border-gold/20">
          {value.map(lang => (
            <span 
              key={lang}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gold text-black text-sm rounded-md"
            >
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
            className={`border-2 border-gold/30 transition-all ${
              value.includes(lang)
                ? 'bg-gold text-black hover:bg-gold/90 border-gold'
                : 'text-black hover:bg-gold/10 hover:border-gold'
            }`}
          >
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
            className="flex-1 bg-white border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold"
            onKeyDown={(e) => e.key === 'Enter' && handleAddOther()}
          />
          <Button
            type="button"
            onClick={handleAddOther}
            className="bg-gold text-black hover:bg-gold/90"
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
            className="border-gold/30 text-black hover:bg-gold/10"
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
          className="border-2 border-dashed border-gold/40 text-black hover:bg-gold/10 hover:border-gold w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Other Language
        </Button>
      )}
    </div>
  );
};

export default LanguageMultiSelect;
