/**
 * FormDraftBar — Reusable draft/reset/new action bar for all submission forms.
 * Consistent Save Draft, Reset, and New Application actions.
 */
import React from 'react';
import { Clock, Save, RotateCcw, FilePlus } from 'lucide-react';

interface FormDraftBarProps {
  hasDraft: boolean;
  onSaveDraft: () => void;
  onReset: () => void;
  onNew?: () => void;
  label?: string;
  /** Theme: legacy names are retained, but AI/listing tools must resolve to JBJ emerald/black — never purple. */
  theme?: 'gold' | 'blue' | 'purple' | 'dark' | 'emerald';
}

const emeraldTheme = {
  bar: 'bg-[#FDFBF7]/70 border border-[#064E3B]/35 rounded-xl',
  icon: 'text-[#064E3B]',
  save: 'bg-[#064E3B] text-white hover:bg-[#042C1C] rounded-md',
  newBtn: 'border-[#064E3B]/50 text-[#064E3B] hover:bg-[#064E3B]/10 rounded-md',
};

const themeMap = {
  gold: {
    bar: 'bg-[#FDFBF7]/40 border border-[#064E3B]/30',
    icon: 'text-[#1A1A1A]',
    save: 'bg-[#064E3B] text-white hover:bg-[#042C1C]',
    newBtn: 'border-[#064E3B]/40 text-[#064E3B] hover:bg-[#064E3B]/10',
  },
  blue: emeraldTheme,
  purple: emeraldTheme,
  emerald: emeraldTheme,
  dark: {
    bar: 'bg-[#042C1C]/60 border border-white/35 rounded-xl',
    icon: 'text-white',
    save: 'bg-[#064E3B] text-white hover:bg-[#042C1C] rounded-md',
    newBtn: 'border-white/45 text-white hover:bg-white/10 rounded-md',
  },
};

export function FormDraftBar({
  hasDraft,
  onSaveDraft,
  onReset,
  onNew,
  label = 'Application',
  theme = 'gold',
}: FormDraftBarProps) {
  const t = themeMap[theme];

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 mb-6 ${t.bar}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Clock className={`w-4 h-4 flex-shrink-0 ${t.icon}`} />
        <span className="text-sm font-medium truncate">
          {hasDraft ? 'Draft saved — continue where you left off' : `New ${label}`}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onSaveDraft}
          data-no-contrast-guard
          data-on-dark
          data-allow-dark-cta
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${t.save}`}
          style={theme === 'blue' || theme === 'purple' || theme === 'emerald' || theme === 'dark' ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}
        >
          <Save className="w-3.5 h-3.5" style={theme === 'blue' || theme === 'purple' || theme === 'emerald' || theme === 'dark' ? { color: '#FFFFFF' } : undefined} /> <span style={theme === 'blue' || theme === 'purple' || theme === 'emerald' || theme === 'dark' ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}>Save Draft</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          data-no-contrast-guard
          data-on-dark
          data-allow-dark-cta
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#B91C1C] hover:bg-[#991B1B] transition-colors rounded-md"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          <RotateCcw className="w-3.5 h-3.5" style={{ color: "#FFFFFF" }} /> <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Reset</span>
        </button>
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            data-no-contrast-guard
            data-on-dark
            data-allow-dark-cta
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#064E3B] hover:bg-[#042C1C] transition-colors rounded-md"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            <FilePlus className="w-3.5 h-3.5" style={{ color: "#FFFFFF" }} /> <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>New</span>
          </button>
        )}
      </div>
    </div>
  );
}
