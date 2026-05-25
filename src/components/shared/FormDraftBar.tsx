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
  /** Theme: 'gold' | 'blue' | 'purple' | 'dark' */
  theme?: 'gold' | 'blue' | 'purple' | 'dark';
}

const themeMap = {
  gold: {
    bar: 'bg-[#FDFBF7]/40 border border-[#B89555]/30',
    icon: 'text-[#1A1A1A]',
    save: 'bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90',
    newBtn: 'border-[#B89555]/40 text-foreground hover:bg-[#EFE6D6]/10',
  },
  blue: {
    bar: 'bg-[#102540]/15 border border-[#102540]/30 rounded-xl',
    icon: 'text-[#102540]',
    save: 'bg-[#102540] text-white hover:bg-[#1a3d63] rounded-md',
    newBtn: 'border-[#102540]/40 text-[#102540] hover:bg-[#102540]/10 rounded-md',
  },
  purple: {
    bar: 'bg-[#FDFBF7]/40 border border-purple-300/30',
    icon: 'text-purple-600',
    save: 'bg-purple-600 text-white hover:bg-purple-700',
    newBtn: 'border-purple-400/40 text-foreground hover:bg-purple-50',
  },
  dark: {
    bar: 'bg-[#FDFBF7]/60 border border-[#1A1A1A]/50',
    icon: 'text-[#1A1A1A]',
    save: 'bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90',
    newBtn: 'border-[#1A1A1A] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]',
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
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${t.save}`}
        >
          <Save className="w-3.5 h-3.5" /> Save Draft
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/90 text-white hover:bg-red-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${t.newBtn}`}
          >
            <FilePlus className="w-3.5 h-3.5" /> New
          </button>
        )}
      </div>
    </div>
  );
}
