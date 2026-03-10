import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

const DEFAULT_PALETTE: BrandPalette = {
  primary: '#C8A766',
  secondary: '#000000',
  accent: '#D4AF37',
  background: '#FDFBF7',
  text: '#1A1A1A',
};

interface BrandPaletteContextType {
  palette: BrandPalette;
  previewPalette: BrandPalette | null;
  isOwner: boolean;
  isLoading: boolean;
  setPalettePreview: (palette: BrandPalette) => void;
  clearPreview: () => void;
  savePalette: (palette: BrandPalette) => Promise<void>;
  activePalette: BrandPalette; // previewPalette ?? palette
}

const BrandPaletteContext = createContext<BrandPaletteContextType | null>(null);

export const useBrandPalette = () => {
  const ctx = useContext(BrandPaletteContext);
  if (!ctx) throw new Error('useBrandPalette must be inside BrandPaletteProvider');
  return ctx;
};

// Convert hex to HSL string for CSS variables
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyPaletteToDOM(p: BrandPalette) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', hexToHsl(p.primary));
  root.style.setProperty('--brand-secondary', hexToHsl(p.secondary));
  root.style.setProperty('--brand-accent', hexToHsl(p.accent));
  root.style.setProperty('--brand-background', hexToHsl(p.background));
  root.style.setProperty('--brand-text', hexToHsl(p.text));
  // Also set raw hex values for tools
  root.style.setProperty('--brand-primary-hex', p.primary);
  root.style.setProperty('--brand-secondary-hex', p.secondary);
  root.style.setProperty('--brand-accent-hex', p.accent);
  root.style.setProperty('--brand-background-hex', p.background);
  root.style.setProperty('--brand-text-hex', p.text);
}

export const BrandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isOwner } = useAuth();
  const [palette, setPalette] = useState<BrandPalette>(DEFAULT_PALETTE);
  const [previewPalette, setPreviewPalette] = useState<BrandPalette | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load owner's saved brand palette
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'brand_palette')
          .maybeSingle();
        if (data?.value) {
          const parsed = JSON.parse(data.value) as BrandPalette;
          setPalette(parsed);
          applyPaletteToDOM(parsed);
        }
      } catch (e) {
        console.error('Failed to load brand palette:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setPalettePreview = useCallback((p: BrandPalette) => {
    setPreviewPalette(p);
    applyPaletteToDOM(p);
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewPalette(null);
    applyPaletteToDOM(palette);
  }, [palette]);

  const savePalette = useCallback(async (p: BrandPalette) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'brand_palette', value: JSON.stringify(p), description: 'Owner brand color palette' }, { onConflict: 'key' });
    if (error) throw error;
    setPalette(p);
    setPreviewPalette(null);
    applyPaletteToDOM(p);
  }, []);

  const activePalette = previewPalette ?? palette;

  return (
    <BrandPaletteContext.Provider value={{
      palette,
      previewPalette,
      isOwner: !!isOwner,
      isLoading,
      setPalettePreview,
      clearPreview,
      savePalette,
      activePalette,
    }}>
      {children}
    </BrandPaletteContext.Provider>
  );
};
