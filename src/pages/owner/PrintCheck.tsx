import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Printer, Loader2, Wand2, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TargetSizePicker, { PRESETS } from "@/components/print-check/TargetSizePicker";
import UploadDropzone from "@/components/print-check/UploadDropzone";
import ResultPanel, { type PrintCheckResult } from "@/components/print-check/ResultPanel";

interface RunRow {
  id: string;
  filename: string;
  pass: boolean;
  created_at: string;
  target_w_mm: number;
  target_h_mm: number;
}

interface BatchEntry {
  filename: string;
  status: "pending" | "running" | "done" | "error";
  result?: PrintCheckResult;
  error?: string;
}

export default function PrintCheck() {
  const [presetId, setPresetId] = useState("a4-p");
  const [customW, setCustomW] = useState(210);
  const [customH, setCustomH] = useState(297);
  const [minDpi, setMinDpi] = useState(300);
  const [edgeMarginMm] = useState(4);
  const [files, setFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batch, setBatch] = useState<BatchEntry[]>([]);
  const [history, setHistory] = useState<RunRow[]>([]);
  const [autoFix, setAutoFix] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(3);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("print_check_runs")
      .select("id,filename,pass,created_at,target_w_mm,target_h_mm")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data ?? []) as RunRow[]);
  };

  useEffect(() => { loadHistory(); }, []);

  const resolveSize = () => {
    if (presetId === "custom") return { w: customW, h: customH };
    const p = PRESETS.find((x) => x.id === presetId)!;
    return { w: p.widthMm, h: p.heightMm };
  };

  const run = async () => {
    if (files.length === 0) { toast.error("Choose one or more PDFs first"); return; }
    const { w, h } = resolveSize();
    if (!w || !h) { toast.error("Enter a valid custom size"); return; }
    setRunning(true);

    const initial: BatchEntry[] = files.map((f) => ({ filename: f.name, status: "pending" }));
    setBatch(initial);

    let passCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setBatch((prev) => prev.map((b, idx) => idx === i ? { ...b, status: "running" } : b));
      setProgress(Math.round((i / files.length) * 100));
      try {
        const form = new FormData();
        form.append("pdf", f);
        form.append("targetWidthMm", String(w));
        form.append("targetHeightMm", String(h));
        form.append("minDpi", String(minDpi));
        form.append("edgeMarginMm", String(edgeMarginMm));
        form.append("autoFix", String(autoFix));
        form.append("maxAttempts", String(maxAttempts));
        const { data, error } = await supabase.functions.invoke("print-check", { body: form });
        if (error) throw error;
        const r = data as PrintCheckResult & { error?: string };
        if (r.error) throw new Error(r.error);
        if (r.pass) passCount++; else failCount++;
        setBatch((prev) => prev.map((b, idx) => idx === i ? { ...b, status: "done", result: r } : b));
      } catch (e) {
        failCount++;
        setBatch((prev) => prev.map((b, idx) => idx === i
          ? { ...b, status: "error", error: (e as Error).message || "Failed" }
          : b));
      }
    }

    setProgress(100);
    if (files.length === 1) {
      toast[failCount === 0 ? "success" : "error"](
        failCount === 0 ? "PASS — print-ready" : "FAIL — see issues",
      );
    } else {
      toast[failCount === 0 ? "success" : "error"](
        `Batch complete · ${passCount} PASS / ${failCount} FAIL`,
      );
    }
    await loadHistory();
    setTimeout(() => { setRunning(false); setProgress(0); }, 400);
  };

  const downloadCombinedReport = () => {
    const { w, h } = resolveSize();
    const passCount = batch.filter((b) => b.result?.pass).length;
    const failCount = batch.length - passCount;
    const lines: string[] = [];
    lines.push("JBJ Global Real Estate — Batch Print QA Report");
    lines.push(`Files: ${batch.length}  ·  Target: ${w} × ${h} mm  ·  Min DPI: ${minDpi}  ·  Edge margin: ${edgeMarginMm} mm`);
    lines.push(`Generated: ${new Date().toISOString().replace("T", " ").replace(/\..+/, "")} UTC`);
    lines.push("");
    lines.push(`Summary: ${passCount} PASS  ·  ${failCount} FAIL  ·  ${batch.length} total`);
    lines.push("");
    lines.push("─".repeat(72));
    for (const b of batch) {
      lines.push("");
      if (b.status === "error") {
        lines.push(`✖ ${b.filename} — ERROR (${b.error || "unknown"})`);
        continue;
      }
      const r = b.result;
      if (!r) { lines.push(`· ${b.filename} — (no result)`); continue; }
      const tag = r.pass ? "✔ PASS" : "✖ FAIL";
      lines.push(`${tag}  ${b.filename}  ·  ${r.pages.length} page(s)${r.autoFixed ? "  ·  auto-fixed" : ""}`);
      if (!r.pass) {
        for (const reason of r.reasons) lines.push(`      - ${reason}`);
      }
    }
    lines.push("");
    lines.push("─".repeat(72));
    lines.push("End of batch report");
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BATCH_PRINT_CHECK_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const passCount = batch.filter((b) => b.result?.pass).length;
  const failCount = batch.filter((b) => b.status === "done" && !b.result?.pass).length;
  const errorCount = batch.filter((b) => b.status === "error").length;
  const isBatch = batch.length > 1;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Printer className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-semibold">Canva Print Check</h1>
          <p className="text-sm text-muted-foreground">
            Upload one or more Canva PDF exports — or a whole folder — and run corner-to-corner print QA.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Run a print check</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <TargetSizePicker
            presetId={presetId}
            customW={customW}
            customH={customH}
            minDpi={minDpi}
            onPresetChange={setPresetId}
            onCustomChange={(w, h) => { setCustomW(w); setCustomH(h); }}
            onDpiChange={setMinDpi}
          />
          <UploadDropzone files={files} onFiles={setFiles} disabled={running} />

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Wand2 className="h-5 w-5 mt-0.5" />
                <div>
                  <Label htmlFor="autofix" className="text-sm font-medium cursor-pointer">Auto-fix failing PDFs</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Re-crops/resizes pages to full-bleed at the target size and re-runs the check until it passes or hits the retry limit. Applied per file. DPI issues cannot be auto-fixed.
                  </p>
                </div>
              </div>
              <Switch id="autofix" checked={autoFix} onCheckedChange={setAutoFix} disabled={running} />
            </div>
            {autoFix && (
              <div className="flex items-center gap-3 pl-8">
                <Label htmlFor="maxAttempts" className="text-xs text-muted-foreground">Max retries</Label>
                <Input
                  id="maxAttempts" type="number" min={1} max={5}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Math.max(1, Math.min(5, parseInt(e.target.value || "3", 10))))}
                  disabled={running}
                  className="h-8 w-20"
                />
              </div>
            )}
          </div>

          {running && <Progress value={progress} />}
          <div className="flex justify-end">
            <Button onClick={run} disabled={files.length === 0 || running}>
              {running
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing… ({batch.filter((b) => b.status === "done" || b.status === "error").length}/{files.length})</>
                : files.length > 1 ? `Run print check on ${files.length} files` : "Run print check"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isBatch && batch.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Batch summary</CardTitle>
              <Button variant="outline" size="sm" onClick={downloadCombinedReport} disabled={running}>
                <Download className="h-4 w-4 mr-2" /> Combined report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="border-foreground/30">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {passCount} PASS
              </Badge>
              <Badge variant="destructive">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> {failCount} FAIL
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive" className="opacity-80">
                  {errorCount} ERROR
                </Badge>
              )}
              <span className="text-muted-foreground self-center ml-auto">
                {batch.filter((b) => b.status !== "pending" && b.status !== "running").length}/{batch.length} processed
              </span>
            </div>
            <ul className="divide-y rounded-lg border">
              {batch.map((b, i) => (
                <li key={i} className="px-3 py-2 flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {b.status === "pending" && <Badge variant="outline" className="text-muted-foreground">queued</Badge>}
                    {b.status === "running" && <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />running</Badge>}
                    {b.status === "done" && (
                      <Badge variant={b.result?.pass ? "outline" : "destructive"} className={b.result?.pass ? "border-foreground/30 text-foreground" : ""}>
                        {b.result?.pass ? "PASS" : "FAIL"}
                      </Badge>
                    )}
                    {b.status === "error" && <Badge variant="destructive">ERROR</Badge>}
                    <span className="truncate font-medium">{b.filename}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {b.status === "done" && b.result
                      ? `${b.result.pages.length} pg${b.result.autoFixed ? " · auto-fixed" : ""}${!b.result.pass ? ` · ${b.result.reasons.length} issue(s)` : ""}`
                      : b.status === "error" ? (b.error || "failed") : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!isBatch && batch[0]?.result && (
        <Card>
          <CardHeader><CardTitle className="text-base">Result · {batch[0].filename}</CardTitle></CardHeader>
          <CardContent>
            <ResultPanel filename={batch[0].filename} result={batch[0].result} />
          </CardContent>
        </Card>
      )}

      {isBatch && batch.some((b) => b.status === "done" && b.result) && (
        <div className="space-y-4">
          {batch.map((b, i) => b.result ? (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant={b.result.pass ? "outline" : "destructive"} className={b.result.pass ? "border-foreground/30 text-foreground" : ""}>
                    {b.result.pass ? "PASS" : "FAIL"}
                  </Badge>
                  {b.filename}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResultPanel filename={b.filename} result={b.result} />
              </CardContent>
            </Card>
          ) : null)}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Recent checks</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No checks yet.</p>
          ) : (
            <ul className="divide-y">
              {history.map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={h.pass ? "outline" : "destructive"} className={h.pass ? "border-foreground/30 text-foreground" : ""}>
                      {h.pass ? "PASS" : "FAIL"}
                    </Badge>
                    <span className="truncate">{h.filename}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{h.target_w_mm}×{h.target_h_mm}mm</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
