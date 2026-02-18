import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutCheatSheetProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Timeline Tools',
    color: '#F59E0B',
    shortcuts: [
      { keys: ['V'], desc: 'Select tool' },
      { keys: ['C'], desc: 'Cut / Blade tool' },
      { keys: ['H'], desc: 'Pan tool' },
      { keys: ['S'], desc: 'Toggle snap to grid' },
      { keys: ['Esc'], desc: 'Deselect all clips' },
    ],
  },
  {
    title: 'Playback',
    color: '#818CF8',
    shortcuts: [
      { keys: ['Space'], desc: 'Play / Pause' },
      { keys: ['Del', 'Bksp'], desc: 'Delete selected clip(s)' },
    ],
  },
  {
    title: 'History',
    color: '#34D399',
    shortcuts: [
      { keys: ['⌘', 'Z'], desc: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'], desc: 'Redo' },
    ],
  },
  {
    title: 'General',
    color: '#F472B6',
    shortcuts: [
      { keys: ['?'], desc: 'Open this cheat sheet' },
    ],
  },
];

function Kbd({ label }: { label: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center rounded font-mono font-bold text-xs px-1.5 py-0.5 min-w-[1.6rem]"
      style={{
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.22)',
        color: '#fff',
        boxShadow: '0 2px 0 rgba(0,0,0,0.4)',
        lineHeight: 1.4,
      }}
    >
      {label}
    </kbd>
  );
}

export function ShortcutCheatSheet({ open, onClose }: ShortcutCheatSheetProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative rounded-2xl overflow-hidden w-full max-w-sm mx-4 animate-scale-in"
        style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #0c1120 100%)',
          border: '1px solid rgba(245,158,11,0.25)',
          boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gold top bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <Keyboard className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-white text-sm font-bold leading-tight">Keyboard Shortcuts</h2>
              <p className="text-slate-500 text-[10px] leading-tight">AI Video Studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Shortcut sections */}
        <div className="px-5 py-4 space-y-5">
          {SECTIONS.map(section => (
            <div key={section.title}>
              {/* Section title */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2 h-2 rounded-full" style={{ background: section.color }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: section.color }}>
                  {section.title}
                </span>
              </div>
              {/* Rows */}
              <div className="space-y-1.5">
                {section.shortcuts.map(sc => (
                  <div key={sc.desc} className="flex items-center justify-between">
                    <span className="text-slate-300 text-xs">{sc.desc}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, i) => (
                        <React.Fragment key={k}>
                          <Kbd label={k} />
                          {i < sc.keys.length - 1 && (
                            <span className="text-slate-600 text-[10px]">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-4 text-center">
          <p className="text-slate-600 text-[10px]">Press <Kbd label="?" /> or <Kbd label="Esc" /> to dismiss</p>
        </div>
      </div>
    </div>
  );
}
