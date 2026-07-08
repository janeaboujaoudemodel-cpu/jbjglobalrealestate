/**
 * Owner Enrichment Review — lists pending AI-extracted drafts and lets the
 * owner approve (auto-fill empty fields only) or reject them.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText, Sparkles, Loader2, ExternalLink } from "lucide-react";

interface Draft {
  id: string;
  target_type: string;
  target_id: string;
  target_slug: string | null;
  source_file_url: string | null;
  source_file_name: string | null;
  extracted_fields: Record<string, any>;
  current_snapshot: Record<string, any>;
  status: string;
  ai_model: string | null;
  created_at: string;
}

const isEmpty = (v: any) =>
  v === null || v === undefined || v === "" ||
  (Array.isArray(v) && v.length === 0);

export default function OwnerEnrichmentReview() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ["enrichment-drafts", filter],
    queryFn: async (): Promise<Draft[]> => {
      let q = supabase.from("enrichment_review_drafts").select("*").order("created_at", { ascending: false }).limit(100);
      if (filter === "pending") q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const approve = async (d: Draft) => {
    setBusyId(d.id);
    try {
      const table = d.target_type === "developer" ? "developers" : "projects";
      // Only fill EMPTY current fields — never overwrite.
      const payload: Record<string, any> = {};
      const applied: string[] = [];
      const skipped: string[] = [];
      for (const [k, v] of Object.entries(d.extracted_fields || {})) {
        if (isEmpty(v)) continue;
        if (!isEmpty(d.current_snapshot?.[k])) { skipped.push(k); continue; }
        payload[k] = v;
        applied.push(k);
      }

      if (Object.keys(payload).length > 0) {
        payload.updated_at = new Date().toISOString();
        const { error: upErr } = await supabase.from(table as any).update(payload).eq("id", d.target_id);
        if (upErr) throw upErr;
      }

      const { error } = await supabase.from("enrichment_review_drafts").update({
        status: applied.length ? (skipped.length ? "partial" : "approved") : "rejected",
        applied_fields: applied,
        skipped_fields: skipped,
        reviewed_at: new Date().toISOString(),
      }).eq("id", d.id);
      if (error) throw error;

      toast.success(`Approved · filled ${applied.length} empty field${applied.length === 1 ? "" : "s"}${skipped.length ? ` · skipped ${skipped.length} (already filled)` : ""}`);
      qc.invalidateQueries({ queryKey: ["enrichment-drafts"] });
    } catch (e: any) {
      toast.error(e.message || "Approve failed");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (d: Draft) => {
    setBusyId(d.id);
    const { error } = await supabase.from("enrichment_review_drafts").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
    }).eq("id", d.id);
    if (error) toast.error(error.message);
    else { toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["enrichment-drafts"] }); }
    setBusyId(null);
  };

  const summary = useMemo(() => ({
    pending: drafts.filter(d => d.status === "pending").length,
    approved: drafts.filter(d => d.status === "approved" || d.status === "partial").length,
    rejected: drafts.filter(d => d.status === "rejected").length,
  }), [drafts]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-semibold tracking-tight">Enrichment Review</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        AI-extracted fields from uploaded PDFs. Approve to auto-fill <strong>empty</strong> fields only —
        your existing values are never overwritten.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === "pending" ? "bg-emerald-900 text-white" : "bg-muted text-foreground"}`}>
          Pending ({summary.pending})
        </button>
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === "all" ? "bg-emerald-900 text-white" : "bg-muted text-foreground"}`}>
          All
        </button>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!isLoading && drafts.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No {filter === "pending" ? "pending" : ""} drafts. Upload a company profile PDF on a developer page to generate one.
        </div>
      )}

      <div className="space-y-4">
        {drafts.map((d) => {
          const fields = Object.entries(d.extracted_fields || {}).filter(([, v]) => !isEmpty(v));
          const willFill = fields.filter(([k]) => isEmpty(d.current_snapshot?.[k]));
          const willSkip = fields.filter(([k]) => !isEmpty(d.current_snapshot?.[k]));

          return (
            <div key={d.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="uppercase text-[10px] tracking-wider font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {d.target_type}
                    </span>
                    <span className="text-xs text-muted-foreground">{d.ai_model}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                      d.status === "pending" ? "bg-amber-100 text-amber-900" :
                      d.status === "approved" ? "bg-emerald-100 text-emerald-900" :
                      d.status === "partial" ? "bg-blue-100 text-blue-900" :
                      "bg-red-100 text-red-900"
                    }`}>{d.status}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span className="truncate">{d.source_file_name || "uploaded file"}</span>
                    {d.source_file_url && (
                      <a href={d.source_file_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-800 hover:underline inline-flex items-center gap-0.5">
                        open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {d.target_type} · <a href={d.target_type === "developer" ? `/developer/${d.target_slug}` : `/project/${d.target_slug}`} target="_blank" rel="noreferrer" className="hover:underline text-emerald-800">
                      /{d.target_type}/{d.target_slug}
                    </a>
                  </div>
                </div>
                {d.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => reject(d)} disabled={busyId === d.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-red-200 text-red-800 hover:bg-red-50">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button onClick={() => approve(d)} disabled={busyId === d.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-900 text-white hover:bg-emerald-800 disabled:opacity-50">
                      {busyId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Approve (fill {willFill.length})
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {fields.length === 0 && <div className="text-muted-foreground text-xs">No usable fields extracted.</div>}
                {fields.map(([k, v]) => {
                  const already = !isEmpty(d.current_snapshot?.[k]);
                  return (
                    <div key={k} className={`rounded border px-3 py-2 ${already ? "bg-muted/40 border-dashed" : "bg-emerald-50/50 border-emerald-200"}`}>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{k}</div>
                      <div className="text-xs mt-0.5 whitespace-pre-wrap break-words">
                        {Array.isArray(v) ? v.join(", ") : String(v)}
                      </div>
                      {already && (
                        <div className="mt-1 text-[10px] text-muted-foreground italic">
                          Skipped — current: {Array.isArray(d.current_snapshot[k]) ? d.current_snapshot[k].join(", ") : String(d.current_snapshot[k]).slice(0, 80)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {d.status !== "pending" && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Filled: {(d as any).applied_fields?.join(", ") || "—"} · Skipped: {(d as any).skipped_fields?.join(", ") || "—"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
