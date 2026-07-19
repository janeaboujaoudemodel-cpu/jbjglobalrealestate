/**
 * Developer Excel Import Review
 *
 * Shows every Excel row classified into buckets (enrich / new / protected / duplicate / rejected).
 * Displays a per-row before/after diff and lets the owner approve rows before committing.
 * Also triggers Excel + PDF report generation via the generate-developer-import-report edge fn.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Download, FileSpreadsheet, FileText, PlayCircle } from "lucide-react";

type ReviewRow = {
  id: string;
  batch_id: string;
  row_number: number;
  canonical_key: string;
  developer_name: string;
  bucket: "enrich" | "new" | "protected" | "duplicate" | "rejected";
  matched_developer_id: string | null;
  before_data: Record<string, string | null>;
  after_data: Record<string, string | null>;
  changed_fields: string[];
  reason: string | null;
  decision: "pending" | "approved" | "skipped" | "committed";
  committed_developer_id: string | null;
};

const FIELDS: Array<{ key: string; label: string }> = [
  { key: "name", label: "Name" },
  { key: "ceo_name", label: "Founder / CEO" },
  { key: "founded_year", label: "Founded" },
  { key: "website_url", label: "Website" },
  { key: "google_drive_url", label: "Google Drive" },
  { key: "admin_email", label: "Email" },
  { key: "office_phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram_url", label: "Instagram" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "office_address", label: "Address" },
  { key: "headquarters", label: "Global presence" },
];

export default function DeveloperImportReview() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<ReviewRow["bucket"]>("new");
  const [reportUrls, setReportUrls] = useState<{ xlsx?: string; pdf?: string }>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dev_excel_import_review")
      .select("*")
      .eq("decision", "pending")
      .order("row_number", { ascending: true })
      .limit(3000);
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { enrich: 0, new: 0, protected: 0, duplicate: 0, rejected: 0 };
    rows.forEach((r) => { c[r.bucket] = (c[r.bucket] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => rows.filter((r) => r.bucket === tab), [rows, tab]);

  const runPreview = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.rpc("preview_dev_excel_import_v2");
      if (error) throw error;
      toast.success(`Preview built — ${JSON.stringify((data as any)?.by_bucket ?? {})}`);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const toggleAllInTab = () => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      const allSelected = filtered.every((r) => s.has(r.id));
      if (allSelected) filtered.forEach((r) => s.delete(r.id));
      else filtered.forEach((r) => s.add(r.id));
      return s;
    });
  };

  const commitSelected = async () => {
    const ids = filtered.filter((r) => selectedIds.has(r.id) && (r.bucket === "enrich" || r.bucket === "new")).map((r) => r.id);
    if (!ids.length) { toast.error("Select at least one Enrich or New row"); return; }
    const batchId = filtered[0]?.batch_id;
    if (!batchId) return;
    setCommitting(true);
    try {
      const { data, error } = await supabase.rpc("commit_dev_excel_import_v2", { p_batch: batchId, p_review_ids: ids });
      if (error) throw error;
      const res: any = data;
      toast.success(`Committed — ${res.enriched} enriched, ${res.created} created`);
      setSelectedIds(new Set());
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCommitting(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-developer-import-report", { body: {} });
      if (error) throw error;
      const r: any = data;
      setReportUrls({ xlsx: r.xlsx_url, pdf: r.pdf_url });
      toast.success("Report generated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const renderCell = (v: string | null | undefined) => {
    if (v == null || v === "") return <span className="text-muted-foreground italic">—</span>;
    if (String(v).startsWith("http")) {
      return <a href={String(v)} target="_blank" rel="noreferrer" className="text-primary underline break-all">{String(v).slice(0, 60)}{String(v).length > 60 ? "…" : ""}</a>;
    }
    return <span className="break-all">{String(v)}</span>;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif tracking-tight">Developer Import Review</h1>
          <p className="text-muted-foreground mt-1">Every row from the uploaded Excel classified with a before/after preview. Approve rows before they are written to the database.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={runPreview} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Rebuild preview
          </Button>
          <Button variant="outline" onClick={generateReport} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Generate before/after report
          </Button>
          <Button onClick={commitSelected} disabled={committing || selectedIds.size === 0}>
            {committing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Commit selected ({selectedIds.size})
          </Button>
        </div>
      </div>

      {(reportUrls.xlsx || reportUrls.pdf) && (
        <Card>
          <CardContent className="p-4 flex gap-3 items-center">
            <span className="text-sm text-muted-foreground">Latest report:</span>
            {reportUrls.xlsx && <a href={reportUrls.xlsx} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel</Button></a>}
            {reportUrls.pdf && <a href={reportUrls.pdf} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> Download A4 PDF</Button></a>}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="new">New ({counts.new ?? 0})</TabsTrigger>
          <TabsTrigger value="enrich">Enrich ({counts.enrich ?? 0})</TabsTrigger>
          <TabsTrigger value="duplicate">Duplicates ({counts.duplicate ?? 0})</TabsTrigger>
          <TabsTrigger value="protected">Protected ({counts.protected ?? 0})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={toggleAllInTab}>
              {filtered.every((r) => selectedIds.has(r.id)) && filtered.length > 0 ? "Unselect all" : "Select all in tab"}
            </Button>
            <span className="text-xs text-muted-foreground">{filtered.length} rows</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No rows in this bucket. Run "Rebuild preview" if the review looks empty.</p>
          ) : (
            filtered.slice(0, 300).map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      {(r.bucket === "enrich" || r.bucket === "new") && (
                        <Checkbox className="mt-1" checked={selectedIds.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{r.developer_name}</h3>
                          <Badge variant={r.bucket === "new" ? "default" : "secondary"}>{r.bucket}</Badge>
                          <span className="text-xs text-muted-foreground">Row #{r.row_number}</span>
                          {r.matched_developer_id && (
                            <Link to={`/owner/developers/${r.matched_developer_id}`} className="text-xs text-primary underline">Open profile</Link>
                          )}
                        </div>
                        {r.reason && <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>}
                      </div>
                    </div>
                  </div>

                  {(r.bucket === "enrich" || r.bucket === "new") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm border-t pt-3">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">BEFORE</div>
                        <div className="space-y-1">
                          {FIELDS.map((f) => (
                            <div key={f.key} className="grid grid-cols-[110px_1fr] gap-2">
                              <span className="text-xs text-muted-foreground">{f.label}</span>
                              <div className="text-xs">{renderCell(r.before_data?.[f.key])}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-700 mb-2">AFTER</div>
                        <div className="space-y-1">
                          {FIELDS.map((f) => {
                            const changed = r.changed_fields?.includes(f.key);
                            return (
                              <div key={f.key} className={`grid grid-cols-[110px_1fr] gap-2 ${changed ? "bg-emerald-50 rounded px-1" : ""}`}>
                                <span className="text-xs text-muted-foreground">{f.label}</span>
                                <div className={`text-xs ${changed ? "font-semibold text-emerald-900" : ""}`}>{renderCell(r.after_data?.[f.key])}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
          {filtered.length > 300 && (
            <p className="text-xs text-muted-foreground text-center">Showing first 300 of {filtered.length}. Use "Select all in tab" to include everything, or download the full report.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
