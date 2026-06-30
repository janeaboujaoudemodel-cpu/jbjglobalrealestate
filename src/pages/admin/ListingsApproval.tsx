import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, ImageOff, ImageIcon, Search, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ProjectRow {
  id: string;
  name: string | null;
  slug: string | null;
  developer_name: string | null;
  city: string | null;
  community: string | null;
  is_published: boolean | null;
  cover_image_url: string | null;
  card_image_url: string | null;
  description: string | null;
  price_from: number | null;
  location: string | null;
  area_name: string | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  property_type_label: string | null;
  payment_plan: string | null;
  updated_at: string | null;
  created_at: string | null;
  gallery_count?: number;
  documents_count?: number;
}

type MediaStatus = "complete" | "gallery-only" | "missing";

const getMediaStatus = (p: ProjectRow): MediaStatus => {
  const hasCover = !!(p.cover_image_url && p.cover_image_url.trim());
  const hasCard = !!(p.card_image_url && p.card_image_url.trim());
  if (hasCover || hasCard) return "complete";
  if ((p.gallery_count ?? 0) > 0) return "gallery-only";
  return "missing";
};

const getReadinessBlockers = (p: ProjectRow) => {
  const blockers: string[] = [];
  if (getMediaStatus(p) === "missing") blockers.push("photo");
  if (!p.developer_name || p.developer_name.trim().toLowerCase() === "unknown") blockers.push("developer");
  if (!p.description || p.description.trim().length < 50) blockers.push("description");
  if (!p.price_from || p.price_from <= 0) blockers.push("price");
  if (!p.location?.trim() && !p.area_name?.trim() && !p.community?.trim()) blockers.push("location");
  if (!p.bedrooms_min && !p.bedrooms_max && !p.property_type_label?.trim()) blockers.push("unit details");
  if ((p.documents_count ?? 0) === 0 && !p.payment_plan?.trim()) blockers.push("brochure/floor plan");
  return blockers;
};

const MediaStatusBadge = ({ status }: { status: MediaStatus }) => {
  if (status === "complete") {
    return (
      <Badge className="jj-surface-emerald text-white border-0 gap-1">
        <ImageIcon className="h-3 w-3" /> Media Complete
      </Badge>
    );
  }
  if (status === "gallery-only") {
    return (
      <Badge className="bg-amber-500 text-white border-0 gap-1">
        <AlertTriangle className="h-3 w-3" /> Gallery Only — No Cover
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-600 text-white border-0 gap-1">
      <ImageOff className="h-3 w-3" /> Media Missing
    </Badge>
  );
};

const ListingsApproval = () => {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"needs-photo" | "pending" | "approved">("needs-photo");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id,name,slug,developer_name,city,community,is_published,cover_image_url,card_image_url,description,price_from,location,area_name,bedrooms_min,bedrooms_max,property_type_label,payment_plan,updated_at,created_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const ids = (data || []).map((p: any) => p.id);
      let counts: Record<string, number> = {};
      if (ids.length > 0) {
        const [{ data: imgs }, { data: docs }] = await Promise.all([
          supabase.from("project_images").select("project_id").in("project_id", ids),
          supabase.from("project_documents").select("project_id").in("project_id", ids),
        ]);
        (imgs || []).forEach((row: any) => {
          counts[row.project_id] = (counts[row.project_id] || 0) + 1;
        });
        (docs || []).forEach((row: any) => {
          counts[`doc:${row.project_id}`] = (counts[`doc:${row.project_id}`] || 0) + 1;
        });
      }
      setProjects((data || []).map((p: any) => ({ ...p, gallery_count: counts[p.id] || 0, documents_count: counts[`doc:${p.id}`] || 0 })));
    } catch (e: any) {
      toast.error(e.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (!q) return true;
      return [p.name, p.developer_name, p.city, p.community]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [projects, search]);

  const needsPhoto = filtered.filter((p) => getMediaStatus(p) === "missing");
  const approved = filtered.filter((p) => p.is_published);
  const pending = filtered.filter((p) => !p.is_published && getMediaStatus(p) !== "missing");
  const ready = pending.filter((p) => getReadinessBlockers(p).length === 0);

  const approve = async (p: ProjectRow) => {
    const blockers = getReadinessBlockers(p);
    if (blockers.length > 0) {
      toast.error(`Cannot approve: missing ${blockers.join(", ")}`);
      return;
    }
    const { error } = await supabase
      .from("projects")
      .update({ is_published: true })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${p.name} approved`);
      load();
    }
  };

  const unpublish = async (p: ProjectRow) => {
    const { error } = await supabase
      .from("projects")
      .update({ is_published: false })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${p.name} moved to Pending`);
      load();
    }
  };

  const renderRow = (p: ProjectRow) => {
    const status = getMediaStatus(p);
    const thumb = p.cover_image_url || p.card_image_url;
    const blockers = getReadinessBlockers(p);
    return (
      <Card
        key={p.id}
        data-surface="champagne"
        className="flex items-center gap-4 p-4 border border-[#B89555]/40"
      >
        <div className="h-16 w-24 rounded-lg overflow-hidden bg-[#EFE6D6] flex items-center justify-center flex-shrink-0">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" />
          ) : (
            <ImageOff className="h-6 w-6 text-[#1A1A1A]/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#1A1A1A] truncate">{p.name || "Untitled"}</h3>
            <MediaStatusBadge status={status} />
            {p.is_published ? (
              <Badge className="bg-[#B89555] text-white border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Approved
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-700 gap-1">
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            )}
          </div>
          <div className="text-sm text-[#1A1A1A]/70 truncate">
            {[p.developer_name, p.community, p.city].filter(Boolean).join(" • ")}
          </div>
          <div className="text-xs text-[#1A1A1A]/60 mt-1">
            Gallery: {p.gallery_count ?? 0} image{(p.gallery_count ?? 0) === 1 ? "" : "s"} · Docs: {p.documents_count ?? 0}
            {blockers.length > 0 && <span> · Missing: {blockers.join(", ")}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {p.slug && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/projects/${p.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {p.is_published ? (
            <Button size="sm" variant="outline" onClick={() => unpublish(p)}>
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              variant="gold"
              disabled={blockers.length > 0}
              onClick={() => approve(p)}
            >
              Approve
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div data-surface="page" className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Listings Approval</h1>
          <p className="text-[#1A1A1A]/70 mt-1">
            Review approved and pending listings with clear media status indicators.
          </p>
        </header>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
            <Input
              placeholder="Search by name, developer, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>

        {needsPhoto.length > 0 && (
          <Card
            data-surface="champagne"
            className="mb-4 p-4 border border-red-600/40 flex items-start gap-3"
          >
            <ImageOff className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#1A1A1A]">
              <strong>{needsPhoto.length}</strong> listing{needsPhoto.length === 1 ? "" : "s"} hidden from the public site because {needsPhoto.length === 1 ? "it has" : "they have"} no photo. Review them in the <em>Needs Photo</em> tab and add media before approval.
            </div>
          </Card>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="needs-photo" className="gap-2">
              <ImageOff className="h-4 w-4" /> Needs Photo ({needsPhoto.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" /> Pending / Ready ({ready.length}/{pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Approved ({approved.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="needs-photo" className="mt-4 space-y-3">
            {needsPhoto.length === 0 ? (
              <Card data-surface="champagne" className="p-8 text-center text-[#1A1A1A]/70">
                {loading ? "Loading…" : "All listings have at least one photo. 🎉"}
              </Card>
            ) : (
              needsPhoto.map(renderRow)
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pending.length === 0 ? (
              <Card data-surface="champagne" className="p-8 text-center text-[#1A1A1A]/70">
                {loading ? "Loading…" : "No listings pending approval."}
              </Card>
            ) : (
              pending.map(renderRow)
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4 space-y-3">
            {approved.length === 0 ? (
              <Card data-surface="champagne" className="p-8 text-center text-[#1A1A1A]/70">
                {loading ? "Loading…" : "No approved listings yet."}
              </Card>
            ) : (
              approved.map(renderRow)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ListingsApproval;
