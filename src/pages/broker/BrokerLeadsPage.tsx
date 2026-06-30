import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Plus, Sparkles, ArrowRight } from "lucide-react";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { formatDisplayDate } from "@/utils/formatDate";
import { useAuth } from "@/contexts/AuthContext";
import CRMLeadModal from "@/components/crm/CRMLeadModal";
import { Button } from "@/components/ui/button";

export default function BrokerLeadsPage() {
  const leads = useBrokerScopedLeads();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const focusId = params.get("focus");
  const focusRef = useRef<HTMLTableRowElement | null>(null);

  // Open Add Lead when ?action=new is in the URL (from sidebar tile / dashboard).
  useEffect(() => {
    if (params.get("action") === "new") {
      setAddOpen(true);
    }
  }, [params]);

  // Scroll focused lead into view
  useEffect(() => {
    if (focusId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusId, leads.data]);

  const closeAdd = () => {
    setAddOpen(false);
    if (params.get("action")) {
      params.delete("action");
      setParams(new URLSearchParams(params), { replace: true });
    }
  };

  const openInAssistant = (id: string) => {
    navigate(`/broker/ai?leadId=${id}`);
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">All my leads</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Click any lead to open it in JBJ Sales Assistant for context-aware help.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="jj-surface-emerald allow-white inline-flex items-center gap-2 h-10 px-4 rounded-md text-white text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 transition-all"
          data-surface="emerald"
        >
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </header>

      <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 overflow-x-auto">
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
                <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.data!.map((l: any) => {
                const isFocused = l.id === focusId;
                return (
                  <tr
                    key={l.id}
                    ref={isFocused ? focusRef : undefined}
                    onClick={() => openInAssistant(l.id)}
                    className={`border-t border-[#B89555]/15 cursor-pointer transition-colors ${
                      isFocused ? "bg-[#EFE6D6]" : "hover:bg-[#EFE6D6]/50"
                    }`}
                  >
                    <td className="px-4 py-2 font-medium text-[#1A1A1A]">{l.full_name || "Unnamed"}</td>
                    <td className="px-4 py-2 text-xs text-[#1A1A1A]/70">{l.pipeline_stage || "new"}</td>
                    <td className="px-4 py-2 text-xs text-[#1A1A1A]/70">{l.source || l.lead_source_type || "—"}</td>
                    <td className="px-4 py-2 text-xs text-[#1A1A1A]/60 tabular-nums">{formatDisplayDate(l.updated_at)}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openInAssistant(l.id); }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A0A0A] hover:underline"
                      >
                        <Sparkles className="h-3 w-3" /> Open in Assistant <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
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
