/**
 * StampLetterEditor — Per-letter editing panel for arc text characters.
 * Allows changing color, size, and position (dx/dy) for individual letters.
 */
import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, RotateCcw, Type } from 'lucide-react';
import type { LetterOverride } from '@/lib/stampOfficialTemplate';

export interface LetterSelection {
  /** Arc ID: 'top-arc', 'bottom-arc', 'loc-top', 'loc-bottom' */
  arcId: string;
  /** Character index in the arc text */
  charIndex: number;
  /** The actual character */
  char: string;
}

interface StampLetterEditorProps {
  selection: LetterSelection | null;
  overrides: Record<string, LetterOverride>;
  inkColor: string;
  onUpdate: (key: string, override: LetterOverride | null) => void;
  onClose: () => void;
}

const ARC_LABELS: Record<string, string> = {
  'top-arc': 'Top Arc',
  'bottom-arc': 'Bottom Arc',
  'loc-top': 'Location Top',
  'loc-bottom': 'Location Bottom',
};

export function StampLetterEditor({ selection, overrides, inkColor, onUpdate, onClose }: StampLetterEditorProps) {
  if (!selection) return null;

  const key = `${selection.arcId}-${selection.charIndex}`;
  const current = overrides[key] || {};
  const arcLabel = ARC_LABELS[selection.arcId] || selection.arcId;

  const update = (patch: Partial<LetterOverride>) => {
    const merged = { ...current, ...patch };
    // Clean up undefined/default values
    const cleaned: LetterOverride = {};
    if (merged.color) cleaned.color = merged.color;
    if (merged.fontSize) cleaned.fontSize = merged.fontSize;
    if (merged.dx) cleaned.dx = merged.dx;
    if (merged.dy) cleaned.dy = merged.dy;
    onUpdate(key, Object.keys(cleaned).length > 0 ? cleaned : null);
  };

  const reset = () => onUpdate(key, null);

  const hasOverride = Object.keys(current).length > 0;

  return (
    <div className="border border-[hsl(var(--gold)/0.3)] rounded-lg bg-[hsl(var(--gold)/0.03)] p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type size={13} className="text-[hsl(var(--gold))]" />
          <span className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Letter Editor</span>
          <Badge className="bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-dark))] border-[hsl(var(--gold)/0.3)] text-[9px] px-1.5">
            {arcLabel}
          </Badge>
        </div>
        <button onClick={onClose} className="w-5 h-5 rounded flex items-center justify-center hover:bg-[hsl(var(--muted))]">
          <X size={11} />
        </button>
      </div>

      {/* Selected character display */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="w-12 h-12 rounded-lg bg-[#FDFBF7] border-2 border-[hsl(var(--gold)/0.4)] flex items-center justify-center shadow-sm">
          <span
            className="text-2xl font-bold"
            style={{
              color: current.color || inkColor,
              fontSize: current.fontSize ? `${Math.min(28, current.fontSize * 1.5)}px` : undefined,
            }}
          >
            {selection.char}
          </span>
        </div>
        <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
          <p>Character #{selection.charIndex + 1}</p>
          <p className="font-medium text-[hsl(var(--foreground))]">{arcLabel}</p>
        </div>
      </div>

      {/* Color override */}
      <div>
        <Label className="text-[10px] font-medium mb-1 block">Letter Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={current.color || inkColor}
            onChange={e => update({ color: e.target.value })}
            className="w-7 h-7 rounded border border-[hsl(var(--border))] cursor-pointer"
          />
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
            {current.color || inkColor}
          </span>
          {current.color && (
            <button
              onClick={() => update({ color: undefined })}
              className="text-[9px] text-[hsl(var(--muted-foreground))] hover:text-destructive"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Font size override */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-[10px] font-medium">Size Override</Label>
          <span className="text-[9px] text-[hsl(var(--muted-foreground))] font-mono">
            {current.fontSize ? `${current.fontSize}px` : 'Default'}
          </span>
        </div>
        <Slider
          min={6}
          max={30}
          step={0.5}
          value={[current.fontSize || 14]}
          onValueChange={([v]) => update({ fontSize: v })}
          className="w-full"
        />
      </div>

      {/* Horizontal nudge (dx) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-[10px] font-medium">Horizontal Nudge</Label>
          <span className="text-[9px] text-[hsl(var(--muted-foreground))] font-mono">
            {current.dx ? `${current.dx > 0 ? '+' : ''}${current.dx}px` : '0px'}
          </span>
        </div>
        <Slider
          min={-10}
          max={10}
          step={0.5}
          value={[current.dx || 0]}
          onValueChange={([v]) => update({ dx: v === 0 ? undefined : v })}
          className="w-full"
        />
      </div>

      {/* Vertical nudge (dy) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-[10px] font-medium">Vertical Nudge</Label>
          <span className="text-[9px] text-[hsl(var(--muted-foreground))] font-mono">
            {current.dy ? `${current.dy > 0 ? '+' : ''}${current.dy}px` : '0px'}
          </span>
        </div>
        <Slider
          min={-10}
          max={10}
          step={0.5}
          value={[current.dy || 0]}
          onValueChange={([v]) => update({ dy: v === 0 ? undefined : v })}
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 pt-1">
        {hasOverride && (
          <Button variant="outline" size="sm" onClick={reset} className="flex-1 gap-1 text-[10px] h-7">
            <RotateCcw size={10} /> Reset Letter
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onClose} className="flex-1 text-[10px] h-7">
          Done
        </Button>
      </div>
    </div>
  );
}
