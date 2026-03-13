/**
 * InlineStampGenerator — Lightweight modal-based stamp creation for use inside other tools.
 * Generates a simple circular stamp SVG without leaving the current page.
 */
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Stamp, Loader2, Check, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

  // Create initials from company name
  const initials = companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'CO';

  const topText = companyName.toUpperCase() || 'COMPANY NAME';
  const bottomText = city.toUpperCase() || 'DUBAI, UAE';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <path id="topArc" d="M ${cx - outerR + 15} ${cy} A ${outerR - 15} ${outerR - 15} 0 1 1 ${cx + outerR - 15} ${cy}" fill="none"/>
    <path id="bottomArc" d="M ${cx + midR - 10} ${cy + 8} A ${midR - 10} ${midR - 10} 0 1 1 ${cx - midR + 10} ${cy + 8}" fill="none"/>
  </defs>
  <!-- Outer rings -->
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="#1B3A8C" stroke-width="4"/>
  <circle cx="${cx}" cy="${cy}" r="${outerR - 6}" fill="none" stroke="#1B3A8C" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="${midR}" fill="none" stroke="#1B3A8C" stroke-width="1.5"/>
  <!-- Inner circle for monogram -->
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="#1B3A8C" stroke-width="2"/>
  <!-- Decorative dots -->
  <circle cx="${cx - outerR + 8}" cy="${cy}" r="3" fill="#1B3A8C"/>
  <circle cx="${cx + outerR - 8}" cy="${cy}" r="3" fill="#1B3A8C"/>
  <!-- Top arc text -->
  <text font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#1B3A8C" letter-spacing="3">
    <textPath href="#topArc" startOffset="50%" text-anchor="middle">${topText}</textPath>
  </text>
  <!-- Bottom arc text -->
  <text font-family="Georgia, serif" font-size="11" fill="#1B3A8C" letter-spacing="2">
    <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">${bottomText}</textPath>
  </text>
  <!-- Center monogram -->
  <text x="${cx}" y="${cy + 8}" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#1B3A8C" text-anchor="middle" dominant-baseline="central">${initials}</text>
  ${licenseNo ? `<text x="${cx}" y="${cy + innerR + 15}" font-family="Georgia, serif" font-size="8" fill="#1B3A8C" text-anchor="middle">Lic. ${licenseNo}</text>` : ''}
</svg>`;
}

export function InlineStampGenerator({ open, onClose, onStampReady, accentColor = '#059669' }: InlineStampGeneratorProps) {
  const [companyName, setCompanyName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [city, setCity] = useState('Dubai, UAE');
  const [generating, setGenerating] = useState(false);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);

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
        // Fallback to local generation
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
      // Also save to sessionStorage for cross-tool use
      sessionStorage.setItem('esignature_stamp_svg', previewSvg);
      onStampReady(dataUrl);
      onClose();
      toast.success('Stamp applied!');
    };
    reader.readAsDataURL(blob);
  }, [previewSvg, onStampReady, onClose]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Stamp className="w-5 h-5" style={{ color: accentColor }} />
            Quick Stamp Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {!previewSvg ? (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-stone-500 mb-1 block">Company Name *</Label>
                  <Input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="JBJ Global Real Estate"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-stone-500 mb-1 block">License Number</Label>
                    <Input
                      value={licenseNo}
                      onChange={e => setLicenseNo(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500 mb-1 block">City</Label>
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
                    className="rounded border-stone-300"
                  />
                  <span className="text-xs text-stone-600 flex items-center gap-1">
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
              {/* Preview */}
              <div className="flex items-center justify-center p-6 bg-white rounded-xl border border-stone-200">
                <div
                  className="w-48 h-48"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewSvg(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all"
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

              <p className="text-[10px] text-center text-stone-400">
                For advanced stamp design, visit the full Stamp Generator tool.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
