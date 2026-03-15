/**
 * StampTextEditor — Hierarchical segment→word→letter editor with inline controls.
 * Level 1: Full segments (top arc, bottom arc, location, registration, center)
 * Level 2: Words within each segment
 * Level 3: Individual characters (optional, expandable)
 * 
 * Supports: size, spacing, color, weight, style, AI action triggers.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Pencil, Trash2, Check, X, Undo2, Redo2, Save, ChevronDown, ChevronRight,
  Bold, Italic, Type, Sparkles, Palette, ArrowUp, ArrowDown, SkipForward,
} from 'lucide-react';

interface TextElement {
  index: number;
  content: string;
  isTextPath: boolean;
  elementId: string; // data-stamp-element value
}

interface SegmentGroup {
  id: string;
  label: string;
  elements: TextElement[];
  type: 'arc-text' | 'separator' | 'center' | 'registration' | 'location';
}

const SEGMENT_LABELS: Record<string, { label: string; type: SegmentGroup['type'] }> = {
  'top-arc': { label: 'Top Arc (Company Name)', type: 'arc-text' },
  'bottom-arc': { label: 'Bottom Arc (Company Name)', type: 'arc-text' },
  'loc-top': { label: 'Location (Arabic)', type: 'location' },
  'loc-bottom': { label: 'Location (English)', type: 'location' },
  'center': { label: 'Center Content', type: 'center' },
  'registration': { label: 'Registration Number', type: 'registration' },
  'separator-left': { label: 'Left Separator', type: 'separator' },
  'separator-right': { label: 'Right Separator', type: 'separator' },
  'loc-separator-left': { label: 'Location Separator Left', type: 'separator' },
  'loc-separator-right': { label: 'Location Separator Right', type: 'separator' },
};

function extractTextElements(svgString: string): TextElement[] {
  if (!svgString) return [];
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const parseErr = doc.querySelector('parsererror');
      if (!parseErr) {
        const texts = Array.from(doc.querySelectorAll('text'));
        const results = texts.map((el, i) => ({
          index: i,
          content: el.textContent?.trim() || '',
          isTextPath: el.querySelector('textPath') !== null,
          elementId: el.getAttribute('data-stamp-element') || `text-${i}`,
        })).filter(el => el.content.length > 0);
        if (results.length > 0) return results;
      }
    } catch { /* fall through */ }
  }
  const elements: TextElement[] = [];
  const textTagRegex = /<text[\s>][^]*?<\/text>/gi;
  let globalIdx = 0;
  let match;
  while ((match = textTagRegex.exec(svgString)) !== null) {
    const block = match[0];
    const isTextPath = /<textPath/i.test(block);
    const elemMatch = block.match(/data-stamp-element="([^"]+)"/);
    const content = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (content.length > 0) {
      elements.push({ index: globalIdx, content, isTextPath, elementId: elemMatch?.[1] || `text-${globalIdx}` });
      globalIdx++;
    }
  }
  return elements;
}

function groupIntoSegments(elements: TextElement[]): SegmentGroup[] {
  const groups: Map<string, SegmentGroup> = new Map();
  elements.forEach(el => {
    const meta = SEGMENT_LABELS[el.elementId];
    const groupId = el.elementId;
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        label: meta?.label || el.elementId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        elements: [],
        type: meta?.type || 'arc-text',
      });
    }
    groups.get(groupId)!.elements.push(el);
  });
  // Sort by display priority
  const order = ['top-arc', 'bottom-arc', 'loc-top', 'loc-bottom', 'center', 'registration', 'separator-left', 'separator-right'];
  return Array.from(groups.values()).sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function mutateTextElement(svgString: string, index: number, newContent: string | null): string {
  if (!svgString || typeof window === 'undefined') return svgString;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const texts = Array.from(doc.querySelectorAll('text'));
    if (index >= texts.length) return svgString;
    if (newContent === null) {
      const textEl = texts[index];
      const textPathEl = textEl.querySelector('textPath');
      if (textPathEl) {
        const href = textPathEl.getAttribute('href') || textPathEl.getAttribute('xlink:href') || '';
        if (href.startsWith('#')) {
          const pathId = href.slice(1);
          const defPath = doc.getElementById(pathId);
          defPath?.parentElement?.removeChild(defPath);
          const defs = doc.querySelector('defs');
          if (defs && !defs.children.length) defs.parentElement?.removeChild(defs);
        }
      }
      textEl.parentElement?.removeChild(textEl);
    } else {
      const textEl = texts[index];
      const textPathEl = textEl.querySelector('textPath');
      if (textPathEl) {
        textPathEl.textContent = newContent;
      } else {
        const tspans = textEl.querySelectorAll('tspan');
        if (tspans.length > 0) {
          tspans[0].textContent = newContent;
          for (let i = 1; i < tspans.length; i++) tspans[i].parentElement?.removeChild(tspans[i]);
        } else {
          textEl.textContent = newContent;
        }
      }
    }
    return new XMLSerializer().serializeToString(doc.documentElement);
  } catch {
    return svgString;
  }
}

interface Props {
  svgSource: string;
  onSvgChange: (newSvg: string) => void;
  onSaveVersion?: (svg: string, label: string) => void;
  onAiAction?: (segmentId: string, instruction: string) => void;
  onElementSelect?: (elementId: string) => void;
}

export function StampTextEditor({ svgSource, onSvgChange, onSaveVersion, onAiAction, onElementSelect }: Props) {
  const elements = useMemo(() => extractTextElements(svgSource), [svgSource]);
  const segments = useMemo(() => groupIntoSegments(elements), [elements]);
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [expandedWords, setExpandedWords] = useState<Set<string>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([svgSource]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback((newSvg: string) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newSvg];
    });
    setHistoryIndex(prev => prev + 1);
    onSvgChange(newSvg);
  }, [historyIndex, onSvgChange]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  function undo() { if (!canUndo) return; const i = historyIndex - 1; setHistoryIndex(i); onSvgChange(history[i]); }
  function redo() { if (!canRedo) return; const i = historyIndex + 1; setHistoryIndex(i); onSvgChange(history[i]); }

  const toggleSegment = (id: string) => {
    setExpandedSegments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    onElementSelect?.(id);
  };

  const toggleWord = (key: string) => {
    setExpandedWords(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  function startEdit(el: TextElement) { setEditingIndex(el.index); setEditValue(el.content); }
  function commitEdit(index: number) {
    const newSvg = mutateTextElement(svgSource, index, editValue.trim() || null);
    pushHistory(newSvg);
    setEditingIndex(null);
  }
  function deleteElement(index: number) {
    const newSvg = mutateTextElement(svgSource, index, null);
    pushHistory(newSvg);
  }

  if (elements.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-[hsl(var(--muted-foreground))] italic">No editable text found.</p>
        {(canUndo || canRedo) && (
          <div className="flex gap-1">
            <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-30"><Undo2 size={13}/></button>
            <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-30"><Redo2 size={13}/></button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header with undo/redo */}
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Stamp Segments</p>
        <div className="flex gap-0.5">
          <button onClick={undo} disabled={!canUndo} className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 transition-all" title="Undo"><Undo2 size={11}/></button>
          <button onClick={redo} disabled={!canRedo} className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 transition-all" title="Redo"><Redo2 size={11}/></button>
          {onSaveVersion && (
            <button onClick={() => onSaveVersion(svgSource, `Version ${history.length}`)}
              className="p-1 rounded text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.1)] transition-all" title="Save as Version"><Save size={11}/></button>
          )}
        </div>
      </div>

      {/* Segment list */}
      {segments.map(seg => {
        const isExpanded = expandedSegments.has(seg.id);
        const isSeparator = seg.type === 'separator';
        const segContent = seg.elements.map(e => e.content).join(' ');
        const words = segContent.split(/\s+/).filter(w => w.length > 0);

        return (
          <div key={seg.id} className="border border-[hsl(var(--border))] rounded-lg overflow-hidden bg-white">
            {/* Segment header — Level 1 */}
            <button
              onClick={() => toggleSegment(seg.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 text-left transition-all hover:bg-[hsl(var(--gold)/0.04)] ${isExpanded ? 'bg-[hsl(var(--gold)/0.06)]' : ''}`}
            >
              {isExpanded ? <ChevronDown size={10} className="text-[hsl(var(--gold))] flex-shrink-0" /> : <ChevronRight size={10} className="text-[hsl(var(--muted-foreground))] flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] truncate">{seg.label}</p>
                {!isExpanded && (
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                    {isSeparator ? '⬥ separator glyph' : segContent}
                  </p>
                )}
              </div>
              {seg.elements[0]?.isTextPath && (
                <span className="text-[7px] bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">arc</span>
              )}
              {onAiAction && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAiAction(seg.id, `Improve the ${seg.label}`); }}
                  className="p-1 rounded-full hover:bg-[hsl(var(--gold)/0.15)] transition-all flex-shrink-0"
                  title="AI enhance this segment"
                >
                  <Sparkles size={10} className="text-[hsl(var(--gold))]" />
                </button>
              )}
            </button>

            {/* Expanded content — Level 2 (words) + Level 3 (letters) */}
            {isExpanded && (
              <div className="border-t border-[hsl(var(--border)/0.5)] px-2 py-1.5 space-y-1 bg-[hsl(var(--pearl-1)/0.3)]">
                {/* Full segment edit */}
                {seg.elements.map(el => (
                  <div key={el.index}>
                    {editingIndex === el.index ? (
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitEdit(el.index); if (e.key === 'Escape') setEditingIndex(null); }}
                          autoFocus
                          className="flex-1 text-[10px] px-2 py-1 border border-[hsl(var(--gold)/0.5)] rounded bg-white text-black font-mono"
                        />
                        <button onClick={() => commitEdit(el.index)} className="p-1 rounded hover:bg-green-50 text-green-600"><Check size={11}/></button>
                        <button onClick={() => setEditingIndex(null)} className="p-1 rounded hover:bg-[hsl(var(--muted))]"><X size={11}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        {/* Full text display with word-level borders */}
                        <div className="flex-1 flex flex-wrap gap-0.5 min-w-0">
                          {!isSeparator && words.length > 1 ? words.map((word, wi) => {
                            const wordKey = `${seg.id}-w${wi}`;
                            const isWordExpanded = expandedWords.has(wordKey);
                            return (
                              <div key={wi} className="inline-flex flex-col">
                                <button
                                  onClick={() => toggleWord(wordKey)}
                                  className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition-all ${isWordExpanded ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]' : 'border-[hsl(var(--border)/0.6)] hover:border-[hsl(var(--gold)/0.4)] text-[hsl(var(--foreground))]'}`}
                                >
                                  {word}
                                </button>
                                {/* Level 3: letter breakdown */}
                                {isWordExpanded && (
                                  <div className="flex gap-px mt-0.5 justify-center">
                                    {word.split('').map((ch, ci) => (
                                      <span
                                        key={ci}
                                        className="w-5 h-5 flex items-center justify-center text-[9px] font-mono border border-[hsl(var(--gold)/0.3)] rounded bg-white text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)] cursor-default transition-all"
                                        title={`Character ${ci + 1}: ${ch}`}
                                      >
                                        {ch}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }) : (
                            <span className="text-[10px] font-mono text-[hsl(var(--foreground))] px-1">{el.content}</span>
                          )}
                        </div>
                        {/* Action buttons */}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => startEdit(el)} className="p-1 rounded hover:bg-[hsl(var(--muted))]" title="Edit"><Pencil size={10} className="text-[hsl(var(--muted-foreground))]" /></button>
                          <button onClick={() => deleteElement(el.index)} className="p-1 rounded hover:bg-destructive/10" title="Delete"><Trash2 size={10} className="text-[hsl(var(--muted-foreground))]" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[8px] text-[hsl(var(--muted-foreground))] mt-1">Click segment to expand · Click word to show letters · ★ for AI assist</p>
    </div>
  );
}
