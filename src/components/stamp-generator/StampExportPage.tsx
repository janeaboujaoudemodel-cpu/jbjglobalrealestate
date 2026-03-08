import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import { StampColorWheel } from '@/components/stamp-generator/StampColorWheel';
import JSZip from 'jszip';
import {
  Download, ArrowLeft, Stamp, CheckCircle2, Loader2,
  FileImage, FileText, File, Package, Palette, X, Plus, Image, PenTool
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Prefix all SVG IDs with a unique token to prevent cross-stamp ID collisions */
function uniquifyIds(svg: string): string {
  const token = Math.random().toString(36).slice(2, 7);
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${token}_${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${token}_${id})`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${token}_${id}"`);
}

/** Convert a Blob to a base64 data URL via FileReader */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** SVG → PNG via base64 data URL — avoids canvas CORS taint caused by Blob URLs */
async function svgToPng(svgString: string, size: number, transparent: boolean): Promise<Blob> {
  // 0. De-duplicate IDs to prevent cross-instance collisions
  let svg = uniquifyIds(svgString);

  // 1. Ensure required XML namespaces are present
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!svg.includes('xmlns:xlink')) {
    svg = svg.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // 2. Inject explicit width/height so the browser knows the intrinsic size
  svg = svg.replace(/<svg([^>]*)>/, (_match, attrs) => {
    let a = attrs;
    if (!/\bwidth=/.test(a)) a += ` width="${size}"`;
    if (!/\bheight=/.test(a)) a += ` height="${size}"`;
    return `<svg${a}>`;
  });

  // 3. Use base64 data URL — same-origin, never taints the canvas
  //    btoa(unescape(encodeURIComponent())) safely handles Arabic / Unicode characters
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  const dataUrl = `data:image/svg+xml;base64,${b64}`;

  return new Promise((resolve, reject) => {
    const img = document.createElement('img') as HTMLImageElement;

    img.onload = async () => {
      try {
        // decode() ensures the image is fully rasterized before we touch the canvas
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        if (!transparent) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
        }
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob returned null'));
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('SVG image failed to load — check SVG validity'));
    img.src = dataUrl;
  });
}

/** PNG → JPEG (no transparency) */
async function pngToJpeg(pngBlob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataUrl(pngBlob);
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(b => {
        if (b) resolve(b); else reject(new Error('JPEG toBlob failed'));
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => reject(new Error('JPEG img load failed'));
    img.src = dataUrl;
  });
}

/** PNG → WEBP */
async function pngToWebp(pngBlob: Blob, transparent: boolean): Promise<Blob> {
  const dataUrl = await blobToDataUrl(pngBlob);
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      if (!transparent) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(b => {
        if (b) resolve(b); else reject(new Error('WEBP toBlob failed'));
      }, 'image/webp', 0.92);
    };
    img.onerror = () => reject(new Error('WEBP img load failed'));
    img.src = dataUrl;
  });
}

/** SVG → PDF (uses pdf-lib) */
async function svgToPdf(svgString: string, transparent: boolean): Promise<Blob> {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const pngBlob = await svgToPng(svgString, 1200, transparent);
  const pngBytes = await pngBlob.arrayBuffer();
  const pdfDoc = await PDFDocument.create();
  const pointSize = 300;
  const page = pdfDoc.addPage([pointSize, pointSize]);
  const pngImage = await pdfDoc.embedPng(pngBytes);
  if (!transparent) {
    page.drawRectangle({ x: 0, y: 0, width: pointSize, height: pointSize, color: rgb(1, 1, 1) });
  }
  page.drawImage(pngImage, { x: 0, y: 0, width: pointSize, height: pointSize });
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

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

/** Swap bilingual text arcs: moves bottom textPath content to top and vice versa */
function swapBilingualArcs(svg: string): string {
  // Match textPath pairs — first is top arc, second is bottom arc
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

  // Three-color system
  const [primaryColor, setPrimaryColor] = useState('#1a2744');
  const [secondaryColor, setSecondaryColor] = useState<string | undefined>(undefined);
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [activeStop, setActiveStop] = useState<ColorStop>('primary');

  const [options, setOptions] = useState<ExportOptions>({
    formats: ['svg', 'png', 'jpg', 'webp', 'pdf'],
    sizes: [512, 1024],
    dpi: [300],
    transparent: true,
  });

  // Multi-color pack
  const [multiColorMode, setMultiColorMode] = useState(false);
  const [packColors, setPackColors] = useState<{ label: string; hex: string }[]>([PACK_COLORS[0], PACK_COLORS[5]]);
  const [generatingZip, setGeneratingZip] = useState(false);

  // Per-file export status
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

  function toggleFormat(f: string) {
    setOptions(o => ({ ...o, formats: o.formats.includes(f) ? o.formats.filter(x => x !== f) : [...o.formats, f] }));
  }
  function toggleSize(s: number) {
    setOptions(o => ({ ...o, sizes: o.sizes.includes(s) ? o.sizes.filter(x => x !== s) : [...o.sizes, s] }));
  }
  function toggleDpi(d: number) {
    setOptions(o => ({ ...o, dpi: o.dpi.includes(d) ? o.dpi.filter(x => x !== d) : [...o.dpi, d] }));
  }

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
    const blob = new Blob([tintedSvg], { type: 'image/svg+xml' });
    triggerDownload(blob, `${companySlug}_stamp.svg`);
    setFileStatuses(s => ({ ...s, svg: 'ok' }));
    toast.success('SVG downloaded!');
  }

  async function downloadPNGFile(size: number): Promise<Blob | null> {
    const key = `png_${size}`;
    try {
      const blob = await svgToPng(tintedSvg, size, options.transparent);
      triggerDownload(blob, `${companySlug}_stamp_${size}px${options.transparent ? '_transparent' : ''}.png`);
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
      const pngBlob = await svgToPng(tintedSvg, size, false);
      const jpgBlob = await pngToJpeg(pngBlob);
      triggerDownload(jpgBlob, `${companySlug}_stamp_${size}px.jpg`);
      setFileStatuses(s => ({ ...s, [key]: 'ok' }));
      return true;
    } catch (err) {
      console.error(`JPG ${size}px failed:`, err);
      setFileStatuses(s => ({ ...s, [key]: 'error' }));
      return false;
    }
  }

  async function downloadWebpFile(size: number) {
    const key = `webp_${size}`;
    try {
      const pngBlob = await svgToPng(tintedSvg, size, options.transparent);
      const webpBlob = await pngToWebp(pngBlob, options.transparent);
      triggerDownload(webpBlob, `${companySlug}_stamp_${size}px${options.transparent ? '_transparent' : ''}.webp`);
      setFileStatuses(s => ({ ...s, [key]: 'ok' }));
      return true;
    } catch (err) {
      console.error(`WEBP ${size}px failed:`, err);
      setFileStatuses(s => ({ ...s, [key]: 'error' }));
      return false;
    }
  }

  async function downloadPDFFile() {
    const key = 'pdf';
    try {
      const blob = await svgToPdf(tintedSvg, options.transparent);
      triggerDownload(blob, `${companySlug}_stamp_print_300dpi.pdf`);
      setFileStatuses(s => ({ ...s, [key]: 'ok' }));
      return true;
    } catch (err) {
      console.error('PDF failed:', err);
      setFileStatuses(s => ({ ...s, [key]: 'error' }));
      return false;
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
        zip.file(`${companySlug}_stamp.svg`, tintedSvg);
        setFileStatuses(s => ({ ...s, svg: 'ok' }));
        fileCount++;
      }

      for (const size of options.sizes) {
        if (options.formats.includes('png')) {
          try {
            const blob = await svgToPng(tintedSvg, size, options.transparent);
            zip.file(`${companySlug}_stamp_${size}px${options.transparent ? '_transparent' : ''}.png`, blob);
            setFileStatuses(s => ({ ...s, [`png_${size}`]: 'ok' }));
            fileCount++;
          } catch (err) {
            console.error(`PNG ${size}px failed:`, err);
            setFileStatuses(s => ({ ...s, [`png_${size}`]: 'error' }));
          }
        }
        if (options.formats.includes('jpg')) {
          try {
            const pngBlob = await svgToPng(tintedSvg, size, false);
            const jpgBlob = await pngToJpeg(pngBlob);
            zip.file(`${companySlug}_stamp_${size}px.jpg`, jpgBlob);
            setFileStatuses(s => ({ ...s, [`jpg_${size}`]: 'ok' }));
            fileCount++;
          } catch (err) {
            console.error(`JPG ${size}px failed:`, err);
            setFileStatuses(s => ({ ...s, [`jpg_${size}`]: 'error' }));
          }
        }
        if (options.formats.includes('webp')) {
          try {
            const pngBlob = await svgToPng(tintedSvg, size, options.transparent);
            const webpBlob = await pngToWebp(pngBlob, options.transparent);
            zip.file(`${companySlug}_stamp_${size}px${options.transparent ? '_transparent' : ''}.webp`, webpBlob);
            setFileStatuses(s => ({ ...s, [`webp_${size}`]: 'ok' }));
            fileCount++;
          } catch (err) {
            console.error(`WEBP ${size}px failed:`, err);
            setFileStatuses(s => ({ ...s, [`webp_${size}`]: 'error' }));
          }
        }
      }

      if (options.formats.includes('pdf')) {
        try {
          const blob = await svgToPdf(tintedSvg, options.transparent);
          zip.file(`${companySlug}_stamp_print_300dpi.pdf`, blob);
          setFileStatuses(s => ({ ...s, pdf: 'ok' }));
          fileCount++;
        } catch (err) {
          console.error('PDF failed:', err);
          setFileStatuses(s => ({ ...s, pdf: 'error' }));
        }
      }

      // ── Bilingual variants (English-top + Arabic-top) ──
      const arabicName = project?.arabic_company_name;
      const arabicCity = project?.arabic_city_optional;
      if (arabicName && tintedSvg.includes('textPath')) {
        try {
          // Arabic-top variant: swap top/bottom text arcs
          const arabicTopSvg = swapBilingualArcs(tintedSvg);
          const biFolder = zip.folder('bilingual_arabic_top')!;
          biFolder.file(`${companySlug}_stamp_arabic_top.svg`, arabicTopSvg);
          const biPng = await svgToPng(arabicTopSvg, 1024, true);
          biFolder.file(`${companySlug}_stamp_arabic_top_1024px.png`, biPng);
          const biPdf = await svgToPdf(arabicTopSvg, true);
          biFolder.file(`${companySlug}_stamp_arabic_top_print.pdf`, biPdf);
          fileCount += 3;
        } catch (err) {
          console.warn('Bilingual variant generation failed:', err);
        }
      }

      // Add README
      const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      zip.file('README.txt',
        `Brand Kit Export\n` +
        `Company: ${project?.company_name || ''}\n` +
        `Exported: ${date}\n` +
        `Files: ${fileCount}\n\n` +
        `Contents:\n` +
        `  • SVG — Vector (scalable to any size)\n` +
        `  • PNG — Transparent background rasters\n` +
        `  • JPG — White background rasters\n` +
        `  • WEBP — Modern web format\n` +
        `  • PDF — Print-ready at 300 DPI\n` +
        (arabicName ? `  • bilingual_arabic_top/ — Arabic-on-top variant\n` : '') +
        `\nGenerated by JBJ AI Stamp Generator\n`
      );

      // Generate and download the ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      triggerDownload(zipBlob, `${companySlug}_brand_kit.zip`);

      // Log export
      await supabase.from('stamp_exports').insert({
        design_id: designId!, user_id: user!.id, includes: options as any, status: 'ready',
      });

      const failCount = Object.values(fileStatuses).filter(s => s === 'error').length;
      if (failCount === 0) {
        toast.success(`✅ ${fileCount} file${fileCount !== 1 ? 's' : ''} bundled into ZIP!`);
      } else {
        toast.warning(`ZIP contains ${fileCount} files. ${failCount} failed.`);
      }
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
          } catch (e) {
            console.error(`PNG ${size}px for ${label} failed:`, e);
          }
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
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-24 sm:top-28 lg:top-32 z-10">
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

            {/* Main preview */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-8 flex items-center justify-center">
              <StampSVGRenderer
                svgSource={design.svg_source}
                size={260}
                tintColor={primaryColor}
                secondaryColor={secondaryColor}
                accentColor={accentColor}
              />
            </div>

            {/* On document */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-2">
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

            {/* On business card */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-2">
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
                      <p className="text-white/50 text-[10px]">CEO / Managing Director</p>
                      {project.city_optional && <p className="text-white/40 text-[10px]">{[project.city_optional, project.country_optional].filter(Boolean).join(', ')}</p>}
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
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                <Palette size={14} className="text-[hsl(var(--gold))]"/> Export Colors
              </p>

              {/* Stop selector */}
              <div className="flex gap-2">
                {stopLabels.map(stop => (
                  <button
                    key={stop.key}
                    onClick={() => setActiveStop(stop.key)}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                      activeStop === stop.key
                        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: stop.color }}/>
                    <span className="text-[10px] font-medium text-[hsl(var(--foreground))]">{stop.label}</span>
                  </button>
                ))}
              </div>

              {/* Color wheel for active stop */}
              <StampColorWheel color={activeColor} onChange={setActiveColor} label="" size={180}/>

              {/* Preset shortcuts */}
              <div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c.hex} onClick={() => setActiveColor(c.hex)} title={c.label}
                      className={`w-7 h-7 rounded-full border-2 shadow-sm transition-all hover:scale-110 ${activeColor === c.hex ? 'border-[hsl(var(--gold))] scale-110' : 'border-white'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Formats */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
                  <File size={14} className="text-[hsl(var(--gold))]"/> File Formats
                </p>
                <div className="flex flex-wrap gap-2">
                  {['svg', 'png', 'jpg', 'webp', 'pdf'].map(f => (
                    <ToggleChip key={f} label={f.toUpperCase()} active={options.formats.includes(f)} onClick={() => toggleFormat(f)}/>
                  ))}
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1.5">SVG is vector (infinite resolution). PDF = print-ready 300 DPI. JPG = no transparency.</p>
              </div>

              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
                  <FileImage size={14} className="text-[hsl(var(--gold))]"/> Sizes (px)
                </p>
                <div className="flex flex-wrap gap-2">
                  {[512, 1024, 2048].map(s => (
                    <ToggleChip key={s} label={`${s}px`} active={options.sizes.includes(s)} onClick={() => toggleSize(s)}/>
                  ))}
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

              <div className="pt-2 border-t border-[hsl(var(--border))] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={options.transparent}
                    onChange={e => setOptions(o => ({ ...o, transparent: e.target.checked }))} className="rounded"/>
                  <span className="text-sm text-[hsl(var(--foreground))]">Transparent background</span>
                </label>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] pl-6">Applies to PNG and WEBP. JPG always has white background.</p>
              </div>
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

            {/* Download buttons */}
            <div className="space-y-2.5">
              <Button className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2 h-11"
                onClick={generateBundle} disabled={generating}>
                {generating ? <><Loader2 size={15} className="animate-spin"/> Downloading…</> : <><Download size={15}/> Download Selected Formats</>}
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={downloadSVG}>
                <Download size={14}/> Quick Download SVG (Vector)
              </Button>
              <Button variant="outline" className="w-full gap-2 border-[hsl(var(--gold)/0.3)] hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.05)]"
                onClick={() => {
                  try {
                    sessionStorage.setItem('esignature_stamp_svg', tintedSvg);
                    sessionStorage.setItem('esignature_stamp_color', primaryColor);
                    toast.success('Stamp saved! Redirecting to E-Signature…');
                    navigate('/e-signature/create');
                  } catch {
                    toast.error('Failed to save stamp');
                  }
                }}>
                <PenTool size={14}/> Use in E-Signature
              </Button>
            </div>

            {/* Multi-Color ZIP Pack */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <Package size={14} className="text-[hsl(var(--gold))]"/> Multi-Color Pack
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setMultiColorMode(v => !v)}
                    className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${multiColorMode ? 'bg-[hsl(var(--gold))]' : 'bg-[hsl(var(--muted))]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${multiColorMode ? 'left-4' : 'left-0.5'}`}/>
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

                  {/* Custom color picker for pack */}
                  <div className="pt-2 border-t border-[hsl(var(--border))]">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">Or pick a custom color:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer"
                        onChange={e => {
                          const hex = e.target.value;
                          const label = `Custom ${hex.slice(1, 4).toUpperCase()}`;
                          if (!packColors.some(p => p.hex === hex)) {
                            togglePackColor({ label, hex });
                          }
                        }}
                      />
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

                  <Button
                    className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2"
                    onClick={downloadColorZip}
                    disabled={generatingZip || packColors.length === 0}
                  >
                    {generatingZip
                      ? <><Loader2 size={14} className="animate-spin"/> Building ZIP…</>
                      : <><Download size={14}/> Download Color Pack ZIP ({packColors.length} colors)</>
                    }
                  </Button>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    ZIP includes SVG + 512px + 1024px PNG for each color.
                  </p>
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
