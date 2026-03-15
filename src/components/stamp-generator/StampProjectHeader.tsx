/**
 * StampProjectHeader — Premium project header with centered alignment,
 * generous padding, professional spacing, save status, undo/redo, and action buttons.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Stamp, Undo2, Redo2, MessageSquare, Download,
  Save, Layers, Package, ChevronRight, Check, Loader2
} from 'lucide-react';

interface StampProjectHeaderProps {
  projectName: string;
  languageMode?: string;
  // Undo/redo
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // Navigation
  onBack: () => void;
  onGallery: () => void;
  onToggleChat: () => void;
  onExport: () => void;
  onSaveAsset: () => void;
  onSaveProject?: () => void;
  // State
  selectedId: string | null;
  saving: boolean;
  lastSaved: Date | null;
}

export function StampProjectHeader(props: StampProjectHeaderProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(props.projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameValue(props.projectName);
  }, [props.projectName]);

  useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingName]);

  const saveLabel = props.saving
    ? 'Saving…'
    : props.lastSaved
      ? `Saved ${formatTimeAgo(props.lastSaved)}`
      : '';

  return (
    <div className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-md z-10 shadow-sm">
      <div className="px-5 py-3 flex items-center justify-between gap-4">
        {/* Left: Back + project info */}
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={props.onBack} className="gap-1.5 h-8 text-xs flex-shrink-0 hover:bg-[hsl(var(--gold)/0.06)]">
            <ArrowLeft size={13} /> Projects
          </Button>
          <div className="w-px h-5 bg-[hsl(var(--border))]" />
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center shadow-sm flex-shrink-0">
            <Stamp size={14} className="text-white" />
          </div>

          {editingName ? (
            <input
              ref={inputRef}
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
              className="font-semibold text-sm text-[hsl(var(--foreground))] bg-transparent border-b-2 border-[hsl(var(--gold))] outline-none px-1 min-w-[100px] max-w-[240px]"
            />
          ) : (
            <button onClick={() => setEditingName(true)}
              className="font-semibold text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--gold-dark))] transition-colors truncate max-w-[240px]"
              title="Click to rename">
              {nameValue}
            </button>
          )}

          {props.languageMode && props.languageMode !== 'EN' && (
            <Badge variant="secondary" className="text-[9px] flex-shrink-0 border border-[hsl(var(--gold)/0.3)]">{props.languageMode}</Badge>
          )}

          {/* Save status */}
          {saveLabel && (
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-1 flex-shrink-0">
              {props.saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} className="text-emerald-600" />}
              {saveLabel}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Undo/Redo group */}
          <div className="flex items-center gap-0.5 bg-white rounded-lg border border-[hsl(var(--border))] shadow-sm px-1 py-0.5">
            <button onClick={props.onUndo} disabled={!props.canUndo}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors disabled:opacity-30"
              title="Undo"><Undo2 size={12} /></button>
            <button onClick={props.onRedo} disabled={!props.canRedo}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors disabled:opacity-30"
              title="Redo"><Redo2 size={12} /></button>
          </div>

          <div className="w-px h-4 bg-[hsl(var(--border))]" />

          {/* Save button */}
          {props.onSaveProject && (
            <Button variant="outline" size="sm" onClick={props.onSaveProject} disabled={props.saving}
              className="gap-1.5 text-[11px] h-8 px-3 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)]">
              <Save size={11} /> {props.saving ? 'Saving…' : 'Save'}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={props.onGallery} className="gap-1.5 text-[11px] h-8 px-3">
            <Layers size={11} /> Gallery
          </Button>
          <Button variant="outline" size="sm" onClick={props.onToggleChat} className="gap-1.5 text-[11px] h-8 px-3">
            <MessageSquare size={11} /> Smart Designer
          </Button>
          <Button variant="outline" size="sm" onClick={props.onSaveAsset} disabled={!props.selectedId} className="gap-1.5 text-[11px] h-8 px-3">
            <Package size={11} /> Save Asset
          </Button>
          {props.selectedId && (
            <Button size="sm"
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1.5 text-[11px] h-8 px-3 shadow-sm"
              onClick={props.onExport}>
              <Download size={11} /> Export Pack <ChevronRight size={10} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
