/**
 * StampProjectHeader — Project name, save status, version display, undo/redo, and action buttons.
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
    <div className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm z-10">
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        {/* Left: Back + project info */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={props.onBack} className="gap-1 h-7 text-xs flex-shrink-0">
            <ArrowLeft size={12} /> Projects
          </Button>
          <div className="w-px h-4 bg-[hsl(var(--border))]" />
          <Stamp size={14} className="text-[hsl(var(--gold))] flex-shrink-0" />

          {editingName ? (
            <input
              ref={inputRef}
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
              className="font-medium text-xs text-[hsl(var(--foreground))] bg-transparent border-b-2 border-[hsl(var(--gold))] outline-none px-0.5 min-w-[80px] max-w-[200px]"
            />
          ) : (
            <button onClick={() => setEditingName(true)}
              className="font-medium text-xs text-[hsl(var(--foreground))] hover:text-[hsl(var(--gold-dark))] transition-colors truncate max-w-[200px]"
              title="Click to rename">
              {nameValue}
            </button>
          )}

          {props.languageMode && props.languageMode !== 'EN' && (
            <Badge variant="secondary" className="text-[9px] flex-shrink-0">{props.languageMode}</Badge>
          )}

          {/* Save status */}
          {saveLabel && (
            <span className="text-[9px] text-[hsl(var(--muted-foreground))] flex items-center gap-1 flex-shrink-0">
              {props.saving ? <Loader2 size={9} className="animate-spin" /> : <Check size={9} className="text-emerald-600" />}
              {saveLabel}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={props.onUndo} disabled={!props.canUndo}
            className="w-6 h-6 rounded-md border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors disabled:opacity-30"
            title="Undo"><Undo2 size={11} /></button>
          <button onClick={props.onRedo} disabled={!props.canRedo}
            className="w-6 h-6 rounded-md border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors disabled:opacity-30"
            title="Redo"><Redo2 size={11} /></button>
          <div className="w-px h-3.5 bg-[hsl(var(--border))]" />
          <Button variant="outline" size="sm" onClick={props.onGallery} className="gap-1 text-[10px] h-7">
            <Layers size={10} /> Gallery
          </Button>
          <Button variant="outline" size="sm" onClick={props.onToggleChat} className="gap-1 text-[10px] h-7">
            <MessageSquare size={10} /> Smart Designer
          </Button>
          <Button variant="outline" size="sm" onClick={props.onSaveAsset} disabled={!props.selectedId} className="gap-1 text-[10px] h-7">
            <Package size={10} /> Save Asset
          </Button>
          {props.selectedId && (
            <Button size="sm"
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1 text-[10px] h-7"
              onClick={props.onExport}>
              <Download size={10} /> Export Pack <ChevronRight size={10} />
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
