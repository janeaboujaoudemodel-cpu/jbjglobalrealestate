import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, ImageOff, ImageIcon, Search, ExternalLink, AlertTriangle, ClipboardList, Inbox } from "lucide-react";
import { toast } from "sonner";
import OwnerHubPage from "@/pages/owner/crm/shell/OwnerHubPage";

interface ProjectRow {
  id: string;
  name: string | null;
  slug: string | null;
  developer_name: string | null;
  emirate: string | null;
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
type Tab = "needs-photo" | "pending" | "approved";

const PROJECT_COLUMNS =
  "id,name,slug,developer_name,emirate,is_published,cover_image_url,card_image_url,description,price_from,location,area_name,bedrooms_min,bedrooms_max,property_type_label,payment_plan,updated_at,created_at,community:communities(name)";

/**
 * Page through EVERY project row. The previous `.limit(500)` made this page
 * disagree with the Owner Panel "Pending Approvals" tile — the tile counted
 * server-side while the page only ever saw the 500 most recently updated rows.
 */
async function fetchAllProjects(): Promise<any[]> {
  const PAGE = 1000;
  const out: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .order("updated_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

async function fetchAllChildIds(table: "project_images" | "project_documents"): Promise<Record<string, number>> {
  const PAGE = 1000;
  const counts: Record<string, number> = {};
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select("project_id").range(from, from + PAGE - 1);
    if (error) throw error;
    (data || []).forEach((row: any) => {
      if (row.project_id) counts[row.project_id] = (counts[row.project_id] || 0) + 1;
    });
    if (!data || data.length < PAGE) break;
  }
  return counts;
}

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
  const [importCount, setImportCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("needs-photo");

  const load = async () => {
    setLoading(true);
    try {
      const [rows, imgCounts, docCounts, imports] = await Promise.all([
        fetchAllProjects(),
        fetchAllChildIds("project_images"),
        fetchAllChildIds("project_documents"),
        supabase.from("pending_project_imports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setImportCount(imports.count || 0);
      setProjects(
        rows.map((p: any) => ({
          ...p,
          community: p.community?.name ?? null,
          gallery_count: imgCounts[p.id] || 0,
          documents_count: docCounts[p.id] || 0,
        })),
      );
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
      return [p.name, p.developer_name, p.emirate, p.community]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [projects, search]);

  const needsPhoto = filtered.filter((p) => getMediaStatus(p) === "missing");
  const approved = filtered.filter((p) => p.is_published);
  const pending = filtered.filter((p) => !p.is_published && getMediaStatus(p) !== "missing");
  const ready = pending.filter((p) => getReadinessBlockers(p).length === 0);

  // Owner Panel tile parity: pending imports + unpublished listings with no cover.
  const unpublishedNoCover = projects.filter(
    (p) => !p.is_published && !(p.cover_image_url && p.cover_image_url.trim()),
  ).length;
  const tileTotal = importCount + unpublishedNoCover;

  const approve = async (p: ProjectRow) => {
    const blockers = getReadinessBlockers(p);
    if (blockers.length > 0) {
      toast.error(`Cannot approve: missing ${blockers.join(", ")}`);
      return;
    }
    const { error } = await supabase.from("projects").update({ is_published: true }).eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${p.name} approved`);
      load();
    }
  };

  const unpublish = async (p: ProjectRow) => {
    const { error } = await supabase.from("projects").update({ is_published: false }).eq("id", p.id);
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
      <div key={p.id} className="owner-hub-card flex items-center gap-4 flex-wrap">
        <div className="h-16 w-24 rounded-lg overflow-hidden bg-[#F1F5F4] flex items-center justify-center flex-shrink-0">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <ImageOff className="h-6 w-6 text-[#064E3B]/50" />
          )}
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#0F172A]">{p.name || "Untitled"}</h3>
            <MediaStatusBadge status={status} />
            {p.is_published ? (
              <Badge className="bg-[#B89555] text-[#1A1A1A] border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Approved
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-700 gap-1">
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            )}
          </div>
          <div className="text-sm text-[#475569]">
            {[p.developer_name, p.community, p.emirate].filter(Boolean).join(" • ")}
          </div>
          <div className="text-xs text-[#64748B] mt-1">
            Gallery: {p.gallery_count ?? 0} image{(p.gallery_count ?? 0) === 1 ? "" : "s"} · Docs: {p.documents_count ?? 0}
            {blockers.length > 0 && <span> · Missing: {blockers.join(", ")}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {p.slug && (
            <Button aria-label="Copy link" asChild variant="outline" size="sm">
              <Link aria-label="Open in a new tab" to={`/project/${p.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {p.is_published ? (
            <Button size="sm" variant="outline" onClick={() => unpublish(p)}>
              Unpublish
            </Button>
          ) : (
            <Button size="sm" variant="gold" disabled={blockers.length > 0} onClick={() => approve(p)}>
              Approve
            </Button>
          )}
        </div>
      </div>
    );
  };

  const rows = tab === "needs-photo" ? needsPhoto : tab === "pending" ? pending : approved;
  const emptyCopy =
    tab === "needs-photo"
      ? "All listings have at least one photo. 🎉"
      : tab === "pending"
        ? "No listings pending approval."
        : "No approved listings yet.";

  const pills: { key: Tab; label: string; icon: typeof ImageOff }[] = [
    { key: "needs-photo", label: `Needs Photo (${needsPhoto.length})`, icon: ImageOff },
    { key: "pending", label: `Pending / Ready (${ready.length}/${pending.length})`, icon: Clock },
    { key: "approved", label: `Approved (${approved.length})`, icon: CheckCircle2 },
  ];

  return (
    <OwnerHubPage
      eyebrow="Listings"
      title="Listings Approval"
      subtitle="Review approved and pending listings with clear media status indicators. Counts below match the Owner Panel Pending Approvals tile."
      icon={ClipboardList}
      insights={[
        { label: "Pending approvals (tile)", value: tileTotal, delta: `${importCount} imports + ${unpublishedNoCover} listings without a cover` },
        { label: "Needs photo", value: needsPhoto.length },
        { label: "Pending listings", value: pending.length, delta: `${ready.length} ready to approve` },
        { label: "Approved & live", value: approved.length },
      ]}
      actions={
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      }
    >
      {importCount > 0 && (
        <div className="owner-hub-card flex items-start gap-3">
          <Inbox className="h-5 w-5 text-[#064E3B] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#0F172A]">
            <strong>{importCount}</strong> imported project{importCount === 1 ? "" : "s"} still awaiting review.{" "}
            <Link className="text-[#064E3B] underline" to="/owner/crm/jbj/owner-market-import">
              Open Market Import Review
            </Link>
            .
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#064E3B]/60" />
          <Input
            placeholder="Search by name, developer, emirate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="owner-hub-pills" role="tablist" aria-label="Listing approval buckets">
        {pills.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            data-active={tab === key}
            className="owner-hub-pill"
            onClick={() => setTab(key)}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="owner-hub-card text-center text-[#475569] py-8">{loading ? "Loading…" : emptyCopy}</div>
        ) : (
          rows.map(renderRow)
        )}
      </div>
    </OwnerHubPage>
  );
};

export default ListingsApproval;
