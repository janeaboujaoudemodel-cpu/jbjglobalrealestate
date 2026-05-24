import React, { useState } from "react";
import { Check, Palette, Globe, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LandingTemplate {
  id: string;
  name: string;
  description: string;
  colors: { primary: string; secondary: string; accent: string; bg: string; text: string };
  font: string;
  layout: 'centered' | 'left-aligned' | 'split' | 'card-grid';
}

const TEMPLATES: LandingTemplate[] = [
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    description: 'Clean black background with gold accents',
    colors: { primary: '#B89555', secondary: '#1a1a1a', accent: '#E0CFA0', bg: '#0a0a0a', text: '#ffffff' },
    font: 'Inter',
    layout: 'centered',
  },
  {
    id: 'corporate-gold',
    name: 'Corporate Gold',
    description: 'Professional gold & navy for enterprise',
    colors: { primary: '#B8860B', secondary: '#1B2A4A', accent: '#DAA520', bg: '#0F1B2D', text: '#F5F5F5' },
    font: 'Playfair Display',
    layout: 'centered',
  },
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: 'Bold gradient backgrounds with modern feel',
    colors: { primary: '#6366f1', secondary: '#a855f7', accent: '#ec4899', bg: '#0f0f23', text: '#ffffff' },
    font: 'DM Sans',
    layout: 'split',
  },
  {
    id: 'photo-first',
    name: 'Photo-First',
    description: 'Hero image focus with overlay text',
    colors: { primary: '#ffffff', secondary: '#000000', accent: '#B89555', bg: '#111111', text: '#ffffff' },
    font: 'Montserrat',
    layout: 'centered',
  },
  {
    id: 'social-hub',
    name: 'Social Hub',
    description: 'Social links prominent, modern card layout',
    colors: { primary: '#059669', secondary: '#1e293b', accent: '#34d399', bg: '#0f172a', text: '#e2e8f0' },
    font: 'Nunito',
    layout: 'card-grid',
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Editorial style with serif typography',
    colors: { primary: '#1a1a1a', secondary: '#f5f0eb', accent: '#8A7356', bg: '#faf8f5', text: '#1a1a1a' },
    font: 'Cormorant Garamond',
    layout: 'left-aligned',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Project showcase grid with minimal chrome',
    colors: { primary: '#e11d48', secondary: '#18181b', accent: '#f43f5e', bg: '#09090b', text: '#fafafa' },
    font: 'Josefin Sans',
    layout: 'card-grid',
  },
  {
    id: 'luxury-white',
    name: 'Luxury White',
    description: 'Clean white with champagne gold details',
    colors: { primary: '#B89555', secondary: '#f8f6f3', accent: '#A8925A', bg: '#ffffff', text: '#1a1a1a' },
    font: 'Cinzel',
    layout: 'centered',
  },
];

interface Props {
  onSelectTemplate: (template: LandingTemplate) => void;
  selectedId?: string;
}

export default function DigitalLandingPageTemplates({ onSelectTemplate, selectedId }: Props) {
  const [websiteUrl, setWebsiteUrl] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--muted-foreground))]">
        Choose a Template
      </p>

      {/* Template Grid */}
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTemplate(t)}
            className={`relative rounded-xl p-3 text-left transition-all border-2 ${
              selectedId === t.id
                ? 'border-[hsl(var(--primary))] shadow-md scale-[1.02]'
                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 hover:scale-[1.01]'
            }`}
          >
            {/* Color Preview Bar */}
            <div className="flex gap-1 mb-2">
              {[t.colors.primary, t.colors.secondary, t.colors.accent, t.colors.bg].map((c, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-[hsl(var(--border))]"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <p className="text-[11px] font-semibold text-[hsl(var(--foreground))] leading-tight">{t.name}</p>
            <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-tight">{t.description}</p>
            {selectedId === t.id && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[hsl(var(--primary-foreground))]" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Color Matching */}
      <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
        <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--muted-foreground))]">
          Match Colors From
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Website URL or Instagram"
              className="h-8 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={!websiteUrl}>
            <Globe className="w-3 h-3" /> Match
          </Button>
        </div>
        <Button variant="outline" size="sm" className="w-full h-8 gap-1 text-xs">
          <Upload className="w-3 h-3" /> Upload Photo to Extract Colors
        </Button>
      </div>
    </div>
  );
}

export { TEMPLATES };
