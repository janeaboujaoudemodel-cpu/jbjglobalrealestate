import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Clock, ArrowRight } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  details: Record<string, any> | null;
  created_at: string;
  actor_user_id: string | null;
}

const actionColors: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  status_change: "bg-amber-100 text-amber-700",
  view: "bg-zinc-100 text-zinc-600",
  export: "bg-purple-100 text-purple-700",
};

export default function LeadAuditHistory({ leadId }: { leadId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("crm_audit_logs")
        .select("*")
        .eq("entity_id", leadId)
        .order("created_at", { ascending: false })
        .limit(100);
      setEntries((data as AuditEntry[]) || []);
      setLoading(false);
    };
    load();
  }, [leadId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gold/30">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-gold" />
          <h3 className="font-semibold text-sm">Audit Trail — {entries.length} Events</h3>
        </div>

        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No audit history for this lead</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.id} className="flex gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="p-2 bg-muted rounded-full h-fit shrink-0">
                  <Clock className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] ${actionColors[entry.action] || "bg-zinc-100 text-zinc-600"}`}>
                      {entry.action.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{entry.entity_type}</span>
                  </div>

                  {/* Show changed fields */}
                  {entry.old_values && entry.new_values && (
                    <div className="text-xs space-y-0.5">
                      {Object.keys(entry.new_values).map((key) => {
                        const oldVal = entry.old_values?.[key];
                        const newVal = entry.new_values?.[key];
                        if (oldVal === newVal) return null;
                        return (
                          <div key={key} className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-zinc-600">{key}:</span>
                            <span className="text-red-500 line-through">{String(oldVal ?? "—")}</span>
                            <ArrowRight className="h-3 w-3 text-zinc-400 shrink-0" />
                            <span className="text-emerald-600">{String(newVal ?? "—")}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {entry.details && !entry.old_values && (
                    <p className="text-xs text-muted-foreground truncate">
                      {typeof entry.details === "object" ? JSON.stringify(entry.details) : String(entry.details)}
                    </p>
                  )}

                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                    {entry.actor_user_id && <span className="ml-2">by {entry.actor_user_id.slice(0, 8)}…</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
