import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Sparkles, Check, X, RefreshCw, Zap, CheckSquare, Square, ArrowRight } from "lucide-react";

interface LogRow {
  id: string;
  developer_id: string;
  before_jsonb: Record<string, unknown>;
  after_jsonb: Record<string, unknown>;
  source_url: string | null;
  status: string;
  created_at: string;
  error: string | null;
  developers: { name: string; slug: string } | null;
}

const FIELDS = ["description", "logo_url", "website_url", "founded_year", "headquarters", "ceo_name", "specialization", "notable_projects"] as const;

export default function DeveloperEnrichmentQueue() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: logs, isLoading } = useQuery({
    queryKey: ["dev-enrichment-logs", search],
    queryFn: async () => {
      const q = supabase
        .from("developer_enrichment_log")
        .select("id, developer_id, before_jsonb, after_jsonb, source_url, status, created_at, error, developers(name, slug)")
        .order("created_at", { ascending: false })
        .limit(100);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as unknown as LogRow[];
      if (search.trim()) {
        const s = search.toLowerCase();
        rows = rows.filter((r) => r.developers?.name?.toLowerCase().includes(s));
      }
      return rows;
    },
  });

  const rows = logs ?? [];
  const stagedRows = useMemo(() => rows.filter((r) => r.status === "staged"), [rows]);
  const allStagedSelected = stagedRows.length > 0 && stagedRows.every((r) => selected.has(r.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAllStaged() {
    setSelected((s) => {
      if (stagedRows.every((r) => s.has(r.id))) return new Set();
      return new Set(stagedRows.map((r) => r.id));
    });
  }
  function clearSelection() { setSelected(new Set()); }

  const rebuildOne = useMutation({
    mutationFn: async (developerId: string) => {
      const { data, error } = await supabase.functions.invoke("developer-site-rebuild", {
        body: { developer_id: developerId, preview: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Scrape staged for review");
      qc.invalidateQueries({ queryKey: ["dev-enrichment-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rebuildAllBroken = useMutation({
    mutationFn: async (limit: number) => {
      const { data: broken, error: e1 } = await supabase
        .from("developers")
        .select("id")
        .or("logo_url.is.null,logo_url.eq.,description.is.null")
        .eq("is_hidden", false)
        .order("rank", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (e1) throw e1;
      const ids = (broken ?? []).map((d) => d.id);
      if (!ids.length) return { count: 0 };
      let done = 0;
      for (let i = 0; i < ids.length; i += 5) {
        const slice = ids.slice(i, i + 5);
        const { error } = await supabase.functions.invoke("developer-site-rebuild", {
          body: { developer_ids: slice, preview: true },
        });
        if (error) throw error;
        done += slice.length;
      }
      return { count: done };
    },
    onSuccess: (r) => {
      toast.success(`Staged ${r.count} developer(s) for review`);
      qc.invalidateQueries({ queryKey: ["dev-enrichment-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: async ({ log_id, action }: { log_id: string; action: "approve" | "reject" }) => {
      const { data, error } = await supabase.functions.invoke("apply-developer-enrichment", {
        body: { log_id, action },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      toast.success(v.action === "approve" ? "Applied to developer" : "Rejected");
      qc.invalidateQueries({ queryKey: ["dev-enrichment-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkDecide = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: "approve" | "reject" }) => {
      let ok = 0, fail = 0;
      for (const id of ids) {
        try {
          const { error } = await supabase.functions.invoke("apply-developer-enrichment", {
            body: { log_id: id, action },
          });
          if (error) throw error;
          ok++;
        } catch (e) {
          console.error("bulk decide failed", id, e);
          fail++;
        }
      }
      return { ok, fail, action };
    },
    onSuccess: (r) => {
      toast.success(`${r.action === "approve" ? "Applied" : "Rejected"} ${r.ok}${r.fail ? ` · ${r.fail} failed` : ""}`);
      clearSelection();
      qc.invalidateQueries({ queryKey: ["dev-enrichment-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedList = useMemo(() => Array.from(selected), [selected]);

  return (
    <div className="space-y-4">
      {/* Explainer: Directory vs Site Rebuild */}
      <Card className="p-4 bg-[#FDFBF7] border border-[#B89555]/30">
        <div className="flex items-start gap-3">
          <Sparkles className="size-4 text-[#1A1A1A] mt-0.5 shrink-0" />
          <div className="text-sm text-[#1A1A1A]/80 space-y-1">
            <p><span className="font-semibold text-[#1A1A1A]">Site Rebuild</span> = approval queue. Every scrape lands here first as a draft. Nothing reaches the public site until you click <span className="font-semibold">Apply</span>.</p>
            <p><span className="font-semibold text-[#1A1A1A]">Directory</span> = the live list of developers — where you pick who to (re-)scrape. The "Rebuild 25 broken" button below does both in one click.</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
        <div className="flex items-center gap-3 flex-wrap">
          <Sparkles className="size-4 text-[#1A1A1A]" />
          <h2 className="text-base font-semibold">Site Rebuild Queue</h2>
          <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
            {rows.length} entries · {stagedRows.length} staged
          </Badge>
          <div className="ml-auto flex gap-2 items-center flex-wrap">
            <Input
              placeholder="Filter by developer name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64"
            />
            <Button
              variant="gold"
              size="sm"
              disabled={rebuildAllBroken.isPending}
              onClick={() => rebuildAllBroken.mutate(25)}
            >
              <Zap className="size-3 mr-1" />
              {rebuildAllBroken.isPending ? "Running…" : "Rebuild 25 broken"}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/developer-hub-admin/directory">Pick from directory →</a>
            </Button>
          </div>
        </div>

        {stagedRows.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#B89555]/20 flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={toggleAllStaged}>
              {allStagedSelected ? <CheckSquare className="size-4 mr-1" /> : <Square className="size-4 mr-1" />}
              {allStagedSelected ? "Unselect all staged" : "Select all staged"}
            </Button>
            {selected.size > 0 && (
              <>
                <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
                  {selected.size} selected
                </Badge>
                <Button
                  size="sm"
                  variant="gold"
                  disabled={bulkDecide.isPending}
                  onClick={() => bulkDecide.mutate({ ids: selectedList, action: "approve" })}
                >
                  <Check className="size-3 mr-1" /> Apply selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkDecide.isPending}
                  onClick={() => bulkDecide.mutate({ ids: selectedList, action: "reject" })}
                >
                  <X className="size-3 mr-1" /> Reject selected
                </Button>
                <Button size="sm" variant="outline" onClick={clearSelection}>Clear</Button>
              </>
            )}
          </div>
        )}
      </Card>

      {isLoading && <p className="text-sm text-[#1A1A1A]/70">Loading…</p>}

      {rows.length === 0 && !isLoading && (
        <Card className="p-8 text-center bg-[#F7F2EA] border border-[#B89555]/30">
          <p className="text-[#1A1A1A]/70">No enrichment runs yet. Go to <a href="/developer-hub-admin/directory" className="underline">Directory</a> and click "Rebuild from site" on any developer.</p>
        </Card>
      )}

      <div className="space-y-3">
        {rows.map((log) => {
          const isSel = selected.has(log.id);
          const isStaged = log.status === "staged";
          return (
            <Card
              key={log.id}
              className={`p-4 bg-[#F7F2EA] border ${isSel ? "border-[#B89555] ring-1 ring-[#B89555]" : "border-[#B89555]/30"}`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  {isStaged && (
                    <Checkbox
                      checked={isSel}
                      onCheckedChange={() => toggleOne(log.id)}
                      className="mt-1"
                      aria-label={`Select ${log.developers?.name ?? "log"}`}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{log.developers?.name ?? "(unknown)"}</h3>
                    <p className="text-xs text-[#1A1A1A]/60 mt-1">
                      {new Date(log.created_at).toLocaleString()} · status: <span className="font-medium">{log.status}</span>
                      {log.source_url && (
                        <> · source: <a href={log.source_url} target="_blank" rel="noreferrer" className="underline">{(() => { try { return new URL(log.source_url!).hostname; } catch { return log.source_url; } })()}</a></>
                      )}
                      {log.developers?.slug && (
                        <> · <a href={`/developer-hub-admin/profile/${log.developers.slug}`} className="underline">Open full profile</a></>
                      )}
                    </p>
                    {log.error && <p className="text-xs text-red-600 mt-1">{log.error}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rebuildOne.mutate(log.developer_id)}
                    disabled={rebuildOne.isPending}
                  >
                    <RefreshCw className="size-3 mr-1" /> Re-scrape
                  </Button>
                  {isStaged && (
                    <>
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => decide.mutate({ log_id: log.id, action: "approve" })}
                        disabled={decide.isPending}
                      >
                        <Check className="size-3 mr-1" /> Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide.mutate({ log_id: log.id, action: "reject" })}
                        disabled={decide.isPending}
                      >
                        <X className="size-3 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <DiffTable before={log.before_jsonb} after={log.after_jsonb} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function fmt(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function DiffTable({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const visibleFields = FIELDS.filter((f) => {
    const a = fmt(after?.[f]);
    const b = fmt(before?.[f]);
    return a !== "" || b !== "";
  });

  if (visibleFields.length === 0) {
    return <p className="text-xs text-[#1A1A1A]/50 mt-3 italic">No changes proposed.</p>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded border border-[#B89555]/30">
      <div className="grid grid-cols-[120px,1fr,16px,1fr] bg-[#EFE6D6] text-[10px] uppercase tracking-wide text-[#1A1A1A]/70">
        <div className="px-3 py-2 border-r border-[#B89555]/30">Field</div>
        <div className="px-3 py-2 border-r border-[#B89555]/30">Before (live)</div>
        <div className="border-r border-[#B89555]/30" />
        <div className="px-3 py-2">After (proposed)</div>
      </div>
      {visibleFields.map((f, i) => {
        const b = fmt(before?.[f]);
        const a = fmt(after?.[f]);
        const changed = a !== b;
        return (
          <div
            key={f}
            className={`grid grid-cols-[120px,1fr,16px,1fr] text-xs items-stretch ${
              i % 2 === 0 ? "bg-[#FDFBF7]" : "bg-[#F7F2EA]"
            }`}
          >
            <div className="px-3 py-2 border-r border-[#B89555]/20 font-medium text-[#1A1A1A]/70 break-words self-start">{f}</div>
            <div className="px-3 py-2 border-r border-[#B89555]/20 text-[#1A1A1A]/70 break-words whitespace-pre-wrap self-start">
              {f === "logo_url" && b ? (
                <img src={b} alt="" className="h-8 max-w-[140px] object-contain bg-[#FDFBF7] rounded border border-[#B89555]/20 p-1" />
              ) : b ? b : <span className="italic text-[#1A1A1A]/40">—</span>}
            </div>
            <div className="flex items-center justify-center border-r border-[#B89555]/20 text-[#B89555]">
              {changed && <ArrowRight className="size-3" />}
            </div>
            <div className={`px-3 py-2 break-words whitespace-pre-wrap self-start ${changed ? "bg-[#B89555]/10 text-[#1A1A1A] font-medium" : "text-[#1A1A1A]/70"}`}>
              {f === "logo_url" && a ? (
                <img src={a} alt="" className="h-8 max-w-[140px] object-contain bg-[#FDFBF7] rounded border border-[#B89555]/20 p-1" />
              ) : a ? a : <span className="italic text-[#1A1A1A]/40">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
