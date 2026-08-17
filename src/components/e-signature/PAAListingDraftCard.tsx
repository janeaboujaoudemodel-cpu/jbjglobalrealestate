import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as ImageIcon, Upload, ExternalLink, Eye, EyeOff, CheckCircle2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  envelopeId: string;
  category: "leasing" | "selling" | "other";
  isOwner?: boolean;
}

export default function PAAListingDraftCard({ envelopeId, category }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const { data: project, refetch, isLoading } = useQuery({
    queryKey: ["paa-linked-listing", envelopeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, slug, is_published, listing_kind, owner_pii_hidden, cover_image_url")
        .eq("source_envelope_id", envelopeId)
        .maybeSingle();
      return data;
    },
    enabled: !!envelopeId,
  });

  const { data: images } = useQuery({
    queryKey: ["paa-linked-listing-images", project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data } = await supabase
        .from("project_images")
        .select("id, image_url, display_order")
        .eq("project_id", project.id)
        .order("display_order", { ascending: true });
      return data || [];
    },
    enabled: !!project?.id,
  });

  useEffect(() => { refetch(); }, [category, refetch]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length || !project?.id) return;
    setUploading(true);
    try {
      const startOrder = (images?.length || 0);
      let i = 0;
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const path = `paa-listings/${project.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("project-files").upload(path, file);
        if (upErr) throw upErr;
        const { data: pu } = supabase.storage.from("project-files").getPublicUrl(path);
        await supabase.from("project_images").insert({
          project_id: project.id,
          image_url: pu.publicUrl,
          display_order: startOrder + i,
          alt_text: file.name,
        });
        if (!project.cover_image_url && i === 0) {
          await supabase.from("projects").update({ cover_image_url: pu.publicUrl }).eq("id", project.id);
        }
        i++;
      }
      toast.success(`${files.length} image${files.length === 1 ? "" : "s"} uploaded`);
      qc.invalidateQueries({ queryKey: ["paa-linked-listing", envelopeId] });
      qc.invalidateQueries({ queryKey: ["paa-linked-listing-images", project.id] });
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handlePublishToggle = async () => {
    if (!project?.id) return;
    setPublishing(true);
    try {
      const next = !project.is_published;
      if (next && (!images || images.length === 0)) {
        toast.error("Add at least one image before publishing");
        return;
      }
      await supabase.from("projects").update({
        is_published: next,
        owner_pii_hidden: true,
      }).eq("id", project.id);
      toast.success(next ? "Listing published" : "Listing unpublished");
      qc.invalidateQueries({ queryKey: ["paa-linked-listing", envelopeId] });
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-[#F7F2EA] border-[#B89555]/30">
        <CardContent className="p-4 text-xs text-[#1A1A1A]/70 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading listing draft…
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="bg-[#F7F2EA] border-[#B89555]/30">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-[#1A1A1A]">
            <Building2 className="w-4 h-4" /> Listing Draft
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[#1A1A1A]/70">
          A listing draft will be auto-generated when you save this PAA.
        </CardContent>
      </Card>
    );
  }

  const kind = project.listing_kind || category;
  const publicHref = kind === "selling" ? "/secondary-market-hub" : "/properties?listingKind=leasing";

  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/30">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between text-[#1A1A1A]">
          <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Listing Draft</span>
          <Badge className={project.is_published
            ? "jj-emerald-soft text-[color:var(--emerald-1)] border border-[color:var(--emerald-1)]/30"
            : "bg-white text-[#1A1A1A]/80 border border-[#B89555]/40"}>
            {project.is_published ? "Published" : "Draft"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-[#1A1A1A]/80">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-[#1A1A1A] truncate">{project.name || "Untitled listing"}</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-[#B89555]/40">{kind}</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {project.owner_pii_hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          Owner contact details {project.owner_pii_hidden ? "hidden" : "visible"} on public pages
        </div>

        {/* Images */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Photos ({images?.length || 0})</span>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
              Add
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
          {images && images.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5">
              {images.slice(0, 8).map((img) => (
                <div key={img.id} className="aspect-square rounded border border-[#B89555]/30 overflow-hidden bg-white">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded border border-dashed border-[#B89555]/40 p-3 text-center text-[11px] text-[#1A1A1A]/60 flex items-center justify-center gap-2">
              <ImageIcon className="w-3 h-3" /> No images yet
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <Button asChild variant="outline" size="sm" className="h-8 text-[11px] w-full justify-center">
            <Link to={`/admin/listings-approval?project=${project.id}`}>
              <ExternalLink className="w-3 h-3 mr-1" /> Open in Listing Approval
            </Link>
          </Button>
          {project.is_published && (
            <Button asChild variant="outline" size="sm" className="h-8 text-[11px] w-full justify-center">
              <Link to={publicHref}>
                <Eye className="w-3 h-3 mr-1" /> View on public {kind === "selling" ? "resale" : "leasing"}
              </Link>
            </Button>
          )}
          <Button
            variant="gold"
            size="sm"
            className="h-8 text-[11px] w-full justify-center"
            onClick={handlePublishToggle}
            disabled={publishing}
          >
            {publishing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
            {project.is_published ? "Unpublish listing" : "Approve & Publish listing"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
