import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit3, ExternalLink, Loader2, Building2, Home, CheckCircle2, XCircle, Sparkles, Search, AlertTriangle, Wand2 } from "lucide-react";
import { useDeveloperAutoPublish } from "@/hooks/useDeveloperAutoPublish";
import { toast } from "sonner";

type StatusFilter = "all" | "live" | "draft";
const PAGE_SIZE = 200;

interface Project {
  id: string;
  name: string;
  slug: string | null;
  developer_id?: string | null;
  developer_name?: string | null;
  developer?: { name: string | null } | null;
  location?: string | null;
  emirate?: string | null;
  construction_status?: string | null;
  status?: string | null;
  status_label?: string | null;
  is_offplan?: boolean | null;
  listing_kind?: string | null;
  price_from: number | null;
  handover_date: string | null;
  is_published: boolean | null;
  cover_image_url: string | null;
  description?: string | null;
  source?: string | null;
  data_quality_flags: unknown;
}

interface ResaleProject {
  id: string;
  title?: string | null;
  project_name?: string | null;
  developer_name?: string | null;
  area_name?: string | null;
  emirate?: string | null;
  asking_price?: number | null;
  bedrooms?: number | null;
  property_type?: string | null;
  handover_status?: string | null;
  created_at?: string | null;
}

const OFFPLAN_FILTER = "and(listing_kind.is.null,listing_kind.neq.resale,listing_kind.neq.leasing)";

const humanizeSource = (s: string | null | undefined): string => {
  if (!s) return "Unknown source";
  const map: Record<string, string> = {
    manual: "Manual entry",
    "paa-envelope": "PAA envelope",
    provident: "Provident feed",
    reelly: "Reelly feed",
    brochure: "Brochure upload",
    developer_portal: "Developer portal",
  };
  return map[s] || s.replace(/[-_]/g, " ");
};

const humanizeFlag = (f: string): string =>
  f.replace(/^missing_/, "Missing ").replace(/_/g, " ");

const DeveloperLiveEditor = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const publish = useDeveloperAutoPublish();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { price_from?: string; handover_date?: string; description?: string }>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<null | "publish" | "unpublish" | "enrich">(null);
  const [autofillBusy, setAutofillBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");
  const [pageSize, setPageSize] = useState(PAGE_SIZE);


  const { data: rep } = useQuery({
    queryKey: ["rep-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_representatives")
        .select("current_developer_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !isOwner,
  });

  const devFilterId = isOwner ? null : rep?.current_developer_id;

  // Server-side totals (true counts, not capped)
  const { data: counts } = useQuery({
    queryKey: ["developer-projects-counts", isOwner ? "owner-all" : devFilterId],
    queryFn: async () => {
      const build = (published: boolean | null) => {
        let q = supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .or("listing_kind.is.null,listing_kind.eq.offplan");
        if (!isOwner) q = q.eq("developer_id", devFilterId!);
        if (published !== null) q = q.eq("is_published", published);
        return q;
      };
      const [all, live, draft] = await Promise.all([build(null), build(true), build(false)]);
      return {
        all: all.count ?? 0,
        live: live.count ?? 0,
        draft: draft.count ?? 0,
      };
    },
    enabled: isOwner || !!devFilterId,
  });

  const { data: allProjects, isLoading } = useQuery({
    queryKey: ["developer-projects", isOwner ? "owner-all" : devFilterId, pageSize, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("id, name, slug, developer_id, developer_name, developer:developers(name), location, emirate, construction_status, status, status_label, is_offplan, listing_kind, price_from, handover_date, is_published, cover_image_url, description, source, data_quality_flags, created_at, updated_at")
        .or("listing_kind.is.null,listing_kind.eq.offplan")
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (!isOwner) query = query.eq("developer_id", devFilterId!);
      if (statusFilter === "live") query = query.eq("is_published", true);
      if (statusFilter === "draft") query = query.eq("is_published", false);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: isOwner || !!devFilterId,
  });

  const projects = useMemo(() => {
    if (!allProjects) return [] as Project[];
    const q = search.trim().toLowerCase();
    if (!q) return allProjects;
    return allProjects.filter((p) => {
      const hay = [p.name, p.developer_name, p.developer?.name, p.location, p.emirate]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [allProjects, search]);

  const { data: resaleProjects = [], isLoading: loadingResale } = useQuery({
    queryKey: ["owner-projects-resale-section", isOwner],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_listings_public")
        .select("id, title, project_name, developer_name, area_name, emirate, asking_price, bedrooms, property_type, handover_status, created_at")
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return (data || []) as ResaleProject[];
    },
    enabled: !!isOwner,
  });

  const allIds = useMemo(() => (projects ?? []).map((p) => p.id), [projects]);
  const allSelected = allIds.length > 0 && selected.size === allIds.length;

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelected(new Set(allIds));
  const clearAll = () => setSelected(new Set());

  const togglePublish = async (p: Project, next: boolean) => {
    const { error } = await supabase.from("projects").update({ is_published: next }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Published" : "Unpublished");
    qc.invalidateQueries({ queryKey: ["developer-projects"] });
    qc.invalidateQueries({ queryKey: ["developer-projects-counts"] });
  };

  const bulkPublish = async (next: boolean) => {
    if (selected.size === 0) return;
    setBulkBusy(next ? "publish" : "unpublish");
    const ids = Array.from(selected);
    const { error } = await supabase.from("projects").update({ is_published: next }).in("id", ids);
    setBulkBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} project${ids.length > 1 ? "s" : ""} ${next ? "published" : "unpublished"}`);
    qc.invalidateQueries({ queryKey: ["developer-projects"] });
    qc.invalidateQueries({ queryKey: ["developer-projects-counts"] });
    clearAll();
  };

  const bulkEnrich = async () => {
    if (selected.size === 0 || !projects) return;
    setBulkBusy("enrich");
    const chosen = projects.filter((p) => selected.has(p.id));
    let ok = 0, fail = 0;
    for (const p of chosen) {
      if (!p.developer_id) { fail++; continue; }
      try {
        await publish.mutateAsync({
          developer_id: p.developer_id,
          project_id: p.id,
          patch: {},
          enrich: true,
        });
        ok++;
      } catch { fail++; }
    }
    setBulkBusy(null);
    toast[fail ? "warning" : "success"](`Enrichment queued for ${ok} / ${chosen.length}`);
    qc.invalidateQueries({ queryKey: ["developer-projects"] });
  };

  const autofillDescription = async (p: Project) => {
    setAutofillBusy(p.id);
    try {
      const { data, error } = await supabase.functions.invoke("project-autofill-description", {
        body: { project_id: p.id },
      });
      if (error) throw error;
      const desc = (data as { description?: string })?.description;
      if (!desc) throw new Error("No description returned");
      setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], description: desc } }));
      toast.success("Description generated — review and save");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate description");
    } finally {
      setAutofillBusy(null);
    }
  };

  const saveEdit = async (p: Project) => {
    const e = edits[p.id] || {};
    const patch: { price_from?: number; handover_date?: string; description?: string } = {};
    if (e.price_from !== undefined && e.price_from !== "") patch.price_from = Number(e.price_from);
    if (e.handover_date !== undefined && e.handover_date !== "") patch.handover_date = e.handover_date;
    if (e.description !== undefined && e.description !== "") patch.description = e.description;
    if (!Object.keys(patch).length) {
      setEditing(null);
      return;
    }
    // Direct update — bypass useDeveloperAutoPublish so it works for both owner and dev-rep
    const { error } = await supabase.from("projects").update(patch).eq("id", p.id);

    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    setEdits((s) => ({ ...s, [p.id]: {} }));
    qc.invalidateQueries({ queryKey: ["developer-projects"] });
  };

  const openFullEditor = (p: Project) => {
    navigate(isOwner
      ? `/owner/developers/new-project?edit=${p.id}`
      : `/developer-hub/new-project?edit=${p.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">My Projects</h1>
          <p className="text-[#1A1A1A]/70 text-sm mt-1">Select projects to bulk publish, unpublish, or enrich. Click any row to edit.</p>
        </div>
        <Button
          onClick={() => navigate(isOwner ? "/owner/developers/new-project" : "/developer-hub/new-project")}
          data-surface="emerald"
          data-emerald-ok="button"
          className="jj-surface-emerald allow-white text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" /> Add project
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Building2 className="h-5 w-5 text-[#064E3B]" />
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Off-plan projects</h2>
          <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
            {counts?.all?.toLocaleString() ?? "…"}
          </Badge>

          {(counts?.all ?? 0) > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={allSelected ? clearAll : selectAll}
                className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]">
                {allSelected ? "Unselect all" : "Select all"}
              </Button>
            </div>
          )}
        </div>

        {/* Search + status tabs */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project or developer name…"
              className="pl-9 bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {([
              ["all", "All", counts?.all],
              ["live", "Live", counts?.live],
              ["draft", "Draft / Unpublished", counts?.draft],
            ] as const).map(([key, label, count]) => (
              <Button
                key={key}
                size="sm"
                variant={statusFilter === key ? "default" : "outline"}
                onClick={() => { setStatusFilter(key as StatusFilter); setPageSize(PAGE_SIZE); }}
                className={statusFilter === key
                  ? "jj-surface-emerald allow-white text-white border-transparent"
                  : "border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"}
                data-surface={statusFilter === key ? "emerald" : undefined}
              >
                {label} <span className="ml-1 opacity-70">({count?.toLocaleString() ?? "…"})</span>
              </Button>
            ))}
          </div>
        </div>

        {selected.size > 0 && (
          <div
            data-surface="emerald"
            data-emerald-ok="toolbar"
            className="jj-surface-emerald allow-white text-white rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-lg"
          >
            <span className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" onClick={() => bulkPublish(true)} disabled={!!bulkBusy}
                className="bg-white text-[#064E3B] hover:bg-white/90 font-semibold">
                {bulkBusy === "publish" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Publish</>}
              </Button>
              <Button size="sm" onClick={() => bulkPublish(false)} disabled={!!bulkBusy}
                className="bg-white text-[#064E3B] hover:bg-white/90 font-semibold">
                {bulkBusy === "unpublish" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3.5 h-3.5 mr-1" /> Unpublish</>}
              </Button>
              <Button size="sm" onClick={bulkEnrich} disabled={!!bulkBusy}
                className="bg-white text-[#064E3B] hover:bg-white/90 font-semibold">
                {bulkBusy === "enrich" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Enrich</>}
              </Button>
              <Button size="sm" onClick={clearAll} disabled={!!bulkBusy}
                className="bg-white text-[#064E3B] hover:bg-white/90 font-semibold border border-white">
                <span style={{ color: "#064E3B" }}>Clear</span>
              </Button>
            </div>
          </div>
        )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]/60" /></div>
      ) : !projects.length ? (
        <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-10 rounded-lg text-center">
          <p className="text-[#1A1A1A]/70">
            {(allProjects?.length ?? 0) === 0
              ? "No off-plan projects yet. Add your first project to get started."
              : `No projects match "${search || statusFilter}". Try clearing the search or the status filter.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const isEdit = editing === p.id;
            const isSelected = selected.has(p.id);
            const flags = Array.isArray(p.data_quality_flags)
              ? (p.data_quality_flags as string[])
              : [];
            const currentEdit = edits[p.id] || {};
            return (
              <Card key={p.id}
                className={`p-4 rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-[#EFE6D6] border-[#064E3B]"
                    : "bg-[#F7F2EA] border-[#B89555]/40"
                }`}>
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(p.id)} aria-label={`Select ${p.name}`} />
                  </div>
                  <div className="w-20 h-20 rounded bg-[#EFE6D6] border border-[#B89555]/40 flex-shrink-0 overflow-hidden">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[10px] text-[#1A1A1A]/40">No cover</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#1A1A1A]">{p.name}</h3>
                      {p.is_published ? (
                        <Badge
                          data-surface="emerald"
                          data-emerald-ok="badge"
                          className="jj-surface-emerald allow-white text-white border-transparent"
                        >
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Unpublished</Badge>
                      )}
                      <Badge variant="outline" className="bg-[#FDFBF7] text-[#1A1A1A]/80 border-[#B89555]/40 text-[10px]">
                        Source: {humanizeSource(p.source)}
                      </Badge>
                      {flags.length > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {flags.length} data issue{flags.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>

                    {/* Data-issue list — always visible so users know exactly what to fix */}
                    {flags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {flags.map((f) => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 capitalize">
                            {humanizeFlag(String(f))}
                          </span>
                        ))}
                      </div>
                    )}

                    {isEdit ? (
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            type="number"
                            placeholder="Price from (AED)"
                            defaultValue={p.price_from ?? ""}
                            onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], price_from: e.target.value } }))}
                            className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
                          />
                          <Input
                            type="date"
                            defaultValue={p.handover_date ?? ""}
                            onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], handover_date: e.target.value } }))}
                            className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-[#1A1A1A]/70">Description</label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => autofillDescription(p)}
                              disabled={autofillBusy === p.id}
                              className="h-7 border-[#064E3B]/40 text-[#064E3B] hover:bg-[#064E3B]/10"
                            >
                              {autofillBusy === p.id ? (
                                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating…</>
                              ) : (
                                <><Wand2 className="w-3 h-3 mr-1" /> AI fill from fact sheet</>
                              )}
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Write or auto-generate the project description…"
                            value={currentEdit.description ?? p.description ?? ""}
                            onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], description: e.target.value } }))}
                            rows={5}
                            className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => openFullEditor(p)}
                          className="text-xs text-[#064E3B] underline underline-offset-2 hover:text-[#042c1c]"
                        >
                          Need more fields? Open full editor →
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#1A1A1A]/70 mt-2">
                        <span>{p.developer_name || p.developer?.name || "Developer —"}</span>
                        <span>{p.location || p.emirate || "Location —"}</span>
                        <span>From AED {p.price_from?.toLocaleString() ?? "—"}</span>
                        <span>Handover {p.handover_date ?? "—"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {isEdit ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(p)} disabled={publish.isPending}
                          data-surface="emerald" data-emerald-ok="button"
                          className="jj-surface-emerald allow-white text-white">
                          {publish.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="border-[#B89555]/40 text-[#1A1A1A]">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {p.is_published ? (
                          <Button size="sm" onClick={() => togglePublish(p, false)}
                            data-surface="emerald" data-emerald-action="true"
                            className="jj-cta-emerald allow-white text-white hover:text-white border border-white/20"
                            style={{ color: "#FFFFFF" }}>
                            <XCircle className="allow-white w-3.5 h-3.5 mr-1" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                            <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Unpublish</span>
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => togglePublish(p, true)}
                            data-surface="emerald" data-emerald-action="true"
                            className="jj-cta-emerald allow-white text-white hover:text-white border border-white/20"
                            style={{ color: "#FFFFFF" }}>
                            <CheckCircle2 className="allow-white w-3.5 h-3.5 mr-1" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                            <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Publish</span>
                          </Button>
                        )}
                        <Button size="sm" onClick={() => setEditing(p.id)}
                          data-surface="emerald" data-emerald-action="true"
                          className="jj-cta-emerald allow-white text-white hover:text-white border border-white/20"
                          style={{ color: "#FFFFFF" }}>
                          <Edit3 className="allow-white w-3.5 h-3.5 mr-1" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                          <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Edit</span>
                        </Button>
                        {p.is_published && p.slug && (
                          <Button size="sm" onClick={() => window.open(`/projects/${p.slug}`, "_blank")}
                            data-surface="emerald" data-emerald-action="true"
                            className="jj-cta-emerald allow-white text-white hover:text-white border border-white/20"
                            style={{ color: "#FFFFFF" }}>
                            <ExternalLink className="allow-white w-3.5 h-3.5 mr-1" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                            <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>View</span>
                          </Button>
                        )}
                      </>

                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {allProjects && allProjects.length >= pageSize && (
        <div className="flex justify-center pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPageSize((s) => s + PAGE_SIZE)}
            className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
          >
            Load more projects
          </Button>
        </div>
      )}
      </section>

      {isOwner && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-[#064E3B]" />
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Resale projects</h2>
            <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">{resaleProjects.length}</Badge>
          </div>
          {loadingResale ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#1A1A1A]/60" /></div>
          ) : resaleProjects.length === 0 ? (
            <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-8 rounded-lg text-center">
              <p className="text-[#1A1A1A]/70">No resale projects found.</p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {resaleProjects.map((p) => (
                <Card key={p.id} className="bg-[#F7F2EA] border-[#B89555]/40 p-4 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#1A1A1A] truncate">{p.project_name || p.title || "Unnamed resale"}</h3>
                      <p className="text-sm text-[#1A1A1A]/70 mt-1 truncate">{p.developer_name || "Developer —"} · {p.area_name || p.emirate || "Location —"}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#1A1A1A]/70 mt-2">
                        <span>AED {p.asking_price?.toLocaleString() ?? "—"}</span>
                        <span>{p.bedrooms ?? "—"} BR</span>
                        <span>{p.property_type || "Property"}</span>
                        <span>{p.handover_status || "Resale"}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-[#B89555]/40 text-[#1A1A1A]">Resale</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default DeveloperLiveEditor;
