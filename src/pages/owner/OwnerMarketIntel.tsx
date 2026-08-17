import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Play, RefreshCw, Database, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type Source = { id: string; name: string; source_type: string; api_endpoint: string | null; is_active: boolean; last_sync_at: string | null; config: any };
type Run = { id: string; source_key: string; started_at: string; finished_at: string | null; status: string; rows_ingested: number; error_text: string | null; details: any };

const SOURCE_KEY: Record<string, string> = {
  "DLD": "ingest-dld",
  "DXB Interact": "ingest-dxb-interact",
  "RERA": "ingest-rera",
  "Property Monitor": "ingest-property-monitor",
};

function statusIcon(s: string) {
  if (s === "success") return <CheckCircle2 className="h-4 w-4 text-[color:var(--emerald-1)]" />;
  if (s === "partial") return <AlertTriangle className="h-4 w-4 text-amber-700" />;
  if (s === "error") return <XCircle className="h-4 w-4 text-red-700" />;
  return <Loader2 className="h-4 w-4 animate-spin text-blue-700" />;
}

export default function OwnerMarketIntel() {
  const [sources, setSources] = useState<Source[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const [s, r] = await Promise.all([
      supabase.from("market_data_sources").select("*").order("name"),
      supabase.from("market_data_runs").select("*").order("started_at", { ascending: false }).limit(50),
    ]);
    if (s.error) toast.error(s.error.message); else setSources((s.data ?? []) as any);
    if (r.error) toast.error(r.error.message); else setRuns((r.data ?? []) as any);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function runOne(source: Source) {
    const fn = SOURCE_KEY[source.name];
    if (!fn) { toast.error(`No ingest function for ${source.name}`); return; }
    setRunning(fn);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body: {} });
      if (error) throw error;
      toast.success(`${source.name}: ${(data as any)?.message || "Ingestion complete"}`);
      load();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setRunning(null); }
  }

  async function runAll() {
    setRunning("ingest-market-data-all");
    try {
      const { data, error } = await supabase.functions.invoke("ingest-market-data-all", { body: {} });
      if (error) throw error;
      toast.success(`Orchestrator: ran ${Object.keys((data as any)?.results ?? {}).length} sources`);
      load();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setRunning(null); }
  }

  return (
    <div className="min-h-screen pt-[88px] px-6 pb-16 bg-[#FDFBF7] text-[#1A1A1A]">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Market Data Ingestion</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              Daily auto-pull from DLD, DXB Interact, RERA and Property Monitor. Owner-only.
            </p>
          </div>
          <Button onClick={runAll} disabled={!!running}>
            {running === "ingest-market-data-all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            <span className="ml-2">Run all now</span>
          </Button>
        </header>

        <Card className="p-6 bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Database className="h-4 w-4" />Sources</h2>
            <Button aria-label="Refresh" size="sm" variant="ghost" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {sources.filter(s => SOURCE_KEY[s.name]).map((s) => (
              <div key={s.id} className="p-4 bg-[#FDFBF7] rounded-xl border border-[#B89555]/20 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-[#1A1A1A]/60 mt-0.5">
                    {s.api_endpoint ?? "—"} · last {s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : "never"}
                  </div>
                </div>
                <Button size="sm" onClick={() => runOne(s)} disabled={!!running}>
                  {running === SOURCE_KEY[s.name] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  <span className="ml-1.5">Run</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl">
          <h2 className="font-semibold mb-3">Recent runs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-[#1A1A1A]/60">
                <th className="py-2 pr-2">Source</th><th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Rows</th><th className="py-2 pr-2">Started</th>
                <th className="py-2 pr-2">Duration</th><th className="py-2 pr-2">Notes</th>
              </tr></thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="py-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>}
                {!loading && runs.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-[#1A1A1A]/60">No runs yet. Click "Run all now" to start.</td></tr>}
                {runs.map((r) => {
                  const dur = r.finished_at ? Math.round((+new Date(r.finished_at) - +new Date(r.started_at)) / 100) / 10 : null;
                  return (
                    <tr key={r.id} className="border-t border-[#B89555]/15 align-top">
                      <td className="py-2 pr-2 font-medium">{r.source_key}</td>
                      <td className="py-2 pr-2"><div className="flex items-center gap-1.5">{statusIcon(r.status)}<span>{r.status}</span></div></td>
                      <td className="py-2 pr-2">{r.rows_ingested}</td>
                      <td className="py-2 pr-2">{new Date(r.started_at).toLocaleString()}</td>
                      <td className="py-2 pr-2">{dur !== null ? `${dur}s` : "—"}</td>
                      <td className="py-2 pr-2 text-xs text-[#1A1A1A]/70 max-w-md truncate">{r.error_text || (r.details ? JSON.stringify(r.details).slice(0,140) : "")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
