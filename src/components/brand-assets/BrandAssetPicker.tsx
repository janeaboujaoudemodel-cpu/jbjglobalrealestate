import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import { toast } from 'sonner';
import { Loader2, Check, X, Package } from 'lucide-react';

type BrandAssetType = 'stamp' | 'logo' | 'business_card' | 'signature' | 'letterhead' | 'email_signature';

interface BrandAsset {
  id: string;
  asset_type: BrandAssetType;
  name: string;
  svg_content: string | null;
  thumbnail_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ASSET_TYPE_LABELS: Record<BrandAssetType, string> = {
  stamp: 'Stamps',
  logo: 'Logos',
  business_card: 'Business Cards',
  signature: 'Signatures',
  letterhead: 'Letterheads',
  email_signature: 'Email Signatures',
};

interface BrandAssetPickerProps {
  filterType?: BrandAssetType;
  onSelect: (asset: BrandAsset) => void;
  onClose: () => void;
}

export function BrandAssetPicker({ filterType, onSelect, onClose }: BrandAssetPickerProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<BrandAssetType | 'all'>(filterType || 'all');

  useEffect(() => {
    loadAssets();
  }, [user]);

  async function loadAssets() {
    if (!user) return;
    setLoading(true);
    let q = supabase.from('brand_assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (filterType) q = q.eq('asset_type', filterType);
    const { data, error } = await q;
    if (!error && data) setAssets(data as unknown as BrandAsset[]);
    setLoading(false);
  }

  const filtered = activeType === 'all' ? assets : assets.filter(a => a.asset_type === activeType);
  const types = [...new Set(assets.map(a => a.asset_type))];

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-[#1A1A1A]/50 backdrop-blur-sm">
      <div className="bg-[#FDFBF7] rounded-2xl shadow-2xl border border-[hsl(var(--border))] w-[90vw] max-w-[700px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--pearl-1))] to-white">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-[hsl(var(--gold))]" />
            <span className="font-semibold text-sm text-[hsl(var(--foreground))]">Brand Assets</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[hsl(var(--muted))] flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        {!filterType && types.length > 1 && (
          <div className="flex gap-1 px-5 pt-3 pb-1 flex-wrap">
            <button onClick={() => setActiveType('all')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${activeType === 'all' ? 'bg-[hsl(var(--gold))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--gold)/0.1)]'}`}>
              All
            </button>
            {types.map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${activeType === t ? 'bg-[hsl(var(--gold))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--gold)/0.1)]'}`}>
                {ASSET_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[hsl(var(--gold))]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Package size={32} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No brand assets saved yet</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Save designs as brand assets from the stamp generator or other tools</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filtered.map(asset => (
                <div key={asset.id}
                  className="group bg-card/80 rounded-xl border-2 border-[hsl(var(--gold)/0.2)] hover:border-[hsl(var(--gold)/0.5)] transition-all cursor-pointer"
                  onClick={() => onSelect(asset)}>
                  <div className="p-2 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-xl min-h-[90px]">
                    {asset.svg_content ? (
                      <StampSVGRenderer svgSource={asset.svg_content} tintColor="#1B3A8C" size={80} />
                    ) : asset.thumbnail_url ? (
                      <img src={asset.thumbnail_url} alt={asset.name} className="max-h-[80px] object-contain"  loading="lazy" decoding="async" />
                    ) : (
                      <Package size={24} className="text-[hsl(var(--muted-foreground))] opacity-30" />
                    )}
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <p className="text-[9px] font-medium text-[hsl(var(--foreground))] truncate">{asset.name}</p>
                    <p className="text-[7px] text-[hsl(var(--muted-foreground))] uppercase">{ASSET_TYPE_LABELS[asset.asset_type]}</p>
                    <Button size="sm"
                      className="w-full h-5 text-[8px] gap-0.5 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90"
                      onClick={(e) => { e.stopPropagation(); onSelect(asset); }}>
                      <Check size={7} /> Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for saving brand assets
export function useSaveBrandAsset() {
  const { user } = useAuth();

  return async (params: {
    assetType: BrandAssetType;
    name: string;
    svgContent?: string;
    thumbnailUrl?: string;
    metadata?: Record<string, unknown>;
    sourceId?: string;
  }) => {
    if (!user) { toast.error('Please log in'); return null; }
    const { data, error } = await supabase.from('brand_assets').insert({
      user_id: user.id,
      asset_type: params.assetType,
      name: params.name,
      svg_content: params.svgContent || null,
      thumbnail_url: params.thumbnailUrl || null,
      metadata: (params.metadata || {}) as any,
      source_id: params.sourceId || null,
    }).select('id').single();
    if (error) { toast.error('Failed to save brand asset'); return null; }

    // Dual-insert into design_assets for cross-tool visibility
    if (params.svgContent) {
      try {
        const svgBase64 = btoa(unescape(encodeURIComponent(params.svgContent)));
        const dataUri = `data:image/svg+xml;base64,${svgBase64}`;
        await supabase.from('design_assets').insert({
          user_id: user.id,
          asset_type: params.assetType === 'stamp' ? 'stamp' : params.assetType === 'logo' ? 'logo' : 'monogram',
          name: params.name,
          file_url: dataUri,
          thumbnail_url: params.thumbnailUrl || dataUri,
        });
      } catch (e) {
        console.warn('Dual-insert to design_assets failed (non-critical):', e);
      }
    }

    toast.success('Saved as brand asset');
    return data?.id;
  };
}
