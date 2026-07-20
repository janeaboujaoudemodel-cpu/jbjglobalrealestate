import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ImageOff, ExternalLink, Upload, Archive } from "lucide-react";

/**
 * Projects with no cover photo & no gallery images.
 * These are held back from the public site until an owner attaches a photo
 * or explicitly archives them.
 */
interface RowProject {
  id: string;
  name: string;
  slug: string | null;
  developer_name: string | null;
  area_name: string | null;
  location: string | null;
  cover_image_url: string | null;
  status: string | null;
  updated_at: string | null;
  image_count: number;
}

export default function OwnerProjectPhotoApproval() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["owner-projects-photo-approval"],
    queryFn: async (): Promise<RowProject[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id, name, slug, developer_name, area_name, location, cover_image_url, status, updated_at,
          project_images(image_url)
        `)
        .or("cover_image_url.is.null,cover_image_url.eq.")
        .limit(500);
      if (error) throw error;
      return (data || [])
        .map((p: any) => ({
          ...p,
          image_count: (p.project_images || []).filter((i: any) => i?.image_url).length,
        }))
        .filter((p: any) => !p.cover_image_url && p.image_count === 0);
    },
    staleTime: 30_000,
  });

  const archive = async (id: string) => {
    setBusy(id);
    const { error } = await supabase
      .from("projects")
      .update({ status: "draft_needs_enrichment" as any })
      .eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Moved to draft — hidden from public site");
    qc.invalidateQueries({ queryKey: ["owner-projects-photo-approval"] });
  };

  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Photo Approval Queue</h1>
          <p className="text-sm text-[#0A0A0A]/70 mt-1 max-w-2xl">
            Projects below have no cover image or gallery photos. They stay
            hidden from the public site until you attach a photo or archive
            them. Upload a cover on the project page or move it to draft.
          </p>
        </div>
        <div className="text-xs uppercase tracking-[0.14em] font-semibold text-[#064E3B]">
          {data?.length ?? 0} awaiting photo
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[#0A0A0A]/70 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : !data?.length ? (
        <div className="rounded-md border border-[#B89555]/40 bg-white p-8 text-center">
          <ImageOff className="w-8 h-8 mx-auto text-[#B89555] mb-2" />
          <div className="text-sm font-semibold text-[#0A0A0A]">All caught up.</div>
          <div className="text-xs text-[#0A0A0A]/60 mt-1">
            Every project currently has at least one photo.
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-[#B89555]/40 bg-white divide-y divide-[#B89555]/15">
          {data.map((p) => (
            <div key={p.id} className="p-4 flex items-center gap-4 flex-wrap">
              <div className="h-12 w-16 rounded bg-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center flex-shrink-0">
                <ImageOff className="w-5 h-5 text-[#B89555]" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm font-semibold text-[#0A0A0A]">{p.name}</div>
                <div className="text-xs text-[#0A0A0A]/60">
                  {[p.developer_name, p.area_name || p.location].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.slug && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/project/${p.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link to={`/owner/media-ingest?project=${p.id}`}>
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload photo
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy === p.id}
                  onClick={() => archive(p.id)}
                >
                  {busy === p.id ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Move to draft
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
