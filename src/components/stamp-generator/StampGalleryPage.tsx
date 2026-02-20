/**
 * StampGalleryPage — Full-screen showcase for all stamp concepts in a project.
 * Features: masonry grid, full-screen lightbox with pinch/wheel zoom,
 * 3-stop color switcher, one-click PNG / SVG / PDF export without leaving the page.
 */
import React, { useState, useEffect, useRef, useCallback, WheelEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StampSVGRenderer } from './StampSVGRenderer';
import { StampColorWheel } from './StampColorWheel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft, Download, X, ZoomIn, ZoomOut, RotateCcw,
  ChevronLeft, ChevronRight, Palette, Stamp, Loader2,
  Heart, FileImage, FileText, File, Package, Check
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DesignRow {
  id: string;
  template_key: string;
  svg_source: string;
  is_favorite: boolean;
  created_at: string;
}

type ColorStop = 'primary' | 'secondary' | 'accent';

// ─── Export helpers (same battle-tested pipeline as StampExportPage) ──────────
function uniquifyIds(svg: string): string {
  const t = Math.random().toString(36).slice(2, 7);
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${t}_${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${t}_${id})`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${t}_${id}"`);
}

function tintSvg(svg: string, primary: string, secondary?: string, accent?: string): string {
  let s = svg.replace(/#1a2744/gi, primary);
  if (secondary) s = s.replace(/#2a3a5c/gi, secondary);
  if (accent) s = s.replace(/(dominant-baseline="central"[^>]*fill=")[^"]+(")/g, `$1${accent}$2`);
  return s;
}

async function svgToPngBlob(svgString: string, size: number, transparent: boolean): Promise<Blob> {
  let svg = uniquifyIds(svgString);
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  if (!svg.includes('xmlns:xlink')) svg = svg.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  svg = svg.replace(/<svg([^>]*)>/, (_, a) => {
    const c = a.replace(/\bwidth="[^"]*"/, '').replace(/\bheight="[^"]*"/, '');
    return `<svg${c} width="${size}" height="${size}">`;
  });
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  const dataUrl = `data:image/svg+xml;base64,${b64}`;
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = async () => {
      try {
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        if (!transparent) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size); }
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob null')), 'image/png');
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('SVG render failed'));
    img.src = dataUrl;
  });
}

async function svgToPdfBlob(svgString: string): Promise<Blob> {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const pngBlob = await svgToPngBlob(svgString, 1200, false);
  const pngBytes = await pngBlob.arrayBuffer();
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 300]);
  const img = await doc.embedPng(pngBytes);
  page.drawRectangle({ x: 0, y: 0, width: 300, height: 300, color: rgb(1, 1, 1) });
  page.drawImage(img, { x: 0, y: 0, width: 300, height: 300 });
  return new Blob([(await doc.save()).buffer as ArrayBuffer], { type: 'application/pdf' });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Palette presets ──────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { label: 'JBJ Gold',   hex: '#B8860B' },
  { label: 'Navy',       hex: '#1a2744' },
  { label: 'Obsidian',   hex: '#0d0d0d' },
  { label: 'Crimson',    hex: '#8B0000' },
  { label: 'Forest',     hex: '#1B4332' },
  { label: 'Purple',     hex: '#4B0082' },
  { label: 'Copper',     hex: '#7C4A00' },
  { label: 'Teal',       hex: '#0D5C63' },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function StampGalleryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Color system
  const [primaryColor, setPrimaryColor] = useState('#1a2744');
  const [secondaryColor, setSecondaryColor] = useState<string | undefined>(undefined);
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [activeStop, setActiveStop] = useState<ColorStop>('primary');
  const [colorPanelOpen, setColorPanelOpen] = useState(false);

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Export
  const [exporting, setExporting] = useState<Record<string, boolean>>({});
  const [exported, setExported] = useState<Record<string, boolean>>({});

  // Load
  useEffect(() => {
    if (!user || !projectId) return;
    (async () => {
      const [{ data: p }, { data: d }] = await Promise.all([
        supabase.from('stamp_projects').select('*').eq('id', projectId).eq('user_id', user!.id).single(),
        supabase.from('stamp_designs').select('id,template_key,svg_source,is_favorite,created_at')
          .eq('project_id', projectId).order('is_favorite', { ascending: false }).order('created_at', { ascending: false }).limit(30),
      ]);
      if (!p) { toast.error('Project not found'); navigate('/toolkit/stamp-generator'); return; }
      setProject(p);
      setDesigns((d || []).filter((r: any) => r.svg_source));
      setLoading(false);
    })();
  }, [user, projectId]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxIdx === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 5));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.25));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, designs.length]);

  function openLightbox(idx: number) {
    setLightboxIdx(idx);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }
  function closeLightbox() { setLightboxIdx(null); setZoom(1); setPan({ x: 0, y: 0 }); }
  function goNext() {
    if (lightboxIdx === null) return;
    const next = (lightboxIdx + 1) % designs.length;
    setLightboxIdx(next); setZoom(1); setPan({ x: 0, y: 0 });
  }
  function goPrev() {
    if (lightboxIdx === null) return;
    const prev = (lightboxIdx - 1 + designs.length) % designs.length;
    setLightboxIdx(prev); setZoom(1); setPan({ x: 0, y: 0 });
  }

  // Wheel zoom
  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.25), 5));
  }

  // Pan drag
  function onDragStart(e: React.MouseEvent) {
    if (zoom <= 1) return;
    isDragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isDragging.current) return;
      setPan({ x: dragStart.current.px + e.clientX - dragStart.current.mx, y: dragStart.current.py + e.clientY - dragStart.current.my });
    }
    function onUp() { isDragging.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Active color
  const activeColor = activeStop === 'primary' ? primaryColor : activeStop === 'secondary' ? (secondaryColor || '#2a3a5c') : (accentColor || '#B8860B');
  function setActiveColor(hex: string) {
    if (activeStop === 'primary') setPrimaryColor(hex);
    else if (activeStop === 'secondary') setSecondaryColor(hex);
    else setAccentColor(hex);
  }

  const stopDefs: { key: ColorStop; label: string; color: string }[] = [
    { key: 'primary',   label: 'Primary',   color: primaryColor },
    { key: 'secondary', label: 'Secondary', color: secondaryColor || '#2a3a5c' },
    { key: 'accent',    label: 'Accent',    color: accentColor   || '#B8860B' },
  ];

  // Export helpers
  async function exportPNG(design: DesignRow, size = 1024) {
    const key = `png_${design.id}`;
    setExporting(s => ({ ...s, [key]: true }));
    try {
      const svg = tintSvg(design.svg_source, primaryColor, secondaryColor, accentColor);
      const blob = await svgToPngBlob(svg, size, true);
      const slug = (project?.company_name || 'stamp').toLowerCase().replace(/\s+/g, '_');
      triggerDownload(blob, `${slug}_stamp_${size}px.png`);
      setExported(s => ({ ...s, [key]: true }));
      toast.success(`PNG ${size}px downloaded!`);
    } catch (e) { toast.error('PNG export failed'); }
    setExporting(s => ({ ...s, [key]: false }));
  }

  async function exportSVG(design: DesignRow) {
    const key = `svg_${design.id}`;
    setExporting(s => ({ ...s, [key]: true }));
    try {
      const svg = tintSvg(design.svg_source, primaryColor, secondaryColor, accentColor);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const slug = (project?.company_name || 'stamp').toLowerCase().replace(/\s+/g, '_');
      triggerDownload(blob, `${slug}_stamp.svg`);
      setExported(s => ({ ...s, [key]: true }));
      toast.success('SVG downloaded!');
    } catch (e) { toast.error('SVG export failed'); }
    setExporting(s => ({ ...s, [key]: false }));
  }

  async function exportPDF(design: DesignRow) {
    const key = `pdf_${design.id}`;
    setExporting(s => ({ ...s, [key]: true }));
    try {
      const svg = tintSvg(design.svg_source, primaryColor, secondaryColor, accentColor);
      const blob = await svgToPdfBlob(svg);
      const slug = (project?.company_name || 'stamp').toLowerCase().replace(/\s+/g, '_');
      triggerDownload(blob, `${slug}_stamp_print.pdf`);
      setExported(s => ({ ...s, [key]: true }));
      toast.success('PDF downloaded!');
    } catch (e) { toast.error('PDF export failed'); }
    setExporting(s => ({ ...s, [key]: false }));
  }

  async function toggleFavorite(design: DesignRow) {
    const newVal = !design.is_favorite;
    await supabase.from('stamp_designs').update({ is_favorite: newVal }).eq('id', design.id);
    setDesigns(prev => {
      const updated = prev.map(d => d.id === design.id ? { ...d, is_favorite: newVal } : d);
      // Re-sort: favorites first
      return [...updated.filter(d => d.is_favorite), ...updated.filter(d => !d.is_favorite)];
    });
  }

  // Current lightbox design
  const lbDesign = lightboxIdx !== null ? designs[lightboxIdx] : null;
  const lbSvg = lbDesign ? tintSvg(lbDesign.svg_source, primaryColor, secondaryColor, accentColor) : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--pearl-1))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--gold)/0.2)] to-[hsl(var(--champagne-1))] flex items-center justify-center animate-pulse">
            <Stamp size={28} className="text-[hsl(var(--gold))]"/>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading gallery…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--pearl-1))]">

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[hsl(var(--border))] pt-24 sm:pt-28 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/generate`)} className="gap-1.5 shrink-0">
              <ArrowLeft size={14}/> Back
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))] shrink-0"/>
            <div className="min-w-0">
              <p className="font-semibold text-[hsl(var(--foreground))] text-sm truncate">{project?.company_name}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{designs.length} concept{designs.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Color stop selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[hsl(var(--muted))] rounded-xl p-1">
              {stopDefs.map(s => (
                <button
                  key={s.key}
                  onClick={() => { setActiveStop(s.key); setColorPanelOpen(true); }}
                  title={s.label}
                  className={`relative h-7 rounded-lg px-2.5 text-xs font-medium flex items-center gap-1.5 transition-all ${
                    activeStop === s.key ? 'bg-white shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: s.color }}/>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Quick presets */}
            <div className="hidden sm:flex items-center gap-1">
              {COLOR_PRESETS.slice(0, 5).map(p => (
                <button
                  key={p.hex}
                  onClick={() => setActiveColor(p.hex)}
                  title={p.label}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>

            {/* Color wheel toggle */}
            <Button
              size="sm"
              variant={colorPanelOpen ? 'default' : 'outline'}
              onClick={() => setColorPanelOpen(o => !o)}
              className={`gap-1.5 h-8 text-xs shrink-0 ${colorPanelOpen ? 'bg-[hsl(var(--gold))] text-white border-transparent' : ''}`}
            >
              <Palette size={13}/> <span className="hidden sm:inline">Color</span>
            </Button>

            <Button
              size="sm"
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1.5 h-8 text-xs shrink-0"
              onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/generate`)}
            >
              <Stamp size={13}/> Studio
            </Button>
          </div>
        </div>

        {/* Color wheel panel */}
        {colorPanelOpen && (
          <div className="border-t border-[hsl(var(--border))] bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-start gap-6">
              {/* Stop tabs */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-semibold">Color Stop</p>
                {stopDefs.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setActiveStop(s.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeStop === s.key
                        ? 'bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]'
                        : 'bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: s.color }}/>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Wheel */}
              <StampColorWheel
                key={activeStop}
                color={activeColor}
                onChange={setActiveColor}
                label={`${stopDefs.find(s => s.key === activeStop)?.label} Color`}
                size={140}
              />

              {/* Preset swatches */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-semibold">Quick Presets</p>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map(p => (
                    <button
                      key={p.hex}
                      onClick={() => setActiveColor(p.hex)}
                      title={p.label}
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${activeColor === p.hex ? 'border-[hsl(var(--gold))] scale-110' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: p.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Close */}
              <button onClick={() => setColorPanelOpen(false)} className="ml-auto self-start p-1 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                <X size={16} className="text-[hsl(var(--muted-foreground))]"/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Gallery grid ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {designs.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--gold)/0.15)] to-[hsl(var(--champagne-1))] flex items-center justify-center mx-auto">
              <Stamp size={36} className="text-[hsl(var(--gold))]"/>
            </div>
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">No concepts generated yet</h2>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">Go back to the studio to generate stamp concepts.</p>
            <Button onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/generate`)}
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2">
              <Stamp size={15}/> Go to Studio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {designs.map((design, idx) => {
              const tinted = tintSvg(design.svg_source, primaryColor, secondaryColor, accentColor);
              const label = (design.template_key || 'stamp').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div
                  key={design.id}
                  className="group bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {/* Stamp preview — click to open lightbox */}
                  <div
                    className="relative aspect-square bg-gradient-to-br from-[hsl(var(--pearl-1))] to-[hsl(var(--champagne-1)/0.5)] flex items-center justify-center cursor-zoom-in overflow-hidden"
                    onClick={() => openLightbox(idx)}
                  >
                    <StampSVGRenderer
                      svgSource={tinted}
                      tintColor={primaryColor}
                      secondaryColor={secondaryColor}
                      accentColor={accentColor}
                      size={160}
                      className="transition-transform duration-200 group-hover:scale-105"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                        <ZoomIn size={16} className="text-[hsl(var(--foreground))]"/>
                      </div>
                    </div>

                    {/* Favorite badge */}
                    {design.is_favorite && (
                      <div className="absolute top-2 left-2">
                        <div className="w-5 h-5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center shadow">
                          <Heart size={10} className="text-white fill-white"/>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="px-3 py-2.5 space-y-2">
                    <p className="text-[11px] font-medium text-[hsl(var(--foreground))] leading-tight line-clamp-1">{label}</p>

                    {/* Quick export row */}
                    <div className="flex items-center gap-1">
                      {/* PNG */}
                      <button
                        onClick={() => exportPNG(design, 1024)}
                        disabled={exporting[`png_${design.id}`]}
                        title="Download PNG 1024px"
                        className="flex-1 h-6 rounded-md text-[10px] font-medium flex items-center justify-center gap-0.5 border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--gold)/0.06)] transition-all text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))]"
                      >
                        {exporting[`png_${design.id}`] ? <Loader2 size={9} className="animate-spin"/> : exported[`png_${design.id}`] ? <Check size={9} className="text-green-600"/> : <FileImage size={9}/>}
                        PNG
                      </button>
                      {/* SVG */}
                      <button
                        onClick={() => exportSVG(design)}
                        disabled={exporting[`svg_${design.id}`]}
                        title="Download SVG"
                        className="flex-1 h-6 rounded-md text-[10px] font-medium flex items-center justify-center gap-0.5 border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--gold)/0.06)] transition-all text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))]"
                      >
                        {exporting[`svg_${design.id}`] ? <Loader2 size={9} className="animate-spin"/> : exported[`svg_${design.id}`] ? <Check size={9} className="text-green-600"/> : <File size={9}/>}
                        SVG
                      </button>
                      {/* PDF */}
                      <button
                        onClick={() => exportPDF(design)}
                        disabled={exporting[`pdf_${design.id}`]}
                        title="Download PDF"
                        className="flex-1 h-6 rounded-md text-[10px] font-medium flex items-center justify-center gap-0.5 border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--gold)/0.06)] transition-all text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))]"
                      >
                        {exporting[`pdf_${design.id}`] ? <Loader2 size={9} className="animate-spin"/> : exported[`pdf_${design.id}`] ? <Check size={9} className="text-green-600"/> : <FileText size={9}/>}
                        PDF
                      </button>
                      {/* Fav */}
                      <button
                        onClick={() => toggleFavorite(design)}
                        title={design.is_favorite ? 'Unfavorite' : 'Favorite'}
                        className={`h-6 w-6 rounded-md flex items-center justify-center border transition-all ${
                          design.is_favorite
                            ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]'
                            : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]'
                        }`}
                      >
                        <Heart size={9} className={design.is_favorite ? 'fill-current' : ''}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {lightboxIdx !== null && lbDesign && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col" onWheel={handleWheel}>

          {/* Lightbox header */}
          <div className="flex-shrink-0 bg-black/60 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={closeLightbox} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0">
                <X size={18}/>
              </button>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {(lbDesign.template_key || 'stamp').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
                <p className="text-white/50 text-xs">{lightboxIdx + 1} / {designs.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"><ZoomOut size={14}/></button>
                <span className="text-white/80 text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(z + 0.25, 5))} className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"><ZoomIn size={14}/></button>
                <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded hover:bg-white/20 text-white/60 hover:text-white transition-colors"><RotateCcw size={13}/></button>
              </div>

              {/* Favorite */}
              <button
                onClick={() => toggleFavorite(lbDesign)}
                className={`p-2 rounded-lg transition-colors ${lbDesign.is_favorite ? 'bg-[hsl(var(--gold))] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <Heart size={15} className={lbDesign.is_favorite ? 'fill-white' : ''}/>
              </button>

              {/* Export buttons */}
              <button
                onClick={() => exportPNG(lbDesign, 1024)}
                disabled={exporting[`png_${lbDesign.id}`]}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
              >
                {exporting[`png_${lbDesign.id}`] ? <Loader2 size={12} className="animate-spin"/> : <FileImage size={12}/>} PNG
              </button>
              <button
                onClick={() => exportSVG(lbDesign)}
                disabled={exporting[`svg_${lbDesign.id}`]}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
              >
                {exporting[`svg_${lbDesign.id}`] ? <Loader2 size={12} className="animate-spin"/> : <File size={12}/>} SVG
              </button>
              <button
                onClick={() => exportPDF(lbDesign)}
                disabled={exporting[`pdf_${lbDesign.id}`]}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--gold))] hover:opacity-90 text-white text-xs font-medium transition-colors"
              >
                {exporting[`pdf_${lbDesign.id}`] ? <Loader2 size={12} className="animate-spin"/> : <FileText size={12}/>} PDF
              </button>
            </div>
          </div>

          {/* Lightbox canvas */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden relative select-none"
            onMouseDown={onDragStart}
            style={{ cursor: zoom > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'default' }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center',
                transition: isDragging.current ? 'none' : 'transform 0.15s ease',
                willChange: 'transform',
              }}
            >
              <div className="bg-white rounded-3xl p-10 shadow-2xl">
                <StampSVGRenderer
                  svgSource={lbSvg}
                  tintColor={primaryColor}
                  secondaryColor={secondaryColor}
                  accentColor={accentColor}
                  size={380}
                />
              </div>
            </div>

            {/* Prev / Next arrows */}
            {designs.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft size={22}/>
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors backdrop-blur-sm"
                >
                  <ChevronRight size={22}/>
                </button>
              </>
            )}

            {/* Zoom hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-[10px] pointer-events-none">
              Scroll to zoom · Arrow keys to navigate · Esc to close
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="flex-shrink-0 bg-black/60 backdrop-blur-sm py-2 px-4 overflow-x-auto">
            <div className="flex gap-2 items-center w-max mx-auto">
              {designs.map((d, i) => {
                const t = tintSvg(d.svg_source, primaryColor, secondaryColor, accentColor);
                return (
                  <button
                    key={d.id}
                    onClick={() => { setLightboxIdx(i); setZoom(1); setPan({ x: 0, y: 0 }); }}
                    className={`rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      i === lightboxIdx
                        ? 'border-[hsl(var(--gold))] scale-105 shadow-[0_0_0_2px_hsl(var(--gold)/0.4)]'
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                    }`}
                  >
                    <div className="w-14 h-14 bg-white flex items-center justify-center">
                      <StampSVGRenderer svgSource={t} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} size={52}/>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
