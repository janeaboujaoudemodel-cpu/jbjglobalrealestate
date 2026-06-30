import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Trash2, Check, Star, Pencil, Stamp as StampIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import DOMPurify from "dompurify";

export interface SavedStamp {
  id: string;
  name: string;
  svg_content: string | null;
  thumbnail_url: string | null;
  is_default: boolean;
  created_at: string;
}

interface StampManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user picks a stamp to USE in the placer right now. */
  onUse: (stamp: { svg?: string | null; imageUrl?: string | null; name: string }) => void;
}

/** Sanitize SVG strictly — no scripts, no event handlers. */
function sanitizeSvg(raw: string): string {
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject"],
    FORBID_ATTR: [
      "onload", "onclick", "onerror", "onmouseover", "onmouseenter",
      "onmouseleave", "onfocus", "onblur",
    ],
  });
}

export default function StampManagerDialog({ open, onOpenChange, onUse }: StampManagerDialogProps) {
  const { user } = useAuth();
  const [stamps, setStamps] = useState<SavedStamp[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadStamps = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("brand_assets")
      .select("id, name, svg_content, thumbnail_url, metadata, created_at")
      .eq("user_id", user.id)
      .eq("asset_type", "stamp")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setStamps(
        data.map((d: any) => ({
          id: d.id,
          name: d.name,
          svg_content: d.svg_content,
          thumbnail_url: d.thumbnail_url,
          is_default: !!(d.metadata && d.metadata.is_default),
          created_at: d.created_at,
        }))
      );
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (open) loadStamps();
  }, [open, loadStamps]);

  // ── File reader ──────────────────────────────────────────────────────
  const readFileAsText = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = reject;
      r.readAsText(file);
    });
  const readFileAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleUpload = async (files: FileList | File[] | null) => {
    if (!files || !user?.id) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }
        const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
        const isImage = file.type.startsWith("image/");
        if (!isImage && !isSvg) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        const baseName = file.name.replace(/\.[^.]+$/, "");
        let svg_content: string | null = null;
        let thumbnail_url: string | null = null;
        if (isSvg) {
          const raw = await readFileAsText(file);
          svg_content = sanitizeSvg(raw);
        } else {
          thumbnail_url = await readFileAsDataURL(file);
        }
        const { error } = await supabase.from("brand_assets").insert({
          user_id: user.id,
          asset_type: "stamp",
          name: baseName || "Stamp",
          svg_content,
          thumbnail_url,
          metadata: { is_default: false, source: "upload" },
        });
        if (error) {
          console.error(error);
          toast.error(`Failed to save ${file.name}`);
        }
      }
      await loadStamps();
      toast.success("Stamp uploaded");
    } finally {
      setUploading(false);
    }
  };

  const setDefault = async (id: string) => {
    if (!user?.id) return;
    // Clear default on every other stamp, set on this one
    const others = stamps.filter((s) => s.id !== id);
    await Promise.all(
      others
        .filter((s) => s.is_default)
        .map((s) =>
          supabase
            .from("brand_assets")
            .update({ metadata: { is_default: false } as any })
            .eq("id", s.id)
        )
    );
    const target = stamps.find((s) => s.id === id);
    await supabase
      .from("brand_assets")
      .update({ metadata: { is_default: true, source: "upload", name: target?.name } as any })
      .eq("id", id);
    toast.success("Default stamp set");
    loadStamps();
  };

  const deleteStamp = async (id: string) => {
    if (!confirm("Delete this stamp? This cannot be undone.")) return;
    const { error } = await supabase.from("brand_assets").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Stamp deleted");
    loadStamps();
  };

  const startRename = (stamp: SavedStamp) => {
    setRenamingId(stamp.id);
    setRenameValue(stamp.name);
  };
  const commitRename = async () => {
    if (!renamingId) return;
    const newName = renameValue.trim() || "Stamp";
    const { error } = await supabase.from("brand_assets").update({ name: newName }).eq("id", renamingId);
    if (error) toast.error("Rename failed");
    else toast.success("Renamed");
    setRenamingId(null);
    loadStamps();
  };

  const useStamp = (stamp: SavedStamp) => {
    onUse({ svg: stamp.svg_content, imageUrl: stamp.thumbnail_url, name: stamp.name });
    onOpenChange(false);
  };

  // ── Drag-drop handlers ────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <StampIcon className="w-5 h-5 text-[hsl(var(--gold))]" />
            Company Stamps
          </DialogTitle>
        </DialogHeader>

        {/* Upload zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]"
              : "border-[hsl(var(--gold)/0.4)] bg-[#F7F2EA]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--gold))]" />
          <p className="text-sm font-medium text-[#1A1A1A]">
            Drag your stamp here or click to upload
          </p>
          <p className="text-xs text-[#1A1A1A]/70 mt-1">
            PNG, JPG, WEBP, or SVG. Transparent background recommended. Max 5MB.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
            Choose file
          </Button>
        </div>

        {/* Stamps grid */}
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--gold))]" />
            </div>
          ) : stamps.length === 0 ? (
            <p className="text-center text-sm text-[#1A1A1A]/70 py-6">
              No stamps saved yet — upload your first stamp above.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stamps.map((s) => (
                <div
                  key={s.id}
                  className="relative bg-white rounded-xl border border-[hsl(var(--gold)/0.3)] p-3 flex flex-col"
                >
                  {s.is_default && (
                    <span className="absolute -top-2 -left-2 bg-[#1A1A1A] text-white text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
                      Default
                    </span>
                  )}
                  <div className="aspect-square w-full flex items-center justify-center bg-[#F7F2EA] rounded mb-2 overflow-hidden">
                    {s.svg_content ? (
                      <div
                        className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
                        dangerouslySetInnerHTML={{ __html: sanitizeSvg(s.svg_content) }}
                      />
                    ) : s.thumbnail_url ? (
                      <img
                        src={s.thumbnail_url}
                        alt={s.name}
                        className="max-w-full max-h-full object-contain"
                       loading="lazy" decoding="async" />
                    ) : (
                      <StampIcon className="w-8 h-8 text-[#1A1A1A]/30" />
                    )}
                  </div>
                  {renamingId === s.id ? (
                    <div className="flex gap-1 mb-2">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-7 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                      <Button size="icon" className="h-7 w-7" onClick={commitRename}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRenamingId(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-[#1A1A1A] truncate mb-2" title={s.name}>
                      {s.name}
                    </p>
                  )}
                  <div className="mt-auto flex gap-1">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.9)] text-white"
                      onClick={() => useStamp(s)}
                    >
                      Use
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      title={s.is_default ? "Default stamp" : "Set as default"}
                      onClick={() => !s.is_default && setDefault(s.id)}
                      disabled={s.is_default}
                    >
                      <Star className={`w-3.5 h-3.5 ${s.is_default ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      title="Rename"
                      onClick={() => startRename(s)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 text-destructive border-destructive/40 hover:bg-destructive/5"
                      title="Delete"
                      onClick={() => deleteStamp(s.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
