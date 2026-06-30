/**
 * Owner-only Icon Audit Dashboard
 * Surfaces results from `icon_audit_runs` produced by scripts/icon-tile-audit/run.mjs
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, RefreshCw, ShieldAlert, ShieldCheck, Terminal } from "lucide-react";

type RuleCode =
  | "missing_icon"
  | "clipped"
  | "low_contrast"
  | "obscured"
  | "invisible"
  | "color_on_color";

interface FailureRow {
  route: string;
  selector: string;
  label?: string;
  rule: RuleCode;
  contrast?: number;
  bbox?: { x: number; y: number; w: number; h: number };
  state?: "default" | "hover" | "focus" | "active";
  crop_default_b64?: string;
  crop_failing_b64?: string;
}

interface RunRow {
  id: string;
  run_label: string;
  environment: string;
  routes_scanned: number;
  tiles_scanned: number;
  total_failures: number;
  failures_by_rule: Partial<Record<RuleCode, number>>;
  report_url: string | null;
  failures: FailureRow[];
  created_at: string;
}

const RULE_LABELS: Record<RuleCode, string> = {
  missing_icon: "Missing icon",
  clipped: "Clipped / zero-sized",
  low_contrast: "Low contrast",
  obscured: "Obscured glyph",
  invisible: "Invisible glyph",
  color_on_color: "Color-on-color",
};

function statusForRun(run: RunRow): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (run.total_failures === 0) return { label: "Pass", variant: "secondary" };
  const major = (run.failures_by_rule.missing_icon ?? 0) + (run.failures_by_rule.invisible ?? 0) + (run.failures_by_rule.low_contrast ?? 0);
  if (major > 0) return { label: "Major", variant: "destructive" };
  return { label: "Minor", variant: "outline" };
}

const IconAuditDashboard: React.FC = () => {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchRuns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("icon_audit_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) {
      setRuns(data as unknown as RunRow[]);
      if (data.length > 0) setSelectedRunId((data[0] as unknown as RunRow).id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? null,
    [runs, selectedRunId],
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Icon Tile Audit</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Automated visual check that screenshots every icon tile state and flags missing,
            clipped, low-contrast, or obscured glyphs across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRuns} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/owner/baseline-pdf">QA Tools</Link>
          </Button>
        </div>
      </div>

      {/* How it runs */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" /> How it runs
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Run the audit script from the project root to scan the live preview and post a new
            entry here:
          </p>
          <pre className="rounded-md bg-muted/40 border border-border p-3 text-xs font-mono overflow-x-auto">
{`node scripts/icon-tile-audit/run.mjs --insert-db --base=https://www.jbj.ae`}
          </pre>
          <p className="text-xs">
            The script crawls homepage, AI Hub, Owner Command Center and any route with ≥3 icon
            tiles, captures each tile in default / hover / focus / active states and validates 6
            rules.
          </p>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!loading && runs.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldCheck className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground">No audit runs yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Run the script above to populate this dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Latest run summary */}
      {selectedRun && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Latest run
                  <Badge variant={statusForRun(selectedRun).variant}>
                    {statusForRun(selectedRun).label}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {selectedRun.run_label} · {selectedRun.environment} ·{" "}
                  {new Date(selectedRun.created_at).toLocaleString()}
                </CardDescription>
              </div>
              {selectedRun.report_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={selectedRun.report_url} target="_blank" rel="noreferrer">
                    Open full report <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Stat label="Routes scanned" value={selectedRun.routes_scanned} />
              <Stat label="Tiles scanned" value={selectedRun.tiles_scanned} />
              <Stat label="Total failures" value={selectedRun.total_failures} highlight={selectedRun.total_failures > 0} />
              <Stat
                label="Pass rate"
                value={
                  selectedRun.tiles_scanned > 0
                    ? `${Math.round(((selectedRun.tiles_scanned - selectedRun.total_failures) / selectedRun.tiles_scanned) * 100)}%`
                    : "—"
                }
              />
            </div>

            {/* Failures by rule */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(RULE_LABELS) as RuleCode[]).map((rule) => {
                const n = selectedRun.failures_by_rule?.[rule] ?? 0;
                return (
                  <Badge key={rule} variant={n > 0 ? "destructive" : "outline"}>
                    {RULE_LABELS[rule]}: {n}
                  </Badge>
                );
              })}
            </div>

            {/* Failures table */}
            {selectedRun.failures && selectedRun.failures.length > 0 ? (
              <div className="border border-border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Tile</TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Contrast</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRun.failures.map((f, i) => (
                      <React.Fragment key={i}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        >
                          <TableCell className="font-mono text-xs">{f.route}</TableCell>
                          <TableCell className="text-xs max-w-[280px] truncate">
                            {f.label || <span className="text-muted-foreground">{f.selector}</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{RULE_LABELS[f.rule] ?? f.rule}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{f.state ?? "default"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {typeof f.contrast === "number" ? f.contrast.toFixed(2) : "—"}
                          </TableCell>
                        </TableRow>
                        {expandedRow === i && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/20">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                                <CropPanel title="Default" b64={f.crop_default_b64} />
                                <CropPanel title={`Failing (${f.state ?? "default"})`} b64={f.crop_failing_b64} />
                              </div>
                              <div className="text-xs font-mono text-muted-foreground mt-2">
                                Selector: {f.selector}
                                {f.bbox && (
                                  <span className="ml-3">
                                    bbox: {f.bbox.x.toFixed(0)},{f.bbox.y.toFixed(0)} ·{" "}
                                    {f.bbox.w.toFixed(0)}×{f.bbox.h.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center border border-border rounded-md bg-muted/10">
                <ShieldCheck className="h-4 w-4 text-foreground" />
                All scanned tiles passed every rule.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Run history */}
      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run history</CardTitle>
            <CardDescription>Last {runs.length} runs (newest first)</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[420px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Env</TableHead>
                    <TableHead className="text-right">Routes</TableHead>
                    <TableHead className="text-right">Tiles</TableHead>
                    <TableHead className="text-right">Failures</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => {
                    const s = statusForRun(r);
                    return (
                      <TableRow
                        key={r.id}
                        className={`cursor-pointer ${selectedRunId === r.id ? "bg-muted/40" : ""}`}
                        onClick={() => setSelectedRunId(r.id)}
                      >
                        <TableCell className="text-xs">
                          {new Date(r.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{r.run_label}</TableCell>
                        <TableCell className="text-xs">{r.environment}</TableCell>
                        <TableCell className="text-right text-xs">{r.routes_scanned}</TableCell>
                        <TableCell className="text-right text-xs">{r.tiles_scanned}</TableCell>
                        <TableCell className="text-right text-xs">
                          {r.total_failures > 0 ? (
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <ShieldAlert className="h-3 w-3" /> {r.total_failures}
                            </span>
                          ) : (
                            r.total_failures
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number | string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div className="rounded-md border border-border p-4">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div
      className={`text-2xl font-semibold mt-1 ${highlight ? "text-destructive" : "text-foreground"}`}
    >
      {value}
    </div>
  </div>
);

const CropPanel: React.FC<{ title: string; b64?: string }> = ({ title, b64 }) => (
  <div>
    <div className="text-xs font-medium text-muted-foreground mb-1">{title}</div>
    {b64 ? (
      <img
        src={`data:image/png;base64,${b64}`}
        alt={title}
        className="rounded border border-border max-h-48 bg-muted/30"
       loading="lazy" decoding="async" />
    ) : (
      <div className="rounded border border-dashed border-border h-24 flex items-center justify-center text-xs text-muted-foreground">
        no crop
      </div>
    )}
  </div>
);

export default IconAuditDashboard;
