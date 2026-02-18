import React, { useState, useCallback } from 'react';
import { Type, Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clip, TextSettings } from '../types';
import { toast } from 'sonner';

const FONT_FAMILIES = [
  { label: 'Sans', value: 'Inter, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: 'Courier New, monospace' },
  { label: 'Display', value: 'Impact, sans-serif' },
  { label: 'Script', value: 'Brush Script MT, cursive' },
  { label: 'Luxury', value: 'Playfair Display, serif' },
];

const TEXT_ANIMATIONS = [
  { id: 'none',       label: 'None',       emoji: '⬜' },
  { id: 'fade-in',    label: 'Fade In',    emoji: '🌅' },
  { id: 'slide-up',   label: 'Slide Up',   emoji: '⬆️' },
  { id: 'slide-down', label: 'Slide Down', emoji: '⬇️' },
  { id: 'zoom-in',    label: 'Zoom In',    emoji: '🔍' },
  { id: 'typewriter', label: 'Typewriter', emoji: '⌨️' },
  { id: 'bounce',     label: 'Bounce',     emoji: '🏀' },
  { id: 'glitch',     label: 'Glitch',     emoji: '⚡' },
];

const TEXT_PRESETS = [
  { label: 'Clean Title',   content: 'Your Title Here', fontFamily: 'Inter, sans-serif',        fontSize: 52, fontWeight: 'bold' as const,   color: '#FFFFFF', backgroundColor: 'transparent',    position: 'center' as const, style: 'clean' as const,       textAlign: 'center' as const },
  { label: 'Lower Third',   content: 'Name / Title',    fontFamily: 'Inter, sans-serif',        fontSize: 28, fontWeight: 'bold' as const,   color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.7)', position: 'bottom' as const, style: 'lower-third' as const, textAlign: 'left' as const   },
  { label: 'Social Bold',   content: 'BIG TEXT',        fontFamily: 'Impact, sans-serif',       fontSize: 72, fontWeight: 'bold' as const,   color: '#FFD700', backgroundColor: 'transparent',    position: 'center' as const, style: 'bold' as const,        textAlign: 'center' as const },
  { label: 'Luxury Quote',  content: '"Your Quote"',    fontFamily: 'Playfair Display, serif',  fontSize: 38, fontWeight: 'normal' as const, color: '#C8A766', backgroundColor: 'transparent',    position: 'center' as const, style: 'clean' as const,       textAlign: 'center' as const },
  { label: 'Caption Box',   content: 'Caption text',    fontFamily: 'Inter, sans-serif',        fontSize: 24, fontWeight: 'normal' as const, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.6)', position: 'bottom' as const, style: 'highlight' as const,   textAlign: 'center' as const },
];

const POSITION_OPTIONS = [
  { id: 'top',    label: 'Top',    grid: 'col-start-2 row-start-1' },
  { id: 'center', label: 'Center', grid: 'col-start-2 row-start-2' },
  { id: 'bottom', label: 'Bottom', grid: 'col-start-2 row-start-3' },
];

const COLOR_SWATCHES = [
  '#FFFFFF', '#000000', '#FFD700', '#C8A766', '#FF3B30',
  '#34C759', '#007AFF', '#AF52DE', '#FF9500', '#5AC8FA',
];

interface TextOverlayPanelProps {
  onAddTextClip: (clipData: {
    text: TextSettings;
    startTime: number;
    duration: number;
    animation: string;
  }) => void;
  currentTime: number;
}

export function TextOverlayPanel({ onAddTextClip, currentTime }: TextOverlayPanelProps) {
  const [content, setContent]         = useState('Your Text Here');
  const [fontFamily, setFontFamily]   = useState(FONT_FAMILIES[0].value);
  const [fontSize, setFontSize]       = useState(48);
  const [fontWeight, setFontWeight]   = useState<'normal' | 'bold'>('bold');
  const [italic, setItalic]           = useState(false);
  const [color, setColor]             = useState('#FFFFFF');
  const [bgColor, setBgColor]         = useState('transparent');
  const [textAlign, setTextAlign]     = useState<'left' | 'center' | 'right'>('center');
  const [position, setPosition]       = useState<'top' | 'center' | 'bottom'>('center');
  const [animation, setAnimation]     = useState('fade-in');
  const [duration, setDuration]       = useState(4);
  const [opacity, setOpacity]         = useState(1);

  const applyPreset = useCallback((preset: typeof TEXT_PRESETS[0]) => {
    setContent(preset.content);
    setFontFamily(preset.fontFamily);
    setFontSize(preset.fontSize);
    setFontWeight(preset.fontWeight);
    setColor(preset.color);
    setBgColor(preset.backgroundColor);
    setPosition(preset.position);
    setTextAlign(preset.textAlign);
  }, []);

  const handleAdd = useCallback(() => {
    if (!content.trim()) { toast.error('Please enter some text'); return; }
    onAddTextClip({
      text: {
        content,
        fontFamily,
        fontSize,
        fontWeight,
        color,
        backgroundColor: bgColor === 'transparent' ? undefined : bgColor,
        textAlign,
        position,
        style: 'clean',
      },
      startTime: currentTime,
      duration,
      animation,
    });
    toast.success(`Text overlay added at ${currentTime.toFixed(1)}s`);
  }, [content, fontFamily, fontSize, fontWeight, color, bgColor, textAlign, position, animation, duration, currentTime, onAddTextClip]);

  const previewStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `${Math.round(fontSize * 0.35)}px`,
    fontWeight,
    fontStyle: italic ? 'italic' : 'normal',
    color,
    textAlign,
    opacity,
    background: bgColor !== 'transparent' ? bgColor : 'transparent',
    padding: bgColor !== 'transparent' ? '4px 10px' : '0',
    borderRadius: bgColor !== 'transparent' ? '4px' : '0',
    whiteSpace: 'pre-wrap',
    maxWidth: '90%',
    wordBreak: 'break-word',
    lineHeight: 1.2,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5 text-slate-100">

        {/* ── PRESETS ─────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {TEXT_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 text-xs rounded-md border border-slate-600 bg-slate-800 hover:border-amber-500/60 hover:bg-slate-700 transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── LIVE MINI PREVIEW ───────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preview</p>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-slate-700">
            <div
              className={`
                ${position === 'top'    ? 'absolute top-4 left-0 right-0 flex justify-center' : ''}
                ${position === 'bottom' ? 'absolute bottom-4 left-0 right-0 flex justify-center' : ''}
                ${position === 'center' ? 'flex justify-center' : ''}
              `}
            >
              <span style={previewStyle}>{content || 'Preview'}</span>
            </div>
          </div>
        </section>

        {/* ── TEXT CONTENT ────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Text</p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-amber-500/60 placeholder-slate-500"
            rows={2}
            placeholder="Enter text…"
          />
        </section>

        {/* ── FONT ───────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Font</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {FONT_FAMILIES.map(f => (
              <button
                key={f.value}
                onClick={() => setFontFamily(f.value)}
                className={`py-1.5 text-xs rounded-md border transition-all truncate px-1 ${
                  fontFamily === f.value
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400'
                }`}
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Style toggles */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setFontWeight(fw => fw === 'bold' ? 'normal' : 'bold')}
              className={`p-2 rounded-md border transition-all ${fontWeight === 'bold' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-slate-600 bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setItalic(i => !i)}
              className={`p-2 rounded-md border transition-all ${italic ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-slate-600 bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="h-5 w-px bg-slate-600 mx-1" />
            {(['left', 'center', 'right'] as const).map(a => {
              const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;
              return (
                <button
                  key={a}
                  onClick={() => setTextAlign(a)}
                  className={`p-2 rounded-md border transition-all ${textAlign === a ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-slate-600 bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          {/* Size */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-8 shrink-0">Size</span>
            <Slider
              value={[fontSize]}
              min={12}
              max={120}
              step={1}
              onValueChange={([v]) => setFontSize(v)}
              className="flex-1"
            />
            <span className="text-xs text-slate-300 w-7 text-right shrink-0">{fontSize}</span>
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-400 w-8 shrink-0">Opacity</span>
            <Slider
              value={[Math.round(opacity * 100)]}
              min={10}
              max={100}
              step={5}
              onValueChange={([v]) => setOpacity(v / 100)}
              className="flex-1"
            />
            <span className="text-xs text-slate-300 w-7 text-right shrink-0">{Math.round(opacity * 100)}%</span>
          </div>
        </section>

        {/* ── COLORS ─────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Colors</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-16 shrink-0">Text</span>
              <div className="flex gap-1 flex-wrap">
                {COLOR_SWATCHES.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? 'border-amber-400 scale-125' : 'border-slate-600 hover:border-slate-400'}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-slate-600 bg-transparent"
                title="Custom color"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-16 shrink-0">BG</span>
              <button
                onClick={() => setBgColor('transparent')}
                className={`px-2 py-0.5 text-xs rounded border transition-all ${bgColor === 'transparent' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-slate-600 bg-slate-800 text-slate-400'}`}
              >
                None
              </button>
              <div className="flex gap-1 flex-wrap">
                {['rgba(0,0,0,0.7)', 'rgba(255,255,255,0.15)', 'rgba(200,167,102,0.8)', 'rgba(30,64,175,0.8)'].map(c => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    className={`w-5 h-5 rounded border-2 transition-all ${bgColor === c ? 'border-amber-400 scale-125' : 'border-slate-600 hover:border-slate-400'}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <input
                type="color"
                value={bgColor.startsWith('#') ? bgColor : '#000000'}
                onChange={e => setBgColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-slate-600 bg-transparent"
                title="Custom BG"
              />
            </div>
          </div>
        </section>

        {/* ── POSITION ───────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Position on Canvas</p>
          <div className="grid grid-cols-3 grid-rows-3 gap-1 w-32 mx-auto h-24 border border-slate-600 rounded-lg p-1 bg-slate-800/50">
            {(['top-left','top','top-right','left','center','right','bottom-left','bottom','bottom-right'] as const).map(pos => {
              const mainPos = pos.replace('-left','').replace('-right','') as 'top'|'center'|'bottom';
              const isActive = mainPos === position && (pos === mainPos);
              return (
                <button
                  key={pos}
                  onClick={() => {
                    if (pos === 'top' || pos === 'center' || pos === 'bottom') setPosition(pos);
                    else if (pos.startsWith('top')) setPosition('top');
                    else if (pos.startsWith('bottom')) setPosition('bottom');
                    else setPosition('center');
                  }}
                  className={`rounded transition-all text-xs ${
                    position === mainPos && pos === mainPos
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white'
                  }`}
                  title={pos}
                />
              );
            })}
          </div>
          <div className="flex gap-1.5 justify-center mt-2">
            {(['top','center','bottom'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPosition(p)}
                className={`px-3 py-1 text-xs rounded-md border capitalize transition-all ${
                  position === p
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-slate-600 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* ── ANIMATION ──────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Animation</p>
          <div className="grid grid-cols-4 gap-1.5">
            {TEXT_ANIMATIONS.map(a => (
              <button
                key={a.id}
                onClick={() => setAnimation(a.id)}
                className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-md border text-xs transition-all ${
                  animation === a.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{a.emoji}</span>
                <span className="text-[10px] leading-tight text-center">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── DURATION ───────────────────────────── */}
        <section>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-16 shrink-0">Duration</span>
            <Slider
              value={[duration]}
              min={1}
              max={30}
              step={0.5}
              onValueChange={([v]) => setDuration(v)}
              className="flex-1"
            />
            <span className="text-xs text-slate-300 w-10 text-right shrink-0">{duration}s</span>
          </div>
        </section>

        {/* ── ADD BUTTON ─────────────────────────── */}
        <Button
          onClick={handleAdd}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-2.5 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add to Timeline at {currentTime.toFixed(1)}s
        </Button>
      </div>
    </ScrollArea>
  );
}
