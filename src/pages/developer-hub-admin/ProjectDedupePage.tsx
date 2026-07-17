import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Loader2, GitMerge, Search } from "lucide-react";

interface Row {
  id: string;
  developer_id: string | null;
  name: string;
  emirate: string | null;
  location: string | null;
  handover_date: string | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  description: string | null;
  cover: string | null;
}
interface Cluster { keep: Row; duplicates: Row[]; }

export default function ProjectDedupePage() {
  const [developerId, setDeveloperId] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selection, setSelection] = useState<Record<string, Set<string>>>({});
  const [merging, setMerging] = useState<string | null>(null);

  const { data: developers = [] } = useQuery({
    queryKey: ["dev-list-for-dedup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name")
        .order("name")
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const runScan = async () => {
    if (!developerId) { toast.error("Pick a developer first"); return; }
    setScanning(true); setClusters([]); setSelection({});
    try {
      const { data, error } = await supabase.functions.invoke("dedup-projects", {
        body: { action: "scan", developer_id: developerId },
      });
      if (error) throw error;
      const cl = (data?.clusters ?? []) as Cluster[];
      setClusters(cl);
      const init: Record<string, Set<string>> = {};
      cl.forEach((c) => { init[c.keep.id] = new Set(c.duplicates.map((d) => d.id)); });
      setSelection(init);
      toast.success(`${cl.length} duplicate cluster${cl.length === 1 ? "" : "s"} found`);
    } catch (e) {
      toast.error(`Scan failed: ${(e as Error).message}`);
    } finally { setScanning(false); }
  };

  const toggle = (keepId: string, dupId: string) => {
    setSelection((prev) => {
      const cur = new Set(prev[keepId] ?? []);
      if (cur.has(dupId)) cur.delete(dupId); else cur.add(dupId);
      return { ...prev, [keepId]: cur };
    });
  };

  const merge = async (keepId: string) => {
    const dupIds = Array.from(selection[keepId] ?? []);
    if (dupIds.length === 0) { toast.error("Select at least one duplicate"); return; }
    setMerging(keepId);
    try {
      const { data, error } = await supabase.functions.invoke("dedup-projects", {
        body: { action: "merge", keep_id: keepId, duplicate_ids: dupIds },
      });
      if (error) throw error;
      toast.success(`Merged ${data.deleted} record(s), repointed ${data.child_rows_repointed} media`);
      setClusters((cs) => cs.filter((c) => c.keep.id !== keepId));
    } catch (e) {
      toast.error(`Merge failed: ${(e as Error).message}`);
    } finally { setMerging(null); }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Project Deduplication</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Scan a developer's projects for duplicates. The richest record (cover image + description + handover)
          is kept and thinner duplicates are merged into it. Media and files are repointed automatically.
        </p>
      </div>

      <Card className="p-4 bg-[#F7F2EA] border-[#B89555]/40">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#1A1A1A]/70 mb-1">Developer</label>
            <select
              value={developerId}
              onChange={(e) => setDeveloperId(e.target.value)}
              className="w-full h-10 rounded-md border border-[#B89555]/40 bg-white px-3 text-sm"
            >
              <option value="">— select —</option>
              {developers.map((d: any) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
          <Button
            onClick={runScan}
            disabled={scanning || !developerId}
            className="bg-emerald-900 hover:bg-emerald-800 text-white"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Scan for duplicates
          </Button>
        </div>
      </Card>

      {clusters.length === 0 && !scanning && (
        <Card className="p-8 text-center text-sm text-[#1A1A1A]/60 bg-[#FDFBF7] border-[#B89555]/30">
          No duplicate clusters yet. Pick a developer and run a scan.
        </Card>
      )}

      {clusters.map((c) => (
        <Card key={c.keep.id} className="p-5 bg-white border-[#B89555]/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-900 text-white">Keep</Badge>
                <h3 className="text-base font-semibold text-[#1A1A1A]">{c.keep.name}</h3>
                {c.keep.emirate && <span className="text-xs text-[#1A1A1A]/60">· {c.keep.emirate}</span>}
                {c.keep.cover && <span className="text-xs text-emerald-900">· has cover</span>}
              </div>
              {c.keep.description && (
                <p className="text-xs text-[#1A1A1A]/60 mt-1 line-clamp-2">{c.keep.description}</p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => merge(c.keep.id)}
              disabled={merging === c.keep.id || (selection[c.keep.id]?.size ?? 0) === 0}
              className="bg-[#B89555] hover:bg-[#a48244] text-white"
            >
              {merging === c.keep.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitMerge className="h-4 w-4 mr-2" />}
              Merge selected
            </Button>
          </div>

          <div className="mt-4 space-y-2 pl-2 border-l-2 border-[#B89555]/30">
            {c.duplicates.map((d) => (
              <label key={d.id} className="flex items-start gap-3 py-1 cursor-pointer">
                <Checkbox
                  checked={selection[c.keep.id]?.has(d.id) ?? false}
                  onCheckedChange={() => toggle(c.keep.id, d.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-[#1A1A1A]">{d.name}</span>
                    {d.emirate && <span className="text-xs text-[#1A1A1A]/50">· {d.emirate}</span>}
                    {!d.cover && <span className="text-xs text-red-700">· no cover</span>}
                    {(!d.handover_date || d.handover_date === "TBD") && (
                      <span className="text-xs text-red-700">· handover TBD</span>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-xs text-[#1A1A1A]/50 line-clamp-1">{d.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
