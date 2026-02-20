/**
 * BrandAssetLibrary — Shared panel for uploading, saving, and applying
 * monograms/logos/signatures across all Corporate Suite tools.
 * 
 * Uses the `design_assets` table + `brand-assets` storage bucket.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Trash2, Check, ImageIcon, Loader2, Plus, Eraser, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AssetType = "monogram" | "logo" | "signature" | "stamp";

export interface BrandAsset {
  id: string;
  name: string;
  asset_type: AssetType;
  file_url: string;
  thumbnail_url?: string | null;
  created_at: string;
}

interface BrandAssetLibraryProps {
  /** Which asset types to show / allow uploading */
  assetTypes?: AssetType[];
  /** Currently selected asset URL */
  selectedUrl?: string;
  /** Called when user clicks "Use" on an asset */
  onSelect: (asset: BrandAsset) => void;
  /** Show size slider below selected asset */
  showSizeControl?: boolean;
  /** Size value 50–200 (%) or px depending on tool */
  sizeValue?: number;
  onSizeChange?: (size: number) => void;
  sizeLabel?: string;
  sizeMin?: number;
  sizeMax?: number;
}

export function BrandAssetLibrary({
  assetTypes = ["monogram", "logo", "signature", "stamp"],
  selectedUrl,
  onSelect,
  showSizeControl = true,
  sizeValue = 100,
  onSizeChange,
  sizeLabel = "Logo Size",
  sizeMin = 50,
  sizeMax = 200,
}: BrandAssetLibraryProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [activeType, setActiveType] = useState<AssetType>(assetTypes[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Signature pad refs & state ──────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigContainerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [savingDrawing, setSavingDrawing] = useState(false);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("design_assets")
        .select("*")
        .eq("user_id", user.id)
        .in("asset_type", assetTypes)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets((data || []) as BrandAsset[]);
    } catch (err) {
      console.error("Failed to load assets:", err);
    } finally {
      setLoading(false);
    }
  }, [user, assetTypes]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // ── Canvas init (only when signature tab is active) ─────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = sigContainerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 130 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `130px`;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (activeType !== "signature") return;
    // Small delay to ensure the container has rendered
    const timer = setTimeout(initCanvas, 50);
    return () => clearTimeout(timer);
  }, [activeType, initCanvas]);

  // ── Canvas drawing helpers ──────────────────────────────────────────────────
  const getXY = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    isDrawingRef.current = true;
    const { x, y } = getXY(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getXY(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawing(true);
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  // ── Save drawn signature to library ────────────────────────────────────────
  const saveDrawnSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing || !user) return;
    setSavingDrawing(true);

    canvas.toBlob(async (blob) => {
      if (!blob) { setSavingDrawing(false); return; }
      try {
        const name = `Signature — ${new Date().toLocaleDateString("en-GB")}`;
        const path = `${user.id}/signature/${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(path, blob, { contentType: "image/png", upsert: false });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);

        const { data: inserted, error: dbError } = await supabase
          .from("design_assets")
          .insert({
            user_id: user.id,
            name,
            asset_type: "signature",
            file_url: urlData.publicUrl,
            thumbnail_url: urlData.publicUrl,
          })
          .select()
          .single();
        if (dbError) throw dbError;

        setAssets(prev => [inserted as BrandAsset, ...prev]);
        if (inserted) onSelect(inserted as BrandAsset);
        clearCanvas();
        toast.success("Signature saved to Brand Library!");
      } catch (err: any) {
        toast.error(err?.message || "Failed to save signature");
      } finally {
        setSavingDrawing(false);
      }
    }, "image/png");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const name = assetName || file.name.replace(/\.[^.]+$/, "");
    setUploading(true);
    try {
      // Upload to brand-assets bucket
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${activeType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      // Save to design_assets table
      const { data: inserted, error: dbError } = await supabase
        .from("design_assets")
        .insert({
          user_id: user.id,
          name,
          asset_type: activeType,
          file_url: fileUrl,
          thumbnail_url: fileUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setAssets(prev => [inserted as BrandAsset, ...prev]);
      setAssetName("");
      toast.success(`${name} saved to Brand Library!`);

      // Auto-select the newly uploaded asset
      if (inserted) onSelect(inserted as BrandAsset);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (asset: BrandAsset) => {
    if (!user) return;
    try {
      // Only attempt storage removal for real https URLs (not data: URIs)
      if (asset.file_url.startsWith("http")) {
        try {
          const url = new URL(asset.file_url);
          const pathParts = url.pathname.split("/brand-assets/");
          if (pathParts[1]) {
            await supabase.storage.from("brand-assets").remove([pathParts[1]]);
          }
        } catch {
          // ignore storage errors — still delete DB row
        }
      }
      await supabase.from("design_assets").delete().eq("id", asset.id);
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      toast.success("Asset deleted");
    } catch (err) {
      toast.error("Failed to delete asset");
    }
  };

  const filteredAssets = assets.filter(a => a.asset_type === activeType);

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      {assetTypes.length > 1 && (
        <div className="flex gap-1 bg-[hsl(var(--muted))] rounded-lg p-1">
          {assetTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 py-1 rounded-md text-[10px] font-semibold capitalize transition-all ${
                activeType === type
                  ? "bg-white shadow-sm text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Signature draw pad — only shown on signature tab */}
      {activeType === "signature" && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Draw your signature
          </p>
          <div
            ref={sigContainerRef}
            className="border-2 border-dashed border-[hsl(var(--gold)/0.4)] rounded-xl bg-white overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none block"
              style={{ height: "130px" }}
              onMouseDown={startDraw}
              onMouseMove={onDraw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={onDraw}
              onTouchEnd={stopDraw}
            />
            <div className="border-t border-[hsl(var(--border))] py-1.5 text-center text-[10px] text-[hsl(var(--muted-foreground))]">
              Sign above this line
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={!hasDrawing}
              className="flex-1 h-7 text-[10px] gap-1"
            >
              <Eraser size={11} /> Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveDrawnSignature}
              disabled={!hasDrawing || savingDrawing}
              className="flex-1 h-7 text-[10px] gap-1 bg-[hsl(var(--gold))] text-white hover:bg-[hsl(var(--gold-dark))]"
            >
              {savingDrawing ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              {savingDrawing ? "Saving…" : "Save to Library"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">or upload an image</span>
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
          </div>
        </div>
      )}

      {/* Upload controls */}
      <div className="space-y-2">
        <Input
          value={assetName}
          onChange={e => setAssetName(e.target.value)}
          placeholder={activeType === "signature" ? "Name this signature…" : `Name this ${activeType}…`}
          className="h-7 text-xs"
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 gap-2 text-xs border-dashed border-[hsl(var(--gold)/0.5)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.05)]"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Upload size={12} />
          )}
          {uploading ? "Uploading…" : `Upload ${activeType}`}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Assets grid */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={18} className="animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
          <ImageIcon size={24} className="text-[hsl(var(--muted-foreground))]" />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            No {activeType}s saved yet.<br />Upload one above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredAssets.map(asset => {
            const isSelected = selectedUrl === asset.file_url;
            return (
              <div
                key={asset.id}
                className={`relative group rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? "border-[hsl(var(--gold))] shadow-md"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)]"
                }`}
                onClick={() => onSelect(asset)}
              >
                {/* Preview */}
                <div className="aspect-square bg-[hsl(var(--muted))] flex items-center justify-center p-2">
                  <img
                    src={asset.file_url}
                    alt={asset.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Name */}
                <p className="text-[9px] font-medium text-center text-[hsl(var(--foreground))] px-1 py-0.5 truncate">
                  {asset.name}
                </p>

                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                    <Check size={8} className="text-white" />
                  </div>
                )}

                {/* Delete button */}
                <button
                  className="absolute top-1 left-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={e => { e.stopPropagation(); handleDelete(asset); }}
                >
                  <Trash2 size={9} />
                </button>
              </div>
            );
          })}

          {/* Add new slot */}
          <button
            className="aspect-square rounded-xl border-2 border-dashed border-[hsl(var(--border))] flex flex-col items-center justify-center gap-1 hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--gold)/0.03)] transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <Plus size={16} className="text-[hsl(var(--muted-foreground))]" />
            <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Add</span>
          </button>
        </div>
      )}

      {/* Size control */}
      {showSizeControl && selectedUrl && onSizeChange && (
        <div className="pt-2 border-t border-[hsl(var(--border))] space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              {sizeLabel}
            </Label>
            <span className="text-[10px] font-mono font-semibold text-[hsl(var(--foreground))]">
              {sizeValue}%
            </span>
          </div>
          <Slider
            min={sizeMin}
            max={sizeMax}
            step={5}
            value={[sizeValue]}
            onValueChange={([v]) => onSizeChange(v)}
            className="h-1"
          />
        </div>
      )}

      {/* Selected preview */}
      {selectedUrl && (
        <div className="rounded-xl border border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.04)] p-3 flex items-center gap-3">
          <img
            src={selectedUrl}
            alt="Selected"
            className="w-10 h-10 object-contain rounded"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Applied to design</p>
            <p className="text-[9px] text-[hsl(var(--muted-foreground))] truncate">{selectedUrl.split("/").pop()}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-[hsl(var(--muted-foreground))]"
            onClick={() => onSelect({ id: "", name: "", asset_type: "monogram", file_url: "", created_at: "" })}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
