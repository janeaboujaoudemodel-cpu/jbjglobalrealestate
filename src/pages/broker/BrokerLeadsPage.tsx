import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { Loader2 } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

export default function BrokerLeadsPage() {
  const leads = useBrokerScopedLeads();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">All my leads</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Every lead currently visible to you across all assigned databases.
        </p>
      </header>

      <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 overflow-hidden">
        {leads.isLoading ? (
          <div className="p-10 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (leads.data?.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-[#1A1A1A]/60">No leads visible to you yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#EFE6D6]/60">
              <tr>
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.data!.map((l: any) => (
                <tr key={l.id} className="border-t border-[#B89555]/15">
                  <td className="px-4 py-2 font-medium">{l.full_name || "Unnamed"}</td>
                  <td className="px-4 py-2 text-xs text-[#1A1A1A]/70">{l.status || "—"}</td>
                  <td className="px-4 py-2 text-xs text-[#1A1A1A]/70">{l.source || "—"}</td>
                  <td className="px-4 py-2 text-xs text-[#1A1A1A]/60 tabular-nums">{formatDisplayDate(l.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
