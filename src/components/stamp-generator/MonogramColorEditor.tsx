/**
 * MonogramColorEditor — Per-letter color editing for monogram center content.
 * Allows individual letter color overrides + divider accent color.
 */
import React, { useState } from 'react';
import { Palette, RotateCw } from 'lucide-react';

export interface MonogramLetterColors {
  /** Per-letter fill overrides keyed by character index (0, 1, 2) */
  letters: Record<number, string>;
  /** Divider / accent line color */
  divider: string | null;
  /** Apply same color to all letters */
  allLetters: string | null;
}

export const DEFAULT_MONOGRAM_COLORS: MonogramLetterColors = {
  letters: {},
  divider: null,
  allLetters: null,
};

interface Props {
  monogramText: string;
  colors: MonogramLetterColors;
  onChange: (colors: MonogramLetterColors) => void;
  defaultColor: string;
}

export function MonogramColorEditor({ monogramText, colors, onChange, defaultColor }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | 'divider' | 'all'>('all');
  const letters = monogramText.toUpperCase().slice(0, 3).split('');

  if (letters.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Enter monogram text to edit letter colors</p>
      </div>
    );
  }

  const getLetterColor = (i: number) => colors.letters[i] || colors.allLetters || defaultColor;
  const getDividerColor = () => colors.divider || defaultColor;

  function handleColorChange(hex: string) {
    if (activeIndex === 'all') {
      onChange({ ...colors, allLetters: hex, letters: {} });
    } else if (activeIndex === 'divider') {
      onChange({ ...colors, divider: hex });
    } else {
      onChange({ ...colors, letters: { ...colors.letters, [activeIndex]: hex }, allLetters: null });
    }
  }

  function handleReset() {
    onChange(DEFAULT_MONOGRAM_COLORS);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] flex items-center gap-1">
          <Palette size={10} className="text-[hsl(var(--gold))]" /> Monogram Colors
        </p>
        <button
          onClick={handleReset}
          className="text-[8px] px-1.5 py-0.5 rounded border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)] hover:text-[hsl(var(--gold-dark))] transition-all flex items-center gap-0.5"
        >
          <RotateCw size={7} /> Reset
        </button>
      </div>

      {/* Letter selector — large clickable letters */}
      <div className="flex items-center justify-center gap-2">
        {/* All Letters button */}
        <button
          onClick={() => setActiveIndex('all')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all min-w-[44px] ${
            activeIndex === 'all'
              ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]'
              : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
          }`}
        >
          <span className="text-[14px] font-bold tracking-wide" style={{ color: colors.allLetters || defaultColor }}>
            {letters.join('')}
          </span>
          <span className="text-[7px] text-[hsl(var(--muted-foreground))]">All</span>
        </button>

        <div className="w-px h-8 bg-[hsl(var(--border))]" />

        {/* Individual letters */}
        {letters.map((letter, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all min-w-[36px] ${
              activeIndex === i
                ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]'
                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
            }`}
          >
            <span className="text-[18px] font-bold" style={{ color: getLetterColor(i) }}>
              {letter}
            </span>
            <span className="text-[7px] text-[hsl(var(--muted-foreground))]">#{i + 1}</span>
          </button>
        ))}

        <div className="w-px h-8 bg-[hsl(var(--border))]" />

        {/* Divider accent */}
        <button
          onClick={() => setActiveIndex('divider')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all min-w-[36px] ${
            activeIndex === 'divider'
              ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]'
              : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
          }`}
        >
          <div className="w-5 h-[3px] rounded-full" style={{ backgroundColor: getDividerColor() }} />
          <span className="text-[7px] text-[hsl(var(--muted-foreground))]">Line</span>
        </button>
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={
            activeIndex === 'all'
              ? colors.allLetters || defaultColor
              : activeIndex === 'divider'
              ? getDividerColor()
              : getLetterColor(activeIndex as number)
          }
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer"
        />
        <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
          {activeIndex === 'all'
            ? 'Color for all letters'
            : activeIndex === 'divider'
            ? 'Divider accent color'
            : `Color for letter "${letters[activeIndex as number]}"`}
        </span>
      </div>

      {/* Quick color swatches */}
      <div className="flex flex-wrap gap-1">
        {[defaultColor, '#0d0d0d', '#ffffff', '#B8860B', '#1B3A8C', '#8B0000', '#1B4332', '#4B0082'].map((hex) => (
          <button
            key={hex}
            onClick={() => handleColorChange(hex)}
            className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${
              hex === '#ffffff' ? 'border-[hsl(var(--border))]' : 'border-white shadow-sm'
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Inject per-letter monogram colors into SVG.
 * Replaces single-fill monogram `<text>` with individually colored `<tspan>` elements.
 */
export function applyMonogramColors(
  svgSource: string,
  monogramText: string,
  letterColors: MonogramLetterColors,
  defaultColor: string
): string {
  if (!monogramText) return svgSource;

  const mono = monogramText.toUpperCase().slice(0, 3);
  
  // Find monogram text element (dominant-baseline="central" near center)
  const monoRegex = /<text([^>]*dominant-baseline="central"[^>]*)>[^<]*<\/text>/gi;
  
  return svgSource.replace(monoRegex, (match, attrs) => {
    // Check if this has per-letter colors
    const hasCustomColors = Object.keys(letterColors.letters).length > 0 || letterColors.allLetters;
    
    if (!hasCustomColors) return match;

    // Build tspan elements for each letter
    const tspans = mono.split('').map((char, i) => {
      const fill = letterColors.letters[i] || letterColors.allLetters || defaultColor;
      return `<tspan fill="${fill}">${char}</tspan>`;
    }).join('');

    // Remove existing fill from attrs since tspans handle it
    const cleanAttrs = attrs.replace(/\bfill="[^"]*"/gi, '');
    
    return `<text${cleanAttrs}>${tspans}</text>`;
  });
}
