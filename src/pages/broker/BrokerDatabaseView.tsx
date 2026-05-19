import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { ArrowLeft, Database, Loader2 } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

export default function BrokerDatabaseView() {
  const { id } = useParams<{ id: string }>();

  const meta = useQuery({
    queryKey: ["broker-db-meta", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_source_databases")
        .select("id, name, row_count, column_headers, uploaded_at")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const leads = useBrokerScopedLeads({ sourceDatabaseId: id });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link
          to="/broker/crm"
          className="inline-flex items-center gap-1.5 text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
        </Link>

        <header className="mb-6 flex items-center gap-3">
          <Database className="h-6 w-6 text-[#1A1A1A]/70" />
          <div>
            <h1 className="text-2xl font-semibold">{meta.data?.name ?? "Database"}</h1>
            <div className="text-[11px] text-[#1A1A1A]/60">
              {meta.data?.row_count?.toLocaleString() ?? 0} rows in source ·
              uploaded {meta.data?.uploaded_at ? formatDisplayDate(meta.data.uploaded_at) : "—"}
            </div>
          </div>
        </header>

        <section className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#B89555]/15 text-xs uppercase tracking-wide text-[#1A1A1A]/70">
            Leads in your scope
          </div>
          {leads.isLoading ? (
            <div className="p-10 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (leads.data?.length ?? 0) === 0 ? (
            <div className="p-12 text-center text-sm text-[#1A1A1A]/60">
              No leads in this database are currently visible to you. Your access scope may
              limit results (date window, lead list or status filter).
            </div>
          ) : (
            <div className="divide-y divide-[#B89555]/15">
              {leads.data!.map((l: any) => (
                <div key={l.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.full_name || "Unnamed lead"}</div>
                    <div className="text-[11px] text-[#1A1A1A]/60 truncate">
                      {l.status || "—"} · {l.source || "—"}
                    </div>
                  </div>
                  <div className="text-[11px] text-[#1A1A1A]/60 tabular-nums">
                    {formatDisplayDate(l.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
