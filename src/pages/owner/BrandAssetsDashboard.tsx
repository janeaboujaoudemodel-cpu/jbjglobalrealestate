/**
 * BrandAssetsDashboard — Full-page dashboard showing all saved brand assets
 * grouped by type with actions: Use in Tool, Duplicate, Delete.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import {
  Loader2, Trash2, Copy, Package, Stamp, Image, FileSignature,
  Mail, FileText, CreditCard, ExternalLink, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StampSVGRenderer } from "@/components/stamp-generator/StampSVGRenderer";

type AssetSource = "design_assets" | "brand_assets";

interface UnifiedAsset {
  id: string;
  name: string;
  asset_type: string;
  file_url: string | null;
  svg_content: string | null;
  thumbnail_url: string | null;
  created_at: string;
  source: AssetSource;
}

const ASSET_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; toolPath?: string }> = {
  stamp: { label: "Stamps", icon: Stamp, toolPath: "/toolkit/stamp-generator" },
  logo: { label: "Logos", icon: Image, toolPath: "/toolkit/corporate-suite/logo-creator" },
  business_card: { label: "Business Cards", icon: CreditCard, toolPath: "/toolkit/corporate-suite/business-card" },
  signature: { label: "Signatures", icon: FileSignature },
  letterhead: { label: "Letterheads", icon: FileText },
  email_signature: { label: "Email Signatures", icon: Mail },
  monogram: { label: "Monograms", icon: Package },
};

export default function BrandAssetsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<UnifiedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>("all");

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [designRes, brandRes] = await Promise.all([
        supabase.from("design_assets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("brand_assets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const designAssets: UnifiedAsset[] = (designRes.data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        asset_type: d.asset_type,
        file_url: d.file_url,
        svg_content: null,
        thumbnail_url: d.thumbnail_url,
        created_at: d.created_at,
        source: "design_assets" as AssetSource,
      }));

      const brandAssets: UnifiedAsset[] = (brandRes.data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        asset_type: b.asset_type,
        file_url: null,
        svg_content: b.svg_content,
        thumbnail_url: b.thumbnail_url,
        created_at: b.created_at,
        source: "brand_assets" as AssetSource,
      }));

      // Dedupe by name + type (prefer design_assets if both exist)
      const seen = new Set<string>();
      const merged: UnifiedAsset[] = [];
      for (const a of [...designAssets, ...brandAssets]) {
        const key = `${a.asset_type}:${a.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(a);
        }
      }
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAssets(merged);
    } catch (err) {
      console.error("Failed to load brand assets:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDuplicate = async (asset: UnifiedAsset) => {
    if (!user) return;
    const newName = `Copy of ${asset.name}`;
    try {
      if (asset.source === "brand_assets") {
        await supabase.from("brand_assets").insert({
          user_id: user.id,
          asset_type: asset.asset_type as any,
          name: newName,
          svg_content: asset.svg_content,
          thumbnail_url: asset.thumbnail_url,
          metadata: {},
        });
      } else {
        await supabase.from("design_assets").insert({
          user_id: user.id,
          asset_type: asset.asset_type,
          name: newName,
          file_url: asset.file_url || "",
          thumbnail_url: asset.thumbnail_url,
        });
      }
      toast.success(`Duplicated as "${newName}"`);
      fetchAll();
    } catch {
      toast.error("Failed to duplicate");
    }
  };

  const handleDelete = async (asset: UnifiedAsset) => {
    if (!user) return;
    try {
      await supabase.from(asset.source).delete().eq("id", asset.id);
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      toast.success("Asset deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const types = [...new Set(assets.map(a => a.asset_type))];
  const filtered = activeType === "all" ? assets : assets.filter(a => a.asset_type === activeType);

  const getPreview = (asset: UnifiedAsset) => {
    if (asset.svg_content) {
      return <StampSVGRenderer svgSource={asset.svg_content} tintColor="#1B3A8C" size={80} />;
    }
    if (asset.file_url || asset.thumbnail_url) {
      return <img src={asset.file_url || asset.thumbnail_url || ""} alt={asset.name} className="max-h-[80px] object-contain"  loading="lazy" decoding="async" />;
    }
    return <Package size={28} className="text-[hsl(var(--muted-foreground))] opacity-30" />;
  };

  return (
    <>
      <SEOHead title="Brand Assets | Owner Dashboard" description="Manage all your brand assets in one place." canonicalPath="/owner/brand-assets" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Brand Assets Library</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              All your stamps, logos, signatures, and branding materials in one place.
            </p>
          </div>
          <Button
            onClick={() => navigate("/toolkit/stamp-generator")}
            className="gap-2 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white"
          >
            <Plus size={14} /> Create New
          </Button>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveType("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeType === "all"
                ? "bg-[hsl(var(--gold))] text-white"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--gold)/0.1)]"
            }`}
          >
            All ({assets.length})
          </button>
          {types.map(t => {
            const cfg = ASSET_TYPE_CONFIG[t];
            const count = assets.filter(a => a.asset_type === t).length;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeType === t
                    ? "bg-[hsl(var(--gold))] text-white"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--gold)/0.1)]"
                }`}
              >
                {cfg?.label || t} ({count})
              </button>
            );
          })}
        </div>

        {/* Assets grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[hsl(var(--gold))]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Package size={40} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No brand assets saved yet</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Save designs from the Stamp Generator, Logo Creator, or other tools
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(asset => {
              const cfg = ASSET_TYPE_CONFIG[asset.asset_type];
              const Icon = cfg?.icon || Package;
              return (
                <div
                  key={`${asset.source}-${asset.id}`}
                  className="group bg-[hsl(var(--card))] rounded-xl border-2 border-[hsl(var(--gold)/0.15)] hover:border-[hsl(var(--gold)/0.4)] transition-all shadow-sm hover:shadow-md"
                >
                  <div className="p-3 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-xl min-h-[100px]">
                    {getPreview(asset)}
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">{asset.name}</p>
                    <div className="flex items-center gap-1">
                      <Icon size={10} className="text-[hsl(var(--muted-foreground))]" />
                      <p className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase">
                        {cfg?.label || asset.asset_type}
                      </p>
                    </div>
                    <div className="flex gap-1 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-6 text-[9px] gap-0.5"
                        onClick={() => handleDuplicate(asset)}
                      >
                        <Copy size={8} /> Duplicate
                      </Button>
                      {cfg?.toolPath && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-1.5"
                          onClick={() => navigate(cfg.toolPath!)}
                        >
                          <ExternalLink size={8} />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(asset)}
                      >
                        <Trash2 size={8} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
