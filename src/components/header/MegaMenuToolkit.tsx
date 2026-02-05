import React from 'react';
import { 
  Video, Image, FileText, Mic, Wand2, Scissors, Sparkles, 
  ImageIcon, Languages, Film, Palette, Play
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
} from '@/components/header/mega-menu-primitives';

interface MegaMenuToolkitProps {
  onClose: () => void;
}

const MegaMenuToolkit = React.forwardRef<HTMLDivElement, MegaMenuToolkitProps>(({ onClose }, ref) => {
  // Column 1: Video & Audio
  const videoAudioLinks = [
    { label: 'AI Video Studio', href: '/toolkit/ai-video-studio', icon: Play, flagship: true },
    { label: 'Video Resize Pack', href: '/toolkit/video-resize-pack', icon: Film },
    { label: 'Voice Studio', href: '/toolkit/voice-studio', icon: Mic },
    { label: 'Captions & Translate', href: '/toolkit/captions-translate', icon: Languages },
  ];

  // Column 2: Images & PDF
  const imagesPdfLinks = [
    { label: 'Image Resizer', href: '/toolkit/image-resize', icon: ImageIcon },
    { label: 'Photo to PDF', href: '/toolkit/pdf-from-photos', icon: FileText },
    { label: 'Smart Reframe', href: '/toolkit/smart-reframe', icon: Scissors },
  ];

  // Column 3: AI Tools
  const aiToolsLinks = [
    { label: 'Background AI', href: '/toolkit/background-ai', icon: Wand2 },
    { label: 'Beauty Filters', href: '/toolkit/beauty-filters', icon: Palette },
  ];

  // Column 4: Toolkit Hub CTA
  const hubLink = { label: 'Toolkit Hub', href: '/toolkit', icon: Sparkles };

  return (
    <MegaMenuShell ref={ref} noScroll>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4 lg:py-5">
        {/* 4 Equal Columns - Tool Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: Video & Audio */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Video} title="Video & Audio" />
            <div className="space-y-0">
              {videoAudioLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
            </div>
            {/* Vertical divider */}
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 2: Images & PDF */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Image} title="Images & PDF" />
            <div className="space-y-0">
              {imagesPdfLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
            </div>
            {/* Vertical divider */}
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 3: AI Tools */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Wand2} title="AI Tools" />
            <div className="space-y-0">
              {aiToolsLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
            </div>
            {/* Vertical divider */}
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 4: Toolkit Hub CTA */}
          <div>
            <MegaMenuSectionTitle icon={Sparkles} title="Explore All Tools" />
            <div className="space-y-0">
              <MegaMenuIconLink
                to={hubLink.href}
                onClick={onClose}
                icon={hubLink.icon}
                title="View All Toolkit Tools"
                emphasis
              />
              <div className="mt-4 p-4 bg-gradient-to-br from-zinc-900 via-black to-zinc-800 rounded-xl border border-gold/40">
                <p className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                  FREE TOOLS
                </p>
                <p className="text-white text-sm font-semibold mb-1">
                  JBJ RealEstate Toolkit™
                </p>
                <p className="text-white/70 text-xs">
                  9 professional tools for video, image, and PDF manipulation — completely free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuToolkit.displayName = 'MegaMenuToolkit';

export default MegaMenuToolkit;
