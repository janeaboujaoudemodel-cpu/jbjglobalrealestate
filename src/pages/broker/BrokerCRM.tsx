import { useState } from "react";
import { Link } from "react-router-dom";
import { useBrokerScopedDatabases } from "@/hooks/useBrokerScopedDatabases";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { Database, Users, Activity, ArrowRight, Loader2 } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

type Tab = "databases" | "leads" | "activity";

export default function BrokerCRM() {
  const [tab, setTab] = useState<Tab>("databases");
  const dbs = useBrokerScopedDatabases();
  const leads = useBrokerScopedLeads();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">JBJ GLOBAL REAL ESTATE</div>
          <h1 className="text-3xl font-semibold mt-1">Broker Workspace</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Your assigned databases, leads and activity.
          </p>
        </header>

        <nav className="flex gap-2 mb-6 border-b border-[#B89555]/20">
          {([
            { id: "databases", label: "My Databases", icon: Database },
            { id: "leads", label: "My Leads", icon: Users },
            { id: "activity", label: "Activity", icon: Activity },
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  active
                    ? "border-[#B89555] text-[#1A1A1A] font-medium bg-[#EFE6D6]/40"
                    : "border-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>

        {tab === "databases" && (
          <section className="space-y-3">
            {dbs.isLoading ? (
              <Loading />
            ) : (dbs.data?.length ?? 0) === 0 ? (
              <Empty msg="No databases have been shared with you yet." />
            ) : (
              dbs.data!.map((d) => (
                <Link
                  key={d.grant_id}
                  to={`/broker/crm/database/${d.database_id}`}
                  className="block p-4 rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 hover:border-[#B89555]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-[#1A1A1A]/60" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{d.database_name}</div>
                      <div className="text-[11px] text-[#1A1A1A]/60">
                        {d.permission_level === "edit" ? "Edit access" : "View access"} ·
                        granted {formatDisplayDate(d.granted_at)}
                        {d.date_window_mode !== "all" && ` · window: ${d.date_window_mode}`}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#1A1A1A]/50" />
                  </div>
                </Link>
              ))
            )}
          </section>
        )}

        {tab === "leads" && (
          <section className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 overflow-hidden">
            {leads.isLoading ? (
              <Loading />
            ) : (leads.data?.length ?? 0) === 0 ? (
              <Empty msg="No leads visible to you yet." />
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
        )}

        {tab === "activity" && (
          <Empty msg="Activity stream coming online — your edits will appear here." />
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="p-10 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="p-12 text-center text-sm text-[#1A1A1A]/60 bg-[#F7F2EA] border border-[#B89555]/20 rounded-xl">
      {msg}
    </div>
  );
}
