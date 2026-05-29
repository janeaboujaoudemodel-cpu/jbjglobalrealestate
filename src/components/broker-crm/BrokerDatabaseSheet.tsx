import { useState } from "react";
import { Loader2, ArrowLeft, Database as DBIcon, Sparkles, AlertTriangle, Plus } from "lucide-react";
import { useBrokerDatabaseLeads } from "@/hooks/useBrokerDatabaseLeads";
import { usePromoteLeadToMain } from "@/hooks/useBrokerJunkActions";
import { formatDisplayDate } from "@/utils/formatDate";
import MarkJunkDialog from "./MarkJunkDialog";

interface Props {
  databaseId: string;
  databaseName: string;
  onBack: () => void;
}

/**
 * Subsection inside /broker/crm. Shows leads of one broker-uploaded database
 * as an isolated CRM-style sheet. Leads here are NOT in the broker's main
 * "My Leads" until they explicitly Promote them. Junk returns to owner.
 */
export default function BrokerDatabaseSheet({ databaseId, databaseName, onBack }: Props) {
  const leads = useBrokerDatabaseLeads(databaseId);
  const promote = usePromoteLeadToMain();
  const [junkLead, setJunkLead] = useState<{ id: string; name: string } | null>(null);

  const rows = leads.data ?? [];
  const merged = rows.filter((l: any) => l.merged_to_main_leads).length;

  return (
    <section className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 overflow-hidden">
      <header className="px-5 py-4 border-b border-[#B89555]/20 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to databases
          </button>
          <div className="h-4 w-px bg-[#B89555]/30" />
          <DBIcon className="h-4 w-4 text-[#B89555]" />
          <div>
            <h3 className="text-base font-semibold text-[#1A1A1A]">{databaseName}</h3>
            <div className="text-[11px] text-[#1A1A1A]/60">
              {rows.length.toLocaleString()} leads · {merged} in My Leads
            </div>
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">
          Sheet view · isolated from main pipeline
        </div>
      </header>

      {leads.isLoading ? (
        <div className="p-12 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading leads…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-14 text-center text-sm text-[#1A1A1A]/65">
          No leads in this database yet. Upload rows from the Add database dialog.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#EFE6D6]/60">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Name</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Phone</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Stage</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">In My Leads</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Updated</th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l: any) => (
                <tr key={l.id} className="border-t border-[#B89555]/15 hover:bg-[#EFE6D6]/40">
                  <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{l.full_name || "Unnamed"}</td>
                  <td className="px-4 py-2.5 text-xs text-[#1A1A1A]/70">{l.phone_e164 || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-[#1A1A1A]/70 capitalize">{l.pipeline_stage || "new"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {l.merged_to_main_leads ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1A1A1A] bg-[#EFE6D6] border border-[#B89555]/40 rounded px-1.5 py-0.5 uppercase tracking-wider">
                        <Sparkles className="h-2.5 w-2.5" /> In pipeline
                      </span>
                    ) : (
                      <span className="text-[#1A1A1A]/45 text-[11px]">Sheet only</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#1A1A1A]/60 tabular-nums">
                    {formatDisplayDate(l.updated_at)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {!l.merged_to_main_leads && (
                        <button
                          type="button"
                          onClick={() => promote.mutate(l.id)}
                          disabled={promote.isPending}
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-[#EFE6D6] border border-[#B89555]/45 text-[11px] font-semibold text-[#1A1A1A] hover:bg-[#E6DAC2] transition-colors"
                        >
                          <Plus className="h-3 w-3" /> Promote
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setJunkLead({ id: l.id, name: l.full_name })}
                        className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-[#B89555]/40 text-[11px] font-semibold text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors"
                      >
                        <AlertTriangle className="h-3 w-3" /> Junk
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MarkJunkDialog
        open={!!junkLead}
        onOpenChange={(v) => !v && setJunkLead(null)}
        leadId={junkLead?.id ?? null}
        leadName={junkLead?.name}
      />
    </section>
  );
}
