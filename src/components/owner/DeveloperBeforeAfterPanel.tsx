import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, History } from "lucide-react";

const FIELDS = [
  "description",
  "website_url",
  "ceo_name",
  "founded_year",
  "headquarters",
  "logo_url",
  "office_phone",
  "admin_email",
  "whatsapp",
  "completed_projects",
  "offplan_projects",
  "total_units_delivered",
  "upcoming_units",
] as const;

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function DiffRow({ field, before, after }: { field: string; before: unknown; after: unknown }) {
  const changed = fmt(before) !== fmt(after);
  return (
    <tr className="border-t border-[#B89555]/20 align-top">
      <td className="px-3 py-2 text-xs font-semibold text-[#1A1A1A]/70 whitespace-nowrap">{field}</td>
      <td className={`px-3 py-2 text-xs ${changed ? "bg-red-50 text-red-900" : "text-[#1A1A1A]/70"} max-w-[280px] break-words`}>
        {fmt(before)}
      </td>
      <td className={`px-3 py-2 text-xs ${changed ? "bg-emerald-50 text-emerald-900 font-medium" : "text-[#1A1A1A]/70"} max-w-[280px] break-words`}>
        {fmt(after)}
      </td>
    </tr>
  );
}

export default function DeveloperBeforeAfterPanel({
  developerId,
  developerName,
}: {
  developerId: string;
  developerName: string;
}) {
  const [open, setOpen] = useState(true);

  const { data: enrichmentLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["dev-before-after-logs", developerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_enrichment_log")
        .select("id, before_jsonb, after_jsonb, status, source_url, created_at, error")
        .eq("developer_id", developerId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: excelRows = [], isLoading: loadingExcel } = useQuery({
    queryKey: ["dev-before-after-excel", developerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dev_excel_import_review")
        .select("id, bucket, decision, before_data, after_data, changed_fields, reason, created_at, committed_at")
        .eq("matched_developer_id", developerId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const combined = useMemo(() => {
    const items: {
      key: string;
      kind: "excel" | "enrichment";
      before: Record<string, unknown>;
      after: Record<string, unknown>;
      status: string;
      when: string;
      source?: string | null;
      reason?: string | null;
      failed?: boolean;
      dupCount?: number;
    }[] = [];
    for (const r of excelRows) {
      items.push({
        key: `x-${r.id}`,
        kind: "excel",
        before: (r.before_data as Record<string, unknown>) ?? {},
        after: (r.after_data as Record<string, unknown>) ?? {},
        status: r.decision ?? r.bucket,
        when: r.committed_at ?? r.created_at,
        reason: r.reason,
      });
    }
    for (const r of enrichmentLogs) {
      const after = (r.after_jsonb as Record<string, unknown>) ?? {};
      const failed = r.status === "failed" || Object.keys(after).length === 0;
      items.push({
        key: `e-${r.id}`,
        kind: "enrichment",
        before: (r.before_jsonb as Record<string, unknown>) ?? {},
        after,
        status: r.status ?? "unknown",
        when: r.created_at,
        source: r.source_url,
        reason: r.error,
        failed,
      });
    }
    // Collapse repeated failed enrichments (same reason) into a single row with a count
    const sorted = items.sort((a, b) => (a.when < b.when ? 1 : -1));
    const collapsed: typeof items = [];
    for (const it of sorted) {
      const dup = collapsed.find(
        (p) =>
          p.kind === "enrichment" &&
          it.kind === "enrichment" &&
          p.failed &&
          it.failed &&
          (p.reason ?? "") === (it.reason ?? ""),
      );
      if (dup) {
        dup.dupCount = (dup.dupCount ?? 1) + 1;
        continue;
      }
      collapsed.push({ ...it });
    }
    return collapsed;
  }, [excelRows, enrichmentLogs]);

  const loading = loadingLogs || loadingExcel;

  return (
    <Card className="border border-[#B89555]/40 bg-[#FDFBF7]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#064E3B]" />
            <CardTitle className="text-sm font-black text-[#1A1A1A]">
              Before / After · {developerName}
            </CardTitle>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-grid h-7 w-7 place-items-center rounded-full border border-[#B89555]/40 bg-white text-[#064E3B] hover:bg-[#F7F2EA]"
            title={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[11px] text-[#1A1A1A]/60 mt-1">
          Every enrichment attempt (Excel import + AI scrape) is captured here with the exact fields that would change on this developer.
        </p>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {loading && <p className="text-xs text-[#1A1A1A]/60">Loading history…</p>}
          {!loading && combined.length === 0 && (
            <div className="rounded-md border border-dashed border-[#B89555]/40 bg-white p-4 text-xs text-[#1A1A1A]/70">
              No before / after records for this developer yet. Run <span className="font-semibold">Extract intel</span> above or commit an Excel import row from{" "}
              <a className="underline text-[#064E3B]" href="/owner/developers/import-review">/owner/developers/import-review</a> to generate a diff.
            </div>
          )}
          {!loading &&
            combined.map((item) => {
              const keys = Array.from(
                new Set([
                  ...FIELDS,
                  ...Object.keys(item.before),
                  ...Object.keys(item.after),
                ]),
              ).filter((k) => {
                const b = (item.before as any)[k];
                const a = (item.after as any)[k];
                return b !== undefined || a !== undefined;
              });
              return (
                <div key={item.key} className="rounded-md border border-[#B89555]/30 bg-white overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#F7F2EA] border-b border-[#B89555]/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-[#064E3B] text-white border-0 uppercase text-[10px]">
                        {item.kind === "excel" ? "Excel import" : "AI enrichment"}
                      </Badge>
                      <Badge className={`border-0 uppercase text-[10px] ${item.failed ? "bg-red-700 text-white" : "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40"}`}>
                        {item.status}
                      </Badge>
                      {item.dupCount && item.dupCount > 1 && (
                        <Badge className="bg-[#1A1A1A] text-white border-0 uppercase text-[10px]">
                          ×{item.dupCount} attempts
                        </Badge>
                      )}
                      {item.source && (
                        <a href={item.source} target="_blank" rel="noreferrer" className="text-[11px] text-[#064E3B] underline truncate max-w-[280px]">
                          {item.source}
                        </a>
                      )}
                    </div>
                    <span className="text-[11px] text-[#1A1A1A]/55">
                      {new Date(item.when).toLocaleString()}
                    </span>
                  </div>
                  {item.reason && (
                    <div className="px-3 py-2 text-[11px] text-[#1A1A1A]/70 bg-[#FDFBF7] border-b border-[#B89555]/20">
                      {item.reason}
                    </div>
                  )}
                  {item.failed ? (
                    <p className="px-3 py-3 text-xs text-[#1A1A1A]/70">
                      No diff — this attempt produced no new data. Nothing was written to the developer record.
                    </p>
                  ) : keys.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-[#1A1A1A]/60">No field changes captured.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white">
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 w-[180px]">Field</th>
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-red-700/70">Before</th>
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-emerald-700/80">After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map((k) => (
                          <DiffRow key={k} field={k} before={(item.before as any)[k]} after={(item.after as any)[k]} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
        </CardContent>
      )}
    </Card>
  );
}
