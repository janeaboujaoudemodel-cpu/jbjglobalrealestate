/**
 * StampPreviewModal — Full-screen design preview
 * Shows the selected stamp on Business Card, Letterhead, Envelope, Contract, Wax Seal, and Stationery mockups
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StampSVGRenderer } from './StampSVGRenderer';
import { StampTextEditor } from './StampTextEditor';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, Download, CreditCard, FileText, Mail, Loader2, Maximize2, Type, ZoomIn, ZoomOut, RotateCcw, Scroll, Stamp, BookOpen, Layers, Lock, Unlock, PenTool, Book, AlignLeft, AlignCenter, AlignRight, Palette } from 'lucide-react';
import { StampDesignConcept } from '@/lib/stampTemplates';

interface Props {
  concept: StampDesignConcept;
  project: any;
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  svgOverride?: string;
  onBack: () => void;
  onSelectAndExport: () => void;
  onSvgChange?: (newSvg: string) => void;
  initialShowEditor?: boolean;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  fontSize?: number | null;
  projectId?: string;
}

type MockupView = 'business-card' | 'letterhead' | 'envelope' | 'contract' | 'wax-seal' | 'stationery' | 'book-cover';

export function StampPreviewModal({
  concept, project, tintColor, secondaryColor, accentColor, svgOverride, onBack, onSelectAndExport, onSvgChange,
  initialShowEditor = false, fontFamily, fontWeight, fontStyle, fontSize, projectId,
}: Props) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<MockupView>('business-card');
  const [stampFullscreen, setStampFullscreen] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(initialShowEditor);
  const [localSvg, setLocalSvg] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState(1.0);
  const [scaleLocked, setScaleLocked] = useState(false);
  const [textScale, setTextScale] = useState(1.0);
  const [textScaleLocked, setTextScaleLocked] = useState(false);
  const [monoScale, setMonoScale] = useState(1.0);
  const [monoScaleLocked, setMonoScaleLocked] = useState(false);
  const [stampAlign, setStampAlign] = useState<'left' | 'center' | 'right'>('right');
  const textEditorRef = useRef<HTMLDivElement>(null);
  const displaySvg = localSvg || svgOverride || concept.svgSource;

  function handleSvgEdit(newSvg: string) {
    setLocalSvg(newSvg);
    onSvgChange?.(newSvg);
  }
  const companyName = project?.company_name || 'Company Name';
  const arabicName = project?.arabic_company_name || '';
  const city = [project?.city_optional, project?.country_optional].filter(Boolean).join(', ') || 'UAE';

  async function downloadPreviewPng() {
    setDownloadingPng(true);
    try {
      let svg = displaySvg;
      const token = Math.random().toString(36).slice(2, 7);
      svg = svg.replace(/\bid="([^"]+)"/g, (_, id) => `id="${token}_${id}"`);
      svg = svg.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${token}_${id})`);
      svg = svg.replace(/href="#([^"]+)"/g, (_, id) => `href="#${token}_${id}"`);
      if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      if (!svg.includes('xmlns:xlink')) svg = svg.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      svg = svg.replace(/<svg([^>]*)>/, (_, a) => {
        const clean = a.replace(/\bwidth="[^"]*"/, '').replace(/\bheight="[^"]*"/, '');
        return `<svg${clean} width="512" height="512">`;
      });
      const b64 = btoa(unescape(encodeURIComponent(svg)));
      const dataUrl = `data:image/svg+xml;base64,${b64}`;
      await new Promise<void>((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = async () => {
          try {
            await img.decode();
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, 512, 512);
            canvas.toBlob(b => {
              if (!b) { reject(new Error('toBlob null')); return; }
              const url = URL.createObjectURL(b);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${companyName.toLowerCase().replace(/\s+/g, '_')}_stamp_preview.png`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              resolve();
            }, 'image/png');
          } catch (e) { reject(e); }
        };
        img.onerror = () => reject(new Error('SVG render failed'));
        img.src = dataUrl;
      });
    } catch (err) {
      console.error('Preview PNG download failed:', err);
    }
    setDownloadingPng(false);
  }

  const views: { key: MockupView; label: string; icon: React.ElementType }[] = [
    { key: 'business-card', label: 'Business Card', icon: CreditCard },
    { key: 'letterhead',    label: 'Letterhead',    icon: FileText },
    { key: 'envelope',      label: 'Envelope',      icon: Mail },
    { key: 'contract',      label: 'Contract',      icon: Scroll },
    { key: 'wax-seal',      label: 'Wax Seal',      icon: Stamp },
    { key: 'stationery',    label: 'Stationery',    icon: BookOpen },
    { key: 'book-cover',    label: 'Book Cover',    icon: Book },
  ];

  return (
    <div className="fixed inset-0 z-[10050] bg-black/80 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-[hsl(var(--border))] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
            <ArrowLeft size={15}/> Back to Designs
          </button>
          <div className="w-px h-5 bg-[hsl(var(--border))]"/>
          <span className="font-semibold text-[hsl(var(--foreground))] text-sm">{concept.label}</span>
        </div>
        <button onClick={onBack} className="p-1.5 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors">
          <X size={18} className="text-[hsl(var(--muted-foreground))]"/>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto flex flex-col lg:flex-row">

        {/* Left: stamp large preview + controls */}
        <div className="lg:w-80 flex-shrink-0 bg-white border-r border-[hsl(var(--border))] flex flex-col items-center pt-12 pb-6 px-6 gap-4 overflow-y-auto">
          <div className="relative bg-[hsl(var(--pearl-1))] rounded-3xl border border-[hsl(var(--border))] shadow-md p-6 flex items-center justify-center w-full">
            <button
              onClick={() => setStampFullscreen(true)}
              title="View fullscreen"
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))] transition-colors"
            >
              <Maximize2 size={14}/>
            </button>
            <div
              className="cursor-zoom-in select-none flex items-center justify-center"
              style={{ transform: `scale(${logoScale})`, transition: 'transform 0.15s ease', transformOrigin: 'center' }}
              onClick={() => {
                if (logoScale >= 1.5) {
                  // Auto-scroll to mockup area instead of resetting
                  const mockupArea = document.querySelector('[data-mockup-area]');
                  if (mockupArea) {
                    mockupArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                } else {
                  setLogoScale(s => +(s + 0.15).toFixed(2));
                }
              }}
              title="Click to zoom in · At max zoom, scrolls to document mockups"
            >
              <StampSVGRenderer
                svgSource={displaySvg}
                tintColor={tintColor}
                secondaryColor={secondaryColor}
                accentColor={accentColor}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                fontStyle={fontStyle}
                fontSize={fontSize}
                size={220}
              />
            </div>
          </div>
          {/* Stamp size slider with lock */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Stamp Size</span>
              <button onClick={() => setScaleLocked(v => !v)} title={scaleLocked ? 'Unlock' : 'Lock'} className={`p-1 rounded transition-colors ${scaleLocked ? 'text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold)/0.1)]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
                {scaleLocked ? <Lock size={11}/> : <Unlock size={11}/>}
              </button>
            </div>
            <div className="flex items-center gap-2 px-1">
              <button onClick={() => !scaleLocked && setLogoScale(s => Math.max(0.5, +(s - 0.1).toFixed(2)))} disabled={scaleLocked} className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30">
                <ZoomOut size={14}/>
              </button>
              <input
                type="range" min="0.5" max="2.0" step="0.05"
                value={logoScale}
                onChange={e => !scaleLocked && setLogoScale(parseFloat(e.target.value))}
                disabled={scaleLocked}
                className="flex-1 accent-[hsl(var(--gold))] h-1.5 cursor-pointer disabled:opacity-30"
              />
              <button onClick={() => !scaleLocked && setLogoScale(s => Math.min(2.0, +(s + 0.1).toFixed(2)))} disabled={scaleLocked} className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30">
                <ZoomIn size={14}/>
              </button>
              <button onClick={() => !scaleLocked && setLogoScale(1.0)} disabled={scaleLocked} title="Reset" className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30">
                <RotateCcw size={12}/>
              </button>
            </div>

            {/* Monogram size slider */}
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Monogram Size</span>
              <button onClick={() => setMonoScaleLocked(v => !v)} title={monoScaleLocked ? 'Unlock' : 'Lock'} className={`p-1 rounded transition-colors ${monoScaleLocked ? 'text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold)/0.1)]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
                {monoScaleLocked ? <Lock size={11}/> : <Unlock size={11}/>}
              </button>
            </div>
            <div className="flex items-center gap-2 px-1">
              <input
                type="range" min="0.5" max="2.0" step="0.05"
                value={monoScale}
                onChange={e => !monoScaleLocked && setMonoScale(parseFloat(e.target.value))}
                disabled={monoScaleLocked}
                className="flex-1 accent-[hsl(var(--gold))] h-1.5 cursor-pointer disabled:opacity-30"
              />
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-8 text-right">{(monoScale * 100).toFixed(0)}%</span>
            </div>

            {/* Text size slider */}
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Text Size</span>
              <button onClick={() => setTextScaleLocked(v => !v)} title={textScaleLocked ? 'Unlock' : 'Lock'} className={`p-1 rounded transition-colors ${textScaleLocked ? 'text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold)/0.1)]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
                {textScaleLocked ? <Lock size={11}/> : <Unlock size={11}/>}
              </button>
            </div>
            <div className="flex items-center gap-2 px-1">
              <input
                type="range" min="0.5" max="2.0" step="0.05"
                value={textScale}
                onChange={e => !textScaleLocked && setTextScale(parseFloat(e.target.value))}
                disabled={textScaleLocked}
                className="flex-1 accent-[hsl(var(--gold))] h-1.5 cursor-pointer disabled:opacity-30"
              />
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-8 text-right">{(textScale * 100).toFixed(0)}%</span>
            </div>
          </div>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Drag slider · Click stamp to zoom</p>
          <div className="text-center space-y-0.5">
            <p className="font-semibold text-[hsl(var(--foreground))]">{concept.label}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{companyName}</p>
          </div>
          <Button
            onClick={onSelectAndExport}
            className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2"
          >
            <Download size={15}/> Select & Export →
          </Button>
          <Button
            variant="outline"
            onClick={downloadPreviewPng}
            disabled={downloadingPng}
            className="w-full gap-2 text-sm"
          >
            {downloadingPng ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
            {downloadingPng ? 'Downloading…' : 'Download Preview PNG'}
          </Button>
          {projectId && (
            <Button
              variant="ghost"
              onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/gallery`)}
              className="w-full gap-2 text-sm"
            >
              <Layers size={14}/> Go to Gallery
            </Button>
          )}
          {/* Use in E-Signature */}
          <Button
            variant="outline"
            onClick={() => {
              // Save stamp SVG to sessionStorage for e-signature flow
              try {
                sessionStorage.setItem('esignature_stamp_svg', displaySvg);
                sessionStorage.setItem('esignature_stamp_color', tintColor);
                toast.success('Stamp saved! Redirecting to E-Signature…');
                navigate('/e-signature/create');
              } catch {
                toast.error('Failed to save stamp for E-Signature');
              }
            }}
            className="w-full gap-2 text-sm border-[hsl(var(--gold)/0.3)] hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.05)]"
          >
            <PenTool size={14}/> Use in E-Signature
          </Button>
          {/* Edit Text toggle */}
          <Button
            variant={showTextEditor ? 'default' : 'outline'}
            onClick={() => {
              const willOpen = !showTextEditor;
              setShowTextEditor(willOpen);
              if (willOpen) {
                setTimeout(() => textEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }
            }}
            className={`w-full gap-2 text-sm ${showTextEditor ? 'bg-[hsl(var(--gold))] text-white border-transparent' : ''}`}
          >
            <Type size={14}/> {showTextEditor ? 'Hide Text Editor' : 'Edit Text Elements'}
          </Button>
          {showTextEditor && (
            <div ref={textEditorRef} className="w-full border border-[hsl(var(--border))] rounded-xl p-3 bg-white">
              <StampTextEditor
                svgSource={displaySvg}
                onSvgChange={handleSvgEdit}
              />
            </div>
          )}
        </div>

        {/* Right: mockup */}
        <div className="flex-1 flex flex-col">
          {/* View tabs */}
          <div className="flex-shrink-0 bg-white border-b border-[hsl(var(--border))] px-4 py-2 flex gap-1 flex-wrap">
            {views.map(v => (
              <button
                key={v.key}
                onClick={() => setActiveView(v.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeView === v.key
                    ? 'bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                <v.icon size={13}/> {v.label}
              </button>
            ))}
          </div>

          {/* Mockup area */}
          <div data-mockup-area className="flex-1 flex flex-col items-center justify-center p-10 bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))] min-h-full overflow-y-auto jj-scrollbar-gold">
            {/* Alignment controls */}
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mr-2">Stamp Position</span>
              {([
                { key: 'left' as const, icon: AlignLeft, label: 'Left' },
                { key: 'center' as const, icon: AlignCenter, label: 'Center' },
                { key: 'right' as const, icon: AlignRight, label: 'Right' },
              ]).map(a => (
                <button key={a.key} onClick={() => setStampAlign(a.key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                    stampAlign === a.key
                      ? 'bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border-[hsl(var(--gold)/0.4)]'
                      : 'text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                  }`}>
                  <a.icon size={11}/> {a.label}
                </button>
              ))}
            </div>

            {/* Business Card Mockup */}
            {activeView === 'business-card' && (
              <div className="w-full max-w-xl">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-4 uppercase tracking-wide">Business Card Preview</p>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '1.75 / 1', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                  <div className="absolute inset-0 p-7 flex items-stretch">
                    <div className={`flex-1 flex flex-col justify-between ${stampAlign === 'left' ? 'order-2 pl-6' : ''}`}>
                      <div>
                        <p className="text-white font-bold text-xl leading-tight tracking-tight">{companyName}</p>
                        {arabicName && <p className="text-white/70 text-sm mt-1" dir="rtl">{arabicName}</p>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Chief Executive Officer</p>
                        <p className="text-white/40 text-xs">{city}</p>
                      </div>
                    </div>
                    <div className={`flex items-center ${stampAlign === 'left' ? 'order-1 pr-6' : stampAlign === 'center' ? 'absolute inset-0 justify-center items-center' : 'justify-end pl-6'}`}>
                      <div className="opacity-85">
                        <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} inkMode={false} size={100}/>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${tintColor}88, ${tintColor}ff, ${tintColor}44)` }}/>
                </div>
                <div className="mt-4 relative rounded-2xl overflow-hidden shadow-xl flex items-center justify-center" style={{ aspectRatio: '1.75 / 1', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                  <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${tintColor}28 0%, transparent 70%)` }}/>
                  <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} size={120}/>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center mt-2">Front (top) · Back (bottom)</p>
              </div>
            )}

            {/* Letterhead Mockup */}
            {activeView === 'letterhead' && (
              <div className="w-full max-w-lg">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-4 uppercase tracking-wide">A4 Letterhead Preview</p>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[hsl(var(--border))]" style={{ aspectRatio: '0.707 / 1' }}>
                  <div style={{ backgroundColor: tintColor }} className="px-8 py-5 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-base leading-tight">{companyName}</p>
                      {arabicName && <p className="text-white/70 text-sm mt-0.5" dir="rtl">{arabicName}</p>}
                      <p className="text-white/60 text-xs mt-1">{city}</p>
                    </div>
                    <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} size={70}/>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    <div className="space-y-1">
                      <div className="h-2 w-32 rounded bg-gray-200"/>
                      <div className="h-1.5 w-48 rounded bg-gray-100"/>
                    </div>
                    <div className="space-y-1.5">
                      {[0.9, 0.75, 0.85, 0.6, 0.8, 0.7, 0.88, 0.65].map((w, i) => (
                        <div key={i} className="h-1.5 rounded bg-gray-200" style={{ width: `${w * 100}%` }}/>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {[0.82, 0.7, 0.91, 0.55, 0.78].map((w, i) => (
                        <div key={i} className="h-1.5 rounded bg-gray-200" style={{ width: `${w * 100}%` }}/>
                      ))}
                    </div>
                    <div className="mt-8 flex items-end justify-between">
                      <div>
                        <div className="h-px w-24 bg-gray-400"/>
                        <div className="h-1.5 w-20 rounded bg-gray-200 mt-1"/>
                      </div>
                      <div className="opacity-60">
                        <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} size={60}/>
                      </div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: `${tintColor}22` }} className="px-8 py-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center">{companyName} · {city}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Envelope Mockup */}
            {activeView === 'envelope' && (
              <div className="w-full max-w-2xl">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-4 uppercase tracking-wide">Envelope Preview</p>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[hsl(var(--border))]" style={{ aspectRatio: '2.15 / 1', background: 'linear-gradient(135deg, #f5f0e8 0%, #ede8da 100%)' }}>
                  <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
                    <div style={{ width: 0, height: 0, borderLeft: '50vw solid transparent', borderRight: '50vw solid transparent', borderTop: '80px solid rgba(200,185,160,0.5)' }}/>
                  </div>
                  <div className="absolute top-5 left-7 space-y-0.5">
                    <p className="text-gray-700 font-bold text-xs">{companyName}</p>
                    <p className="text-gray-500 text-[10px]">{city}</p>
                  </div>
                  <div className={`absolute top-5 opacity-90 ${stampAlign === 'left' ? 'left-7' : stampAlign === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-7'}`}>
                    <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} size={72}/>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-0.5">
                      <div className="h-2 w-36 rounded bg-gray-300 mx-auto"/>
                      <div className="h-1.5 w-28 rounded bg-gray-200 mx-auto"/>
                      <div className="h-1.5 w-24 rounded bg-gray-200 mx-auto"/>
                    </div>
                  </div>
                  {/* Removed duplicate bottom stamp — only top-right stamp shown */}
                </div>
              </div>
            )}

            {/* Contract / A4 Document Mockup */}
            {activeView === 'contract' && (
              <div className="w-full max-w-lg">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-4 uppercase tracking-wide">Contract / Approval Seal Preview</p>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[hsl(var(--border))]" style={{ aspectRatio: '0.707 / 1' }}>
                  <div style={{ backgroundColor: tintColor }} className="h-2 w-full"/>
                  <div className="px-8 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="h-2.5 w-28 rounded bg-gray-800 mb-1.5"/>
                        <div className="h-1.5 w-16 rounded bg-gray-300"/>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">DOC-2024-001</p>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {[0.92, 0.78, 0.88, 0.65, 0.83, 0.7, 0.9, 0.6, 0.85, 0.72, 0.88, 0.58].map((w, i) => (
                        <div key={i} className="h-1.5 rounded bg-gray-200" style={{ width: `${w * 100}%` }}/>
                      ))}
                    </div>
                    <div className="space-y-1.5 mb-6">
                      {[0.8, 0.68, 0.9, 0.55].map((w, i) => (
                        <div key={i} className="h-1.5 rounded bg-gray-200" style={{ width: `${w * 100}%` }}/>
                      ))}
                    </div>
                    <div className="flex items-end justify-between pt-4 border-t border-gray-200">
                      <div className="space-y-1">
                        <div className="h-px w-28 bg-gray-400"/>
                        <div className="h-1.5 w-20 rounded bg-gray-200"/>
                        <p className="text-[9px] text-gray-400">Authorized Signature</p>
                      </div>
                      <div className="relative flex items-center justify-center" style={{ transform: 'rotate(-8deg)' }}>
                        <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} inkMode={true} size={80}/>
                      </div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: `${tintColor}11` }} className="px-8 py-2 border-t border-gray-100">
                    <p className="text-[9px] text-gray-400 text-center">{companyName} · {city} · Official Document</p>
                  </div>
                </div>
              </div>
            )}

            {/* Wax Seal Mockup — Premium Embossed */}
            {activeView === 'wax-seal' && (
              <div className="w-full max-w-lg flex flex-col items-center gap-6">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center uppercase tracking-wide">Premium Wax Seal Impression</p>
                <div className="w-full rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center p-12" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', minHeight: 360 }}>
                  <div className="flex flex-col items-center gap-8">
                    <div className="relative flex items-center justify-center">
                      {/* Outer embossed ring */}
                      <div
                        className="absolute rounded-full"
                        style={{
                          width: 260, height: 260,
                          background: `radial-gradient(circle at 30% 30%, ${tintColor}55, transparent 60%)`,
                          boxShadow: `0 0 60px ${tintColor}33`,
                        }}
                      />
                      {/* Main wax disc */}
                      <div
                        className="absolute rounded-full"
                        style={{
                          width: 230, height: 230,
                          background: `radial-gradient(circle at 35% 30%, ${tintColor}ee, ${tintColor}ff 45%, ${tintColor}cc 70%, ${tintColor}88)`,
                          boxShadow: `0 12px 48px ${tintColor}88, inset 0 3px 12px rgba(255,255,255,0.25), inset 0 -6px 18px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5)`,
                        }}
                      />
                      {/* Inner ring detail */}
                      <div
                        className="absolute rounded-full"
                        style={{
                          width: 200, height: 200,
                          border: `2px solid rgba(255,255,255,0.12)`,
                          boxShadow: `inset 0 1px 4px rgba(255,255,255,0.1), inset 0 -1px 4px rgba(0,0,0,0.2)`,
                        }}
                      />
                      {/* Stamp impression — larger and prominent */}
                      <div className="relative z-10" style={{ filter: 'brightness(0) invert(1) opacity(0.92)', mixBlendMode: 'soft-light' }}>
                        <StampSVGRenderer svgSource={displaySvg} tintColor="#ffffff" secondaryColor="#ffffff" accentColor="#ffffff" fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} size={200}/>
                      </div>
                      {/* Specular highlight */}
                      <div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          width: 100, height: 60,
                          top: 20, left: '30%',
                          background: 'radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)',
                          transform: 'rotate(-15deg)',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-px w-20" style={{ background: `linear-gradient(90deg, transparent, ${tintColor}66)` }}/>
                      <p className="text-sm tracking-[0.2em] uppercase font-semibold" style={{ color: `${tintColor}cc`, fontFamily: 'Georgia, serif', textShadow: `0 0 20px ${tintColor}44` }}>{companyName}</p>
                      <div className="h-px w-20" style={{ background: `linear-gradient(90deg, ${tintColor}66, transparent)` }}/>
                    </div>
                    <p className="text-[10px] tracking-[0.15em] uppercase text-white/30">{city} · Authenticated Seal</p>
                  </div>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center">Premium wax seal impression — embossed on luxury stationery & documents</p>
              </div>
            )}

            {/* Stationery / Notebook Mockup */}
            {activeView === 'stationery' && (
              <div className="w-full max-w-md flex flex-col items-center gap-4">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-2 uppercase tracking-wide">Stationery / Notebook Cover</p>
                <div
                  className="w-full rounded-2xl shadow-2xl overflow-hidden relative"
                  style={{ aspectRatio: '0.75 / 1', background: `linear-gradient(160deg, ${tintColor}f0 0%, ${tintColor}dd 100%)` }}
                >
                  {/* Spiral binding on left */}
                  <div className="absolute left-0 top-0 bottom-0 w-7 flex flex-col justify-around items-center py-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border-2 border-white/40 bg-white/10"/>
                    ))}
                  </div>
                  {/* Cover content */}
                  <div className="ml-8 h-full flex flex-col items-center justify-center gap-5 p-6">
                    <div className="relative flex items-center justify-center p-4 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)' }}>
                      <div style={{ filter: 'brightness(0) invert(1) opacity(0.9)' }}>
                        <StampSVGRenderer svgSource={displaySvg} tintColor="#ffffff" secondaryColor="#ffffff" accentColor="#ffffff" fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} size={130}/>
                      </div>
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="text-white font-bold text-lg tracking-wider" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{companyName}</p>
                      {arabicName && <p className="text-white/70 text-sm" dir="rtl">{arabicName}</p>}
                      <div className="h-px w-24 mx-auto" style={{ background: 'rgba(255,255,255,0.3)' }}/>
                      <p className="text-white/60 text-xs tracking-widest uppercase">{city}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Book Cover Mockup */}
            {activeView === 'book-cover' && (
              <div className="w-full max-w-md flex flex-col items-center gap-4">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-2 uppercase tracking-wide">Book Cover Preview</p>
                <div
                  className="w-full rounded-2xl shadow-2xl overflow-hidden relative"
                  style={{ aspectRatio: '0.67 / 1', background: `linear-gradient(175deg, ${tintColor}f8 0%, ${tintColor}dd 40%, ${tintColor}aa 100%)` }}
                >
                  {/* Spine shadow */}
                  <div className="absolute left-0 top-0 bottom-0 w-3" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.35), transparent)' }}/>
                  {/* Top decorative band */}
                  <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-px w-3/4 mx-auto" style={{ background: 'rgba(255,255,255,0.2)' }}/>
                  </div>
                  {/* Cover content */}
                  <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
                    {/* Stamp as emblem */}
                    <div className="relative flex items-center justify-center p-5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.15)' }}>
                      <div style={{ filter: 'brightness(0) invert(1) opacity(0.92)' }}>
                        <StampSVGRenderer svgSource={displaySvg} tintColor="#ffffff" secondaryColor="#ffffff" accentColor="#ffffff" fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} fontSize={fontSize} size={140}/>
                      </div>
                    </div>
                    {/* Title area */}
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold text-xl tracking-wider" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)', fontFamily: 'Georgia, serif' }}>{companyName}</p>
                      {arabicName && <p className="text-white/70 text-base" dir="rtl" style={{ fontFamily: 'Georgia, serif' }}>{arabicName}</p>}
                      <div className="h-px w-28 mx-auto" style={{ background: 'rgba(255,255,255,0.25)' }}/>
                      <p className="text-white/50 text-xs tracking-[0.2em] uppercase">Company Profile</p>
                    </div>
                    {/* Bottom area */}
                    <div className="mt-auto text-center">
                      <p className="text-white/40 text-[10px] tracking-widest uppercase">{city} · {new Date().getFullYear()}</p>
                    </div>
                  </div>
                  {/* Bottom decorative band */}
                  <div className="absolute bottom-0 left-0 right-0 h-3" style={{ background: `linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.15), rgba(255,255,255,0.08))` }}/>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center">A5 book cover — uses your stamp colors and company branding</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen stamp overlay */}
      {stampFullscreen && (
        <div
          className="fixed inset-0 z-[10100] bg-black/90 flex items-center justify-center"
          onClick={() => setStampFullscreen(false)}
        >
          <button
            onClick={() => setStampFullscreen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={22}/>
          </button>
          <div className="bg-white rounded-3xl p-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <StampSVGRenderer
              svgSource={displaySvg}
              tintColor={tintColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
              size={420}
            />
          </div>
          <p className="absolute bottom-6 text-white/40 text-xs">Click outside to close</p>
        </div>
      )}
    </div>
  );
}
