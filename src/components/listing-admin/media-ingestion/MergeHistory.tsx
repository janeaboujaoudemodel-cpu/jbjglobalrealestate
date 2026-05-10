import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AuditRow {
  id: string;
  job_id: string;
  target_table: string;
  target_row_id: string;
  action: string;
  performed_at: string;
  payload: any;
}

export function MergeHistory() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("media_ingestion_audit")
      .select("*")
      .order("performed_at", { ascending: false })
      .limit(200);
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const rollback = async (jobId: string) => {
    const { error } = await supabase.functions.invoke("media-ingestion-rollback", {
      body: { job_ids: [jobId] },
    });
    if (error) toast.error("Rollback failed");
    else {
      toast.success("Rolled back");
      load();
    }
  };

  // Group by job_id
  const grouped = rows.reduce<Record<string, AuditRow[]>>((acc, r) => {
    (acc[r.job_id] = acc[r.job_id] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-foreground font-semibold">
        <History className="w-5 h-5 text-[#1A1A1A]" />
        Merge History
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && Object.keys(grouped).length === 0 && (
        <p className="text-sm text-muted-foreground">No merges yet.</p>
      )}
      {Object.entries(grouped).map(([jobId, items]) => (
        <div
          key={jobId}
          className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">
              Job {jobId.slice(0, 8)} · {new Date(items[0].performed_at).toLocaleString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rollback(jobId)}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Rollback
            </Button>
          </div>
          <ul className="text-sm text-foreground space-y-0.5">
            {items.map((r) => (
              <li key={r.id}>
                <span className="text-muted-foreground">{r.action}</span> →{" "}
                <span className="font-medium">{r.target_table}</span>
                {r.payload?.url ? (
                  <span className="text-xs text-muted-foreground ml-2">
                    {String(r.payload.url).slice(0, 60)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
