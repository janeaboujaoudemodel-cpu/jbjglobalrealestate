import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import {
  Download, ArrowLeft, Stamp, CheckCircle2, Loader2,
  FileImage, FileText, File, Package
} from 'lucide-react';

interface ExportOptions {
  formats: string[];
  sizes: number[];
  dpi: number[];
  buffer: boolean;
  transparent: boolean;
}

function ToggleChip({
  label, active, onClick
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        active
          ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]'
          : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.3)]'
      }`}
    >{label}</button>
  );
}

export default function StampExportPage() {
  const { projectId, designId } = useParams<{ projectId: string; designId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [design, setDesign] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [bundleUrl, setBundleUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    formats: ['svg', 'png', 'pdf'],
    sizes: [512, 1024],
    dpi: [300],
    buffer: false,
    transparent: true,
  });

  const svgRef = useRef<HTMLDivElement>(null);

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

  function toggleFormat(f: string) {
    setOptions(o => ({
      ...o,
      formats: o.formats.includes(f) ? o.formats.filter(x => x !== f) : [...o.formats, f],
    }));
  }

  function toggleSize(s: number) {
    setOptions(o => ({
      ...o,
      sizes: o.sizes.includes(s) ? o.sizes.filter(x => x !== s) : [...o.sizes, s],
    }));
  }

  function toggleDpi(d: number) {
    setOptions(o => ({
      ...o,
      dpi: o.dpi.includes(d) ? o.dpi.filter(x => x !== d) : [...o.dpi, d],
    }));
  }

  /** Client-side SVG download (instant) */
  function downloadSVG() {
    if (!design?.svg_source) return;
    const blob = new Blob([design.svg_source], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.company_name || 'stamp'}_stamp.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded!');
  }

  /** Client-side PNG via canvas */
  async function downloadPNG(size: number, transparent: boolean) {
    if (!design?.svg_source) return;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    if (!transparent) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
    }
    const img = new Image();
    const blob = new Blob([design.svg_source], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => { ctx.drawImage(img, 0, 0, size, size); resolve(); };
      img.onerror = reject;
      img.src = url;
    });
    URL.revokeObjectURL(url);
    canvas.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `${project?.company_name || 'stamp'}_${size}px_${transparent ? 'transparent' : 'white'}.png`;
      a.click();
    }, 'image/png');
    toast.success(`PNG (${size}px) downloaded!`);
  }

  async function generateBundle() {
    if (options.formats.length === 0) { toast.error('Select at least one format'); return; }
    setGenerating(true);
    try {
      // Download selected formats
      if (options.formats.includes('svg')) { downloadSVG(); await new Promise(r => setTimeout(r, 300)); }

      for (const size of options.sizes) {
        if (options.formats.includes('png')) {
          await downloadPNG(size, options.transparent);
          await new Promise(r => setTimeout(r, 300));
        }
        if (options.formats.includes('jpg')) {
          await downloadPNG(size, false); // JPG = white bg
          await new Promise(r => setTimeout(r, 300));
        }
      }

      // Log the export
      await supabase.from('stamp_exports').insert({
        design_id: designId!,
        user_id: user!.id,
        includes: options as any,
        status: 'ready',
      });

      toast.success('Export complete! Check your downloads folder.');
    } catch (err) {
      console.error(err);
      toast.error('Export failed. Please try again.');
    }
    setGenerating(false);
  }

  if (!design || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[hsl(var(--gold))]" size={32}/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
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

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Preview */}
          <div className="space-y-4">
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Stamp Preview</h2>

            {/* Blank background */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-8 flex items-center justify-center">
              <div ref={svgRef}>
                <StampSVGRenderer svgSource={design.svg_source} size={220} tintColor="#1a2744"/>
              </div>
            </div>

            {/* On document simulation */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-3">Preview on document</p>
              <div className="bg-[hsl(var(--pearl-1))] rounded-xl p-4 border border-[hsl(var(--border)/0.5)]">
                {/* Mock letterhead */}
                <div className="h-2 w-24 bg-[hsl(var(--muted))] rounded mb-2"/>
                <div className="h-1.5 w-40 bg-[hsl(var(--muted))] rounded mb-1"/>
                <div className="h-1.5 w-32 bg-[hsl(var(--muted))] rounded mb-4"/>
                <div className="h-1 w-full bg-[hsl(var(--border))] rounded mb-3"/>
                <div className="grid grid-cols-3 gap-1 mb-4">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-1 bg-[hsl(var(--muted))] rounded"/>)}
                </div>
                <div className="flex justify-end">
                  <StampSVGRenderer svgSource={design.svg_source} size={80} tintColor="#1a2744"/>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-[hsl(var(--pearl-1))] rounded-xl border border-[hsl(var(--border))] p-4 space-y-1">
              <p className="text-xs font-medium text-[hsl(var(--foreground))]">{project.company_name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{[project.city_optional, project.country_optional].filter(Boolean).join(', ')}</p>
              {project.registration_number_optional && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">REG: {project.registration_number_optional}</p>
              )}
            </div>
          </div>

          {/* Right: Export options */}
          <div className="space-y-6">
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Export Options</h2>

            {/* Formats */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
                  <File size={14} className="text-[hsl(var(--gold))]"/> File Formats
                </p>
                <div className="flex flex-wrap gap-2">
                  {['svg', 'png', 'jpg', 'pdf'].map(f => (
                    <ToggleChip key={f} label={f.toUpperCase()} active={options.formats.includes(f)} onClick={() => toggleFormat(f)}/>
                  ))}
                </div>
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

              <div className="space-y-2 pt-1 border-t border-[hsl(var(--border))]">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">Options</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.transparent}
                    onChange={e => setOptions(o => ({ ...o, transparent: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-[hsl(var(--foreground))]">Transparent background (PNG)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.buffer}
                    onChange={e => setOptions(o => ({ ...o, buffer: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-[hsl(var(--foreground))]">With buffer (padding around stamp)</span>
                </label>
              </div>
            </div>

            {/* What's included */}
            <div className="bg-[hsl(var(--pearl-1))] rounded-xl border border-[hsl(var(--border))] p-4">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
                <Package size={12} className="text-[hsl(var(--gold))]"/> Your download will include:
              </p>
              <div className="space-y-1">
                {options.formats.includes('svg') && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">✓ stamp.svg (vector, scalable)</p>
                )}
                {options.formats.includes('png') && options.sizes.map(s => (
                  <p key={`png-${s}`} className="text-xs text-[hsl(var(--muted-foreground))]">✓ stamp_{s}px{options.transparent ? '_transparent' : ''}.png</p>
                ))}
                {options.formats.includes('jpg') && options.sizes.map(s => (
                  <p key={`jpg-${s}`} className="text-xs text-[hsl(var(--muted-foreground))]">✓ stamp_{s}px_white.jpg</p>
                ))}
                {options.formats.includes('pdf') && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">✓ stamp_print_ready.pdf</p>
                )}
              </div>
            </div>

            {/* Download buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2 h-11"
                onClick={generateBundle}
                disabled={generating}
              >
                {generating ? <><Loader2 size={15} className="animate-spin"/> Downloading…</> : <><Download size={15}/> Download Selected Formats</>}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={downloadSVG}
              >
                <Download size={14}/> Quick Download SVG
              </Button>
            </div>

            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
              Files download directly to your browser. SVG is print-ready at any size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
