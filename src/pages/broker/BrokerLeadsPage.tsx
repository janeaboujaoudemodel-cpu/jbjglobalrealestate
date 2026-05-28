import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { formatDisplayDate } from "@/utils/formatDate";
import { useAuth } from "@/contexts/AuthContext";
import CRMLeadModal from "@/components/crm/CRMLeadModal";

export default function BrokerLeadsPage() {
  const leads = useBrokerScopedLeads();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);

  // Open Add Lead when ?action=new is in the URL (from sidebar tile / dashboard).
  useEffect(() => {
    if (params.get("action") === "new") {
      setAddOpen(true);
    }
  }, [params]);

  const closeAdd = () => {
    setAddOpen(false);
    if (params.get("action")) {
      params.delete("action");
      setParams(params, { replace: true });
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">All my leads</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Every lead currently visible to you across all assigned databases.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[#102540] text-white text-sm font-semibold hover:bg-[#1a3d63] transition-colors"
          data-allow-dark-cta
        >
          <Plus className="h-4 w-4" /> Add Lead
        </button>
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
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider">Stage</th>
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.data!.map((l: any) => (
                <tr key={l.id} className="border-t border-[#B89555]/15">
                  <td className="px-4 py-2 font-medium">{l.full_name || "Unnamed"}</td>
                  <td className="px-4 py-2 text-xs text-[#1A1A1A]/70">{l.pipeline_stage || "new"}</td>
                  <td className="px-4 py-2 text-xs text-[#1A1A1A]/70">{l.source || l.lead_source_type || "—"}</td>
                  <td className="px-4 py-2 text-xs text-[#1A1A1A]/60 tabular-nums">{formatDisplayDate(l.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {user?.id && (
        <CRMLeadModal
          open={addOpen}
          onClose={closeAdd}
          onSuccess={() => { leads.refetch(); }}
          userId={user.id}
        />
      )}
    </div>
  );
}
