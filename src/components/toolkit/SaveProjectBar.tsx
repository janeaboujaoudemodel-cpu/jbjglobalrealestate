/**
 * Shared Save Project Bar — used across all toolkit tools
 * Provides: project name (editable), Save Draft, Save, Clear, Create New, Load Previous
 */

import React, { useState } from 'react';
import { Save, Trash2, FolderOpen, X, FilePlus2, History, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DraftEntry {
  key: string;
  name: string;
  savedAt: string;
}

interface SaveProjectBarProps {
  projectName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClear: () => void;
  onCreateNew?: () => void;
  onLoadDraft?: (key: string) => void;
  canSave?: boolean;
  accentColor?: string;
  accentBorder?: string;
  toolId?: string; // for draft storage key prefix
}

export function SaveProjectBar({
  projectName,
  onNameChange,
  onSave,
  onClear,
  onCreateNew,
  onLoadDraft,
  canSave = true,
  accentColor = "#2563EB",
  accentBorder = "rgba(37,99,235,0.2)",
  toolId = "generic",
}: SaveProjectBarProps) {
  const [editing, setEditing] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  // Load drafts from localStorage
  const getDrafts = (): DraftEntry[] => {
    const drafts: DraftEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`jbj_draft_${toolId}_`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          drafts.push({ key, name: data.name || 'Untitled', savedAt: data.savedAt || '' });
        } catch { /* skip */ }
      }
    }
    return drafts.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  };

  const saveDraft = () => {
    const key = `jbj_draft_${toolId}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({ name: projectName, savedAt: new Date().toISOString() }));
    toast.success(`Draft "${projectName}" saved`);
  };

  const deleteDraft = (key: string) => {
    localStorage.removeItem(key);
    toast.success('Draft deleted');
    setShowDrafts(false);
    setTimeout(() => setShowDrafts(true), 50);
  };

  const drafts = showDrafts ? getDrafts() : [];

  return (
    <div className="relative">
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/30 shadow-sm"
      >
        {/* Project name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FolderOpen className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
          {editing ? (
            <Input
              value={projectName}
              onChange={e => onNameChange(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditing(false); }}
              autoFocus
              className="h-7 text-sm font-semibold bg-transparent border-0 border-b-2 rounded-none focus:ring-0 px-0 text-[#1A1A1A]"
              style={{ borderBottomColor: accentColor }}
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-[#1A1A1A] hover:text-[#1A1A1A]/70 transition-colors truncate text-left"
              title="Click to rename project"
            >
              {projectName}
            </button>
          )}
          <span className="text-[10px] shrink-0 text-[#1A1A1A]/70">(click to rename)</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#F7F2EA]"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> New
            </button>
          )}
          <button
            onClick={() => setShowDrafts(!showDrafts)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#F7F2EA]"
          >
            <History className="w-3.5 h-3.5" /> Drafts <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => { saveDraft(); onSave(); }}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
            style={{ background: accentColor, boxShadow: `0 2px 12px ${accentColor}40` }}
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button
            onClick={onClear}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* Drafts dropdown */}
      {showDrafts && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#FDFBF7] rounded-xl border border-[#B89555]/30 shadow-xl max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-[#B89555]/30">
            <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider">Recent Drafts</p>
          </div>
          {drafts.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#1A1A1A]/70">No drafts saved yet</div>
          ) : (
            drafts.slice(0, 10).map(draft => (
              <div key={draft.key} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F7F2EA] transition-colors border-b border-[#B89555]/30 last:border-0">
                <button
                  onClick={() => { onLoadDraft?.(draft.key); setShowDrafts(false); }}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-medium text-[#1A1A1A]">{draft.name}</p>
                  <p className="text-[10px] text-[#1A1A1A]/70">{new Date(draft.savedAt).toLocaleString()}</p>
                </button>
                <button onClick={() => deleteDraft(draft.key)} className="p-1 text-[#1A1A1A]/70 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Outer border wrapper to hold all tool content together */
export function ToolContentWrapper({
  children,
  accentColor = "#2563EB",
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="rounded-2xl p-5 sm:p-7 bg-[#FDFBF7] border border-[#B89555]/30 shadow-sm">
      {children}
    </div>
  );
}
