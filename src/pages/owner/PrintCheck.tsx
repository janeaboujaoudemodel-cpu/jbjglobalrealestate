import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Printer, Loader2, Wand2 } from "lucide-react";
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

export default function PrintCheck() {
  const [presetId, setPresetId] = useState("a4-p");
  const [customW, setCustomW] = useState(210);
  const [customH, setCustomH] = useState(297);
  const [minDpi, setMinDpi] = useState(300);
  const [edgeMarginMm] = useState(4);
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PrintCheckResult | null>(null);
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
    if (!file) { toast.error("Choose a PDF first"); return; }
    const { w, h } = resolveSize();
    if (!w || !h) { toast.error("Enter a valid custom size"); return; }
    setRunning(true);
    setResult(null);
    setProgress(15);

    try {
      const form = new FormData();
      form.append("pdf", file);
      form.append("targetWidthMm", String(w));
      form.append("targetHeightMm", String(h));
      form.append("minDpi", String(minDpi));
      form.append("edgeMarginMm", String(edgeMarginMm));
      form.append("autoFix", String(autoFix));
      form.append("maxAttempts", String(maxAttempts));

      setProgress(45);
      const { data, error } = await supabase.functions.invoke("print-check", { body: form });
      setProgress(85);

      if (error) throw error;
      const r = data as PrintCheckResult & { error?: string };
      if (r.error) throw new Error(r.error);
      setResult(r);
      const passToast = r.pass ? (r.autoFixed ? "PASS — auto-fixed" : "PASS — print-ready") : `FAIL — ${r.reasons.length} issue(s)`;
      toast[r.pass ? "success" : "error"](passToast);
      await loadHistory();
    } catch (e) {
      toast.error((e as Error).message || "Print check failed");
    } finally {
      setProgress(100);
      setTimeout(() => { setRunning(false); setProgress(0); }, 400);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Printer className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-semibold">Canva Print Check</h1>
          <p className="text-sm text-muted-foreground">
            Upload a Canva PDF export and run a corner-to-corner print QA against your target size and DPI.
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
          <UploadDropzone file={file} onFile={setFile} disabled={running} />
          {running && <Progress value={progress} />}
          <div className="flex justify-end">
            <Button onClick={run} disabled={!file || running}>
              {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</> : "Run print check"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && file && (
        <Card>
          <CardHeader><CardTitle className="text-base">Result · {file.name}</CardTitle></CardHeader>
          <CardContent>
            <ResultPanel filename={file.name} result={result} />
          </CardContent>
        </Card>
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
