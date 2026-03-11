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

export interface SavedPalette {
  id: string;
  name: string;
  palette: BrandPalette;
  is_active: boolean;
  created_at: string;
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
  activePalette: BrandPalette;
  // Per-user palette features
  savedPalettes: SavedPalette[];
  saveUserPalette: (name: string, palette: BrandPalette, setActive?: boolean) => Promise<void>;
  deleteUserPalette: (id: string) => Promise<void>;
  activateUserPalette: (id: string) => Promise<void>;
  revertToDefault: () => void;
  loadUserPalettes: () => Promise<void>;
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
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);

  // Load owner's saved brand palette (global)
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
          // Only apply global palette if no user-specific palette
          if (!user || isOwner) {
            applyPaletteToDOM(parsed);
          }
        } else {
          applyPaletteToDOM(DEFAULT_PALETTE);
        }
      } catch (e) {
        console.error('Failed to load brand palette:', e);
        applyPaletteToDOM(DEFAULT_PALETTE);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Load user-specific active palette for non-owners
  useEffect(() => {
    if (!user || isOwner) return;
    const loadUserPalette = async () => {
      try {
        const { data } = await supabase
          .from('user_color_palettes')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        if (data?.palette) {
          const p = data.palette as unknown as BrandPalette;
          applyPaletteToDOM(p);
        }
      } catch (e) {
        console.error('Failed to load user palette:', e);
      }
    };
    loadUserPalette();
  }, [user, isOwner]);

  const loadUserPalettes = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_color_palettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        setSavedPalettes(data.map(d => ({
          id: d.id,
          name: d.name,
          palette: d.palette as unknown as BrandPalette,
          is_active: d.is_active ?? false,
          created_at: d.created_at ?? '',
        })));
      }
    } catch (e) {
      console.error('Failed to load user palettes:', e);
    }
  }, [user]);

  // Auto-load user palettes
  useEffect(() => {
    if (user) loadUserPalettes();
  }, [user, loadUserPalettes]);

  const setPalettePreview = useCallback((p: BrandPalette) => {
    setPreviewPalette(p);
    applyPaletteToDOM(p);
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewPalette(null);
    applyPaletteToDOM(palette);
  }, [palette]);

  // Owner saves global palette
  const savePalette = useCallback(async (p: BrandPalette) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'brand_palette', value: JSON.stringify(p), description: 'Owner brand color palette' }, { onConflict: 'key' });
    if (error) throw error;
    setPalette(p);
    setPreviewPalette(null);
    applyPaletteToDOM(p);
  }, []);

  // User saves a personal palette
  const saveUserPalette = useCallback(async (name: string, p: BrandPalette, setActive = true) => {
    if (!user) return;
    // Deactivate all other palettes if setting active
    if (setActive) {
      await supabase
        .from('user_color_palettes')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);
    }
    const { error } = await supabase
      .from('user_color_palettes')
      .insert({
        user_id: user.id,
        name,
        palette: p as unknown as Record<string, unknown>,
        is_active: setActive,
      });
    if (error) throw error;
    if (setActive) applyPaletteToDOM(p);
    await loadUserPalettes();
  }, [user, loadUserPalettes]);

  const deleteUserPalette = useCallback(async (id: string) => {
    await supabase.from('user_color_palettes').delete().eq('id', id);
    await loadUserPalettes();
  }, [loadUserPalettes]);

  const activateUserPalette = useCallback(async (id: string) => {
    if (!user) return;
    // Deactivate all
    await supabase
      .from('user_color_palettes')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);
    // Activate selected
    await supabase
      .from('user_color_palettes')
      .update({ is_active: true })
      .eq('id', id);
    const found = savedPalettes.find(sp => sp.id === id);
    if (found) applyPaletteToDOM(found.palette);
    await loadUserPalettes();
  }, [user, savedPalettes, loadUserPalettes]);

  const revertToDefault = useCallback(() => {
    setPreviewPalette(null);
    applyPaletteToDOM(palette);
    // Also deactivate user's active palette
    if (user && !isOwner) {
      supabase
        .from('user_color_palettes')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)
        .then(() => loadUserPalettes());
    }
  }, [palette, user, isOwner, loadUserPalettes]);

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
      savedPalettes,
      saveUserPalette,
      deleteUserPalette,
      activateUserPalette,
      revertToDefault,
      loadUserPalettes,
    }}>
      {children}
    </BrandPaletteContext.Provider>
  );
};
