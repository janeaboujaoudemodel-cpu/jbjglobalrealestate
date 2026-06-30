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
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";

interface LogRow {
  id: string;
  developer_id: string;
  before_jsonb: Record<string, unknown>;
  after_jsonb: Record<string, unknown>;
  source_url: string | null;
  status: string;
  created_at: string;
  error: string | null;
  developers: { name: string; slug: string; logo_url: string | null } | null;
}

const FIELDS = [
  "description", "logo_url", "founded_year", "headquarters", "ceo_name",
  "specialization", "notable_projects", "completed_projects", "total_units_delivered",
  "instagram_url", "linkedin_url", "office_phone", "whatsapp",
  "office_address", "google_maps_url", "website_url",
] as const;

export default function DeveloperEnrichmentQueue() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: logs, isLoading } = useQuery({
    queryKey: ["dev-enrichment-logs", search],
    queryFn: async () => {
      const q = supabase
        .from("developer_enrichment_log")
        .select("id, developer_id, before_jsonb, after_jsonb, source_url, status, created_at, error, developers(name, slug, logo_url)")
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
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Explainer: Directory vs Profile Rebuild */}
      <Card className="p-4 bg-[#FDFBF7] border border-[#B89555]/30">
        <div className="flex items-start gap-3">
          <Sparkles className="size-4 text-[#1A1A1A] mt-0.5 shrink-0" />
          <div className="text-sm text-[#1A1A1A]/80 space-y-1">
            <p><span className="font-semibold text-[#1A1A1A]">Profile Rebuild</span> = developer profile approval queue. Every scrape lands here first as a draft. Nothing reaches the public site until you click <span className="font-semibold">Apply</span>.</p>
            <p><span className="font-semibold text-[#1A1A1A]">Developer Directory</span> = the live owner list — where you pick who to (re-)scrape. The "Rebuild 25 broken" button below does both in one click.</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
        <div className="flex items-center gap-3 flex-wrap">
          <Sparkles className="size-4 text-[#1A1A1A]" />
          <h2 className="text-base font-semibold text-[#1A1A1A]">Profile Rebuild Queue</h2>
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
              <a href="/owner/developers">Pick from directory →</a>
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
          <p className="text-[#1A1A1A]/70">No enrichment runs yet. Go to <a href="/owner/developers" className="underline">Developer Directory</a> and click "Rebuild from site" on any developer.</p>
        </Card>
      )}

      <div className="space-y-3">
        {rows.map((log) => {
          const isSel = selected.has(log.id);
          const isStaged = log.status === "staged";
          return (
            <Card
              key={log.id}
              className={`p-4 bg-[#F7F2EA] border rounded-2xl overflow-hidden ${isSel ? "border-[#B89555] ring-1 ring-[#B89555]" : "border-[#B89555]/30"}`}
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
                  <DeveloperLogo
                    src={log.developers?.logo_url ?? null}
                    name={log.developers?.name ?? "Developer"}
                    alt={`${log.developers?.name ?? "Developer"} logo`}
                    variant="tile"
                    renderFallback
                    className="size-11 rounded-xl border-[#B89555]/40 bg-[#FDFBF7] shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1A1A1A]">{log.developers?.name ?? "(unknown)"}</h3>
                    <p className="text-xs text-[#1A1A1A]/60 mt-1">
                      {new Date(log.created_at).toLocaleString()} · status: <span className="font-medium">{log.status}</span>
                      {log.source_url && (
                        <> · source: <a href={log.source_url} target="_blank" rel="noreferrer" className="underline">{(() => { try { return new URL(log.source_url!).hostname; } catch { return log.source_url; } })()}</a></>
                      )}
                      {log.developers?.slug && (
                        <> · <a href={`/owner/developers/${log.developers.slug}`} className="underline">Open full profile</a></>
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

const FIELD_LABELS: Record<typeof FIELDS[number], string> = {
  description: "Description",
  logo_url: "Logo",
  founded_year: "Founded",
  headquarters: "Headquarters",
  ceo_name: "CEO",
  specialization: "Specialization",
  notable_projects: "Notable projects",
  completed_projects: "Completed projects",
  total_units_delivered: "Units delivered",
  instagram_url: "Instagram",
  linkedin_url: "LinkedIn",
  office_phone: "Office phone",
  whatsapp: "WhatsApp",
  office_address: "Office address",
  google_maps_url: "Google Maps",
  website_url: "Website (owner-only)",
};

function linkFor(f: typeof FIELDS[number], v: string): string | null {
  if (!v) return null;
  if (f === "office_phone") return `tel:${v.replace(/\s+/g, "")}`;
  if (f === "whatsapp") {
    const d = v.replace(/[^\d+]/g, "").replace(/^\+/, "");
    return `https://wa.me/${d}`;
  }
  if (f === "instagram_url" || f === "linkedin_url" || f === "google_maps_url" || f === "website_url") {
    return /^https?:\/\//.test(v) ? v : `https://${v}`;
  }
  return null;
}

function DiffTable({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const rows = FIELDS.map((f) => {
    const b = fmt(before?.[f]);
    const aRaw = after?.[f];
    const aProposed = aRaw !== undefined && aRaw !== null && aRaw !== "";
    const a = fmt(aRaw);
    const displayAfter = aProposed ? a : b;
    const changed = aProposed && a !== b;
    const confirmed = aProposed && a === b;
    const isNew = aProposed && !b;
    const kept = !aProposed && !!b;
    return { f, b, a: displayAfter, aProposed, changed, confirmed, isNew, kept, has: !!b || aProposed };
  }).filter((r) => r.has);

  if (rows.length === 0) {
    return <p className="text-xs text-[#1A1A1A]/50 mt-4 italic">No changes proposed.</p>;
  }

  const renderCell = (f: typeof FIELDS[number], v: string, side: "before" | "after", isProposed: boolean) => {
    if (!v) {
      return <span className="italic text-[#1A1A1A]/40 text-xs">{side === "before" ? "Not set yet" : "—"}</span>;
    }
    if (f === "logo_url") {
      return (
        <div className="inline-flex items-center justify-center h-10 px-2 rounded bg-[#FDFBF7] border border-[#B89555]/30">
          <img src={v} alt="" className="h-7 max-w-[160px] object-contain"  loading="lazy" decoding="async" />
        </div>
      );
    }
    const href = linkFor(f, v);
    const className = `text-[13px] leading-relaxed break-words whitespace-pre-wrap ${
      side === "after" && isProposed ? "text-[#1A1A1A] font-medium" : "text-[#1A1A1A]/80"
    }`;
    if (href) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={`${className} underline decoration-[#B89555]/50 hover:decoration-[#B89555]`}>
          {v}
        </a>
      );
    }
    return <p className={className}>{v}</p>;
  };

  const badge = (r: typeof rows[number]) => {
    if (r.isNew) return { label: "New", cls: "jj-emerald-soft text-[color:var(--emerald-1)] border border-[color:var(--emerald-1)]/30" };
    if (r.changed) return { label: "Updated", cls: "bg-[#B89555]/15 text-[#1A1A1A] border border-[#B89555]/40" };
    if (r.confirmed) return { label: "Confirmed", cls: "bg-[#EFE6D6]/60 text-[#1A1A1A]/70 border border-[#B89555]/20" };
    if (r.kept) return { label: "Kept", cls: "bg-[#FDFBF7] text-[#1A1A1A]/60 border border-[#B89555]/20 italic" };
    return { label: "Unchanged", cls: "bg-[#EFE6D6]/60 text-[#1A1A1A]/60 border border-[#B89555]/20" };
  };

  return (
    <div className="mt-4 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] overflow-hidden">
      <div className="grid grid-cols-[180px,1fr,1fr] bg-[#EFE6D6]/60 border-b border-[#B89555]/30">
        <div className="px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-[#1A1A1A]/70 border-r border-[#B89555]/20">Field</div>
        <div className="px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-[#1A1A1A]/70 border-r border-[#B89555]/20">Current (live)</div>
        <div className="px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-[#1A1A1A]">Proposed</div>
      </div>

      {rows.map((r, i) => {
        const b = badge(r);
        return (
          <div
            key={r.f}
            className={`grid grid-cols-[180px,1fr,1fr] ${i !== 0 ? "border-t border-[#B89555]/15" : ""} ${r.changed || r.isNew ? "bg-[#B89555]/[0.04]" : ""}`}
          >
            <div className="px-4 py-3.5 border-r border-[#B89555]/15 flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#1A1A1A]">{FIELD_LABELS[r.f]}</span>
              <span className={`inline-flex items-center self-start text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${b.cls}`}>
                {b.label}
              </span>
            </div>
            <div className="px-4 py-3.5 border-r border-[#B89555]/15 self-start">
              {renderCell(r.f, r.b, "before", false)}
            </div>
            <div className="px-4 py-3.5 self-start relative">
              {(r.changed || r.isNew) && (
                <ArrowRight className="absolute -left-[9px] top-4 size-[14px] text-[#B89555] bg-[#FDFBF7] rounded-full" />
              )}
              {renderCell(r.f, r.a, "after", r.aProposed)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
