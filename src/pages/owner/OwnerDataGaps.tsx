/**
 * Owner Data Gaps — chase-list of fields that fell back to "Not specified".
 * Sourced from public.missing_field_flags (owner-only via RLS).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

interface Flag {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_slug: string | null;
  entity_name: string | null;
  field_name: string;
  surface: string | null;
  first_seen_at: string;
  last_seen_at: string;
  seen_count: number;
  resolved_at: string | null;
}

export default function OwnerDataGaps() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["missing-field-flags", showResolved],
    queryFn: async () => {
      let query = supabase
        .from("missing_field_flags")
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(500);
      if (!showResolved) query = query.is("resolved_at", null);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Flag[];
    },
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("missing_field_flags")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as resolved");
      qc.invalidateQueries({ queryKey: ["missing-field-flags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter((f) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (f.entity_name ?? "").toLowerCase().includes(s) ||
      f.field_name.toLowerCase().includes(s) ||
      f.entity_type.toLowerCase().includes(s)
    );
  });

  // Group by entity for a chase-list feel
  const grouped = new Map<string, Flag[]>();
  for (const f of filtered) {
    const k = `${f.entity_type}:${f.entity_id}`;
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(f);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Data Gaps
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every field that rendered as "Not specified" — chase these with the developer to replace fallbacks with real data.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </header>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search entity, field, type…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Include resolved
        </label>
        <Badge variant="secondary">{filtered.length} flags · {grouped.size} entities</Badge>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : grouped.size === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
          No gaps logged. Everything on public pages is showing real data.
        </Card>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([k, flags]) => {
            const first = flags[0];
            return (
              <Card key={k} className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase text-xs">{first.entity_type}</Badge>
                      <h3 className="font-semibold">{first.entity_name || first.entity_slug || first.entity_id}</h3>
                    </div>
                    {first.entity_slug && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{first.entity_slug}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{flags.length} missing field{flags.length === 1 ? "" : "s"}</Badge>
                </div>
                <ul className="divide-y">
                  {flags.map((f) => (
                    <li key={f.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{f.field_name}</span>
                        {f.surface && <span className="text-muted-foreground ml-2">· {f.surface}</span>}
                        <div className="text-xs text-muted-foreground">
                          seen {f.seen_count}× · last {new Date(f.last_seen_at).toLocaleString()}
                        </div>
                      </div>
                      {f.resolved_at ? (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-300">Resolved</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => resolve.mutate(f.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Resolve
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
