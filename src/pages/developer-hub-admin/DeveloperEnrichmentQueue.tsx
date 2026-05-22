import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Check, X, RefreshCw, Zap } from "lucide-react";

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
      // batch 5 at a time to respect Firecrawl rate
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

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
        <div className="flex items-center gap-3 flex-wrap">
          <Sparkles className="size-4 text-[#1A1A1A]" />
          <h2 className="text-base font-semibold">Site Rebuild Queue</h2>
          <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
            {logs?.length ?? 0} entries
          </Badge>
          <div className="ml-auto flex gap-2 items-center">
            <Input
              placeholder="Filter by developer name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64"
            />
            <Button asChild variant="outline">
              <a href="/developer-hub-admin/directory">Pick from directory →</a>
            </Button>
          </div>
        </div>
        <p className="text-xs text-[#1A1A1A]/70 mt-2">
          Scrapes the developer's official site (logo, description, projects, social), stages the result here, and only writes to the live record after you approve. Existing locked logos are preserved.
        </p>
      </Card>

      {isLoading && <p className="text-sm text-[#1A1A1A]/70">Loading…</p>}

      {logs?.length === 0 && !isLoading && (
        <Card className="p-8 text-center bg-[#F7F2EA] border border-[#B89555]/30">
          <p className="text-[#1A1A1A]/70">No enrichment runs yet. Go to <a href="/developer-hub-admin/directory" className="underline">Directory</a> and click "Rebuild from site" on any developer.</p>
        </Card>
      )}

      <div className="space-y-3">
        {logs?.map((log) => (
          <Card key={log.id} className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">{log.developers?.name ?? "(unknown)"}</h3>
                <p className="text-xs text-[#1A1A1A]/60 mt-1">
                  {new Date(log.created_at).toLocaleString()} · status: <span className="font-medium">{log.status}</span>
                  {log.source_url && (
                    <> · source: <a href={log.source_url} target="_blank" rel="noreferrer" className="underline">{new URL(log.source_url).hostname}</a></>
                  )}
                </p>
                {log.error && <p className="text-xs text-red-600 mt-1">{log.error}</p>}
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
                {log.status === "staged" && (
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

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#1A1A1A]/60 mb-1">Before</p>
                <DiffBlock value={log.before_jsonb} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#1A1A1A]/60 mb-1">After (proposed)</p>
                <DiffBlock value={log.after_jsonb} highlight />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DiffBlock({ value, highlight }: { value: Record<string, unknown>; highlight?: boolean }) {
  return (
    <div className={`rounded border p-3 text-xs space-y-1 ${highlight ? "border-[#B89555] bg-[#FDFBF7]" : "border-[#B89555]/30 bg-[#FDFBF7]"}`}>
      {FIELDS.map((f) => {
        const v = value?.[f];
        if (v === undefined || v === null || v === "") return null;
        if (f === "logo_url" && typeof v === "string") {
          return (
            <div key={f} className="flex items-center gap-2">
              <span className="text-[#1A1A1A]/60 w-24 shrink-0">{f}</span>
              <img src={v} alt="" className="h-8 max-w-[120px] object-contain bg-[#F7F2EA] rounded border border-[#B89555]/20 p-1" />
            </div>
          );
        }
        return (
          <div key={f} className="flex gap-2">
            <span className="text-[#1A1A1A]/60 w-24 shrink-0">{f}</span>
            <span className="text-[#1A1A1A] break-words">{String(v)}</span>
          </div>
        );
      })}
    </div>
  );
}
