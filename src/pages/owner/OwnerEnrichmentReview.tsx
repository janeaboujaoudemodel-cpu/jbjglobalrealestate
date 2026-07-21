/**
 * Owner Enrichment Review — card-by-card rebuild.
 * - Emerald pills with locked white text.
 * - Deduplicates suggestions by (target_id, source_file_url) keeping the newest.
 * - Filters "fill 0" rows out of Pending — you only see actionable work.
 * - Renders JSON fields as labeled key/value rows (no raw braces).
 * - Flat card surface, no muted highlight halos.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText, Sparkles, Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

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
  applied_fields?: string[] | null;
  skipped_fields?: string[] | null;
}

const isEmpty = (v: any) =>
  v === null || v === undefined || v === "" ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

const DEVELOPER_NATIVE_FIELDS = new Set([
  "description", "founded_year", "ceo_name", "parent_company", "website_url",
  "admin_email", "office_phone", "whatsapp", "whatsapp_group_url",
  "telegram_group_url", "linkedin_url", "instagram_url", "notable_projects",
  "specialization", "license_number", "completed_projects", "offplan_projects",
  "upcoming_units", "total_units_delivered", "portfolio_worth", "custom_fields",
]);

const humanize = (k: string) =>
  k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Render any extracted value into human-readable rows.
function FieldValue({ value }: { value: any }) {
  const [expanded, setExpanded] = useState(false);

  if (value === null || value === undefined || value === "") {
    return <span className="text-xs text-neutral-400 italic">empty</span>;
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/5 border border-emerald-900/10 text-neutral-800">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => !isEmpty(v));
    return (
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <span className="font-medium text-neutral-700 min-w-[120px]">{humanize(k)}</span>
            <span className="text-neutral-900 break-words min-w-0">
              {Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  const str = String(value);
  const long = str.length > 320;
  const display = !long || expanded ? str : str.slice(0, 320) + "…";
  return (
    <div className="text-xs text-neutral-900 whitespace-pre-wrap break-words leading-relaxed">
      {display}
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="ml-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-900 hover:underline"
        >
          {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Show more <ChevronDown className="w-3 h-3" /></>}
        </button>
      )}
    </div>
  );
}

const EMERALD_PILL: React.CSSProperties = { backgroundColor: "#064E3B", color: "#FFFFFF" };
const EMERALD_OUTLINE: React.CSSProperties = { borderColor: "#064E3B", color: "#064E3B", backgroundColor: "#FFFFFF" };

export default function OwnerEnrichmentReview() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data: rawDrafts = [], isLoading } = useQuery({
    queryKey: ["enrichment-drafts", filter],
    queryFn: async (): Promise<Draft[]> => {
      let q = supabase.from("enrichment_review_drafts").select("*").order("created_at", { ascending: false }).limit(200);
      if (filter === "pending") q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  // Dedupe: keep newest per (target_id, source_file_url). Older duplicates auto-hide.
  const drafts = useMemo(() => {
    const seen = new Map<string, Draft>();
    for (const d of rawDrafts) {
      const key = `${d.target_id}::${d.source_file_url || d.source_file_name || "no-source"}`;
      if (!seen.has(key)) seen.set(key, d);
    }
    return Array.from(seen.values());
  }, [rawDrafts]);

  const computeFill = (d: Draft) => {
    const fields = Object.entries(d.extracted_fields || {}).filter(([, v]) => !isEmpty(v));
    const willFill = fields.filter(([k]) => isEmpty(d.current_snapshot?.[k]));
    return { fields, willFill };
  };

  // In Pending view, hide rows that would fill 0 (clutter — nothing to do).
  const visibleDrafts = useMemo(() => {
    if (filter !== "pending") return drafts;
    return drafts.filter((d) => computeFill(d).willFill.length > 0);
  }, [drafts, filter]);

  const approve = async (d: Draft) => {
    setBusyId(d.id);
    try {
      const table = d.target_type === "developer" ? "developers" : "projects";
      const payload: Record<string, any> = {};
      const applied: string[] = [];
      const skipped: string[] = [];
      const customMerge: Record<string, any> = {};
      for (const [k, v] of Object.entries(d.extracted_fields || {})) {
        if (isEmpty(v)) continue;
        if (table === "developers" && !DEVELOPER_NATIVE_FIELDS.has(k)) {
          const currentCustom = d.current_snapshot?.custom_fields as Record<string, any> | undefined;
          if (!isEmpty(currentCustom?.[k])) { skipped.push(k); continue; }
          customMerge[k] = v;
          applied.push(k);
          continue;
        }
        if (table === "developers" && k === "custom_fields" && v && typeof v === "object" && !Array.isArray(v)) {
          const currentCustom = (d.current_snapshot?.custom_fields as Record<string, any> | undefined) || {};
          for (const [ck, cv] of Object.entries(v as Record<string, any>)) {
            if (isEmpty(cv)) continue;
            if (!isEmpty(currentCustom?.[ck])) skipped.push(`custom_fields.${ck}`);
            else { customMerge[ck] = cv; applied.push(`custom_fields.${ck}`); }
          }
          continue;
        }
        if (!isEmpty(d.current_snapshot?.[k])) { skipped.push(k); continue; }
        payload[k] = v;
        applied.push(k);
      }
      if (Object.keys(customMerge).length > 0) {
        payload.custom_fields = { ...((d.current_snapshot?.custom_fields as Record<string, any>) || {}), ...customMerge };
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
      toast.success(`Filled ${applied.length} field${applied.length === 1 ? "" : "s"}${skipped.length ? ` · skipped ${skipped.length}` : ""}`);
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
    pending: drafts.filter(d => d.status === "pending" && computeFill(d).willFill.length > 0).length,
    empty: drafts.filter(d => d.status === "pending" && computeFill(d).willFill.length === 0).length,
    approved: drafts.filter(d => d.status === "approved" || d.status === "partial").length,
    rejected: drafts.filter(d => d.status === "rejected").length,
  }), [drafts]);

  return (
    <div className="max-w-6xl mx-auto p-6" data-page="enrichment-review">
      <div className="flex items-center gap-3 mb-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={EMERALD_PILL}
          data-no-contrast-guard
        >
          <Sparkles className="w-4 h-4" style={{ color: "#FFFFFF" }} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Enrichment Review</h1>
      </div>
      <p className="text-sm text-neutral-600 mb-5 max-w-3xl">
        AI-extracted fields from uploaded PDFs, developer websites and source links.
        Approving fills <strong>empty</strong> fields only — existing values are never overwritten.
        {summary.empty > 0 && (
          <span className="ml-1 text-neutral-500">
            ({summary.empty} draft{summary.empty === 1 ? "" : "s"} hidden with nothing to fill.)
          </span>
        )}
      </p>

      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setFilter("pending")}
          data-no-contrast-guard
          style={filter === "pending" ? EMERALD_PILL : { backgroundColor: "#FFFFFF", color: "#064E3B", border: "1px solid rgba(6,78,59,0.2)" }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
        >
          Pending ({summary.pending})
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          data-no-contrast-guard
          style={filter === "all" ? EMERALD_PILL : { backgroundColor: "#FFFFFF", color: "#064E3B", border: "1px solid rgba(6,78,59,0.2)" }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
        >
          All
        </button>
      </div>

      {isLoading && <div className="text-sm text-neutral-500">Loading…</div>}
      {!isLoading && visibleDrafts.length === 0 && (
        <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-10 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-emerald-900/40" />
          <div className="text-sm font-semibold text-neutral-900">
            {filter === "pending" ? "Nothing to review" : "No enrichment drafts yet"}
          </div>
          <div className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Run <em>Extract intel</em> or upload a company profile PDF on a developer page to generate suggestions.
          </div>
        </div>
      )}

      <div className="space-y-4">
        {visibleDrafts.map((d) => {
          const { fields, willFill } = computeFill(d);
          const isPending = d.status === "pending";
          const fillCount = willFill.length;

          return (
            <article
              key={d.id}
              className="rounded-xl border border-emerald-900/10 bg-white shadow-sm"
              data-no-contrast-guard
            >
              {/* Header */}
              <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-emerald-900/5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
                      style={EMERALD_PILL}
                      data-no-contrast-guard
                    >
                      {d.target_type}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">{d.ai_model || "—"}</span>
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
                      style={d.status === "rejected"
                        ? { backgroundColor: "#FEE2E2", color: "#991B1B" }
                        : d.status === "approved" || d.status === "partial"
                        ? EMERALD_PILL
                        : { backgroundColor: "#FEF3C7", color: "#92400E" }}
                      data-no-contrast-guard
                    >
                      {d.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900 flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-900 shrink-0" />
                    <span className="truncate">{d.source_file_name || "uploaded source"}</span>
                    {d.source_file_url && (
                      <a
                        href={d.source_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-emerald-900 hover:underline inline-flex items-center gap-0.5 shrink-0"
                      >
                        open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    <a
                      href={d.target_type === "developer" ? `/developer/${d.target_slug}` : `/project/${d.target_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline text-emerald-900 font-medium"
                    >
                      /{d.target_type}/{d.target_slug}
                    </a>
                  </div>
                </div>

                {isPending && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => reject(d)}
                      disabled={busyId === d.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => approve(d)}
                      disabled={busyId === d.id || fillCount === 0}
                      data-no-contrast-guard
                      style={fillCount > 0 ? EMERALD_PILL : { backgroundColor: "#E5E7EB", color: "#6B7280" }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {busyId === d.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#FFFFFF" }} />}
                      {fillCount === 0 ? "Nothing to fill" : `Approve (fill ${fillCount})`}
                    </button>
                  </div>
                )}
              </header>

              {/* Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                {fields.length === 0 && (
                  <div className="text-xs text-neutral-400 italic col-span-2">No usable fields extracted from this source.</div>
                )}
                {fields.map(([k, v]) => {
                  const already = !isEmpty(d.current_snapshot?.[k]);
                  return (
                    <div
                      key={k}
                      className="rounded-lg border px-3 py-2.5"
                      style={already
                        ? { backgroundColor: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)", borderStyle: "dashed" }
                        : { backgroundColor: "#F0FDF4", borderColor: "rgba(6,78,59,0.2)" }}
                    >
                      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-900 mb-1">
                        {humanize(k)}
                      </div>
                      <FieldValue value={v} />
                      {already && (
                        <div className="mt-1.5 text-[10px] text-neutral-500 italic">
                          Skipped — already set
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isPending && (d.applied_fields?.length || d.skipped_fields?.length) ? (
                <footer className="px-4 pb-3 text-[11px] text-neutral-500 border-t border-emerald-900/5 pt-2">
                  {d.applied_fields?.length ? <>Filled: <span className="text-neutral-700">{d.applied_fields.join(", ")}</span></> : null}
                  {d.applied_fields?.length && d.skipped_fields?.length ? " · " : ""}
                  {d.skipped_fields?.length ? <>Skipped: <span className="text-neutral-700">{d.skipped_fields.join(", ")}</span></> : null}
                </footer>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
