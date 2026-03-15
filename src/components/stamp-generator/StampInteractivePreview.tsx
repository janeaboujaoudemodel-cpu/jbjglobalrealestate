/**
 * StampInteractivePreview — Click-to-edit overlay for stamp SVG preview.
 * Single-click selects individual letter; double-click selects full word/arc.
 * Dispatches language-specific events to auto-open only the relevant sidebar panel.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StampSVGRenderer } from './StampSVGRenderer';
import { mutateTextElement } from './StampTextEditor';
import {
  Pencil, Trash2, Check, X, Move, Eye, EyeOff, Palette,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Type, Maximize2, Minimize2, Replace, LayoutGrid,
} from 'lucide-react';
import { ALL_SEPARATOR_STYLES, separatorLabel, type SeparatorStyle, type CenterContentMode, type CenterIconType } from '@/lib/stampOfficialTemplate';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface HitZone {
  id: string;
  rect: DOMRect;
  label: string;
  type: 'arc-text' | 'separator' | 'center' | 'registration' | 'location';
}

const ELEMENT_LABELS: Record<string, { label: string; type: HitZone['type'] }> = {
  'top-arc': { label: 'Arabic Company Name (Top)', type: 'arc-text' },
  'bottom-arc': { label: 'English Company Name (Bottom)', type: 'arc-text' },
  'separator-left': { label: 'Left Separator', type: 'separator' },
  'separator-right': { label: 'Right Separator', type: 'separator' },
  'loc-top': { label: 'Arabic Location (Top)', type: 'location' },
  'loc-bottom': { label: 'English Location (Bottom)', type: 'location' },
  'loc-separator-left': { label: 'Location Separator Left', type: 'separator' },
  'loc-separator-right': { label: 'Location Separator Right', type: 'separator' },
  'center': { label: 'Center Content', type: 'center' },
  'registration': { label: 'Registration Number', type: 'registration' },
  'border-outer': { label: 'Outer Ring', type: 'center' },
  'border-middle': { label: 'Middle Ring', type: 'center' },
  'border-inner': { label: 'Inner Ring', type: 'center' },
  'border-decorative': { label: 'Decorative Ring', type: 'center' },
};

const CENTER_MODES: { value: CenterContentMode; label: string }[] = [
  { value: 'monogram', label: 'Monogram' },
  { value: 'initials', label: 'Initials' },
  { value: 'logo', label: 'Logo' },
  { value: 'icon', label: 'Icon' },
  { value: 'license', label: 'License' },
  { value: 'none', label: 'Empty' },
];

const CENTER_ICONS: { value: CenterIconType; label: string }[] = [
  { value: 'shield', label: '🛡 Shield' },
  { value: 'crown', label: '👑 Crown' },
  { value: 'building', label: '🏢 Building' },
  { value: 'globe', label: '🌐 Globe' },
];

/** Determine language from element ID */
function getLanguageFromElement(id: string): 'arabic' | 'english' | null {
  if (id === 'top-arc' || id === 'loc-top') return 'arabic';
  if (id === 'bottom-arc' || id === 'loc-bottom') return 'english';
  return null;
}

/** Element selection type for contextual sidebar wiring */
export type SelectedElementType =
  | 'arabic-company' | 'english-company' | 'arabic-location' | 'english-location'
  | 'monogram' | 'logo' | 'separator-left' | 'separator-right'
  | 'outer-ring' | 'middle-ring' | 'inner-ring' | 'registration';

export interface SelectedElement {
  id: string;
  type: SelectedElementType;
}

/** Map stamp element IDs to SelectedElementType */
function mapElementToType(id: string): SelectedElementType | null {
  switch (id) {
    case 'top-arc': return 'arabic-company';
    case 'bottom-arc': return 'english-company';
    case 'loc-top': return 'arabic-location';
    case 'loc-bottom': return 'english-location';
    case 'center': return 'monogram';
    case 'separator-left': case 'loc-separator-left': return 'separator-left';
    case 'separator-right': case 'loc-separator-right': return 'separator-right';
    case 'border-outer': return 'outer-ring';
    case 'border-middle': return 'middle-ring';
    case 'border-inner': return 'inner-ring';
    case 'registration': return 'registration';
    default: return null;
  }
}

interface Props {
  svgSource: string;
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  fontSize?: number | null;
  inkMode?: boolean;
  size: number;
  onSvgChange: (newSvg: string) => void;
  onSeparatorChange?: (style: SeparatorStyle) => void;
  onCenterModeChange?: (mode: CenterContentMode, options?: { monogramText?: string; icon?: CenterIconType }) => void;
  onCenterClick?: () => void;
  onElementSelect?: (element: SelectedElement | null) => void;
  currentSeparatorStyle?: SeparatorStyle;
  currentCenterMode?: CenterContentMode;
}

export function StampInteractivePreview({
  svgSource,
  tintColor,
  secondaryColor,
  accentColor,
  fontFamily,
  fontWeight,
  fontStyle,
  fontSize,
  inkMode,
  size,
  onSvgChange,
  onSeparatorChange,
  onCenterModeChange,
  onCenterClick,
  onElementSelect,
  currentSeparatorStyle,
  currentCenterMode,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hitZones, setHitZones] = useState<HitZone[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedLetterIdx, setSelectedLetterIdx] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState<'letter' | 'word'>('word');
  const [editingText, setEditingText] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });

  // Scan DOM for data-stamp-element nodes
  const scanElements = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const elements = container.querySelectorAll('[data-stamp-element]');
    const zones: HitZone[] = [];

    elements.forEach((el) => {
      const id = el.getAttribute('data-stamp-element') || '';
      const meta = ELEMENT_LABELS[id];
      if (!meta) return;
      const rect = el.getBoundingClientRect();
      const isArc = meta.type === 'arc-text' || meta.type === 'location';
      const padding = isArc ? 12 : 6;
      const adjustedRect = new DOMRect(
        rect.x - containerRect.x - padding,
        rect.y - containerRect.y - padding,
        Math.max(rect.width + padding * 2, 24),
        Math.max(rect.height + padding * 2, 18)
      );
      zones.push({ id, rect: adjustedRect, label: meta.label, type: meta.type });
    });

    setHitZones(zones);
  }, []);

  useEffect(() => {
    const timer = setTimeout(scanElements, 150);
    return () => clearTimeout(timer);
  }, [svgSource, tintColor, secondaryColor, accentColor, fontFamily, fontSize, scanElements]);

  // Get text content for an element
  const getElementText = useCallback((elementId: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgSource, 'image/svg+xml');
    const el = doc.querySelector(`[data-stamp-element="${elementId}"]`);
    if (!el) return '';
    const tp = el.querySelector('textPath');
    return tp?.textContent || el.textContent || '';
  }, [svgSource]);

  // Estimate which letter was clicked based on position within the hit zone
  const estimateLetterIndex = useCallback((zone: HitZone, clickX: number): number => {
    const text = getElementText(zone.id);
    if (!text || text.length <= 1) return 0;
    const relX = clickX - zone.rect.x;
    const pct = Math.max(0, Math.min(1, relX / zone.rect.width));
    return Math.min(text.length - 1, Math.floor(pct * text.length));
  }, [getElementText]);

  // Emit element selection via prop callback
  const emitSelection = useCallback((elementId: string) => {
    const type = mapElementToType(elementId);
    if (type && onElementSelect) {
      onElementSelect({ id: elementId, type });
    }
  }, [onElementSelect]);

  // Single click: select letter
  const handleZoneClick = (zone: HitZone, e: React.MouseEvent) => {
    const meta = ELEMENT_LABELS[zone.id];
    if (!meta) return;

    // For text elements, select individual letter
    if (meta.type === 'arc-text' || meta.type === 'location') {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const clickX = containerRect ? e.clientX - containerRect.x : 0;
      const letterIdx = estimateLetterIndex(zone, clickX);

      setSelected(zone.id);
      setSelectedLetterIdx(letterIdx);
      setSelectionMode('letter');
      setEditingText(null);
      setToolbarPos({
        x: Math.max(0, Math.min(zone.rect.x + zone.rect.width / 2, size - 120)),
        y: Math.max(0, zone.rect.y - 8),
      });
      emitSelection(zone.id);
    } else {
      // Non-text elements: standard selection
      setSelected(zone.id);
      setSelectedLetterIdx(null);
      setSelectionMode('word');
      setEditingText(null);
      setToolbarPos({
        x: Math.max(0, Math.min(zone.rect.x + zone.rect.width / 2, size - 120)),
        y: Math.max(0, zone.rect.y - 8),
      });
      emitSelection(zone.id);
      if (meta.type === 'center') {
        if (onCenterClick) onCenterClick();
      }
    }
  };

  // Double click: select full word/arc and open language-specific panel
  const handleZoneDoubleClick = (zone: HitZone) => {
    const meta = ELEMENT_LABELS[zone.id];
    if (!meta) return;

    setSelected(zone.id);
    setSelectedLetterIdx(null);
    setSelectionMode('word');
    setEditingText(null);
    setToolbarPos({
      x: Math.max(0, Math.min(zone.rect.x + zone.rect.width / 2, size - 120)),
      y: Math.max(0, zone.rect.y - 8),
    });

    // Emit element selection via prop callback (replaces window events)
    emitSelection(zone.id);
    if (meta.type === 'center') {
      if (onCenterClick) onCenterClick();
    }
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-hit-zone]') && !target.closest('[data-toolbar]')) {
      setSelected(null);
      setSelectedLetterIdx(null);
      setEditingText(null);
    }
  };

  const findTextIndex = useCallback((elementId: string): number => {
    if (!containerRef.current) return -1;
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgSource, 'image/svg+xml');
    const originalTexts = Array.from(doc.querySelectorAll('text'));
    for (let i = 0; i < originalTexts.length; i++) {
      if (originalTexts[i].getAttribute('data-stamp-element') === elementId) {
        return i;
      }
    }
    return -1;
  }, [svgSource]);

  const startTextEdit = (elementId: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgSource, 'image/svg+xml');
    const el = doc.querySelector(`[data-stamp-element="${elementId}"]`);
    if (el) {
      const tp = el.querySelector('textPath');
      setEditValue(tp?.textContent || el.textContent || '');
      setEditingText(elementId);
    }
  };

  const commitTextEdit = () => {
    if (!editingText) return;
    const idx = findTextIndex(editingText);
    if (idx >= 0 && editValue.trim()) {
      const newSvg = mutateTextElement(svgSource, idx, editValue.trim());
      onSvgChange(newSvg);
    }
    setEditingText(null);
  };

  const deleteElement = (elementId: string) => {
    const idx = findTextIndex(elementId);
    if (idx >= 0) {
      const newSvg = mutateTextElement(svgSource, idx, null);
      onSvgChange(newSvg);
      setSelected(null);
    }
  };

  const nudgeElement = (elementId: string, dx: number, dy: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgSource, 'image/svg+xml');
    const el = doc.querySelector(`[data-stamp-element="${elementId}"]`);
    if (!el) return;
    const x = parseFloat(el.getAttribute('x') || '0');
    const y = parseFloat(el.getAttribute('y') || '0');
    el.setAttribute('x', String(x + dx));
    el.setAttribute('y', String(y + dy));
    const newSvg = new XMLSerializer().serializeToString(doc.documentElement);
    onSvgChange(newSvg);
  };

  const adjustSpacing = (elementId: string, delta: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgSource, 'image/svg+xml');
    const el = doc.querySelector(`[data-stamp-element="${elementId}"]`);
    if (!el) return;
    const current = parseFloat(el.getAttribute('letter-spacing') || '2');
    const next = Math.max(0, Math.min(12, current + delta));
    el.setAttribute('letter-spacing', String(next));
    const newSvg = new XMLSerializer().serializeToString(doc.documentElement);
    onSvgChange(newSvg);
  };

  const adjustFontSize = (elementId: string, delta: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgSource, 'image/svg+xml');
    const el = doc.querySelector(`[data-stamp-element="${elementId}"]`);
    if (!el) return;
    const current = parseFloat(el.getAttribute('font-size') || '14');
    const next = Math.max(5, Math.min(28, current + delta));
    el.setAttribute('font-size', String(next));
    const newSvg = new XMLSerializer().serializeToString(doc.documentElement);
    onSvgChange(newSvg);
  };

  const selectedZone = hitZones.find(z => z.id === selected);
  const selectedMeta = selected ? ELEMENT_LABELS[selected] : null;
  const selectedText = selected ? getElementText(selected) : '';
  const selectedLang = selected ? getLanguageFromElement(selected) : null;

  return (
    <div
      ref={containerRef}
      className="relative cursor-crosshair"
      style={{ width: size, height: size }}
      onClick={handleClickOutside}
    >
      {/* Render the SVG */}
      <StampSVGRenderer
        svgSource={svgSource}
        tintColor={tintColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fontStyle={fontStyle}
        fontSize={fontSize}
        inkMode={inkMode}
        size={size}
      />

      {/* Hit zone overlays */}
      {hitZones.map((zone) => (
        <div
          key={zone.id}
          data-hit-zone={zone.id}
          onClick={(e) => { e.stopPropagation(); handleZoneClick(zone, e); }}
          onDoubleClick={(e) => { e.stopPropagation(); handleZoneDoubleClick(zone); }}
          className={`absolute rounded cursor-pointer transition-all duration-150 ${
            selected === zone.id
              ? selectionMode === 'letter'
                ? 'ring-2 ring-amber-400 bg-amber-400/10'
                : 'ring-2 ring-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.12)]'
              : 'hover:bg-[hsl(var(--gold)/0.06)] hover:ring-1 hover:ring-[hsl(var(--gold)/0.3)]'
          }`}
          style={{
            left: zone.rect.x,
            top: zone.rect.y,
            width: zone.rect.width,
            height: zone.rect.height,
          }}
          title={`${zone.label} — Click: select letter, Double-click: select all`}
        />
      ))}

      {/* Floating Toolbar */}
      {selected && selectedZone && selectedMeta && (
        <div
          data-toolbar
          className="absolute z-50 bg-white rounded-lg shadow-xl border border-[hsl(var(--gold)/0.3)] p-2 min-w-[200px] max-w-[280px]"
          style={{
            left: Math.max(4, Math.min(toolbarPos.x - 100, size - 210)),
            top: Math.max(4, toolbarPos.y < 100 ? toolbarPos.y + selectedZone.rect.height + 12 : toolbarPos.y - 160),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-1.5 min-w-0">
              {selectedLang === 'arabic' && <span className="text-[9px]">🇦🇪</span>}
              {selectedLang === 'english' && <span className="text-[9px]">🇬🇧</span>}
              <span className="text-[9px] font-bold text-[hsl(var(--foreground))] uppercase tracking-wider truncate">
                {selectionMode === 'letter' && selectedLetterIdx !== null && selectedText
                  ? `Letter "${selectedText[selectedLetterIdx]}" — ${selectedZone.label}`
                  : selectedZone.label}
              </span>
            </div>
            <button onClick={() => { setSelected(null); setSelectedLetterIdx(null); }} className="p-0.5 rounded hover:bg-[hsl(var(--muted))]">
              <X size={10} className="text-[hsl(var(--muted-foreground))]" />
            </button>
          </div>

          {/* Selection mode indicator */}
          {(selectedMeta.type === 'arc-text' || selectedMeta.type === 'location') && (
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => setSelectionMode('letter')}
                className={`flex-1 text-[8px] py-1 rounded border transition-all ${selectionMode === 'letter' ? 'border-amber-400 bg-amber-50 text-amber-700 font-bold' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}
              >Letter</button>
              <button
                onClick={() => { setSelectionMode('word'); setSelectedLetterIdx(null); }}
                className={`flex-1 text-[8px] py-1 rounded border transition-all ${selectionMode === 'word' ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] font-bold' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}
              >Full Arc</button>
            </div>
          )}

          {/* Inline text edit */}
          {editingText === selected ? (
            <div className="flex items-center gap-1 mb-2">
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitTextEdit(); if (e.key === 'Escape') setEditingText(null); }}
                autoFocus
                className="flex-1 text-[10px] px-2 py-1 border border-[hsl(var(--gold)/0.5)] rounded bg-white text-black font-mono"
              />
              <button onClick={commitTextEdit} className="p-1 rounded hover:bg-green-50 text-green-600"><Check size={11} /></button>
              <button onClick={() => setEditingText(null)} className="p-1 rounded hover:bg-[hsl(var(--muted))]"><X size={11} /></button>
            </div>
          ) : null}

          {/* Actions based on element type */}
          <div className="flex flex-wrap gap-1">
            {/* Text elements — edit, spacing, size, delete */}
            {(selectedMeta.type === 'arc-text' || selectedMeta.type === 'location' || selectedMeta.type === 'registration') && (
              <>
                <ToolBtn icon={<Pencil size={10} />} label="Edit" onClick={() => startTextEdit(selected)} />
                <ToolBtn icon={<Type size={10} />} label="Size +" onClick={() => adjustFontSize(selected, 1)} />
                <ToolBtn icon={<Minimize2 size={10} />} label="Size −" onClick={() => adjustFontSize(selected, -1)} />
                <ToolBtn icon={<Maximize2 size={10} />} label="Space +" onClick={() => adjustSpacing(selected, 0.5)} />
                <ToolBtn icon={<LayoutGrid size={10} />} label="Space −" onClick={() => adjustSpacing(selected, -0.5)} />
                {/* Match Style */}
                {(selected === 'top-arc' || selected === 'bottom-arc') && (
                  <ToolBtn
                    icon={<Replace size={10} />}
                    label={selected === 'top-arc' ? 'Match Bottom' : 'Match Top'}
                    onClick={() => {
                      const otherId = selected === 'top-arc' ? 'bottom-arc' : 'top-arc';
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(svgSource, 'image/svg+xml');
                      const source = doc.querySelector(`[data-stamp-element="${otherId}"]`);
                      const target = doc.querySelector(`[data-stamp-element="${selected}"]`);
                      if (source && target) {
                        const srcFS = source.getAttribute('font-size');
                        const srcLS = source.getAttribute('letter-spacing');
                        const srcFW = source.getAttribute('font-weight');
                        if (srcFS) target.setAttribute('font-size', srcFS);
                        if (srcLS) target.setAttribute('letter-spacing', srcLS);
                        if (srcFW) target.setAttribute('font-weight', srcFW);
                        onSvgChange(new XMLSerializer().serializeToString(doc.documentElement));
                      }
                    }}
                  />
                )}
                {/* Open language panel shortcut */}
                {selectedLang && (
                  <ToolBtn
                    icon={selectedLang === 'arabic' ? <span className="text-[8px]">🇦🇪</span> : <span className="text-[8px]">🇬🇧</span>}
                    label={selectedLang === 'arabic' ? 'AR Panel' : 'EN Panel'}
                    onClick={() => {
                      if (selectedLang === 'arabic') window.dispatchEvent(new CustomEvent('stamp-focus-arabic'));
                      else window.dispatchEvent(new CustomEvent('stamp-focus-english'));
                    }}
                  />
                )}
                <ToolBtn icon={<Trash2 size={10} />} label="Delete" onClick={() => deleteElement(selected)} danger />
              </>
            )}

            {/* Separators */}
            {selectedMeta.type === 'separator' && (
              <>
                <ToolBtn icon={<Move size={10} />} label="↑" onClick={() => nudgeElement(selected, 0, -1)} />
                <ToolBtn icon={<Move size={10} />} label="↓" onClick={() => nudgeElement(selected, 0, 1)} />
                <ToolBtn icon={<Move size={10} />} label="←" onClick={() => nudgeElement(selected, -1, 0)} />
                <ToolBtn icon={<Move size={10} />} label="→" onClick={() => nudgeElement(selected, 1, 0)} />
                <ToolBtn icon={<Type size={10} />} label="Size +" onClick={() => adjustFontSize(selected, 1)} />
                <ToolBtn icon={<Minimize2 size={10} />} label="Size −" onClick={() => adjustFontSize(selected, -1)} />
                <ToolBtn icon={<Trash2 size={10} />} label="Delete" onClick={() => deleteElement(selected)} danger />
              </>
            )}

            {/* Center content */}
            {selectedMeta.type === 'center' && (
              <>
                <ToolBtn icon={<Pencil size={10} />} label="Edit" onClick={() => startTextEdit(selected)} />
                <ToolBtn icon={<Trash2 size={10} />} label="Clear" onClick={() => deleteElement(selected)} danger />
              </>
            )}
          </div>

          {/* Separator style picker */}
          {selectedMeta.type === 'separator' && onSeparatorChange && (
            <div className="mt-2 pt-1.5 border-t border-[hsl(var(--border))]">
              <p className="text-[8px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1">Replace Style</p>
              <div className="grid grid-cols-5 gap-1">
                {ALL_SEPARATOR_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => onSeparatorChange(style)}
                    className={`text-[10px] px-1 py-0.5 rounded border transition-all ${
                      currentSeparatorStyle === style
                        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] font-bold'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] text-[hsl(var(--foreground))]'
                    }`}
                    title={separatorLabel(style)}
                  >
                    {separatorLabel(style).slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Center mode picker */}
          {selectedMeta.type === 'center' && onCenterModeChange && (
            <div className="mt-2 pt-1.5 border-t border-[hsl(var(--border))]">
              <p className="text-[8px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1">Center Content</p>
              <div className="grid grid-cols-3 gap-1">
                {CENTER_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => onCenterModeChange(mode.value)}
                    className={`text-[9px] px-1.5 py-1 rounded border transition-all ${
                      currentCenterMode === mode.value
                        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] font-bold'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] text-[hsl(var(--foreground))]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              {currentCenterMode === 'icon' && (
                <div className="grid grid-cols-4 gap-1 mt-1.5">
                  {CENTER_ICONS.map((icon) => (
                    <button
                      key={icon.value}
                      onClick={() => onCenterModeChange('icon', { icon: icon.value })}
                      className="text-[9px] px-1 py-0.5 rounded border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] text-center"
                    >
                      {icon.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nudge arrows for center */}
          {selectedMeta.type === 'center' && (
            <div className="mt-2 pt-1.5 border-t border-[hsl(var(--border))]">
              <p className="text-[8px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1">Position</p>
              <div className="flex items-center justify-center gap-0.5">
                <div className="flex flex-col items-center gap-0.5">
                  <button onClick={() => nudgeElement(selected, 0, -1)} className="p-1 rounded hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))]"><ChevronUp size={10} /></button>
                  <div className="flex gap-0.5">
                    <button onClick={() => nudgeElement(selected, -1, 0)} className="p-1 rounded hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))]"><ChevronLeft size={10} /></button>
                    <button onClick={() => nudgeElement(selected, 1, 0)} className="p-1 rounded hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))]"><ChevronRight size={10} /></button>
                  </div>
                  <button onClick={() => nudgeElement(selected, 0, 1)} className="p-1 rounded hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))]"><ChevronDown size={10} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hint text */}
      {!selected && hitZones.length > 0 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-[hsl(var(--muted-foreground))] bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
          Click letter · Double-click full arc
        </div>
      )}
    </div>
  );
}

/** Small action button for the floating toolbar */
function ToolBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-0.5 px-1.5 py-1 rounded text-[9px] border transition-all ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
          : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.06)] hover:border-[hsl(var(--gold)/0.4)]'
      }`}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
