import { Link } from "react-router-dom";
import { useBrokerScopedDatabases } from "@/hooks/useBrokerScopedDatabases";
import { Database, ArrowRight, Loader2, Lock } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

export default function BrokerDatabasesList() {
  const dbs = useBrokerScopedDatabases();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">My databases</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Databases shared with you. Click any to open the Excel-style editor.
        </p>
      </header>

      {dbs.isLoading ? (
        <div className="p-12 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (dbs.data?.length ?? 0) === 0 ? (
        <div className="p-12 text-center text-sm text-[#1A1A1A]/60 bg-[#F7F2EA] border border-[#B89555]/20 rounded-xl">
          No databases have been shared with you yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dbs.data!.map((d) => (
            <Link
              key={d.grant_id}
              to={`/broker/crm/database/${d.database_id}`}
              className="block p-5 rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 hover:border-[#B89555]/60 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <Database className="h-5 w-5 text-[#1A1A1A]/60" />
                <ArrowRight className="h-4 w-4 text-[#1A1A1A]/40 group-hover:translate-x-0.5 transition" />
              </div>
              <h3 className="text-sm font-medium truncate">{d.database_name}</h3>
              <div className="text-[11px] text-[#1A1A1A]/60 mt-1 flex items-center gap-1">
                {d.permission_level === "edit" ? "Edit access" : <><Lock className="h-3 w-3" /> View only</>}
                {" · "}granted {formatDisplayDate(d.granted_at)}
              </div>
              {d.date_window_mode !== "all" && (
                <div className="text-[10px] text-[#1A1A1A]/55 mt-1">Window: {d.date_window_mode}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
