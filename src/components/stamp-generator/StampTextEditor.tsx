/**
 * StampTextEditor — Inline SVG text element editor/deleter
 * Parses <text> nodes from SVG, allows editing content or deleting them.
 */
import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextElement {
  index: number;
  content: string;
  isTextPath: boolean;
}

function extractTextElements(svgString: string): TextElement[] {
  if (!svgString || typeof window === 'undefined') return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const texts = Array.from(doc.querySelectorAll('text'));
    return texts.map((el, i) => ({
      index: i,
      content: el.textContent?.trim() || '',
      isTextPath: el.querySelector('textPath') !== null,
    })).filter(el => el.content.length > 0);
  } catch {
    return [];
  }
}

export function mutateTextElement(svgString: string, index: number, newContent: string | null): string {
  if (!svgString || typeof window === 'undefined') return svgString;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const texts = Array.from(doc.querySelectorAll('text'));
    if (index >= texts.length) return svgString;
    if (newContent === null) {
      // Delete — also remove associated <defs> path if it's a textPath
      const textEl = texts[index];
      const textPathEl = textEl.querySelector('textPath');
      if (textPathEl) {
        const href = textPathEl.getAttribute('href') || textPathEl.getAttribute('xlink:href') || '';
        if (href.startsWith('#')) {
          const pathId = href.slice(1);
          // Remove the defs path
          const defPath = doc.getElementById(pathId);
          defPath?.parentElement?.removeChild(defPath);
          // If defs is now empty, remove it
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
        // Handle tspan children
        const tspans = textEl.querySelectorAll('tspan');
        if (tspans.length > 0) {
          tspans[0].textContent = newContent;
          // remove extra tspans
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
}

export function StampTextEditor({ svgSource, onSvgChange }: Props) {
  const elements = useMemo(() => extractTextElements(svgSource), [svgSource]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  if (elements.length === 0) {
    return (
      <p className="text-xs text-[hsl(var(--muted-foreground))] italic">No editable text found in this stamp.</p>
    );
  }

  function startEdit(el: TextElement) {
    setEditingIndex(el.index);
    setEditValue(el.content);
  }

  function commitEdit(index: number) {
    const newSvg = mutateTextElement(svgSource, index, editValue.trim() || null);
    onSvgChange(newSvg);
    setEditingIndex(null);
  }

  function deleteElement(index: number) {
    const newSvg = mutateTextElement(svgSource, index, null);
    onSvgChange(newSvg);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Edit Text Elements</p>
      {elements.map((el) => (
        <div key={el.index} className="group border border-[hsl(var(--border))] rounded-lg bg-white overflow-hidden">
          {editingIndex === el.index ? (
            <div className="flex items-center gap-1.5 p-1.5">
              <input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit(el.index);
                  if (e.key === 'Escape') setEditingIndex(null);
                }}
                autoFocus
                className="flex-1 text-xs px-2 py-1 border border-[hsl(var(--gold)/0.5)] rounded outline-none bg-white text-black font-mono"
              />
              <button onClick={() => commitEdit(el.index)} className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-50 rounded">
                <Check size={12}/>
              </button>
              <button onClick={() => setEditingIndex(null)} className="w-6 h-6 flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded">
                <X size={12}/>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1.5">
              <span className="flex-1 text-xs font-mono text-[hsl(var(--foreground))] truncate">{el.content}</span>
              {el.isTextPath && (
                <span className="text-[9px] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded font-medium flex-shrink-0">arc</span>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(el)}
                  className="w-6 h-6 flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded"
                  title="Edit text"
                >
                  <Pencil size={11}/>
                </button>
                <button
                  onClick={() => deleteElement(el.index)}
                  className="w-6 h-6 flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-destructive hover:bg-destructive/10 rounded"
                  title="Delete text"
                >
                  <Trash2 size={11}/>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">Hover a row to edit or delete. Changes apply to live preview instantly.</p>
    </div>
  );
}
