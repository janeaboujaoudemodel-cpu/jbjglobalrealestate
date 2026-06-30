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
import { Sparkles, ExternalLink, Zap, CheckSquare, Square, ShieldCheck } from "lucide-react";
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
}

const PAGE_SIZE = 60;

const normalizeDeveloperKey = (row: Row) => {
  const host = (() => {
    if (!row.website_url) return "";
    try {
      return new URL(row.website_url.startsWith("http") ? row.website_url : `https://${row.website_url}`).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return row.website_url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }
  })();
  return (row.slug || host || row.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

  // Reset pagination when filters change
  useEffect(() => { setPage(0); setAccumulated([]); }, [search, onlyBroken]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dev-hub-directory", search, onlyBroken, page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("developers")
        .select("id, name, slug, logo_url, website_url, description, last_enriched_at", { count: "exact" })
        .eq("is_hidden", false)
        .order("name")
        .range(from, to);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      if (onlyBroken) q = q.or("logo_url.is.null,logo_url.eq.,description.is.null");
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data as Row[], total: count ?? 0 };
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

  const rows = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of accumulated) {
      const key = normalizeDeveloperKey(row) || row.id;
      map.set(key, map.has(key) ? preferRicherDeveloperRow(map.get(key)!, row) : row);
    }
    return Array.from(map.values());
  }, [accumulated]);
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
        action: { label: "Open queue", onClick: () => navigate("/developers-portal/enrichment") },
      });
      clearSelection();
      qc.invalidateQueries({ queryKey: ["dev-enrichment-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedList = useMemo(() => Array.from(selected), [selected]);
  const canLoadMore = rows.length < total;

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-[#FDFBF7] border border-[#B89555]/30 shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
        <p className="text-sm text-[#1A1A1A]/80">
          <span className="font-semibold text-[#1A1A1A]">Directory</span> = the live developer list. Click <span className="font-semibold">Open profile</span> for full details (projects, media, sales reps, activity), or <span className="font-semibold">Rebuild from site</span> to scrape their website — every scrape stages in <a href="/developers-portal/enrichment" className="underline">Site Rebuild</a> for your approval before going live. Use <span className="font-semibold">Visibility access</span> to publish or hide contact fields in bulk.
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
              <p className="text-sm text-[#1A1A1A]/75 mt-3 line-clamp-2 leading-relaxed">
                {d.description ?? <span className="italic text-[#1A1A1A]/40">No description</span>}
              </p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Button asChild size="sm" variant="gold">
                  <Link to={`/developers-portal/developers/${d.slug}`}>
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
