import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import { StampColorWheel } from '@/components/stamp-generator/StampColorWheel';
import JSZip from 'jszip';
import {
  Download, ArrowLeft, Stamp, CheckCircle2, Loader2,
  FileImage, FileText, File, Package, Palette, X, Plus, Image, PenTool,
  Eye, Ruler, Printer, CircleDot, Save
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uniquifyIds(svg: string): string {
  const token = Math.random().toString(36).slice(2, 7);
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${token}_${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${token}_${id})`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${token}_${id}"`);
}

/** Sanitize SVG for standalone file export — ensures valid XML, strips React artifacts */
function sanitizeSvgForExport(svg: string, size?: number): string {
  let s = svg;
  // 1. Ensure xmlns declarations
  if (!s.includes('xmlns="http://www.w3.org/2000/svg"'))
    s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  if (!s.includes('xmlns:xlink') && s.includes('xlink:'))
    s = s.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  // 2. Strip data-* attributes (not valid SVG namespace — causes XML parse errors)
  s = s.replace(/\s+data-[a-z-]+="[^"]*"/gi, '');
  // 3. Strip React useId()-scoped IDs (e.g. :r1a:)
  s = s.replace(/\bid="[^"]*:[^"]*"/g, '');
  s = s.replace(/url\(#[^)]*:[^)]*\)/g, 'url(#)');
  s = s.replace(/href="#[^"]*:[^"]*"/g, 'href="#"');
  // 4. Ensure viewBox exists
  if (!/viewBox=/.test(s)) {
    const sz = size || 200;
    s = s.replace('<svg', `<svg viewBox="0 0 ${sz} ${sz}"`);
  }
  // 5. Ensure width/height for standalone rendering
  if (!/\bwidth="/.test(s)) s = s.replace('<svg', '<svg width="100%"');
  if (!/\bheight="/.test(s)) s = s.replace('<svg', '<svg height="100%"');
  // 6. Add XML declaration for file validity
  if (!s.startsWith('<?xml'))
    s = '<?xml version="1.0" encoding="UTF-8"?>\n' + s;
  return s;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** SVG → PNG with configurable background color */
async function svgToPng(svgString: string, size: number, transparent: boolean, bgColor?: string): Promise<Blob> {
  // Sanitize first, then uniquify IDs for this render
  let svg = sanitizeSvgForExport(svgString, size);
  // Remove XML declaration for data URL embedding (browsers choke on it in data URIs)
  svg = svg.replace(/<\?xml[^?]*\?>\s*/, '');
  svg = uniquifyIds(svg);
  // Force explicit width/height for canvas rendering
  svg = svg.replace(/<svg([^>]*)>/, (_match, attrs) => {
    let a = attrs.replace(/\bwidth="[^"]*"/g, '').replace(/\bheight="[^"]*"/g, '');
    a += ` width="${size}" height="${size}"`;
    return `<svg${a}>`;
  });
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  const dataUrl = `data:image/svg+xml;base64,${b64}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('SVG image load timed out (10s)')), 10000);
    const img = document.createElement('img') as HTMLImageElement;
    img.onload = async () => {
      clearTimeout(timeout);
      try {
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        if (!transparent) {
          ctx.fillStyle = bgColor || '#ffffff';
          ctx.fillRect(0, 0, size, size);
        }
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob(b => {
          if (b) resolve(b); else reject(new Error('Canvas toBlob returned null'));
        }, 'image/png');
      } catch (err) { reject(err); }
    };
    img.onerror = () => { clearTimeout(timeout); reject(new Error('SVG image failed to load — check SVG validity')); };
    img.src = dataUrl;
  });
}

async function pngToJpeg(pngBlob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataUrl(pngBlob);
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('JPEG toBlob failed')); }, 'image/jpeg', 0.92);
    };
    img.onerror = () => reject(new Error('JPEG img load failed'));
    img.src = dataUrl;
  });
}

async function pngToWebp(pngBlob: Blob, transparent: boolean): Promise<Blob> {
  const dataUrl = await blobToDataUrl(pngBlob);
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      if (!transparent) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('WEBP toBlob failed')); }, 'image/webp', 0.92);
    };
    img.onerror = () => reject(new Error('WEBP img load failed'));
    img.src = dataUrl;
  });
}

/** SVG → PDF with optional margins and crop marks */
async function svgToPdf(svgString: string, transparent: boolean, printReady: boolean = false): Promise<Blob> {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const pngBlob = await svgToPng(svgString, 1200, transparent);
  const pngBytes = await pngBlob.arrayBuffer();
  const pdfDoc = await PDFDocument.create();

  // Set metadata
  pdfDoc.setTitle('Stamp Export — JBJ Global Real Estate');
  pdfDoc.setAuthor('JBJ Smart Stamp Generator');
  pdfDoc.setCreationDate(new Date());

  if (printReady) {
    // 12mm margin ≈ 34pt. Stamp area = 300pt, total page = 300 + 2*34 = 368pt
    const margin = 34;
    const stampSize = 300;
    const pageSize = stampSize + margin * 2;
    const page = pdfDoc.addPage([pageSize, pageSize]);
    if (!transparent) {
      page.drawRectangle({ x: 0, y: 0, width: pageSize, height: pageSize, color: rgb(1, 1, 1) });
    }
    const pngImage = await pdfDoc.embedPng(pngBytes);
    page.drawImage(pngImage, { x: margin, y: margin, width: stampSize, height: stampSize });

    // Crop marks (8pt lines at corners)
    const markLen = 8;
    const markColor = rgb(0, 0, 0);
    const lineWidth = 0.5;
    // Top-left
    page.drawLine({ start: { x: margin, y: margin + stampSize }, end: { x: margin, y: margin + stampSize + markLen }, thickness: lineWidth, color: markColor });
    page.drawLine({ start: { x: margin, y: margin + stampSize }, end: { x: margin - markLen, y: margin + stampSize }, thickness: lineWidth, color: markColor });
    // Top-right
    page.drawLine({ start: { x: margin + stampSize, y: margin + stampSize }, end: { x: margin + stampSize, y: margin + stampSize + markLen }, thickness: lineWidth, color: markColor });
    page.drawLine({ start: { x: margin + stampSize, y: margin + stampSize }, end: { x: margin + stampSize + markLen, y: margin + stampSize }, thickness: lineWidth, color: markColor });
    // Bottom-left
    page.drawLine({ start: { x: margin, y: margin }, end: { x: margin, y: margin - markLen }, thickness: lineWidth, color: markColor });
    page.drawLine({ start: { x: margin, y: margin }, end: { x: margin - markLen, y: margin }, thickness: lineWidth, color: markColor });
    // Bottom-right
    page.drawLine({ start: { x: margin + stampSize, y: margin }, end: { x: margin + stampSize, y: margin - markLen }, thickness: lineWidth, color: markColor });
    page.drawLine({ start: { x: margin + stampSize, y: margin }, end: { x: margin + stampSize + markLen, y: margin }, thickness: lineWidth, color: markColor });
  } else {
    const pointSize = 300;
    const page = pdfDoc.addPage([pointSize, pointSize]);
    const pngImage = await pdfDoc.embedPng(pngBytes);
    if (!transparent) {
      page.drawRectangle({ x: 0, y: 0, width: pointSize, height: pointSize, color: rgb(1, 1, 1) });
    }
    page.drawImage(pngImage, { x: 0, y: 0, width: pointSize, height: pointSize });
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/** Apply three-color tint to SVG */
function tintSvgFull(svgString: string, primary: string, secondary?: string, accent?: string): string {
  let s = svgString.replace(/#1a2744/gi, primary);
  if (secondary) s = s.replace(/#2a3a5c/gi, secondary);
  if (accent) {
    s = s.replace(/#8b6914/gi, accent);
    s = s.replace(/(dominant-baseline="central"[^>]*fill=")[^"]+(")/g, `$1${accent}$2`);
  } else if (secondary) {
    s = s.replace(/#8b6914/gi, secondary);
  }
  return s;
}

/** Convert SVG to solid black rubber stamp (fills → #000, strokes → #000, strip filters) */
function convertToRubberStamp(svg: string): string {
  let s = svg;
  // Replace all fill colors (except "none") with black
  s = s.replace(/fill="(?!none)[^"]*"/gi, 'fill="#000000"');
  // Replace all stroke colors with black
  s = s.replace(/stroke="(?!none)[^"]*"/gi, 'stroke="#000000"');
  // Strip filter elements
  s = s.replace(/<filter[^>]*>[\s\S]*?<\/filter>/gi, '');
  // Strip linearGradient / radialGradient
  s = s.replace(/<(linear|radial)Gradient[^>]*>[\s\S]*?<\/(linear|radial)Gradient>/gi, '');
  // Remove filter references
  s = s.replace(/\s*filter="[^"]*"/gi, '');
  return s;
}

/** Convert SVG to emboss-ready vector outlines (fill → none, stroke → #000, strip filters) */
function convertToEmboss(svg: string): string {
  let s = svg;
  // All fills become none (outline only)
  s = s.replace(/fill="(?!none)[^"]*"/gi, 'fill="none"');
  // All strokes become black; add stroke if missing
  s = s.replace(/stroke="[^"]*"/gi, 'stroke="#000000"');
  // Strip filters and gradients
  s = s.replace(/<filter[^>]*>[\s\S]*?<\/filter>/gi, '');
  s = s.replace(/<(linear|radial)Gradient[^>]*>[\s\S]*?<\/(linear|radial)Gradient>/gi, '');
  s = s.replace(/\s*filter="[^"]*"/gi, '');
  return s;
}

let downloadQueue = Promise.resolve();
function triggerDownload(blob: Blob, filename: string) {
  downloadQueue = downloadQueue.then(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      requestAnimationFrame(() => {
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        resolve();
      });
    });
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        active
          ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]'
          : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.3)]'
      }`}
    >{label}</button>
  );
}

const PACK_COLORS = [
  { label: 'Navy', hex: '#1a2744' },
  { label: 'Black', hex: '#0d0d0d' },
  { label: 'Dark Red', hex: '#8B0000' },
  { label: 'Forest Green', hex: '#1B4332' },
  { label: 'Royal Purple', hex: '#4B0082' },
  { label: 'Gold', hex: '#856404' },
  { label: 'White', hex: '#ffffff' },
  { label: 'Silver Embossed', hex: '#C0C0C0' },
  { label: 'Bronze', hex: '#8B4513' },
];

const STANDARD_EXPORT_COLORS = [
  { label: 'White',      hex: '#ffffff' },
  { label: 'Black',      hex: '#0d0d0d' },
  { label: 'Navy Ink',   hex: '#1B3A8C' },
  { label: 'Brand Gold', hex: '#B89555' },
  { label: 'Dark Gold',  hex: '#B8860B' },
];

const PRESET_COLORS = [
  { label: 'Navy', hex: '#1a2744' },
  { label: 'Gold', hex: '#B8860B' },
  { label: 'Black', hex: '#0d0d0d' },
  { label: 'Dark Red', hex: '#8B0000' },
  { label: 'Purple', hex: '#4B0082' },
  { label: 'Forest', hex: '#1B4332' },
  { label: 'White', hex: '#ffffff' },
  { label: 'Silver', hex: '#C0C0C0' },
  { label: 'Bronze', hex: '#8B4513' },
];

type ColorStop = 'primary' | 'secondary' | 'accent';
type BgMode = 'white' | 'transparent' | 'black' | 'paper';

function swapBilingualArcs(svg: string): string {
  const textPathRegex = /<textPath[^>]*>([^<]*)<\/textPath>/gi;
  const matches = [...svg.matchAll(textPathRegex)];
  if (matches.length >= 2) {
    const topContent = matches[0][1];
    const bottomContent = matches[1][1];
    let swapped = svg;
    swapped = swapped.replace(matches[0][0], matches[0][0].replace(topContent, bottomContent));
    swapped = swapped.replace(matches[1][0], matches[1][0].replace(bottomContent, topContent));
    return swapped;
  }
  return svg;
}

/** Background preview classes */
function getBgStyle(mode: BgMode): React.CSSProperties {
  switch (mode) {
    case 'white': return { backgroundColor: '#ffffff' };
    case 'transparent': return {
      backgroundImage: 'repeating-conic-gradient(#e5e5e5 0% 25%, #ffffff 0% 50%)',
      backgroundSize: '16px 16px',
    };
    case 'black': return { backgroundColor: '#111111' };
    case 'paper': return { backgroundColor: '#F7F2EA' };
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

interface ExportOptions {
  formats: string[];
  sizes: number[];
  dpi: number[];
  transparent: boolean;
}

export default function StampExportPage() {
  const { projectId, designId } = useParams<{ projectId: string; designId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [design, setDesign] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const [primaryColor, setPrimaryColor] = useState('#1B3A8C');
  const [secondaryColor, setSecondaryColor] = useState<string | undefined>(undefined);
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [activeStop, setActiveStop] = useState<ColorStop>('primary');

  const [bgMode, setBgMode] = useState<BgMode>('white');
  const [customSize, setCustomSize] = useState('');
  const [rubberStampMode, setRubberStampMode] = useState(false);
  const [embossMode, setEmbossMode] = useState(false);

  const [options, setOptions] = useState<ExportOptions>({
    formats: ['svg', 'png', 'jpg', 'webp', 'pdf'],
    sizes: [512, 1024],
    dpi: [300],
    transparent: false,
  });

  // Sync transparent flag from bgMode
  useEffect(() => {
    setOptions(o => ({ ...o, transparent: bgMode === 'transparent' }));
  }, [bgMode]);

  const [multiColorMode, setMultiColorMode] = useState(false);
  const [packColors, setPackColors] = useState<{ label: string; hex: string }[]>([...STANDARD_EXPORT_COLORS]);
  const [generatingZip, setGeneratingZip] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<Record<string, 'idle' | 'ok' | 'error'>>({});

  useEffect(() => {
    if (!user || !designId || !projectId) return;
    loadData();
  }, [user, designId, projectId]);

  async function loadData() {
    const [{ data: d }, { data: p }] = await Promise.all([
      supabase.from('stamp_designs').select('*').eq('id', designId).eq('user_id', user!.id).single(),
      supabase.from('stamp_projects').select('*').eq('id', projectId).eq('user_id', user!.id).single(),
    ]);
    if (!d || !p) { toast.error('Design not found'); navigate('/toolkit/stamp-generator'); return; }
    setDesign(d);
    setProject(p);
  }

  const activeColor = activeStop === 'primary' ? primaryColor : activeStop === 'secondary' ? (secondaryColor || '#2a3a5c') : (accentColor || '#856404');
  const setActiveColor = (hex: string) => {
    if (activeStop === 'primary') setPrimaryColor(hex);
    else if (activeStop === 'secondary') setSecondaryColor(hex);
    else setAccentColor(hex);
  };

  const tintedSvg = design?.svg_source ? tintSvgFull(design.svg_source, primaryColor, secondaryColor, accentColor) : '';
  const companySlug = (project?.company_name || 'stamp').toLowerCase().replace(/\s+/g, '_');

  // Compute effective sizes including custom
  const effectiveSizes = useMemo(() => {
    const s = [...options.sizes];
    const cv = parseInt(customSize, 10);
    if (cv >= 128 && cv <= 8192 && !s.includes(cv)) s.push(cv);
    return s.sort((a, b) => a - b);
  }, [options.sizes, customSize]);

  const bgColorForExport = bgMode === 'black' ? '#111111' : bgMode === 'paper' ? '#F7F2EA' : '#ffffff';
  const isTransparent = bgMode === 'transparent';

  function toggleFormat(f: string) { setOptions(o => ({ ...o, formats: o.formats.includes(f) ? o.formats.filter(x => x !== f) : [...o.formats, f] })); }
  function toggleSize(s: number) { setOptions(o => ({ ...o, sizes: o.sizes.includes(s) ? o.sizes.filter(x => x !== s) : [...o.sizes, s] })); }
  function toggleDpi(d: number) { setOptions(o => ({ ...o, dpi: o.dpi.includes(d) ? o.dpi.filter(x => x !== d) : [...o.dpi, d] })); }
  function togglePackColor(c: { label: string; hex: string }) {
    setPackColors(prev => {
      const has = prev.some(p => p.hex === c.hex);
      if (has) return prev.filter(p => p.hex !== c.hex);
      if (prev.length >= 5) { toast('Max 5 colors'); return prev; }
      return [...prev, c];
    });
  }

  async function downloadSVG() {
    if (!tintedSvg) return;
    const clean = sanitizeSvgForExport(tintedSvg);
    const blob = new Blob([clean], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, `${companySlug}_stamp.svg`);
    setFileStatuses(s => ({ ...s, svg: 'ok' }));
    toast.success('SVG downloaded!');
  }

  async function downloadPNGFile(size: number): Promise<Blob | null> {
    const key = `png_${size}`;
    try {
      const blob = await svgToPng(tintedSvg, size, isTransparent, bgColorForExport);
      triggerDownload(blob, `${companySlug}_stamp_${size}px${isTransparent ? '_transparent' : ''}.png`);
      setFileStatuses(s => ({ ...s, [key]: 'ok' }));
      return blob;
    } catch (err) {
      console.error(`PNG ${size}px failed:`, err);
      setFileStatuses(s => ({ ...s, [key]: 'error' }));
      return null;
    }
  }

  async function downloadJPGFile(size: number) {
    const key = `jpg_${size}`;
    try {
      const pngBlob = await svgToPng(tintedSvg, size, false, bgColorForExport);
      const jpgBlob = await pngToJpeg(pngBlob);
      triggerDownload(jpgBlob, `${companySlug}_stamp_${size}px.jpg`);
      setFileStatuses(s => ({ ...s, [key]: 'ok' }));
    } catch (err) {
      console.error(`JPG ${size}px failed:`, err);
      setFileStatuses(s => ({ ...s, [key]: 'error' }));
    }
  }

  async function downloadWebpFile(size: number) {
    const key = `webp_${size}`;
    try {
      const pngBlob = await svgToPng(tintedSvg, size, isTransparent, bgColorForExport);
      const webpBlob = await pngToWebp(pngBlob, isTransparent);
      triggerDownload(webpBlob, `${companySlug}_stamp_${size}px${isTransparent ? '_transparent' : ''}.webp`);
      setFileStatuses(s => ({ ...s, [key]: 'ok' }));
    } catch (err) {
      console.error(`WEBP ${size}px failed:`, err);
      setFileStatuses(s => ({ ...s, [key]: 'error' }));
    }
  }

  async function downloadPDFFile() {
    const key = 'pdf';
    try {
      const blob = await svgToPdf(tintedSvg, isTransparent, true);
      triggerDownload(blob, `${companySlug}_stamp_print_300dpi.pdf`);
      setFileStatuses(s => ({ ...s, [key]: 'ok' }));
    } catch (err) {
      console.error('PDF failed:', err);
      setFileStatuses(s => ({ ...s, [key]: 'error' }));
    }
  }

  async function downloadManufacturerFile(mode: 'rubber' | 'emboss') {
    if (!design?.svg_source) return;
    const converter = mode === 'rubber' ? convertToRubberStamp : convertToEmboss;
    const label = mode === 'rubber' ? 'rubber_stamp' : 'emboss';
    try {
      toast.info(`Generating ${mode === 'rubber' ? 'rubber stamp' : 'emboss'} files…`);
      const converted = converter(tintedSvg);
      // SVG
      const svgBlob = new Blob([sanitizeSvgForExport(converted)], { type: 'image/svg+xml;charset=utf-8' });
      triggerDownload(svgBlob, `${companySlug}_${label}.svg`);
      // High-res PNG
      const pngBlob = await svgToPng(converted, 2048, true);
      triggerDownload(pngBlob, `${companySlug}_${label}_2048px.png`);
      toast.success(`${mode === 'rubber' ? 'Rubber stamp' : 'Emboss'} files downloaded!`);
    } catch (err) {
      console.error(`${label} export failed:`, err);
      toast.error('Manufacturer export failed');
    }
  }

  async function generateBundle() {
    if (options.formats.length === 0) { toast.error('Select at least one format'); return; }
    setGenerating(true);
    setFileStatuses({});

    try {
      const zip = new JSZip();
      let fileCount = 0;

      if (options.formats.includes('svg')) {
        zip.file(`${companySlug}_stamp.svg`, sanitizeSvgForExport(tintedSvg));
        setFileStatuses(s => ({ ...s, svg: 'ok' }));
        fileCount++;
      }

      for (const size of effectiveSizes) {
        if (options.formats.includes('png')) {
          try {
            const blob = await svgToPng(tintedSvg, size, isTransparent, bgColorForExport);
            zip.file(`${companySlug}_stamp_${size}px${isTransparent ? '_transparent' : ''}.png`, blob);
            setFileStatuses(s => ({ ...s, [`png_${size}`]: 'ok' }));
            fileCount++;
          } catch (err) {
            console.error(`PNG ${size}px failed:`, err);
            setFileStatuses(s => ({ ...s, [`png_${size}`]: 'error' }));
          }
        }
        if (options.formats.includes('jpg')) {
          try {
            const pngBlob = await svgToPng(tintedSvg, size, false, bgColorForExport);
            const jpgBlob = await pngToJpeg(pngBlob);
            zip.file(`${companySlug}_stamp_${size}px.jpg`, jpgBlob);
            setFileStatuses(s => ({ ...s, [`jpg_${size}`]: 'ok' }));
            fileCount++;
          } catch (err) {
            setFileStatuses(s => ({ ...s, [`jpg_${size}`]: 'error' }));
          }
        }
        if (options.formats.includes('webp')) {
          try {
            const pngBlob = await svgToPng(tintedSvg, size, isTransparent, bgColorForExport);
            const webpBlob = await pngToWebp(pngBlob, isTransparent);
            zip.file(`${companySlug}_stamp_${size}px${isTransparent ? '_transparent' : ''}.webp`, webpBlob);
            setFileStatuses(s => ({ ...s, [`webp_${size}`]: 'ok' }));
            fileCount++;
          } catch (err) {
            setFileStatuses(s => ({ ...s, [`webp_${size}`]: 'error' }));
          }
        }
      }

      if (options.formats.includes('pdf')) {
        try {
          const blob = await svgToPdf(tintedSvg, isTransparent, true);
          zip.file(`${companySlug}_stamp_print_300dpi.pdf`, blob);
          setFileStatuses(s => ({ ...s, pdf: 'ok' }));
          fileCount++;
        } catch (err) {
          setFileStatuses(s => ({ ...s, pdf: 'error' }));
        }
      }

      // Bilingual variants
      const arabicName = project?.arabic_company_name;
      if (arabicName && tintedSvg.includes('textPath')) {
        try {
          const arabicTopSvg = swapBilingualArcs(tintedSvg);
          const biFolder = zip.folder('bilingual_arabic_top')!;
          biFolder.file(`${companySlug}_stamp_arabic_top.svg`, arabicTopSvg);
          const biPng = await svgToPng(arabicTopSvg, 1024, true);
          biFolder.file(`${companySlug}_stamp_arabic_top_1024px.png`, biPng);
          const biPdf = await svgToPdf(arabicTopSvg, true, true);
          biFolder.file(`${companySlug}_stamp_arabic_top_print.pdf`, biPdf);
          fileCount += 3;
        } catch (err) { console.warn('Bilingual variant generation failed:', err); }
      }

      // Standard Export Colors
      const standardColorsFolder = zip.folder('standard_colors')!;
      for (const { label, hex } of STANDARD_EXPORT_COLORS) {
        try {
          const colorFolder = standardColorsFolder.folder(label.toLowerCase().replace(/\s+/g, '_'))!;
          const coloredSvg = tintSvgFull(design.svg_source, hex);
          colorFolder.file(`${companySlug}_${label.toLowerCase().replace(/\s+/g, '_')}.svg`, coloredSvg);
          const pngBlob = await svgToPng(coloredSvg, 1024, true);
          colorFolder.file(`${companySlug}_${label.toLowerCase().replace(/\s+/g, '_')}_1024px.png`, pngBlob);
          fileCount += 2;
        } catch (err) { console.warn(`Standard color ${label} failed:`, err); }
      }

      // Manufacturer exports in bundle
      if (rubberStampMode || embossMode) {
        const mfgFolder = zip.folder('manufacturer')!;
        if (rubberStampMode) {
          const rsFolder = mfgFolder.folder('rubber_stamp')!;
          const rsSvg = convertToRubberStamp(tintedSvg);
          rsFolder.file(`${companySlug}_rubber_stamp.svg`, rsSvg);
          try {
            const rsPng = await svgToPng(rsSvg, 2048, true);
            rsFolder.file(`${companySlug}_rubber_stamp_2048px.png`, rsPng);
            fileCount += 2;
          } catch { fileCount += 1; }
        }
        if (embossMode) {
          const emFolder = mfgFolder.folder('emboss')!;
          const emSvg = convertToEmboss(tintedSvg);
          emFolder.file(`${companySlug}_emboss.svg`, emSvg);
          try {
            const emPng = await svgToPng(emSvg, 2048, true);
            emFolder.file(`${companySlug}_emboss_2048px.png`, emPng);
            fileCount += 2;
          } catch { fileCount += 1; }
        }
      }

      // README
      const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      zip.file('README.txt',
        `Brand Kit Export\nCompany: ${project?.company_name || ''}\nExported: ${date}\nFiles: ${fileCount}\n\n` +
        `Contents:\n  • SVG — Vector\n  • PNG — Raster\n  • JPG — White background\n  • WEBP — Modern web format\n  • PDF — Print-ready (300 DPI, margins + crop marks)\n` +
        (rubberStampMode ? `  • manufacturer/rubber_stamp/ — Solid black for rubber stamp manufacturing\n` : '') +
        (embossMode ? `  • manufacturer/emboss/ — Vector outlines for emboss/engraving\n` : '') +
        `\nGenerated by JBJ Smart Stamp Generator\n`
      );

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      triggerDownload(zipBlob, `${companySlug}_brand_kit.zip`);

      await supabase.from('stamp_exports').insert({
        design_id: designId!, user_id: user!.id, includes: options as any, status: 'ready',
      });

      const failCount = Object.values(fileStatuses).filter(s => s === 'error').length;
      if (failCount === 0) toast.success(`✅ ${fileCount} files bundled into ZIP!`);
      else toast.warning(`ZIP contains ${fileCount} files. ${failCount} failed.`);
    } catch (err) {
      console.error('Bundle error:', err);
      toast.error('Export error. Try individual downloads.');
    }
    setGenerating(false);
  }

  async function downloadColorZip() {
    if (!design?.svg_source || packColors.length === 0) return;
    setGeneratingZip(true);
    try {
      const zip = new JSZip();
      for (const { label, hex } of packColors) {
        const folder = zip.folder(label.toLowerCase().replace(/\s+/g, '_'))!;
        const coloredSvg = tintSvgFull(design.svg_source, hex);
        folder.file('stamp.svg', coloredSvg);
        for (const size of [512, 1024]) {
          try {
            const pngBlob = await svgToPng(coloredSvg, size, true);
            folder.file(`stamp_${size}px.png`, pngBlob);
          } catch (e) { console.error(`PNG ${size}px for ${label} failed:`, e); }
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(blob, `${companySlug}_stamp_color_pack.zip`);
      toast.success(`Color pack with ${packColors.length} colors downloaded!`);
    } catch (err) {
      console.error('ZIP error:', err);
      toast.error('Failed to generate color pack.');
    }
    setGeneratingZip(false);
  }

  if (!design || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[hsl(var(--gold))]" size={32}/>
      </div>
    );
  }

  const stopLabels: { key: ColorStop; label: string; color: string }[] = [
    { key: 'primary', label: 'Primary', color: primaryColor },
    { key: 'secondary', label: 'Secondary', color: secondaryColor || '#2a3a5c' },
    { key: 'accent', label: 'Accent', color: accentColor || '#856404' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))] pt-24 sm:pt-28 lg:pt-32">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-[#FDFBF7]/90 backdrop-blur-sm sticky top-24 sm:top-28 lg:top-32 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/generate`)} className="gap-1">
              <ArrowLeft size={14}/> Back to Designs
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]"/>
            <div className="flex items-center gap-2">
              <Stamp size={16} className="text-[hsl(var(--gold))]"/>
              <span className="font-medium text-sm text-[hsl(var(--foreground))]">Export Pack</span>
            </div>
          </div>
          <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)] gap-1">
            <CheckCircle2 size={11}/> Final Design
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ─ Left: Previews ──────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Live Preview</h2>

            {/* Export Preview Panel — shows stamp with selected background */}
            <div className="rounded-2xl border-2 border-[hsl(var(--gold)/0.3)] overflow-hidden">
              <div className="bg-[hsl(var(--gold)/0.05)] px-4 py-2 flex items-center justify-between border-b border-[hsl(var(--gold)/0.15)]">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-[hsl(var(--gold))]"/>
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Export Preview</span>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-[9px] border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))]">
                    {options.formats.map(f => f.toUpperCase()).join(' · ')}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))]">
                    {effectiveSizes.map(s => `${s}px`).join(' · ')}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))]">
                    BG: {bgMode}
                  </Badge>
                </div>
              </div>
              <div className="p-8 flex items-center justify-center" style={getBgStyle(bgMode)}>
                <div className="drop-shadow-lg">
                  <StampSVGRenderer
                    svgSource={design.svg_source}
                    size={260}
                    tintColor={primaryColor}
                    secondaryColor={secondaryColor}
                    accentColor={accentColor}
                  />
                </div>
              </div>
            </div>

            {/* Manufacturer previews */}
            {(rubberStampMode || embossMode) && (
              <div className="grid grid-cols-2 gap-3">
                {rubberStampMode && (
                  <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-4 space-y-2">
                    <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide flex items-center gap-1">
                      <Stamp size={10}/> Rubber Stamp
                    </p>
                    <div className="flex justify-center">
                      <StampSVGRenderer svgSource={convertToRubberStamp(design.svg_source)} size={140} tintColor="#000000"/>
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => downloadManufacturerFile('rubber')}>
                      <Download size={12}/> Download
                    </Button>
                  </div>
                )}
                {embossMode && (
                  <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-4 space-y-2">
                    <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide flex items-center gap-1">
                      <CircleDot size={10}/> Emboss / Engrave
                    </p>
                    <div className="flex justify-center">
                      <StampSVGRenderer svgSource={convertToEmboss(design.svg_source)} size={140} tintColor="#000000"/>
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => downloadManufacturerFile('emboss')}>
                      <Download size={12}/> Download
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* On Letterhead */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-4 space-y-2">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Preview on Letterhead</p>
              <div className="bg-gradient-to-br from-[hsl(var(--pearl-1))] to-white rounded-xl p-5 border border-[hsl(var(--border)/0.5)] relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="h-2.5 w-32 bg-[hsl(var(--muted))] rounded"/>
                    <div className="h-1.5 w-48 bg-[hsl(var(--muted)/0.7)] rounded"/>
                    <div className="h-1.5 w-36 bg-[hsl(var(--muted)/0.5)] rounded"/>
                  </div>
                  <div className="h-8 w-8 bg-[hsl(var(--muted))] rounded"/>
                </div>
                <div className="h-px bg-[hsl(var(--border))] mb-3"/>
                <div className="space-y-1.5 mb-4">
                  {[44, 36, 40, 28, 38, 32].map((w, i) => (
                    <div key={i} className="h-1.5 rounded" style={{ width: `${w * 2}px`, backgroundColor: 'hsl(var(--muted))' }}/>
                  ))}
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="h-px w-24 bg-[hsl(var(--foreground)/0.3)]"/>
                    <div className="h-1 w-16 bg-[hsl(var(--muted))] rounded"/>
                  </div>
                  <div className="opacity-90">
                    <StampSVGRenderer svgSource={design.svg_source} size={88} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor}/>
                  </div>
                </div>
              </div>
            </div>

            {/* On Business Card */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-4 space-y-2">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Preview on Business Card</p>
              <div className="relative bg-gradient-to-br from-[hsl(222,47%,11%)] to-[hsl(222,47%,20%)] rounded-xl p-5 overflow-hidden" style={{ aspectRatio: '1.75 / 1' }}>
                <div className="absolute inset-0 flex items-stretch p-5 gap-4">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-white/90 font-bold text-sm leading-tight">{project.company_name}</p>
                      {project.arabic_company_name && (
                        <p className="text-white/70 text-xs mt-0.5" dir="rtl">{project.arabic_company_name}</p>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-white/90 text-[10px]">CEO / Managing Director</p>
                      {project.city_optional && <p className="text-white/85 text-[10px]">{[project.city_optional, project.country_optional].filter(Boolean).join(', ')}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-center opacity-80">
                    <StampSVGRenderer svgSource={design.svg_source} size={72} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Project info */}
            <div className="bg-[hsl(var(--pearl-1))] rounded-xl border border-[hsl(var(--border))] p-4 space-y-1">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{project.company_name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{[project.city_optional, project.country_optional].filter(Boolean).join(', ')}</p>
              {project.registration_number_optional && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">License: {project.registration_number_optional}</p>
              )}
            </div>
          </div>

          {/* ─ Right: Export Options ──────────────────────────────── */}
          <div className="space-y-5">
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Export Options</h2>

            {/* Three-Color System */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                <Palette size={14} className="text-[hsl(var(--gold))]"/> Export Colors
              </p>
              <div className="flex gap-2">
                {stopLabels.map(stop => (
                  <button key={stop.key} onClick={() => setActiveStop(stop.key)}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                      activeStop === stop.key ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                    }`}>
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: stop.color }}/>
                    <span className="text-[10px] font-medium text-[hsl(var(--foreground))]">{stop.label}</span>
                  </button>
                ))}
              </div>
              <StampColorWheel color={activeColor} onChange={setActiveColor} label="" size={180}/>
              <div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c.hex} onClick={() => setActiveColor(c.hex)} title={c.label}
                      className={`w-7 h-7 rounded-full border-2 shadow-sm transition-all hover:scale-110 ${activeColor === c.hex ? 'border-[hsl(var(--gold))] scale-110' : 'border-white'}`}
                      style={{ backgroundColor: c.hex }}/>
                  ))}
                </div>
              </div>

              {/* Standard Export Colors */}
              <div className="bg-[#FDFBF7] rounded-2xl border-2 border-[hsl(var(--gold)/0.25)] p-5 space-y-3">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <Palette size={14} className="text-[hsl(var(--gold))]"/> Standard Export Colors
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Click any standard color to instantly download a PNG in that ink.</p>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_EXPORT_COLORS.map(c => (
                    <button key={c.hex} title={`Download in ${c.label}`}
                      onClick={async () => {
                        try {
                          toast.info(`Generating ${c.label}…`);
                          const colored = tintSvgFull(design.svg_source, c.hex);
                          const blob = await svgToPng(colored, 1024, true);
                          triggerDownload(blob, `${companySlug}_stamp_${c.label.toLowerCase().replace(/\s+/g, '_')}_1024px.png`);
                          toast.success(`${c.label} downloaded!`);
                        } catch { toast.error('Download failed'); }
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:border-[hsl(var(--gold))] hover:scale-105 border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.02)] ${c.hex === '#ffffff' ? 'bg-[hsl(var(--muted))]' : ''}`}>
                      <div className={`w-10 h-10 rounded-full shadow-md ${c.hex === '#ffffff' ? 'border-2 border-[hsl(var(--border))]' : 'border-2 border-white'}`} style={{ backgroundColor: c.hex }}/>
                      <span className="text-[9px] text-[hsl(var(--foreground))] font-semibold">{c.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setPrimaryColor('#1B3A8C'); setSecondaryColor(undefined); setAccentColor(undefined); toast.success('Reset to Navy Ink standard'); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))] text-[10px] font-semibold hover:bg-[hsl(var(--gold)/0.06)] transition-all">
                  Reset to Standard (Navy Ink)
                </button>
              </div>
            </div>

            {/* Formats + Sizes + DPI + Background */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
                  <File size={14} className="text-[hsl(var(--gold))]"/> File Formats
                </p>
                <div className="flex flex-wrap gap-2">
                  {['svg', 'png', 'jpg', 'webp', 'pdf'].map(f => (
                    <ToggleChip key={f} label={f.toUpperCase()} active={options.formats.includes(f)} onClick={() => toggleFormat(f)}/>
                  ))}
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1.5">SVG is vector. PDF = print-ready with margins + crop marks. JPG always has white background.</p>
              </div>

              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
                  <FileImage size={14} className="text-[hsl(var(--gold))]"/> Sizes (px)
                </p>
                <div className="flex flex-wrap gap-2">
                  {[512, 1024, 2048, 4096].map(s => (
                    <ToggleChip key={s} label={`${s}px`} active={options.sizes.includes(s)} onClick={() => toggleSize(s)}/>
                  ))}
                </div>
                {/* Custom resolution */}
                <div className="flex items-center gap-2 mt-2">
                  <Ruler size={12} className="text-[hsl(var(--muted-foreground))]"/>
                  <Input
                    type="number" placeholder="Custom (128–8192)" min={128} max={8192}
                    value={customSize} onChange={e => setCustomSize(e.target.value)}
                    className="h-8 w-40 text-xs bg-[#FDFBF7] border-[hsl(var(--border))]"
                  />
                  {customSize && parseInt(customSize) >= 128 && parseInt(customSize) <= 8192 && (
                    <Badge className="bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] text-[9px] border border-[hsl(var(--gold)/0.3)]">
                      +{customSize}px
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
                  <FileText size={14} className="text-[hsl(var(--gold))]"/> Resolution (DPI)
                </p>
                <div className="flex flex-wrap gap-2">
                  {[72, 150, 300, 600].map(d => (
                    <ToggleChip key={d} label={`${d} DPI`} active={options.dpi.includes(d)} onClick={() => toggleDpi(d)}/>
                  ))}
                </div>
              </div>

              {/* Background Mode */}
              <div className="pt-3 border-t border-[hsl(var(--border))] space-y-3">
                <p className="text-sm font-medium text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <Image size={14} className="text-[hsl(var(--gold))]"/> Background
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { value: 'white' as BgMode, label: 'White', style: { backgroundColor: '#ffffff', border: '1px solid hsl(var(--border))' } },
                    { value: 'transparent' as BgMode, label: 'Transparent', style: { backgroundImage: 'repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%)', backgroundSize: '8px 8px' } },
                    { value: 'black' as BgMode, label: 'Black', style: { backgroundColor: '#111111' } },
                    { value: 'paper' as BgMode, label: 'Paper', style: { backgroundColor: '#F7F2EA' } },
                  ]).map(bg => (
                    <button key={bg.value} onClick={() => setBgMode(bg.value)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                        bgMode === bg.value ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                      }`}>
                      <div className="w-8 h-8 rounded-lg" style={bg.style}/>
                      <span className="text-[9px] font-medium text-[hsl(var(--foreground))]">{bg.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  {bgMode === 'transparent' ? 'Transparent applies to PNG and WEBP only. JPG forces white.' : 
                   bgMode === 'paper' ? 'Paper texture: cream/off-white background for document previews.' :
                   bgMode === 'black' ? 'Black background for dark-theme previews.' : 
                   'Standard white background.'}
                </p>
              </div>
            </div>

            {/* Manufacturer Export */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                <Printer size={14} className="text-[hsl(var(--gold))]"/> Manufacturer Export
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                Special export modes for rubber stamp manufacturers, embossing tools, and engraving machines.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setRubberStampMode(v => !v)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    rubberStampMode ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Stamp size={14} className={rubberStampMode ? 'text-[hsl(var(--gold))]' : 'text-[hsl(var(--muted-foreground))]'}/>
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Rubber Stamp</span>
                  </div>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Solid black fills, no gradients. SVG + high-res PNG for stamp manufacturing.
                  </p>
                </button>
                <button onClick={() => setEmbossMode(v => !v)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    embossMode ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CircleDot size={14} className={embossMode ? 'text-[hsl(var(--gold))]' : 'text-[hsl(var(--muted-foreground))]'}/>
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Emboss / Engrave</span>
                  </div>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Vector outlines only (no fills). Optimized for CNC, laser, and embossing machines.
                  </p>
                </button>
              </div>
              {(rubberStampMode || embossMode) && (
                <p className="text-[10px] text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold)/0.08)] rounded-lg px-3 py-2">
                  ✓ Manufacturer files will be included in the ZIP bundle under <code className="font-mono">manufacturer/</code> folder.
                </p>
              )}
            </div>

            {/* Per-file status */}
            {Object.keys(fileStatuses).length > 0 && (
              <div className="bg-[hsl(var(--pearl-1))] rounded-xl p-3 space-y-1">
                {Object.entries(fileStatuses).map(([key, status]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className={status === 'ok' ? 'text-green-600' : 'text-destructive'}>
                      {status === 'ok' ? '✓' : '✗'}
                    </span>
                    <span className="text-[hsl(var(--foreground))] font-mono">{key}</span>
                    {status === 'error' && <span className="text-destructive text-[10px]">— failed, try individually</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Download in Any Color */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-5 space-y-3">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                <Image size={14} className="text-[hsl(var(--gold))]"/> Quick Download in Color
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Click any color to instantly download a PNG in that ink color.</p>
              <div className="flex flex-wrap gap-2">
                {PACK_COLORS.map(c => (
                  <button key={c.hex} title={`Download in ${c.label}`}
                    onClick={async () => {
                      try {
                        toast.info(`Generating ${c.label}…`);
                        const colored = tintSvgFull(design.svg_source, c.hex);
                        const blob = await svgToPng(colored, 1024, true);
                        triggerDownload(blob, `${companySlug}_stamp_${c.label.toLowerCase().replace(/\s+/g, '_')}_1024px.png`);
                        toast.success(`${c.label} downloaded!`);
                      } catch { toast.error('Download failed'); }
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all hover:border-[hsl(var(--gold))] hover:scale-105 border-[hsl(var(--border))] ${c.hex === '#ffffff' ? 'bg-[hsl(var(--muted))]' : ''}`}>
                    <div className={`w-8 h-8 rounded-full shadow-sm ${c.hex === '#ffffff' ? 'border-2 border-[hsl(var(--border))]' : 'border border-white'}`} style={{ backgroundColor: c.hex }}/>
                    <span className="text-[9px] text-[hsl(var(--muted-foreground))] font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Download buttons */}
            <div className="space-y-2.5">
              <Button className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2 h-11"
                onClick={generateBundle} disabled={generating}>
                {generating ? <><Loader2 size={15} className="animate-spin"/> Downloading…</> : <><Package size={15}/> Download Full Kit (All Formats)</>}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-1.5 text-xs" onClick={downloadSVG}>
                  <Download size={12}/> SVG (Vector)
                </Button>
                <Button variant="outline" className="gap-1.5 text-xs" onClick={async () => {
                  if (!tintedSvg) return;
                  try {
                    toast.info('Generating PNG (transparent)…');
                    const blob = await svgToPng(tintedSvg, 1024, true);
                    triggerDownload(blob, `${companySlug}_stamp_1024px_transparent.png`);
                    toast.success('PNG (transparent) downloaded!');
                  } catch { toast.error('PNG download failed'); }
                }}>
                  <Download size={12}/> PNG Transparent
                </Button>
                <Button variant="outline" className="gap-1.5 text-xs" onClick={async () => {
                  if (!tintedSvg) return;
                  try {
                    toast.info('Generating PNG (white bg)…');
                    const blob = await svgToPng(tintedSvg, 1024, false, '#ffffff');
                    triggerDownload(blob, `${companySlug}_stamp_1024px_white.png`);
                    toast.success('PNG (white) downloaded!');
                  } catch { toast.error('PNG download failed'); }
                }}>
                  <Download size={12}/> PNG White BG
                </Button>
                <Button variant="outline" className="gap-1.5 text-xs" onClick={async () => {
                  if (!tintedSvg) return;
                  try {
                    toast.info('Generating JPG…');
                    const pngBlob = await svgToPng(tintedSvg, 1024, false, '#ffffff');
                    const jpgBlob = await pngToJpeg(pngBlob);
                    triggerDownload(jpgBlob, `${companySlug}_stamp_1024px.jpg`);
                    toast.success('JPG downloaded!');
                  } catch { toast.error('JPG download failed'); }
                }}>
                  <Download size={12}/> JPG
                </Button>
                <Button variant="outline" className="gap-1.5 text-xs" onClick={async () => {
                  if (!tintedSvg) return;
                  try {
                    toast.info('Generating PDF…');
                    const blob = await svgToPdf(tintedSvg, false, true);
                    triggerDownload(blob, `${companySlug}_stamp_print_300dpi.pdf`);
                    toast.success('PDF downloaded!');
                  } catch { toast.error('PDF download failed'); }
                }}>
                  <Download size={12}/> PDF (White BG)
                </Button>
                <Button variant="outline" className="gap-1.5 text-xs" onClick={async () => {
                  if (!tintedSvg) return;
                  try {
                    toast.info('Generating WEBP…');
                    const pngBlob = await svgToPng(tintedSvg, 1024, isTransparent, bgColorForExport);
                    const webpBlob = await pngToWebp(pngBlob, isTransparent);
                    triggerDownload(webpBlob, `${companySlug}_stamp_1024px${isTransparent ? '_transparent' : ''}.webp`);
                    toast.success('WEBP downloaded!');
                  } catch { toast.error('WEBP download failed'); }
                }}>
                  <Download size={12}/> WEBP
                </Button>
                <Button variant="outline" className="gap-1.5 text-xs border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))]" onClick={() => {
                  if (!tintedSvg) return;
                  const printWindow = window.open('', '_blank', 'width=800,height=800');
                  if (printWindow) {
                    const cleanSvg = sanitizeSvgForExport(tintedSvg, 200);
                    const htmlSvg = cleanSvg.replace(/<\?xml[^?]*\?>\s*/, '');
                    printWindow.document.write(`<!DOCTYPE html><html><head>
                      <title>Print Stamp — ${project?.company_name || 'Stamp'}</title>
                      <style>
                        @page { size: 100mm 100mm; margin: 10mm; }
                        html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: white; }
                        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                        svg { width: 80mm; height: 80mm; max-width: 100%; }
                      </style>
                    </head><body>${htmlSvg}</body></html>`);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.onafterprint = () => printWindow.close();
                    setTimeout(() => printWindow.print(), 600);
                  }
                }}>
                  <Printer size={12}/> Print
                </Button>
              </div>

              {/* User Preset Export */}
              <Button variant="outline" className="w-full gap-2 text-xs" onClick={() => {
                try {
                  const presetData = {
                    exportedAt: new Date().toISOString(),
                    company: project?.company_name || '',
                    colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
                    formats: options.formats,
                    sizes: effectiveSizes,
                  };
                  const blob = new Blob([JSON.stringify(presetData, null, 2)], { type: 'application/json' });
                  triggerDownload(blob, `${companySlug}_preset.json`);
                  toast.success('User preset exported!');
                } catch { toast.error('Preset export failed'); }
              }}>
                <Save size={12}/> Export User Preset (.json)
              </Button>

              <Button variant="outline" className="w-full gap-2 border-[hsl(var(--gold)/0.3)] hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.05)]"
                onClick={() => {
                  try {
                    sessionStorage.setItem('esignature_stamp_svg', tintedSvg);
                    sessionStorage.setItem('esignature_stamp_color', primaryColor);
                    toast.success('Stamp saved! Redirecting to E-Signature…');
                    navigate('/e-signature/create', { state: { stampSvg: tintedSvg, stampColor: primaryColor, source: 'stamp-generator' } });
                  } catch { toast.error('Failed to save stamp'); }
                }}>
                <PenTool size={14}/> Use in E-Signature
              </Button>
            </div>

            {/* Multi-Color ZIP Pack */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <Package size={14} className="text-[hsl(var(--gold))]"/> Multi-Color Pack
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setMultiColorMode(v => !v)}
                    className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${multiColorMode ? 'bg-[hsl(var(--gold))]' : 'bg-[hsl(var(--muted))]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#FDFBF7] shadow transition-all ${multiColorMode ? 'left-4' : 'left-0.5'}`}/>
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Enable</span>
                </label>
              </div>

              {multiColorMode && (
                <div className="space-y-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Select up to 5 colors for the ZIP pack:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PACK_COLORS.map(c => {
                      const selected = packColors.some(p => p.hex === c.hex);
                      return (
                        <button key={c.hex} onClick={() => togglePackColor(c)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${selected ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'}`}>
                          <div className={`w-4 h-4 rounded-full flex-shrink-0 shadow-sm ${c.hex === '#ffffff' ? 'border-2 border-[hsl(var(--border))]' : 'border border-white'}`} style={{ backgroundColor: c.hex }}/>
                          <span className="font-medium truncate text-[hsl(var(--foreground))]">{c.label}</span>
                          {selected && <span className="ml-auto text-[hsl(var(--gold))]">✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[hsl(var(--border))]">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">Or pick a custom color:</p>
                    <div className="flex items-center gap-2">
                      <input type="color" className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer"
                        onChange={e => {
                          const hex = e.target.value;
                          const label = `Custom ${hex.slice(1, 4).toUpperCase()}`;
                          if (!packColors.some(p => p.hex === hex)) togglePackColor({ label, hex });
                        }}/>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Click to add custom color to pack</span>
                    </div>
                  </div>

                  {packColors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Pack preview ({packColors.length} color{packColors.length !== 1 ? 's' : ''}):</p>
                      <div className="flex gap-2 flex-wrap">
                        {packColors.map(c => (
                          <div key={c.hex} className="flex flex-col items-center gap-1">
                            <StampSVGRenderer svgSource={design.svg_source} size={52} tintColor={c.hex}/>
                            <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2"
                    onClick={downloadColorZip} disabled={generatingZip || packColors.length === 0}>
                    {generatingZip ? <><Loader2 size={14} className="animate-spin"/> Building ZIP…</> : <><Download size={14}/> Download Color Pack ZIP ({packColors.length} colors)</>}
                  </Button>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">ZIP includes SVG + 512px + 1024px PNG for each color.</p>
                </div>
              )}
            </div>

            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
              Files download to your browser. SVG is print-ready at any size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
