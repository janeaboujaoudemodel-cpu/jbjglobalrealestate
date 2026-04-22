import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle2, AlertTriangle, Wand2, FileDown, ScanLine } from "lucide-react";

export interface PageReport {
  page: number;
  widthMm: number;
  heightMm: number;
  widthDeltaMm?: number;
  heightDeltaMm?: number;
  edgeCoveragePct: number;
  minImageDpi: number | null;
  requiredDpi?: number;
  blank: boolean;
  reasons: string[];
  failedEdges?: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  ok: boolean;
}

export interface AutoFixAttempt {
  attempt: number;
  pass: boolean;
  reasons: string[];
}

export interface PrintCheckResult {
  pass: boolean;
  pages: PageReport[];
  reasons: string[];
  txtReport: string;
  autoFixed?: boolean;
  autoFixNote?: string;
  attempts?: AutoFixAttempt[];
  fixedPdfUrl?: string | null;
  fixedFilename?: string | null;
  diffPdfUrl?: string | null;
  diffFilename?: string | null;
}

interface Props {
  filename: string;
  result: PrintCheckResult;
}

export default function ResultPanel({ filename, result }: Props) {
  const downloadTxt = () => {
    const blob = new Blob([result.txtReport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\.pdf$/i, "") + "_PRINT_CHECK.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-4 flex items-center justify-between ${result.pass ? "border-emerald-300 bg-muted/30" : "border-destructive/40 bg-destructive/5"}`}>
        <div className="flex items-center gap-3">
          {result.pass
            ? <CheckCircle2 className="h-6 w-6 text-foreground" />
            : <AlertTriangle className="h-6 w-6 text-destructive" />}
          <div>
            <div className="font-semibold">{result.pass ? "PASS" : "FAIL"}</div>
            <div className="text-sm text-muted-foreground">
              {result.pages.length} page{result.pages.length === 1 ? "" : "s"}
              {!result.pass && ` · ${result.reasons.length} issue(s)`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result.diffPdfUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={result.diffPdfUrl} target="_blank" rel="noreferrer" download={result.diffFilename ?? undefined}>
                <ScanLine className="h-4 w-4 mr-2" /> Diff PDF
              </a>
            </Button>
          )}
          <Button onClick={downloadTxt} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Report
          </Button>
        </div>
      </div>

      {(result.autoFixed || result.autoFixNote) && (
        <div className="rounded-lg border p-4 bg-muted/20 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Wand2 className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm">Auto-fix {result.autoFixed ? "applied" : "skipped"}</div>
              <div className="text-xs text-muted-foreground">{result.autoFixNote || "—"}</div>
              {result.attempts && result.attempts.length > 1 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Attempts: {result.attempts.map((a) => `${a.attempt === 0 ? "initial" : `#${a.attempt}`}=${a.pass ? "PASS" : "FAIL"}`).join(" → ")}
                </div>
              )}
            </div>
          </div>
          {result.fixedPdfUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={result.fixedPdfUrl} target="_blank" rel="noreferrer" download={result.fixedFilename ?? undefined}>
                <FileDown className="h-4 w-4 mr-2" /> Fixed PDF
              </a>
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2 font-medium">Page</th>
              <th className="p-2 font-medium">Size (mm)</th>
              <th className="p-2 font-medium">Δ Size</th>
              <th className="p-2 font-medium">Failed edges</th>
              <th className="p-2 font-medium">Edge %</th>
              <th className="p-2 font-medium">DPI (min / req)</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {result.pages.map((p) => {
              const dW = p.widthDeltaMm ?? 0;
              const dH = p.heightDeltaMm ?? 0;
              const sizeOff = Math.abs(dW) > 2 || Math.abs(dH) > 2;
              const edges = p.failedEdges
                ? Object.entries(p.failedEdges).filter(([, v]) => v).map(([k]) => k)
                : [];
              const dpiBad = p.minImageDpi !== null && p.requiredDpi !== undefined && p.minImageDpi < p.requiredDpi;
              const dpiDelta = p.minImageDpi !== null && p.requiredDpi !== undefined
                ? ` (Δ ${p.minImageDpi - p.requiredDpi})`
                : "";
              return (
              <tr key={p.page} className="border-t">
                <td className="p-2">{p.page}</td>
                <td className="p-2">{p.widthMm} × {p.heightMm}</td>
                <td className={`p-2 ${sizeOff ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {dW > 0 ? `+${dW}` : dW}×{dH > 0 ? `+${dH}` : dH}
                </td>
                <td className="p-2">
                  {edges.length === 0
                    ? <span className="text-muted-foreground">—</span>
                    : edges.map((e) => (
                        <Badge key={e} variant="destructive" className="mr-1 text-[10px] px-1.5 py-0">{e}</Badge>
                      ))}
                </td>
                <td className="p-2">{p.edgeCoveragePct}%</td>
                <td className={`p-2 ${dpiBad ? "text-destructive font-medium" : ""}`}>
                  {p.minImageDpi ?? "—"}{p.requiredDpi !== undefined ? ` / ${p.requiredDpi}` : ""}
                  {dpiBad && <span className="text-xs">{dpiDelta}</span>}
                </td>
                <td className="p-2">
                  {p.ok
                    ? <Badge variant="outline" className="border-foreground/30 text-foreground">OK</Badge>
                    : <Badge variant="destructive">FAIL</Badge>}
                  {!p.ok && <div className="text-xs text-muted-foreground mt-1">{p.reasons.join("; ")}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.reasons.length > 0 && (
        <div className="rounded-lg border p-4 bg-muted/20">
          <div className="font-medium mb-2">Issues</div>
          <ul className="list-disc list-inside text-sm space-y-1">
            {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      <div>
        <div className="text-sm font-medium mb-2">Report preview</div>
        <pre className="text-xs bg-muted/40 rounded-lg border p-4 overflow-x-auto whitespace-pre-wrap">
{result.txtReport}
        </pre>
      </div>
    </div>
  );
}
