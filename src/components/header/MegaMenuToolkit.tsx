import React from 'react';
import { 
  Video, Image, FileText, Mic, Home, Sparkles, Stamp
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
} from '@/components/header/mega-menu-primitives';


interface MegaMenuToolkitProps {
  onClose: () => void;
}

const MegaMenuToolkit = React.forwardRef<HTMLDivElement, MegaMenuToolkitProps>(({ onClose }, ref) => {
  // Master Suites - grouped by output type
  const suites = [
    {
      icon: Video,
      title: 'Video Suite',
      href: '/toolkit/video-suite',
      description: 'Edit, resize, captions & export',
      flagship: true,
    },
    {
      icon: Mic,
      title: 'Voice & Audio Suite',
      href: '/toolkit/voice-suite',
      description: 'TTS, STT, cleanup & translate',
    },
    {
      icon: Image,
      title: 'Photo & Image Suite',
      href: '/toolkit/photo-suite',
      description: 'Background, beauty, resize & design',
    },
    {
      icon: FileText,
      title: 'PDF & Documents Suite',
      href: '/toolkit/pdf-suite',
      description: 'Edit, convert, scan & sign',
    },
    {
      icon: Home,
      title: 'Property Intelligence',
      href: '/toolkit/property-suite',
      description: 'Home finder, valuations & analytics',
    },
  ];

  // New standalone tools
  const standaloneTools = [
    {
      icon: Sparkles,
      title: 'AI Stamp Generator',
      href: '/toolkit/stamp-generator',
      description: 'AI company seals · bilingual · SVG/PNG/PDF',
      isNew: true,
    },
    {
      icon: FileText,
      title: 'JBJ E-Sign',
      href: '/e-signature',
      description: 'Contract signing · multi-signer · audit trail',
      isNew: true,
    },
    {
      icon: FileText,
      title: 'Scan & Sign',
      href: '/toolkit/scan-sign',
      description: 'Camera scan · signature · PDF export',
    },
  ];

  return (
    <MegaMenuShell ref={ref} noScroll>
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-semibold text-white">JBJ Royal Tools Hub</h3>
          </div>
          <a 
            href="/toolkit" 
            onClick={onClose}
            className="text-sm text-gold hover:underline"
          >
            View All Tools →
          </a>
        </div>

        {/* 5 Suite Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {suites.map((suite) => (
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

        {/* New AI Tools Row */}
        <div className="mt-3 border-t border-gold/20 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Stamp className="w-4 h-4 text-gold" />
            <span className="text-xs font-bold text-gold tracking-[0.18em] uppercase">New AI Tools</span>
            <span className="text-[10px] bg-gold/20 text-gold border border-gold/30 rounded-full px-2 py-0.5 font-semibold">3 NEW</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {standaloneTools.map((tool) => (
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
        <div className="mt-4 p-4 bg-gradient-to-br from-zinc-900 via-black to-zinc-800 rounded-xl border border-gold/40">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase">
                FREE PROFESSIONAL TOOLS
              </p>
              <p className="text-white text-sm font-semibold mt-1">
                5 suites + AI Stamp Generator + E-Sign + Scan & Sign — all free
              </p>
            </div>
            <a 
              href="/toolkit"
              onClick={onClose}
              className="px-4 py-2 bg-gold text-black text-sm font-semibold rounded-lg hover:bg-gold/90 transition-colors"
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
