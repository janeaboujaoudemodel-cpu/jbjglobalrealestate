/**
 * StampPreviewModal — Full-screen design preview
 * Shows the selected stamp on Business Card, Letterhead, and Envelope mockups
 */
import React, { useState } from 'react';
import { StampSVGRenderer } from './StampSVGRenderer';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, Download, CreditCard, FileText, Mail } from 'lucide-react';
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
}

type MockupView = 'business-card' | 'letterhead' | 'envelope';

export function StampPreviewModal({
  concept, project, tintColor, secondaryColor, accentColor, svgOverride, onBack, onSelectAndExport,
}: Props) {
  const [activeView, setActiveView] = useState<MockupView>('business-card');
  const displaySvg = svgOverride || concept.svgSource;
  const companyName = project?.company_name || 'Company Name';
  const arabicName = project?.arabic_company_name || '';
  const city = [project?.city_optional, project?.country_optional].filter(Boolean).join(', ') || 'UAE';

  const views: { key: MockupView; label: string; icon: React.ElementType }[] = [
    { key: 'business-card', label: 'Business Card', icon: CreditCard },
    { key: 'letterhead', label: 'Letterhead', icon: FileText },
    { key: 'envelope', label: 'Envelope', icon: Mail },
  ];

  return (
    <div className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-[hsl(var(--border))] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
            <ArrowLeft size={15}/> Back to Designs
          </button>
          <div className="w-px h-5 bg-[hsl(var(--border))]"/>
          <span className="font-semibold text-[hsl(var(--foreground))] text-sm">{concept.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors">
            <X size={18} className="text-[hsl(var(--muted-foreground))]"/>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto flex flex-col lg:flex-row">

        {/* Left: stamp large preview + info */}
        <div className="lg:w-80 flex-shrink-0 bg-[hsl(var(--pearl-1))] border-r border-[hsl(var(--border))] flex flex-col items-center pt-4 pb-6 px-6 gap-4">
          <div className="bg-white rounded-3xl border border-[hsl(var(--border))] shadow-md p-6 flex items-center justify-center">
            <StampSVGRenderer
              svgSource={displaySvg}
              tintColor={tintColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
              size={220}
            />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-[hsl(var(--foreground))]">{concept.label}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{companyName}</p>
          </div>
          <Button
            onClick={onSelectAndExport}
            className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2"
          >
            <Download size={15}/> Select & Export →
          </Button>
        </div>

        {/* Right: mockup */}
        <div className="flex-1 flex flex-col">
          {/* View tabs */}
          <div className="flex-shrink-0 bg-white border-b border-[hsl(var(--border))] px-6 py-2 flex gap-1">
            {views.map(v => (
              <button
                key={v.key}
                onClick={() => setActiveView(v.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === v.key
                    ? 'bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                <v.icon size={14}/> {v.label}
              </button>
            ))}
          </div>

          {/* Mockup area */}
          <div className="flex-1 flex items-center justify-center p-10 bg-[hsl(var(--pearl-2))]">

            {/* Business Card Mockup */}
            {activeView === 'business-card' && (
              <div className="w-full max-w-xl">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-4 uppercase tracking-wide">Business Card Preview</p>
                {/* Front */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '1.75 / 1', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                  <div className="absolute inset-0 p-7 flex items-stretch">
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-white font-bold text-xl leading-tight tracking-tight">{companyName}</p>
                        {arabicName && <p className="text-white/70 text-sm mt-1" dir="rtl">{arabicName}</p>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Chief Executive Officer</p>
                        <p className="text-white/40 text-xs">{city}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end pl-6">
                      <div className="opacity-85">
                        <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} size={100}/>
                      </div>
                    </div>
                  </div>
                  {/* Decorative accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${tintColor}88, ${tintColor}ff, ${tintColor}44)` }}/>
                </div>
                {/* Back */}
                <div className="mt-4 relative rounded-2xl overflow-hidden shadow-xl flex items-center justify-center" style={{ aspectRatio: '1.75 / 1', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                  <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${tintColor}18 0%, transparent 70%)` }}/>
                  <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} size={90}/>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center mt-2">Front (top) · Back (bottom)</p>
              </div>
            )}

            {/* Letterhead Mockup */}
            {activeView === 'letterhead' && (
              <div className="w-full max-w-lg">
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-4 uppercase tracking-wide">A4 Letterhead Preview</p>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[hsl(var(--border))]" style={{ aspectRatio: '0.707 / 1' }}>
                  {/* Header band */}
                  <div style={{ backgroundColor: tintColor }} className="px-8 py-5 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-base leading-tight">{companyName}</p>
                      {arabicName && <p className="text-white/70 text-sm mt-0.5" dir="rtl">{arabicName}</p>}
                      <p className="text-white/60 text-xs mt-1">{city}</p>
                    </div>
                    <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} size={70}/>
                  </div>

                  {/* Document body */}
                  <div className="px-8 py-6 space-y-4">
                    <div className="space-y-1">
                      <div className="h-2 w-32 rounded bg-gray-200"/>
                      <div className="h-1.5 w-48 rounded bg-gray-150"/>
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

                    {/* Signature area */}
                    <div className="mt-8 flex items-end justify-between">
                      <div>
                        <div className="h-px w-24 bg-gray-400"/>
                        <div className="h-1.5 w-20 rounded bg-gray-200 mt-1"/>
                      </div>
                      <div className="opacity-60">
                        <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} size={60}/>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
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
                  {/* V-flap at top */}
                  <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
                    <div style={{ width: 0, height: 0, borderLeft: '50vw solid transparent', borderRight: '50vw solid transparent', borderTop: '80px solid rgba(200,185,160,0.5)' }}/>
                  </div>

                  {/* Return address (top-left) */}
                  <div className="absolute top-5 left-7 space-y-0.5">
                    <p className="text-gray-700 font-bold text-xs">{companyName}</p>
                    <p className="text-gray-500 text-[10px]">{city}</p>
                  </div>

                  {/* Stamp seal (top-right corner — postage area) */}
                  <div className="absolute top-5 right-7 opacity-90">
                    <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} size={72}/>
                  </div>

                  {/* Recipient address (center) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-0.5">
                      <div className="h-2 w-36 rounded bg-gray-300 mx-auto"/>
                      <div className="h-1.5 w-28 rounded bg-gray-250 mx-auto"/>
                      <div className="h-1.5 w-24 rounded bg-gray-200 mx-auto"/>
                    </div>
                  </div>

                  {/* Wax-seal center-bottom */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-70">
                    <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} size={56}/>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
