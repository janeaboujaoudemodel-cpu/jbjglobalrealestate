import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeleteJunkLead, useRedistributeJunkLead } from "@/hooks/useBrokerJunkActions";
import { Loader2, AlertTriangle, UserCheck, Trash2 } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/**
 * Owner-side Junk Returns queue. Lists every junk lead returned by brokers
 * with two actions: Redistribute to a different broker, or permanently delete.
 */
export default function JunkReturnsQueue() {
  const [pickerLeadId, setPickerLeadId] = useState<string | null>(null);
  const [pickerBrokerId, setPickerBrokerId] = useState<string>("");

  const junk = useQuery({
    queryKey: ["owner-junk-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("id, full_name, email_lower, phone_e164, junk_reason, junk_returned_at, junk_original_broker_id, source")
        .eq("is_junk", true)
        .is("deleted_at", null)
        .order("junk_returned_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const brokers = useQuery({
    queryKey: ["owner-broker-list-for-redistribute"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_profiles")
        .select("user_id, full_name")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  const redistribute = useRedistributeJunkLead();
  const del = useDeleteJunkLead();

  const rows = junk.data ?? [];

  return (
    <section className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 overflow-hidden">
      <header className="px-5 py-4 border-b border-[#B89555]/20 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-[#B89555]" />
        <div>
          <h3 className="text-base font-semibold text-[#1A1A1A]">Junk returns from brokers</h3>
          <p className="text-xs text-[#1A1A1A]/65">
            Leads brokers flagged as junk. Redistribute or delete — they cannot delete leads themselves.
          </p>
        </div>
        <div className="ml-auto text-[11px] text-[#1A1A1A]/55 tabular-nums">{rows.length} pending</div>
      </header>

      {junk.isLoading ? (
        <div className="p-12 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading junk queue…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-sm text-[#1A1A1A]/65">
          No junk leads pending. Returns from brokers will appear here.
        </div>
      ) : (
        <div className="divide-y divide-[#B89555]/15">
          {rows.map((l: any) => {
            const broker = brokers.data?.find((b: any) => b.user_id === l.junk_original_broker_id);
            const picking = pickerLeadId === l.id;
            return (
              <div key={l.id} className="px-5 py-4 flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="text-sm font-semibold text-[#1A1A1A]">{l.full_name || "Unnamed"}</div>
                  <div className="text-[11px] text-[#1A1A1A]/60 mt-0.5">
                    {l.phone_e164 || l.email_lower || "—"}
                    {l.source ? ` · ${l.source}` : ""}
                  </div>
                  <div className="text-[11px] text-[#1A1A1A]/55 mt-1">
                    Returned {formatDisplayDate(l.junk_returned_at)}
                    {broker ? ` by ${broker.full_name}` : ""}
                  </div>
                  {l.junk_reason && (
                    <div className="text-[12px] text-[#1A1A1A]/80 mt-1.5 italic">"{l.junk_reason}"</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {picking ? (
                    <>
                      <Select value={pickerBrokerId} onValueChange={setPickerBrokerId}>
                        <SelectTrigger className="h-9 w-[200px] bg-white border-[#B89555]/35 text-[#1A1A1A]">
                          <SelectValue placeholder="Pick a broker" />
                        </SelectTrigger>
                        <SelectContent>
                          {(brokers.data ?? []).map((b: any) => (
                            <SelectItem key={b.user_id} value={b.user_id}>
                              {b.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          if (!pickerBrokerId) return;
                          redistribute.mutate(
                            { leadId: l.id, newBrokerId: pickerBrokerId },
                            { onSuccess: () => { setPickerLeadId(null); setPickerBrokerId(""); } },
                          );
                        }}
                        disabled={!pickerBrokerId || redistribute.isPending}
                        className="bg-[#102540] hover:bg-[#1a3d63] text-white allow-white"
                        data-allow-dark-cta
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setPickerLeadId(null); setPickerBrokerId(""); }}
                        className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setPickerLeadId(l.id)}
                        className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/45 hover:bg-[#E6DAC2]"
                      >
                        <UserCheck className="h-4 w-4 mr-1.5" /> Redistribute
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Permanently delete "${l.full_name || "this lead"}"? This cannot be undone.`)) {
                            del.mutate(l.id);
                          }
                        }}
                        className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
