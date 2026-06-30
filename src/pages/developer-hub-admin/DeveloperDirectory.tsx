import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Sparkles, ExternalLink, Zap, CheckSquare, Square, ShieldCheck, Download, FileSpreadsheet, LayoutGrid, Table2, Building2, Plus, CalendarDays, UserPlus } from "lucide-react";
import { DeveloperVisibilitySheet } from "./DeveloperVisibilitySheet";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";

interface Row {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  last_enriched_at: string | null;
  ceo_name: string | null;
  founded_year: number | null;
  headquarters: string | null;
  completed_projects: number | null;
  offplan_projects: number | null;
  total_units_delivered: number | null;
  upcoming_units: number | null;
  logo_status: string | null;
  project_count: number;
  projects_for_sale: number;
  total_project_units: number;
  avg_price_from: number | null;
  coverage: string[];
}

interface ProjectStatRow {
  id: string;
  developer_id: string | null;
  emirate: string | null;
  location: string | null;
  is_published: boolean | null;
  is_sold_out: boolean | null;
  sale_status: string | null;
  availability_status: string | null;
  status: string | null;
  price_from: number | null;
  price_to: number | null;
  total_units: number | null;
  available_units: number | null;
}

const PAGE_SIZE = 60;

const normalizeDeveloperKey = (row: Row) => {
  const SUFFIX = /\b(developments?|developers?|properties|property|realty|real\s*estate|holdings?|holding|group|llc|fz-?llc|pjsc|psc|inc|co|company|international|investments?)\b/gi;
  const nameKey = row.name.replace(SUFFIX, "").replace(/\s{2,}/g, " ").trim().toLowerCase();
  const host = (() => {
    if (!row.website_url) return "";
    try {
      return new URL(row.website_url.startsWith("http") ? row.website_url : `https://${row.website_url}`).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return row.website_url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }
  })();
  return (host || nameKey || row.slug || row.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};

const preferRicherDeveloperRow = (a: Row, b: Row) => {
  const aScore = (a.logo_url ? 10 : 0) + (a.website_url ? 4 : 0) + (a.description?.length ?? 0) / 300;
  const bScore = (b.logo_url ? 10 : 0) + (b.website_url ? 4 : 0) + (b.description?.length ?? 0) / 300;
  return bScore > aScore ? b : a;
};

export default function DeveloperDirectory() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [onlyBroken, setOnlyBroken] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [accumulated, setAccumulated] = useState<Row[]>([]);
  const [visOpen, setVisOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "excel">("cards");

  // Reset pagination when filters change
  useEffect(() => { setPage(0); setAccumulated([]); }, [search, onlyBroken]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dev-hub-directory", search, onlyBroken, page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("developers")
        .select("id, name, slug, logo_url, website_url, description, last_enriched_at, ceo_name, founded_year, headquarters, completed_projects, offplan_projects, total_units_delivered, upcoming_units, logo_status", { count: "exact" })
        .eq("is_hidden", false)
        .order("name")
        .range(from, to);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      if (onlyBroken) q = q.or("logo_url.is.null,logo_url.eq.,description.is.null");
      const { data, error, count } = await q;
      if (error) throw error;
      return {
        rows: (data ?? []).map((row: any) => ({
          ...row,
          project_count: 0,
          projects_for_sale: 0,
          total_project_units: 0,
          avg_price_from: null,
          coverage: [],
        })) as Row[],
        total: count ?? 0,
      };
    },
  });

  useEffect(() => {
    if (!data) return;
    setAccumulated((prev) => {
      if (page === 0) return data.rows;
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...data.rows.filter((r) => !seen.has(r.id))];
    });
  }, [data, page]);

  const dedupedRows = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of accumulated) {
      const key = normalizeDeveloperKey(row) || row.id;
      map.set(key, map.has(key) ? preferRicherDeveloperRow(map.get(key)!, row) : row);
    }
    return Array.from(map.values());
  }, [accumulated]);

  const developerIds = useMemo(() => dedupedRows.map((r) => r.id), [dedupedRows]);

  const { data: projectStats } = useQuery({
    queryKey: ["dev-directory-project-stats", developerIds],
    enabled: developerIds.length > 0,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, developer_id, emirate, location, is_published, is_sold_out, sale_status, availability_status, status, price_from, price_to, total_units, available_units")
        .in("developer_id", developerIds)
        .is("deleted_at", null)
        .limit(5000);
      if (error) throw error;

      const map = new Map<string, {
        project_count: number;
        projects_for_sale: number;
        total_project_units: number;
        avg_price_from: number | null;
        coverage: string[];
      }>();

      for (const project of ((data ?? []) as ProjectStatRow[])) {
        if (!project.developer_id) continue;
        const stat = map.get(project.developer_id) ?? {
          project_count: 0,
          projects_for_sale: 0,
          total_project_units: 0,
          avg_price_from: null,
          coverage: [],
        };
        stat.project_count += 1;
        stat.total_project_units += Number(project.total_units ?? project.available_units ?? 0);
        const statusText = `${project.sale_status ?? ""} ${project.availability_status ?? ""} ${project.status ?? ""}`.toLowerCase();
        const isForSale = project.is_published !== false && !project.is_sold_out && !/sold\s*out|unavailable|inactive|archived/.test(statusText);
        if (isForSale) stat.projects_for_sale += 1;
        if (project.price_from && project.price_from > 0) {
          const previousTotal = (stat.avg_price_from ?? 0) * Math.max(stat.project_count - 1, 0);
          stat.avg_price_from = Math.round((previousTotal + project.price_from) / stat.project_count);
        }
        const place = (project.emirate || project.location || "").trim();
        if (place && !stat.coverage.includes(place)) stat.coverage.push(place);
        map.set(project.developer_id, stat);
      }
      return map;
    },
  });

  const rows = useMemo(() => dedupedRows.map((row) => ({
    ...row,
    ...(projectStats?.get(row.id) ?? {}),
  })), [dedupedRows, projectStats]);
  const total = data?.total ?? rows.length;
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((s) => {
      if (rows.every((r) => s.has(r.id))) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }
  function clearSelection() { setSelected(new Set()); }

  const rebuild = useMutation({
    mutationFn: async (developerIds: string[]) => {
      let done = 0;
      for (let i = 0; i < developerIds.length; i += 5) {
        const slice = developerIds.slice(i, i + 5);
        const { error } = await supabase.functions.invoke("developer-site-rebuild", {
          body: { developer_ids: slice, preview: true },
        });
        if (error) throw error;
        done += slice.length;
      }
      return { count: done };
    },
    onSuccess: (r) => {
      toast.success(`Staged ${r.count} for review`, {
        action: { label: "Open queue", onClick: () => navigate("/owner/developers/profile-rebuild") },
      });
      clearSelection();
      qc.invalidateQueries({ queryKey: ["dev-enrichment-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedList = useMemo(() => Array.from(selected), [selected]);
  const canLoadMore = rows.length < total;

  const exportRows = useMemo(() => rows.map((d) => ({
    "Developer Name": d.name,
    "Founded Date": d.founded_year ?? "",
    "Owner / Founder / CEO": d.ceo_name ?? "",
    "Headquarters": d.headquarters ?? "",
    "Countries / Emirates": d.coverage?.length ? d.coverage.join(", ") : "Dubai / UAE",
    "Units Delivered": d.total_units_delivered ?? "",
    "Total Projects": d.project_count || d.completed_projects || 0,
    "Projects For Sale": d.projects_for_sale || d.offplan_projects || 0,
    "Completed Projects": d.completed_projects ?? "",
    "Upcoming Units": d.upcoming_units ?? "",
    "Total Project Units": d.total_project_units || "",
    "Average Starting Price": d.avg_price_from ?? "",
    "Logo Status": d.logo_url ? "Logo available" : (d.logo_status ?? "missing"),
    "Website": d.website_url ?? "",
    "Profile Slug": d.slug,
    "Last Enriched Dubai Time": d.last_enriched_at ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" }).format(new Date(d.last_enriched_at)) : "",
  })), [rows]);

  const exportFileStem = () => {
    const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return `JBJ-developer-registry-${stamp}`;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!exportRows.length) return;
    const headers = Object.keys(exportRows[0]);
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(","), ...exportRows.map((row) => headers.map((h) => escape((row as Record<string, unknown>)[h])).join(","))].join("\n");
    downloadBlob(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }), `${exportFileStem()}.csv`);
    toast.success("Developer CSV downloaded");
  };

  const exportExcel = async () => {
    if (!exportRows.length) return;
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = Object.keys(exportRows[0]).map((key) => ({ wch: Math.max(16, key.length + 4) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Developers");
    const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${exportFileStem()}.xlsx`);
    toast.success("Developer Excel downloaded");
  };

  return (
    <div className="space-y-5 max-w-full overflow-hidden">
      <div className="rounded-[28px] border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6 shadow-[0_24px_60px_-42px_rgba(26,26,26,0.45)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <span data-surface="emerald" className="allow-white shrink-0 size-12 rounded-2xl jj-emerald-metallic flex items-center justify-center shadow-[0_16px_34px_-20px_rgba(6,78,59,0.9)]">
              <Building2 className="size-5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] font-black text-[#B89555]">Owner Backend · Developers</p>
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Developers Portal</h1>
              <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">Owner-only command center for developers, projects, briefing requests, launch events, profile updates, sales reps, logo governance and Excel exports.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/owner/developers/add")}>
              <UserPlus className="size-4 mr-1" /> Add Developer
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/owner/developers/new-project")}>
              <Plus className="size-4 mr-1" /> Add Project
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/owner/developers/briefings")}>
              <CalendarDays className="size-4 mr-1" /> Apply Briefing
            </Button>
            <Button size="sm" variant={viewMode === "cards" ? "gold" : "outline"} onClick={() => setViewMode("cards")}>
              <LayoutGrid className="size-4 mr-1" /> Cards
            </Button>
            <Button size="sm" variant={viewMode === "excel" ? "gold" : "outline"} onClick={() => setViewMode("excel")}>
              <Table2 className="size-4 mr-1" /> Excel View
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!rows.length}>
              <Download className="size-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="gold" onClick={exportExcel} disabled={!rows.length}>
              <FileSpreadsheet className="size-4 mr-1" /> Download Excel
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-5 bg-[#FDFBF7] border border-[#B89555]/30 shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
        <p className="text-sm text-[#1A1A1A]/80">
          <span className="font-semibold text-[#1A1A1A]">Developers Portal</span> = the live owner-side developer control surface. Click <span className="font-semibold">Open profile</span> for full details (projects, media, sales reps, activity), or <span className="font-semibold">Rebuild from site</span> to scrape their website — every scrape stages in <a href="/owner/developers/profile-rebuild" className="underline">Profile Rebuild</a> for your approval before going live. Use <span className="font-semibold">Visibility access</span> to publish or hide contact fields in bulk.
        </p>
      </Card>

      <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 flex items-center gap-3 flex-wrap shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
        <Input
          placeholder="Search developer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-72"
        />
        <Button
          variant={onlyBroken ? "gold" : "outline"}
          size="sm"
          onClick={() => setOnlyBroken((v) => !v)}
        >
          {onlyBroken ? "Showing broken only" : "Show broken only"}
        </Button>

        <Button size="sm" variant="outline" onClick={toggleAll}>
          {allSelected ? <CheckSquare className="size-4 mr-1" /> : <Square className="size-4 mr-1" />}
          {allSelected ? "Unselect all" : "Select all loaded"}
        </Button>

        <Button size="sm" variant="outline" onClick={() => setVisOpen(true)}>
          <ShieldCheck className="size-4 mr-1" /> Visibility access
        </Button>

        {selected.size > 0 && (
          <>
            <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
              {selected.size} selected
            </Badge>
            <Button
              size="sm"
              variant="gold"
              disabled={rebuild.isPending}
              onClick={() => rebuild.mutate(selectedList.slice(0, 25))}
            >
              <Zap className="size-3 mr-1" />
              {rebuild.isPending ? "Rebuilding…" : `Rebuild ${Math.min(selected.size, 25)} selected`}
            </Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>Clear</Button>
          </>
        )}

        <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] ml-auto">
          {rows.length} of {total} shown
        </Badge>
      </Card>

      {isLoading && page === 0 && <p className="text-sm text-[#1A1A1A]/70">Loading…</p>}

      {viewMode === "excel" ? (
        <Card className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl overflow-hidden shadow-[0_18px_42px_-34px_rgba(26,26,26,0.42)]">
          <div className="overflow-x-auto jj-scrollbar-gold">
            <table className="w-full min-w-[1320px] text-sm">
              <thead className="bg-[#EFE6D6] border-b border-[#B89555]/35">
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#1A1A1A]/70">
                  <th className="px-4 py-3 font-black">Developer</th>
                  <th className="px-4 py-3 font-black">Founded</th>
                  <th className="px-4 py-3 font-black">Owner / Founder</th>
                  <th className="px-4 py-3 font-black">Units Delivered</th>
                  <th className="px-4 py-3 font-black">For Sale</th>
                  <th className="px-4 py-3 font-black">Total Projects</th>
                  <th className="px-4 py-3 font-black">Coverage</th>
                  <th className="px-4 py-3 font-black">Avg. Price</th>
                  <th className="px-4 py-3 font-black">Logo</th>
                  <th className="px-4 py-3 font-black">Website</th>
                  <th className="px-4 py-3 font-black">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-[#B89555]/15 align-middle hover:bg-[#FDFBF7]">
                    <td className="px-4 py-3 min-w-[260px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggleOne(d.id)} aria-label={`Select ${d.name}`} />
                        <DeveloperLogo
                          src={!brokenImgs.has(d.id) ? d.logo_url : null}
                          alt={`${d.name} logo`}
                          name={d.name}
                          variant="tile"
                          renderFallback
                          className="size-10 rounded-xl border-[#B89555]/40 bg-[#FDFBF7]"
                          onError={() => setBrokenImgs((s) => new Set(s).add(d.id))}
                        />
                        <div className="min-w-0">
                          <p className="font-black text-[#1A1A1A] truncate">{d.name}</p>
                          <p className="text-xs text-[#1A1A1A]/55 truncate">{d.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{d.founded_year ?? "—"}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] max-w-[170px] truncate">{d.ceo_name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] font-bold">{(d.total_units_delivered ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] font-bold">{(d.projects_for_sale || d.offplan_projects || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] font-bold">{(d.project_count || d.completed_projects || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] max-w-[180px] truncate">{d.coverage?.length ? d.coverage.slice(0, 4).join(", ") : (d.headquarters ?? "Dubai / UAE")}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{d.avg_price_from ? `AED ${d.avg_price_from.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3"><Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">{d.logo_url ? "Ready" : (d.logo_status ?? "Missing")}</Badge></td>
                    <td className="px-4 py-3 max-w-[170px] truncate">
                      {d.website_url ? <a href={d.website_url} target="_blank" rel="noreferrer" className="text-[#1A1A1A] underline decoration-[#B89555]/50">Website</a> : <span className="text-[#1A1A1A]/45">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="gold">
                        <Link to={`/owner/developers/${d.slug}`}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((d) => {
          const isSel = selected.has(d.id);
          return (
            <Card
              key={d.id}
              className={`p-5 bg-[#F7F2EA] border rounded-2xl shadow-[0_18px_42px_-34px_rgba(26,26,26,0.42)] ${isSel ? "border-[#B89555] ring-1 ring-[#B89555]" : "border-[#B89555]/30"}`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSel}
                  onCheckedChange={() => toggleOne(d.id)}
                  className="mt-1"
                  aria-label={`Select ${d.name}`}
                />
                <DeveloperLogo
                  src={!brokenImgs.has(d.id) ? d.logo_url : null}
                  alt={`${d.name} logo`}
                  name={d.name}
                  variant="tile"
                  renderFallback
                  className="size-16 rounded-xl border-[#B89555]/40 bg-[#FDFBF7] shadow-[0_10px_24px_-18px_rgba(26,26,26,0.55)]"
                  onError={() => setBrokenImgs((s) => new Set(s).add(d.id))}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-[#1A1A1A] text-[16px] leading-tight truncate">{d.name}</p>
                  <p className="text-xs text-[#1A1A1A]/60 truncate">{d.slug}</p>
                  {d.website_url && (
                    <a href={d.website_url} target="_blank" rel="noreferrer" className="text-xs text-[#1A1A1A]/70 underline flex items-center gap-1 mt-1">
                      <ExternalLink className="size-3" />
                      {(() => { try { return new URL(d.website_url).hostname; } catch { return d.website_url; } })()}
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/55 font-black">For Sale</p>
                  <p className="text-[#1A1A1A] font-black">{(d.projects_for_sale || d.offplan_projects || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/55 font-black">Projects</p>
                  <p className="text-[#1A1A1A] font-black">{(d.project_count || d.completed_projects || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/55 font-black">Units</p>
                  <p className="text-[#1A1A1A] font-black">{(d.total_units_delivered ?? 0).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-[#1A1A1A]/75 mt-3 line-clamp-2 leading-relaxed">
                {d.description ?? <span className="italic text-[#1A1A1A]/40">No description</span>}
              </p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Button asChild size="sm" variant="gold">
                  <Link to={`/owner/developers/${d.slug}`}>
                    <ExternalLink className="size-3 mr-1" /> Open profile
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rebuild.mutate([d.id])}
                  disabled={rebuild.isPending}
                >
                  <Sparkles className="size-3 mr-1" /> Rebuild from site
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {canLoadMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {isFetching ? "Loading…" : `Load ${Math.min(PAGE_SIZE, total - rows.length)} more`}
          </Button>
        </div>
      )}

      <DeveloperVisibilitySheet
        open={visOpen}
        onOpenChange={setVisOpen}
        selectedIds={selectedList}
        totalVisible={total}
      />
    </div>
  );
}
