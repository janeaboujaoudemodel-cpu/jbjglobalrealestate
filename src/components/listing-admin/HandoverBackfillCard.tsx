import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarClock, Loader2, RefreshCw, Play } from "lucide-react";
import { toast } from "sonner";

/**
 * Owner-only admin card: backfills `handover_date` across all projects.
 * Stage 2 = Firecrawl scrape of source_url
 * Stage 3 = Lovable AI inference (developer + project name)
 * Loops in batches of 20 until either updated=0 or failed remaining.
 */
export const HandoverBackfillCard = () => {
  const [totalMissing, setTotalMissing] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<2 | 3 | null>(null);
  const [progress, setProgress] = useState({ updated: 0, failed: 0, batches: 0 });
  const [log, setLog] = useState<string[]>([]);

  const refreshTotal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("backfill-handover-dates", {
      body: { stage: 0 },
    });
    if (error) return;
    if (typeof data?.total_missing === "number") setTotalMissing(data.total_missing);
  }, []);

  useEffect(() => { refreshTotal(); }, [refreshTotal]);

  const runStage = async (s: 2 | 3) => {
    if (running) return;
    setRunning(true);
    setStage(s);
    setProgress({ updated: 0, failed: 0, batches: 0 });
    setLog([]);

    try {
      let consecutiveZero = 0;
      for (let i = 0; i < 200; i++) { // hard safety cap
        const { data, error } = await supabase.functions.invoke("backfill-handover-dates", {
          body: { stage: s, batch_size: 20 },
        });
        if (error) throw error;
        const r = data?.result;
        if (r?.skipped) {
          toast.error(`Stage ${s} skipped: ${r.reason}`);
          break;
        }
        const updated = r?.updated ?? 0;
        const failed = r?.failed ?? 0;
        setProgress((p) => ({
          updated: p.updated + updated,
          failed: p.failed + failed,
          batches: p.batches + 1,
        }));
        setTotalMissing(data?.total_missing ?? null);
        if (Array.isArray(r?.details) && r.details.length) {
          setLog((prev) => [...r.details.slice(0, 5), ...prev].slice(0, 50));
        }
        if (updated === 0) {
          consecutiveZero++;
          if (consecutiveZero >= 2) break;
        } else {
          consecutiveZero = 0;
        }
        if ((r?.remaining ?? 0) === 0) break;
      }
      toast.success(`Stage ${s} complete`);
    } catch (e: any) {
      toast.error(`Stage ${s} failed: ${e.message}`);
    } finally {
      setRunning(false);
      setStage(null);
      refreshTotal();
    }
  };

  const runAll = async () => {
    await runStage(2);
    await runStage(3);
  };

  return (
    <Card className="bg-card border-2 border-[#B89555]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[#1A1A1A]" />
          Handover Date Backfill
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Fills missing <code className="text-xs">handover_date</code> across all projects using
          source-URL scraping (Firecrawl) and AI inference. Only verified formats are written
          (<code>Q# YYYY</code>, <code>YYYY</code>, or <code>Ready</code>) — never invented.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Missing handover dates: </span>
            <span className="font-bold text-[var(--price-orange)]">
              {totalMissing ?? "…"}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={refreshTotal} disabled={running}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={runAll} disabled={running} variant="primary" size="sm">
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Run Full Backfill (Scrape + AI)
          </Button>
          <Button onClick={() => runStage(2)} disabled={running} variant="outline" size="sm">
            Stage 2 — Source-URL scrape
          </Button>
          <Button onClick={() => runStage(3)} disabled={running} variant="outline" size="sm">
            Stage 3 — AI inference
          </Button>
        </div>

        {(running || progress.batches > 0) && (
          <div className="space-y-2 rounded-lg border border-[#B89555]/20 bg-[#FDFBF7] p-3">
            <div className="flex items-center justify-between text-xs text-foreground">
              <span>
                {stage ? `Running stage ${stage}…` : "Idle"} • {progress.batches} batch
                {progress.batches === 1 ? "" : "es"}
              </span>
              <span>
                <span className="font-semibold text-emerald-700">{progress.updated}</span> updated
                {" · "}
                <span className="font-semibold text-red-600">{progress.failed}</span> failed
              </span>
            </div>
            {totalMissing != null && (
              <Progress
                value={Math.min(
                  100,
                  Math.round((progress.updated / Math.max(progress.updated + totalMissing, 1)) * 100)
                )}
              />
            )}
            {log.length > 0 && (
              <ul className="max-h-40 overflow-y-auto text-[11px] text-muted-foreground font-mono space-y-0.5">
                {log.map((l, i) => (
                  <li key={i} className="truncate">{l}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
