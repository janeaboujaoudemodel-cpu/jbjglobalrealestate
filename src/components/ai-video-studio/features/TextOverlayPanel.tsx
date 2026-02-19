import React, { useState, useCallback, useRef } from 'react';
import { Plus, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TextSettings } from '../types';
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

type PresetCategory = 'Title' | 'Lower Third' | 'Caption' | 'Quote' | 'Social';

type PresetItem = {
  label: string;
  category: PresetCategory;
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  style: 'clean' | 'bold' | 'highlight' | 'lower-third';
  textAlign: 'left' | 'center' | 'right';
  hoverAnimation: 'fade-in' | 'slide-up' | 'slide-down' | 'zoom-in' | 'typewriter';
  /** Extra inline CSS applied only to the thumbnail text span */
  extraStyle?: React.CSSProperties;
  /** Custom thumbnail renderer — overrides default text span layout */
  thumbnailRenderer?: () => React.ReactNode;
};

const PRESET_CATEGORIES: PresetCategory[] = ['Title', 'Lower Third', 'Caption', 'Quote', 'Social'];

const TEXT_PRESETS: PresetItem[] = [
  { label: 'Clean Title',    category: 'Title',       content: 'Your Title Here',   fontFamily: 'Inter, sans-serif',       fontSize: 52, fontWeight: 'bold',   color: '#FFFFFF', backgroundColor: 'transparent',     position: 'center', style: 'clean',       textAlign: 'center', hoverAnimation: 'fade-in'    },
  { label: 'Cinematic Title',category: 'Title',       content: 'EPIC SCENE',        fontFamily: 'Impact, sans-serif',      fontSize: 60, fontWeight: 'bold',   color: '#F5E6C8', backgroundColor: 'transparent',     position: 'center', style: 'clean',       textAlign: 'center', hoverAnimation: 'zoom-in'    },
  {
    label: 'Neon Glow', category: 'Title',
    content: 'NEON', fontFamily: 'Impact, sans-serif', fontSize: 64, fontWeight: 'bold',
    color: '#00FFFF', backgroundColor: 'transparent', position: 'center', style: 'bold', textAlign: 'center',
    hoverAnimation: 'fade-in',
    extraStyle: {
      textShadow: '0 0 8px #00FFFF, 0 0 20px #00FFFF, 0 0 40px #00BFFF',
      letterSpacing: '0.08em',
    },
  },
  {
    label: 'Kinetic Bold', category: 'Title',
    content: 'BOLD', fontFamily: 'Impact, sans-serif', fontSize: 72, fontWeight: 'bold',
    color: 'transparent', backgroundColor: 'transparent', position: 'center', style: 'bold', textAlign: 'center',
    hoverAnimation: 'zoom-in',
    extraStyle: {
      WebkitTextStroke: '1.5px #FFFFFF',
      color: 'transparent',
      letterSpacing: '0.06em',
    },
  },
  { label: 'Lower Third',    category: 'Lower Third', content: 'Name / Title',      fontFamily: 'Inter, sans-serif',       fontSize: 28, fontWeight: 'bold',   color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.7)', position: 'bottom', style: 'lower-third', textAlign: 'left',   hoverAnimation: 'slide-up'   },
  { label: 'Dubai Lower 3rd',category: 'Lower Third', content: 'Luxury Property',   fontFamily: 'Inter, sans-serif',       fontSize: 26, fontWeight: 'bold',   color: '#FFD700', backgroundColor: 'rgba(0,0,0,0.75)',position: 'bottom', style: 'lower-third', textAlign: 'left',   hoverAnimation: 'slide-up'   },
  {
    label: 'Breaking News', category: 'Lower Third',
    content: 'BREAKING NEWS', fontFamily: 'Impact, sans-serif', fontSize: 26, fontWeight: 'bold',
    color: '#FFFFFF', backgroundColor: 'transparent', position: 'bottom', style: 'highlight', textAlign: 'left',
    hoverAnimation: 'slide-up',
    thumbnailRenderer: () => (
      <div className="absolute bottom-1.5 left-0 right-0 flex items-center overflow-hidden" style={{ paddingLeft: 4 }}>
        <span style={{ background: '#E00', color: '#FFF', fontFamily: 'Impact, sans-serif', fontSize: 7, fontWeight: 'bold', padding: '1px 4px', borderRadius: 2, marginRight: 4, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>● LIVE</span>
        <span style={{ background: 'rgba(20,20,20,0.9)', color: '#FFF', fontFamily: 'Inter, sans-serif', fontSize: 7, fontWeight: 'bold', padding: '1px 5px', flexShrink: 0, whiteSpace: 'nowrap' }}>BREAKING: Major news event</span>
      </div>
    ),
  },
  { label: 'Caption Box',    category: 'Caption',     content: 'Caption text',      fontFamily: 'Inter, sans-serif',       fontSize: 24, fontWeight: 'normal', color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.6)', position: 'bottom', style: 'highlight',   textAlign: 'center', hoverAnimation: 'slide-down' },
  { label: 'Subtitle',       category: 'Caption',     content: 'Subtitle goes here',fontFamily: 'Inter, sans-serif',       fontSize: 22, fontWeight: 'normal', color: '#E2E8F0', backgroundColor: 'rgba(0,0,0,0.5)', position: 'bottom', style: 'highlight',   textAlign: 'center', hoverAnimation: 'fade-in'    },
  { label: 'Luxury Quote',   category: 'Quote',       content: '"Your Quote"',      fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 'normal', color: '#C8A766', backgroundColor: 'transparent',     position: 'center', style: 'clean',       textAlign: 'center', hoverAnimation: 'fade-in'    },
  { label: 'Minimal Quote',  category: 'Quote',       content: '— Author Name',     fontFamily: 'Georgia, serif',          fontSize: 30, fontWeight: 'normal', color: '#CBD5E1', backgroundColor: 'transparent',     position: 'center', style: 'clean',       textAlign: 'center', hoverAnimation: 'fade-in'    },
  {
    label: 'Luxury Watermark', category: 'Quote',
    content: '© JBJ Realty', fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 'normal',
    color: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent', position: 'top', style: 'clean', textAlign: 'right',
    hoverAnimation: 'fade-in',
    extraStyle: {
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      fontSize: 6,
    },
    thumbnailRenderer: () => (
      <div className="absolute top-1.5 right-2 flex items-center gap-1">
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 6, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>© JBJ REALTY</span>
      </div>
    ),
  },
  { label: 'Social Bold',    category: 'Social',      content: 'BIG TEXT',          fontFamily: 'Impact, sans-serif',      fontSize: 72, fontWeight: 'bold',   color: '#FFD700', backgroundColor: 'transparent',     position: 'center', style: 'bold',        textAlign: 'center', hoverAnimation: 'zoom-in'    },
  { label: 'Reel Hook',      category: 'Social',      content: 'Watch till end 👀', fontFamily: 'Inter, sans-serif',       fontSize: 40, fontWeight: 'bold',   color: '#FFFFFF', backgroundColor: 'transparent',     position: 'top',    style: 'bold',        textAlign: 'center', hoverAnimation: 'zoom-in'    },
  {
    label: 'Instagram Story', category: 'Social',
    content: '✨ Swipe Up', fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 'bold',
    color: '#FFFFFF', backgroundColor: 'transparent', position: 'bottom', style: 'highlight', textAlign: 'center',
    hoverAnimation: 'slide-up',
    thumbnailRenderer: () => (
      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 8, fontWeight: 'bold', color: '#FFF',
          background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
          padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
        }}>✨ Swipe Up</span>
      </div>
    ),
  },
];

// Per-animation keyframe CSS injected once into <head>
const ANIM_STYLES = `
@keyframes tp-fade-in {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes tp-slide-up {
  0%   { opacity: 0; transform: translateY(100%); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes tp-slide-down {
  0%   { opacity: 0; transform: translateY(-70%); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes tp-zoom-in {
  0%   { opacity: 0; transform: scale(0.55); }
  70%  { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}
`;

// Inject once
if (typeof document !== 'undefined' && !document.getElementById('tp-anim-styles')) {
  const el = document.createElement('style');
  el.id = 'tp-anim-styles';
  el.textContent = ANIM_STYLES;
  document.head.appendChild(el);
}

const ANIM_CSS: Record<string, string> = {
  'fade-in':    'tp-fade-in 0.45s cubic-bezier(0.22,1,0.36,1) both',
  'slide-up':   'tp-slide-up 0.42s cubic-bezier(0.22,1,0.36,1) both',
  'slide-down': 'tp-slide-down 0.42s cubic-bezier(0.22,1,0.36,1) both',
  'zoom-in':    'tp-zoom-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
};

const ANIM_LABEL: Record<string, string> = {
  'fade-in':    'Fade In',
  'slide-up':   'Slide Up',
  'slide-down': 'Slide Down',
  'zoom-in':    'Zoom In',
};

const COLOR_SWATCHES = [
  '#FFFFFF', '#000000', '#FFD700', '#C8A766', '#FF3B30',
  '#34C759', '#007AFF', '#AF52DE', '#FF9500', '#5AC8FA',
];

// ── TextPreviewThumbnail sub-component ──────────────────────────────────────

function TextPreviewThumbnail({ preset, isActive, onClick }: {
  preset: PresetItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const [animKey, setAnimKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scaledSize = Math.max(6, Math.round(preset.fontSize * 0.19));

  const textStyle: React.CSSProperties = {
    fontFamily: preset.fontFamily,
    fontSize: scaledSize,
    fontWeight: preset.fontWeight,
    color: preset.color,
    background: preset.backgroundColor !== 'transparent' ? preset.backgroundColor : 'transparent',
    padding: preset.backgroundColor !== 'transparent' ? '2px 5px' : 0,
    borderRadius: preset.backgroundColor !== 'transparent' ? 3 : 0,
    textAlign: preset.textAlign,
    whiteSpace: 'nowrap',
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
    animation: isHovered ? ANIM_CSS[preset.hoverAnimation] : 'none',
    ...preset.extraStyle,
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setAnimKey(k => k + 1);
    timerRef.current = setInterval(() => setAnimKey(k => k + 1), 900);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const positionWrap = (children: React.ReactNode) => {
    if (preset.position === 'center') {
      return <div className="absolute inset-0 flex items-center justify-center">{children}</div>;
    }
    if (preset.position === 'top') {
      return <div className="absolute top-1.5 left-0 right-0 flex justify-center overflow-hidden">{children}</div>;
    }
    return (
      <div
        className="absolute bottom-1.5 left-0 right-0 flex overflow-hidden"
        style={{ justifyContent: preset.textAlign === 'left' ? 'flex-start' : 'center', paddingLeft: preset.textAlign === 'left' ? 4 : 0 }}
      >
        {children}
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group flex flex-col rounded-lg overflow-hidden border transition-all duration-150 text-left w-full ${
        isActive
          ? 'ring-2 ring-amber-400 border-amber-400'
          : 'border-slate-700 bg-slate-800/50 hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/10 hover:scale-[1.02]'
      }`}
    >
      {/* Dark video bg area */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '16/9',
          background: 'radial-gradient(ellipse at center, #111111 0%, #050508 100%)',
        }}
      >
        {preset.thumbnailRenderer
          ? preset.thumbnailRenderer()
          : positionWrap(<span key={animKey} style={textStyle}>{preset.content}</span>)
        }

        {/* Animation label pill — shown on hover */}
        {isHovered && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wider bg-amber-500/80 text-black animate-fade-in pointer-events-none select-none">
            {ANIM_LABEL[preset.hoverAnimation]}
          </div>
        )}
      </div>

      {/* Label bar */}
      <div className="flex items-center justify-between px-1.5 py-1 bg-slate-800">
        <span className="text-[10px] font-semibold text-slate-200 truncate">{preset.label}</span>
        <Plus className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
      </div>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

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
  const [content, setContent]       = useState('Your Text Here');
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
  const [fontSize, setFontSize]     = useState(48);
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('bold');
  const [italic, setItalic]         = useState(false);
  const [color, setColor]           = useState('#FFFFFF');
  const [bgColor, setBgColor]       = useState('transparent');
  const [textAlign, setTextAlign]   = useState<'left' | 'center' | 'right'>('center');
  const [position, setPosition]     = useState<'top' | 'center' | 'bottom'>('center');
  const [animation, setAnimation]   = useState('fade-in');
  const [duration, setDuration]     = useState(4);
  const [opacity, setOpacity]       = useState(1);
  const [lastAppliedPreset, setLastAppliedPreset] = useState<string | null>(null);
  const [presetSearch, setPresetSearch]           = useState('');
  const [activeCategory, setActiveCategory]       = useState<PresetCategory | null>(null);

  const applyPreset = useCallback((preset: PresetItem) => {
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
    <div>
      <div className="p-4 space-y-5" style={{ color: '#F1F0EE' }}>

        {/* ── PRESETS ─────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Presets</p>

          {/* Search bar */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={presetSearch}
              onChange={e => setPresetSearch(e.target.value)}
              placeholder="Search presets…"
              className="w-full h-10 bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-8 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            {presetSearch && (
              <button
                onClick={() => setPresetSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category filter chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border transition-all duration-150 ${
                activeCategory === null
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              All
            </button>
            {PRESET_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border transition-all duration-150 ${
                  activeCategory === cat
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filtered grid */}
          {(() => {
            const filtered = TEXT_PRESETS.filter(p => {
              const matchesSearch = presetSearch === '' || p.label.toLowerCase().includes(presetSearch.toLowerCase()) || p.content.toLowerCase().includes(presetSearch.toLowerCase());
              const matchesCategory = activeCategory === null || p.category === activeCategory;
              return matchesSearch && matchesCategory;
            });

            if (filtered.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">No presets match your search</p>
                  <button
                    onClick={() => { setPresetSearch(''); setActiveCategory(null); }}
                    className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map(p => (
                  <TextPreviewThumbnail
                    key={p.label}
                    preset={p}
                    isActive={lastAppliedPreset === p.label}
                    onClick={() => {
                      // Only SELECT/PREVIEW the preset — do NOT auto-add to timeline
                      applyPreset(p);
                      setLastAppliedPreset(p.label);
                      toast.success(`"${p.label}" selected — click Add to place it`);
                    }}
                  />
                ))}
              </div>
            );
          })()}
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
    </div>
  );
}
