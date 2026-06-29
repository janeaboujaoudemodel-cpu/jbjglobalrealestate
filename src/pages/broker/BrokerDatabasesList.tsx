import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBrokerScopedDatabases } from "@/hooks/useBrokerScopedDatabases";
import { Database, ArrowRight, Loader2, Lock, Upload, Inbox } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";
import UploadDatabaseDialog from "@/components/crm/UploadDatabaseDialog";
import RequestDatabaseDialog from "@/components/broker-portal/RequestDatabaseDialog";
import { IconTile } from "@/components/ui/icon-tile";

export default function BrokerDatabasesList() {
  const dbs = useBrokerScopedDatabases();
  const [params, setParams] = useSearchParams();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    if (params.get("action") === "import") {
      setUploadOpen(true);
    }
  }, [params]);

  const handleOpenChange = (next: boolean) => {
    setUploadOpen(next);
    if (!next && params.get("action")) {
      params.delete("action");
      setParams(params, { replace: true });
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My databases</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Databases shared with you, plus databases you import. Click any to open the editor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-[#B89555]/55 bg-[#EFE6D6] text-[#1A1A1A] text-sm font-semibold hover:bg-[#F7F2EA] transition-colors"
          >
            <Inbox className="h-4 w-4" /> Request Database
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md jj-surface-emerald allow-white text-white text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 transition-colors"
            data-allow-dark-cta
          >
            <Upload className="h-4 w-4" /> Import Database
          </button>
        </div>
      </header>

      {dbs.isLoading ? (
        <div className="p-12 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (dbs.data?.length ?? 0) === 0 ? (
        <div className="p-12 text-center text-sm text-[#1A1A1A]/60 bg-[#F7F2EA] border border-[#B89555]/20 rounded-xl space-y-4">
          <p>
            No databases shared with you yet. Use <span className="font-semibold">Request Database</span> for JBJ access or <span className="font-semibold">Import Database</span> to upload your own CSV or Excel file.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setRequestOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-[#B89555]/55 bg-[#EFE6D6] text-[#1A1A1A] text-sm font-semibold hover:bg-[#FDFBF7] transition-colors"
            >
              <Inbox className="h-4 w-4" /> Request Database
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md jj-surface-emerald allow-white text-white text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 transition-colors"
              data-allow-dark-cta
            >
              <Upload className="h-4 w-4" /> Import Database
            </button>
          </div>
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
                <IconTile icon={Database} tone="emerald" size="sm" className="!h-9 !w-9 !rounded-xl" iconClassName="!h-4 !w-4" />
                <span data-surface="emerald" data-allow-dark-cta className="allow-white inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75)] group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="h-4 w-4" strokeWidth={2.6} style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "none", opacity: 1 }} />
                </span>
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

      <UploadDatabaseDialog
        open={uploadOpen}
        onOpenChange={handleOpenChange}
        onCreated={() => dbs.refetch()}
      />
      <RequestDatabaseDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
