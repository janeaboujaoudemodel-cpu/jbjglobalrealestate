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
    bar: 'bg-white/40 border border-gold/30',
    icon: 'text-gold',
    save: 'bg-gold text-black hover:bg-gold/90',
    newBtn: 'border-gold/40 text-foreground hover:bg-gold/10',
  },
  blue: {
    bar: 'bg-white/40 border border-blue-300/30',
    icon: 'text-blue-600',
    save: 'bg-blue-600 text-white hover:bg-blue-700',
    newBtn: 'border-blue-400/40 text-foreground hover:bg-blue-50',
  },
  purple: {
    bar: 'bg-white/40 border border-purple-300/30',
    icon: 'text-purple-600',
    save: 'bg-purple-600 text-white hover:bg-purple-700',
    newBtn: 'border-purple-400/40 text-foreground hover:bg-purple-50',
  },
  dark: {
    bar: 'bg-zinc-900/60 border border-zinc-700/50',
    icon: 'text-gold',
    save: 'bg-gold text-black hover:bg-gold/90',
    newBtn: 'border-zinc-600 text-zinc-300 hover:bg-zinc-800',
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
