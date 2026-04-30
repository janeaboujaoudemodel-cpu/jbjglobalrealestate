/**
 * InlineStampGenerator — Lightweight modal-based stamp creation for use inside other tools.
 * Now includes a "Select from Library" tab to reuse saved brand assets.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Stamp, Loader2, Check, ArrowLeft, Sparkles, Package, Library } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';

interface InlineStampGeneratorProps {
  open: boolean;
  onClose: () => void;
  onStampReady: (svgDataUrl: string) => void;
  accentColor?: string;
}

function generateLocalStampSVG(companyName: string, licenseNo: string, city: string): string {
  const size = 300;
  const cx = size / 2, cy = size / 2;
  const outerR = 140, midR = 120, innerR = 70;
  const initials = companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'CO';
  const topText = companyName.toUpperCase() || 'COMPANY NAME';
  const bottomText = city.toUpperCase() || 'DUBAI, UAE';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <path id="topArc" d="M ${cx - outerR + 15} ${cy} A ${outerR - 15} ${outerR - 15} 0 1 1 ${cx + outerR - 15} ${cy}" fill="none"/>
    <path id="bottomArc" d="M ${cx + midR - 10} ${cy + 8} A ${midR - 10} ${midR - 10} 0 1 1 ${cx - midR + 10} ${cy + 8}" fill="none"/>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="#1B3A8C" stroke-width="4"/>
  <circle cx="${cx}" cy="${cy}" r="${outerR - 6}" fill="none" stroke="#1B3A8C" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="${midR}" fill="none" stroke="#1B3A8C" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="#1B3A8C" stroke-width="2"/>
  <circle cx="${cx - outerR + 8}" cy="${cy}" r="3" fill="#1B3A8C"/>
  <circle cx="${cx + outerR - 8}" cy="${cy}" r="3" fill="#1B3A8C"/>
  <text font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#1B3A8C" letter-spacing="3">
    <textPath href="#topArc" startOffset="50%" text-anchor="middle">${topText}</textPath>
  </text>
  <text font-family="Georgia, serif" font-size="11" fill="#1B3A8C" letter-spacing="2">
    <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">${bottomText}</textPath>
  </text>
  <text x="${cx}" y="${cy + 8}" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#1B3A8C" text-anchor="middle" dominant-baseline="central">${initials}</text>
  ${licenseNo ? `<text x="${cx}" y="${cy + innerR + 15}" font-family="Georgia, serif" font-size="8" fill="#1B3A8C" text-anchor="middle">Lic. ${licenseNo}</text>` : ''}
</svg>`;
}

interface LibraryStamp {
  id: string;
  name: string;
  svg_content: string | null;
  thumbnail_url: string | null;
}

export function InlineStampGenerator({ open, onClose, onStampReady, accentColor = '#059669' }: InlineStampGeneratorProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'create' | 'library'>('create');
  const [companyName, setCompanyName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [city, setCity] = useState('Dubai, UAE');
  const [generating, setGenerating] = useState(false);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [libraryStamps, setLibraryStamps] = useState<LibraryStamp[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // Load library stamps
  useEffect(() => {
    if (!open || !user || tab !== 'library') return;
    setLoadingLibrary(true);
    supabase
      .from('brand_assets')
      .select('id, name, svg_content, thumbnail_url')
      .eq('user_id', user.id)
      .eq('asset_type', 'stamp')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLibraryStamps((data || []) as LibraryStamp[]);
        setLoadingLibrary(false);
      });
  }, [open, user, tab]);

  const generateStamp = useCallback(async () => {
    if (!companyName.trim()) {
      toast.error('Enter a company name');
      return;
    }
    setGenerating(true);

    if (useAI) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-stamp-generator', {
          body: {
            companyName: companyName.trim(),
            registrationNumber: licenseNo.trim(),
            city: city.trim(),
            templateId: 'official-standard',
            languageMode: 'english',
          }
        });
        if (error) throw error;
        if (data?.svgContent) {
          setPreviewSvg(data.svgContent);
          toast.success('AI stamp generated!');
        } else {
          throw new Error('No SVG returned');
        }
      } catch {
        const svg = generateLocalStampSVG(companyName.trim(), licenseNo.trim(), city.trim());
        setPreviewSvg(svg);
        toast.success('Stamp generated (local)');
      }
    } else {
      const svg = generateLocalStampSVG(companyName.trim(), licenseNo.trim(), city.trim());
      setPreviewSvg(svg);
      toast.success('Stamp generated!');
    }
    setGenerating(false);
  }, [companyName, licenseNo, city, useAI]);

  const handleUseStamp = useCallback(() => {
    if (!previewSvg) return;
    const blob = new Blob([previewSvg], { type: 'image/svg+xml' });
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      sessionStorage.setItem('esignature_stamp_svg', previewSvg);
      onStampReady(dataUrl);
      onClose();
      toast.success('Stamp applied!');
    };
    reader.readAsDataURL(blob);
  }, [previewSvg, onStampReady, onClose]);

  const handleSelectFromLibrary = (stamp: LibraryStamp) => {
    if (!stamp.svg_content) return;
    const blob = new Blob([stamp.svg_content], { type: 'image/svg+xml' });
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      sessionStorage.setItem('esignature_stamp_svg', stamp.svg_content!);
      onStampReady(dataUrl);
      onClose();
      toast.success(`"${stamp.name}" applied!`);
    };
    reader.readAsDataURL(blob);
  };

  const handleSaveAsBrandAsset = useCallback(async () => {
    if (!previewSvg || !user) return;
    const assetName = companyName.trim() || 'Inline Stamp';
    try {
      await supabase.from('brand_assets').insert({
        user_id: user.id,
        asset_type: 'stamp' as any,
        name: assetName,
        svg_content: previewSvg,
        metadata: {},
      });
      toast.success('Saved as brand asset!');
    } catch {
      toast.error('Failed to save');
    }
  }, [previewSvg, user, companyName]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Stamp className="w-5 h-5" style={{ color: accentColor }} />
            Quick Stamp Generator
          </DialogTitle>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="flex gap-1 bg-[hsl(var(--muted))] rounded-lg p-1">
          <button
            onClick={() => { setTab('create'); setPreviewSvg(null); }}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
              tab === 'create' ? 'bg-[#FDFBF7] shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
            }`}
          >
            <Sparkles size={12} /> Create New
          </button>
          <button
            onClick={() => setTab('library')}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
              tab === 'library' ? 'bg-[#FDFBF7] shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
            }`}
          >
            <Library size={12} /> From Library
          </button>
        </div>

        <div className="space-y-4 mt-2">
          {tab === 'library' ? (
            /* Library tab */
            loadingLibrary ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-[hsl(var(--muted-foreground))]" />
              </div>
            ) : libraryStamps.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Package size={28} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No saved stamps yet</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Create and save a stamp first</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                {libraryStamps.map(stamp => (
                  <button
                    key={stamp.id}
                    onClick={() => handleSelectFromLibrary(stamp)}
                    className="group rounded-xl border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] transition-all p-2 flex flex-col items-center gap-1"
                  >
                    <div className="w-full aspect-square flex items-center justify-center bg-[hsl(var(--muted))] rounded-lg">
                      {stamp.svg_content ? (
                        <StampSVGRenderer svgSource={stamp.svg_content} tintColor="#1B3A8C" size={60} />
                      ) : (
                        <Package size={20} className="opacity-30" />
                      )}
                    </div>
                    <p className="text-[9px] font-medium truncate w-full text-center">{stamp.name}</p>
                  </button>
                ))}
              </div>
            )
          ) : !previewSvg ? (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Company Name *</Label>
                  <Input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="JBJ Global Real Estate"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">License Number</Label>
                    <Input
                      value={licenseNo}
                      onChange={e => setLicenseNo(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">City</Label>
                    <Input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Dubai, UAE"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={e => setUseAI(e.target.checked)}
                    className="rounded border-[hsl(var(--border))]"
                  />
                  <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Use AI for premium design
                  </span>
                </label>
              </div>

              <button
                onClick={generateStamp}
                disabled={generating || !companyName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
                style={{ background: accentColor }}
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><Stamp className="w-4 h-4" /> Generate Stamp</>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center p-6 bg-[#FDFBF7] rounded-xl border border-[hsl(var(--border))]">
                <div
                  className="w-48 h-48"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewSvg(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Regenerate
                </button>
                <button
                  onClick={handleUseStamp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: accentColor }}
                >
                  <Check className="w-4 h-4" /> Use This Stamp
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1"
                onClick={handleSaveAsBrandAsset}
              >
                <Package size={12} /> Save as Brand Asset
              </Button>

              <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">
                For advanced stamp design, visit the full Stamp Generator tool.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
