/**
 * DLDConflictsSection — panel showing DLD scrape conflicts awaiting review.
 * Approve → patches contact fields on the live row.
 * Reject  → leaves live row untouched, marks conflict resolved.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, Check, X } from "lucide-react";

type Segment = "developer" | "brokerage" | "broker";

const SEG_LABEL: Record<Segment, string> = {
  developer: "Developer",
  brokerage: "Brokerage",
  broker: "Broker",
};

export function DLDConflictsSection() {
  const q = useQuery({
    queryKey: ["dld-conflicts", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dld_scrape_conflicts" as any)
        .select("*")
        .eq("resolution", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 30_000,
  });

  const decide = async (conflict_id: string, decision: "approved" | "rejected") => {
    const { error } = await supabase.functions.invoke("dld-review-conflict", {
      body: { conflict_id, decision },
    });
    if (error) {
      toast.error("Failed to resolve conflict");
      return;
    }
    toast.success(
      decision === "approved" ? "Live record updated with DLD data" : "Conflict dismissed",
    );
    q.refetch();
  };

  const rows = q.data ?? [];

  return (
    <Card className="bg-white border-[#B89555]/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-[#B45309]" />
        <h3 className="text-sm font-black text-[#0F1A16] tracking-tight">
          DLD Conflicts — needs your review
        </h3>
        <span className="ml-auto text-[11px] text-[#4B5D55]">
          {rows.length} pending
        </span>
      </div>

      {q.isLoading && (
        <p className="text-[12px] text-[#4B5D55]">Loading conflicts…</p>
      )}
      {!q.isLoading && rows.length === 0 && (
        <p className="text-[12px] text-[#4B5D55] italic">
          No conflicts. Nightly DLD sync only inserts net-new rows — nothing existing has been altered.
        </p>
      )}

      <div className="space-y-2">
        {rows.map((c: any) => {
          const live = c.live_snapshot ?? {};
          const dld = c.dld_snapshot ?? {};
          const seg = c.segment as Segment;
          const nameField =
            seg === "developer" ? "name" : seg === "brokerage" ? "company_name" : "full_name";
          const liveEmail = live.email ?? live.email_lower ?? "—";
          const dldEmail = dld.email ?? "—";
          const livePhone = live.phone_number ?? live.phone_e164 ?? "—";
          const dldPhone = dld.phone ?? dld.mobile ?? "—";

          return (
            <div
              key={c.id}
              className="border border-[#B45309]/25 rounded-md p-3 bg-[#FFF7EC]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-[#7A5C1E]">
                  {SEG_LABEL[seg]}
                </span>
                <span className="text-sm font-black text-[#0F1A16]">
                  {live[nameField] ?? dld.name_en ?? "—"}
                </span>
                <span className="ml-auto text-[10px] text-[#4B5D55]">{c.match_type}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#4B5D55] font-black mb-1">Live (kept)</p>
                  <p><span className="text-[#4B5D55]">Email:</span> {liveEmail}</p>
                  <p><span className="text-[#4B5D55]">Phone:</span> {livePhone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#4B5D55] font-black mb-1">From DLD (new)</p>
                  <p><span className="text-[#4B5D55]">Email:</span> {dldEmail}</p>
                  <p><span className="text-[#4B5D55]">Phone:</span> {dldPhone}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                <Button
                  size="sm" variant="outline"
                  onClick={() => decide(c.id, "rejected")}
                  className="border-[#4B5D55]/40 text-[#4B5D55]"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => decide(c.id, "approved")}
                  className="bg-[#064E3B] hover:bg-[#053729] text-white"
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Approve DLD values
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default DLDConflictsSection;
