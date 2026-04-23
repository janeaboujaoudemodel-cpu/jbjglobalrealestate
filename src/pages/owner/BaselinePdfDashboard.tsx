import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, FileText, RefreshCw } from "lucide-react";

const BASELINE_URL = "/documents/JBJ-Global-Real-Estate-Company-Profile.pdf";
const BASELINE_FILENAME = "JBJ-Global-Real-Estate-Company-Profile.pdf";
const EXPORT_ID = "company-profile";
const EXPECTED_PAGE_COUNT = 18;
const EXPECTED_DPI_FLOOR = 150;

interface BaselineMeta {
  sizeBytes: number;
  sha256: string;
  pageCount: number | null;
  fetchedAt: string;
}

interface BaselineRun {
  id: string;
  export_id: string;
  candidate_label: string | null;
  candidate_sha256: string | null;
  result_status: string | null;
  pages_compared: number | null;
  pages_changed: number | null;
  avg_changed_pct: number | null;
  report_url: string | null;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function countPdfPages(buf: ArrayBuffer): number | null {
  try {
    const text = new TextDecoder("latin1").decode(buf);
    // Strategy 1: top-level /Pages dictionary /Count N (most reliable for normal PDFs)
    const countMatches = Array.from(text.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g));
    if (countMatches.length) {
      const max = Math.max(...countMatches.map((m) => parseInt(m[1], 10)));
      if (Number.isFinite(max) && max > 0) return max;
    }
    // Strategy 2: count individual /Type /Page entries
    const pageMatches = text.match(/\/Type\s*\/Page(?!s)/g);
    if (pageMatches?.length) return pageMatches.length;
    return null;
  } catch {
    return null;
  }
}

function statusVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch ((status ?? "").toLowerCase()) {
    case "pass":
    case "identical":
      return "default";
    case "minor":
      return "secondary";
    case "moderate":
      return "outline";
    case "fail":
    case "major":
      return "destructive";
    default:
      return "outline";
  }
}

export default function BaselinePdfDashboard() {
  const { toast } = useToast();
  const [meta, setMeta] = useState<BaselineMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [runs, setRuns] = useState<BaselineRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);

  const loadMeta = async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const res = await fetch(BASELINE_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const sha = await sha256Hex(buf);
      setMeta({
        sizeBytes: buf.byteLength,
        sha256: sha,
        pageCount: countPdfPages(buf),
        fetchedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setMetaError(e?.message ?? "Failed to load baseline");
    } finally {
      setMetaLoading(false);
    }
  };

  const loadRuns = async () => {
    setRunsLoading(true);
    const { data, error } = await supabase
      .from("pdf_baseline_runs")
      .select("*")
      .eq("export_id", EXPORT_ID)
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error && data) setRuns(data as BaselineRun[]);
    setRunsLoading(false);
  };

  useEffect(() => {
    loadMeta();
    loadRuns();
  }, []);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: `${label} copied` });
  };

  const lastRun = runs[0] ?? null;
  const pageCountOk = meta?.pageCount === EXPECTED_PAGE_COUNT;

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Baseline PDF Dashboard
            </CardTitle>
            <CardDescription>
              Company Profile baseline — metadata, integrity, and last comparison results.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadMeta} disabled={metaLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${metaLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={BASELINE_URL} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Baseline
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Baseline Metadata</CardTitle>
          <CardDescription>Read directly from the deployed PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          {metaError && (
            <div className="text-sm text-destructive mb-4">Error: {metaError}</div>
          )}
          {!meta && metaLoading && (
            <div className="text-sm text-muted-foreground">Loading…</div>
          )}
          {meta && (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Filename</dt>
                <dd className="font-medium break-all">{BASELINE_FILENAME}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">File size</dt>
                <dd className="font-medium">
                  {formatBytes(meta.sizeBytes)}{" "}
                  <span className="text-muted-foreground">({meta.sizeBytes.toLocaleString()} bytes)</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Page count</dt>
                <dd className="font-medium flex items-center gap-2 flex-wrap">
                  <span>{meta.pageCount ?? "—"}</span>
                  {meta.pageCount === null ? (
                    <Badge variant="outline">unparsed</Badge>
                  ) : pageCountOk ? (
                    <Badge variant="default">matches spec</Badge>
                  ) : (
                    <Badge variant="secondary">expected {EXPECTED_PAGE_COUNT}</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expected page count</dt>
                <dd className="font-medium">{EXPECTED_PAGE_COUNT}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expected DPI floor</dt>
                <dd className="font-medium">{EXPECTED_DPI_FLOOR} DPI</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last fetched at</dt>
                <dd className="font-medium">{new Date(meta.fetchedAt).toLocaleString()}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-muted-foreground">SHA-256</dt>
                <dd className="font-mono text-xs break-all flex items-start gap-2">
                  <span className="flex-1">{meta.sha256}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => copy(meta.sha256, "SHA-256")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Last comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Last Comparison</CardTitle>
          <CardDescription>Most recent visual-diff or QA run for this baseline.</CardDescription>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : !lastRun ? (
            <div className="text-sm text-muted-foreground">
              No comparison runs logged yet. Runs are recorded in <code>pdf_baseline_runs</code> when a
              visual-diff or QA pipeline reports a result.
            </div>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Candidate</dt>
                <dd className="font-medium break-all">{lastRun.candidate_label ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={statusVariant(lastRun.result_status)}>
                    {lastRun.result_status ?? "unknown"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pages compared / changed</dt>
                <dd className="font-medium">
                  {lastRun.pages_compared ?? "—"} / {lastRun.pages_changed ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Avg changed %</dt>
                <dd className="font-medium">
                  {lastRun.avg_changed_pct !== null
                    ? `${Number(lastRun.avg_changed_pct).toFixed(4)}%`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Run timestamp</dt>
                <dd className="font-medium">{new Date(lastRun.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Report</dt>
                <dd className="font-medium">
                  {lastRun.report_url ? (
                    <a
                      href={lastRun.report_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline inline-flex items-center gap-1"
                    >
                      Open report <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Recent runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>Last 10 comparison entries for {EXPORT_ID}.</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No runs to display.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                  <TableHead className="text-right">Avg %</TableHead>
                  <TableHead>Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {r.candidate_label ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.result_status)}>
                        {r.result_status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(r.pages_changed ?? "—")} / {(r.pages_compared ?? "—")}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.avg_changed_pct !== null ? Number(r.avg_changed_pct).toFixed(2) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.report_url ? (
                        <a
                          href={r.report_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
