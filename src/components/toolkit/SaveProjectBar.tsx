/**
 * Shared Save Project Bar — used across all toolkit tools
 * Provides: project name (editable), Save, Clear, Delete actions
 */

import React, { useState } from 'react';
import { Save, Trash2, FolderOpen, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SaveProjectBarProps {
  projectName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClear: () => void;
  canSave?: boolean;
  accentColor?: string;
  accentBorder?: string;
}

export function SaveProjectBar({
  projectName,
  onNameChange,
  onSave,
  onClear,
  canSave = true,
  accentColor = "#6366F1",
  accentBorder = "rgba(99,102,241,0.3)",
}: SaveProjectBarProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: `${accentColor}08`, border: `1px solid ${accentBorder}` }}
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
            className="h-7 text-sm font-semibold text-white bg-transparent border-0 border-b-2 rounded-none focus:ring-0 px-0"
            style={{ borderBottomColor: accentColor }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-white hover:opacity-70 transition-opacity truncate text-left"
            title="Click to rename project"
          >
            {projectName}
          </button>
        )}
        <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
          (click to rename)
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSave}
          disabled={!canSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
          style={{ background: accentColor, boxShadow: `0 2px 12px ${accentColor}55` }}
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button
          onClick={onClear}
          disabled={!canSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
          style={{ background: "rgba(239,68,68,0.75)", border: "1px solid rgba(239,68,68,0.6)" }}
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}

/** Outer border wrapper to hold all tool content together */
export function ToolContentWrapper({
  children,
  accentColor = "#6366F1",
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      className="rounded-3xl p-5 sm:p-7"
      style={{
        border: `1.5px solid ${accentColor}28`,
        background: `${accentColor}03`,
        boxShadow: `0 0 60px ${accentColor}06, 0 4px 40px rgba(0,0,0,0.5)`,
      }}
    >
      {children}
    </div>
  );
}
