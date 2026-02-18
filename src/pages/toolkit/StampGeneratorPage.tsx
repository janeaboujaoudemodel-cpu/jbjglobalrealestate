import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Stamp, Wand2, Download, Shield, Globe, Layers,
  ArrowRight, Check, Lock, FileImage
} from 'lucide-react';

const FEATURES = [
  { icon: Wand2, title: 'AI-Curated Designs', desc: 'Get 7 unique stamp concepts tailored to your brand style, shape, and language preferences.' },
  { icon: Globe, title: 'Bilingual Support', desc: 'Full Arabic, English, or bilingual stamp layouts with proper RTL text handling.' },
  { icon: Layers, title: 'Multiple Shapes', desc: 'Round, oval, rectangle, square — with classic, modern, luxury, vintage and more themes.' },
  { icon: Download, title: 'Complete Export Pack', desc: 'Download SVG (vector), PNG (transparent), JPG, and PDF in multiple sizes and DPIs.' },
  { icon: Shield, title: 'Secure & Private', desc: 'All designs are private to your account. Government seals are blocked to prevent misuse.' },
  { icon: FileImage, title: 'Re-download Anytime', desc: 'Save multiple stamp projects and re-download your assets whenever needed.' },
];

const STEPS = [
  { n: '01', title: 'Enter Company Details', desc: 'Company name, registration number, city, language mode.' },
  { n: '02', title: 'Choose Your Style', desc: 'Pick shape, theme, border style, typography, and density.' },
  { n: '03', title: 'Generate Concepts', desc: 'AI generates 7 unique stamp designs for you to choose from.' },
  { n: '04', title: 'Download Your Pack', desc: 'Export SVG, PNG, JPG, PDF in multiple sizes — ready for print.' },
];

// Static placeholder stamps (rendered as CSS circles)
function MockStamp({ label, sub, variant }: { label: string; sub: string; variant: 'round' | 'rect' }) {
  return (
    <div className={`border-2 border-[hsl(var(--gold)/0.6)] flex flex-col items-center justify-center text-center p-2 ${
      variant === 'round' ? 'rounded-full w-28 h-28' : 'rounded-lg w-32 h-16'
    }`}>
      <p className="text-[hsl(var(--gold-dark))] font-bold text-xs leading-tight">{label}</p>
      <p className="text-[hsl(var(--gold))] text-[9px] mt-0.5 tracking-widest">{sub}</p>
    </div>
  );
}

export default function StampGeneratorLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleCTA() {
    if (user) navigate('/toolkit/stamp-generator/projects');
    else navigate('/auth?redirect=/toolkit/stamp-generator/projects');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--champagne-1))] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)] px-3 py-1">
            <Stamp size={12} className="mr-1.5"/> AI-Powered Tool
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-[hsl(var(--foreground))] leading-tight">
            AI Company Stamp Generator
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            Design professional company stamps in minutes. AI-curated concepts, multiple styles, bilingual support, and a complete export pack.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2 text-base px-8"
              onClick={handleCTA}
            >
              <Wand2 size={18}/> Create Your Stamp
              <ArrowRight size={16}/>
            </Button>
            {user && (
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => navigate('/toolkit/stamp-generator/projects')}
              >
                My Projects
              </Button>
            )}
          </div>

          {/* Mock stamp gallery */}
          <div className="flex flex-wrap gap-6 justify-center items-center mt-10 opacity-70">
            <MockStamp label="JBJ GLOBAL REAL ESTATE LLC" sub="OFFICIAL STAMP" variant="round"/>
            <MockStamp label="ALPHA CONSULTING GROUP" sub="DUBAI · UAE" variant="round"/>
            <MockStamp label="SUMMIT PROPERTIES" sub="OFFICIAL STAMP" variant="rect"/>
            <MockStamp label="NEXUS ADVISORY LLC" sub="SINCE 2010" variant="round"/>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(s => (
              <div key={s.n} className="space-y-3">
                <span className="text-3xl font-black text-[hsl(var(--gold)/0.3)]">{s.n}</span>
                <h3 className="font-semibold text-[hsl(var(--foreground))]">{s.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-[hsl(var(--pearl-1))]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] text-center mb-10">Everything You Need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gold)/0.1)] flex items-center justify-center">
                  <f.icon size={18} className="text-[hsl(var(--gold))]"/>
                </div>
                <h3 className="font-semibold text-[hsl(var(--foreground))] text-sm">{f.title}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] text-center mb-2">Export Pack Includes</h2>
          <p className="text-center text-[hsl(var(--muted-foreground))] text-sm mb-8">Every download includes all these formats — ready for print and digital use</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'stamp.svg (vector)',
              'stamp_512px.png (transparent)',
              'stamp_1024px.png',
              'stamp_2048px.png',
              'stamp_white.jpg',
              'stamp_print_300dpi.pdf',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-[hsl(var(--gold))] shrink-0"/>
                <span className="text-[hsl(var(--foreground))]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety notice */}
      <section className="py-10 px-6 bg-[hsl(var(--pearl-1))]">
        <div className="max-w-2xl mx-auto flex items-start gap-4">
          <Lock size={20} className="text-[hsl(var(--gold))] shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold text-[hsl(var(--foreground))] text-sm">Safety & Compliance Notice</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              This tool generates company stamps for internal and official business use only. Generation of government seals, ministry emblems, or official authority stamps is blocked and logged. All generated stamps are for the user's own company use only.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-[hsl(var(--gold)/0.1)] to-[hsl(var(--champagne-1))]">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Ready to create your stamp?</h2>
          <p className="text-[hsl(var(--muted-foreground))]">Takes less than 3 minutes. No design skills needed.</p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2 px-10"
            onClick={handleCTA}
          >
            <Wand2 size={16}/> Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
}
