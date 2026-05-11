import React from 'react';
import { 
  Video, Image, FileText, Mic, Home, Sparkles, Stamp,
  CreditCard, Palette, Award, Pen, Globe, Building2, Layers
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
} from '@/components/header/mega-menu-primitives';


interface MegaMenuToolkitProps {
  onClose: () => void;
}

const MegaMenuToolkit = React.forwardRef<HTMLDivElement, MegaMenuToolkitProps>(({ onClose }, ref) => {
  // Creative Suites - one line shortcut row
  const creativeSuites = [
    {
      icon: Building2,
      title: 'Corporate Suite',
      href: '/toolkit/corporate-suite',
      description: 'Stamps, cards, CV, logos & docs',
    },
    {
      icon: Home,
      title: 'Real Estate Suite',
      href: '/toolkit/property-suite',
      description: 'Valuations, analytics & finder',
    },
    {
      icon: Video,
      title: 'Video Suite',
      href: '/toolkit/video-suite',
      description: 'Edit, resize, captions & export',
      flagship: true,
    },
    {
      icon: Image,
      title: 'Photo Suite',
      href: '/toolkit/photo-suite',
      description: 'Background, beauty, resize & design',
    },
    {
      icon: Mic,
      title: 'Voice & Audio',
      href: '/toolkit/voice-suite',
      description: 'TTS, STT, cleanup & translate',
    },
    {
      icon: FileText,
      title: 'PDF & Documents',
      href: '/toolkit/pdf-suite',
      description: 'Edit, convert, scan & sign',
    },
  ];

  // AI Corporate Tools - next to stamp generator
  const corporateTools = [
    {
      icon: Stamp,
      title: 'Stamp Generator',
      href: '/toolkit/stamp-generator',
      description: 'Professional seals · bilingual · SVG/PNG/PDF',
      isNew: true,
    },
    {
      icon: CreditCard,
      title: 'Business Card',
      href: '/toolkit/corporate-suite/business-card',
      description: 'Digital & print cards · 7 shapes',
      isNew: true,
    },
    {
      icon: Palette,
      title: 'Logo Maker',
      href: '/toolkit/corporate-suite/logo',
      description: 'AI logo generation & branding',
      isNew: true,
    },
    {
      icon: FileText,
      title: 'Resume / CV',
      href: '/toolkit/corporate-suite/cv-builder',
      description: '12 templates · AI summary',
      isNew: true,
    },
    {
      icon: Pen,
      title: 'Cover Letter',
      href: '/toolkit/corporate-suite/cover-letter',
      description: 'AI-crafted · branded export',
      isNew: true,
    },
    {
      icon: Award,
      title: 'Company Profile',
      href: '/toolkit/corporate-suite/company-profile',
      description: 'Multi-page A4 · smart scan',
    },
    {
      icon: Globe,
      title: 'JBJ E-Sign',
      href: '/owner/documents-forms?tab=sign',
      description: 'Contract signing · audit trail',
    },
    {
      icon: FileText,
      title: 'Scan & Sign',
      href: '/toolkit/scan-sign',
      description: 'Camera scan · PDF export',
    },
  ];

  return (
    <MegaMenuShell ref={ref} noScroll>
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
            <h3 className="text-lg font-semibold text-white">JBJ Royal Tools Hub</h3>
          </div>
          <a 
            href="/ai-hub" 
            onClick={onClose}
            className="text-sm text-[#1A1A1A] hover:underline"
          >
            View All Tools →
          </a>
        </div>

        {/* Creative Suites Row - all 6 in one line */}
        <div className="mb-1">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-bold text-[#1A1A1A] tracking-[0.18em] uppercase">Creative Suites</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {creativeSuites.map((suite) => (
              <MegaMenuIconLink
                key={suite.href}
                to={suite.href}
                onClick={onClose}
                icon={suite.icon}
                title={suite.title}
                description={suite.description}
                emphasis={suite.flagship}
              />
            ))}
          </div>
        </div>

        {/* AI Corporate Tools Row */}
        <div className="mt-3 border-t border-[#B89555]/30 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Stamp className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-bold text-[#1A1A1A] tracking-[0.18em] uppercase">AI Corporate Tools</span>
            <span className="text-[10px] bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/30 rounded-full px-2 py-0.5 font-semibold">5 NEW</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {corporateTools.map((tool) => (
              <MegaMenuIconLink
                key={tool.href}
                to={tool.href}
                onClick={onClose}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-4 p-4 bg-gradient-to-br from-zinc-900 via-black to-zinc-800 rounded-xl border border-[#B89555]/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[#1A1A1A] text-[10px] font-bold tracking-[0.2em] uppercase">
                FREE PROFESSIONAL TOOLS
              </p>
              <p className="text-white text-sm font-semibold mt-1">
                6 suites + Stamp · Business Card · Logo · CV · Cover Letter · E-Sign — all free
              </p>
            </div>
            <a 
              href="/ai-hub"
              onClick={onClose}
              className="px-4 py-2 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              Explore All
            </a>
          </div>
        </div>

      </div>
    </MegaMenuShell>
  );
});

MegaMenuToolkit.displayName = 'MegaMenuToolkit';

export default MegaMenuToolkit;
