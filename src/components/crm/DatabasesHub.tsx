import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Download, Upload, FileSpreadsheet, RefreshCw, Loader2, ShieldCheck, Settings2, ChevronRight, ChevronDown } from "lucide-react";
import UploadDatabaseDialog from "./UploadDatabaseDialog";
import GrantBrokerAccessDialog from "./GrantBrokerAccessDialog";
import BrokerGrantsManagerDialog from "./BrokerGrantsManagerDialog";
import DatabaseRowsGrid from "./DatabaseRowsGrid";
import LeadPublishQueue from "./LeadPublishQueue";
import { toast } from "sonner";
import { formatDisplayDate as formatDate } from "@/utils/formatDate";
import { CRMToolbar } from "@/components/ui/crm-toolbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = {
  id: string;
  name: string;
  original_filename: string;
  mime_type: string | null;
  file_storage_path: string | null;
  file_size_bytes: number | null;
  row_count: number;
  column_headers: string[];
  status: "separate" | "merged" | "both";
  notes: string | null;
  uploaded_at: string;
  uploaded_by: string;
};

const statusLabel: Record<Row["status"], string> = {
  separate: "Separate",
  merged: "Merged",
  both: "Merged + Separate",
};

function fmtBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function DatabasesHub() {
  const [rows, setRows] = useState<Row[]>([]);
  const [grantsByDb, setGrantsByDb] = useState<Record<string, { count: number; latest: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Row["status"]>("all");
  const [grantTarget, setGrantTarget] = useState<Row | null>(null);
  const [manageTarget, setManageTarget] = useState<Row | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const toggleOpen = (id: string) => {
    const next = new Set(openIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setOpenIds(next);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_source_databases" as any)
      .select("*")
      .is("archived_at", null)
      .order("uploaded_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) || []);

    // Grantee summary per database (active grants only)
    const { data: grantsData } = await supabase
      .from("vw_crm_database_access" as any)
      .select("database_id, granted_at, status")
      .eq("status", "active");
    const summary: Record<string, { count: number; latest: string | null }> = {};
    for (const g of (grantsData as any[]) || []) {
      const s = summary[g.database_id] ||= { count: 0, latest: null };
      s.count += 1;
      if (!s.latest || g.granted_at > s.latest) s.latest = g.granted_at;
    }
    setGrantsByDb(summary);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.original_filename.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const download = async (r: Row) => {
    if (!r.file_storage_path) { toast.error("No file on storage"); return; }
    const { data, error } = await supabase.storage
      .from("crm-source-databases")
      .createSignedUrl(r.file_storage_path, 60, { download: r.original_filename });
    if (error || !data?.signedUrl) { toast.error(error?.message || "Could not sign URL"); return; }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = r.original_filename;
    a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="crm-scope space-y-4 w-full min-w-0">
      <CRMToolbar>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] basis-[280px]">
          <Input
            placeholder="Search databases…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] min-w-0"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger
              aria-label="Status filter"
              className="h-9 w-[180px] shrink-0 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] text-sm text-[#1A1A1A] focus:ring-2 focus:ring-[#B89555]/40 focus:border-[#B89555]/60"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
              <SelectItem value="all" className="focus:bg-[#EFE6D6] focus:text-[#1A1A1A] data-[state=checked]:bg-[#EFE6D6]">All statuses</SelectItem>
              <SelectItem value="separate" className="focus:bg-[#EFE6D6] focus:text-[#1A1A1A] data-[state=checked]:bg-[#EFE6D6]">Separate</SelectItem>
              <SelectItem value="merged" className="focus:bg-[#EFE6D6] focus:text-[#1A1A1A] data-[state=checked]:bg-[#EFE6D6]">Merged</SelectItem>
              <SelectItem value="both" className="focus:bg-[#EFE6D6] focus:text-[#1A1A1A] data-[state=checked]:bg-[#EFE6D6]">Merged + Separate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={load} className="border-[#B89555]/40 text-[#1A1A1A] shrink-0 h-10 min-w-10">
          <RefreshCw className="h-4 w-4 lg:mr-2" />
          <span className="toolbar-label hidden lg:inline">Refresh</span>
        </Button>
        <Button onClick={() => setUploadOpen(true)} className="shrink-0 h-10">
          <Upload className="h-4 w-4 lg:mr-2" />
          <span className="toolbar-label hidden lg:inline">Upload Database</span>
        </Button>
      </CRMToolbar>

      <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[#1A1A1A]/70 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="h-10 w-10 mx-auto text-[#1A1A1A]/40 mb-3" />
            <div className="text-sm text-[#1A1A1A] font-medium">No databases yet</div>
            <div className="text-xs text-[#1A1A1A]/60 mb-4">Upload a CSV or Excel file to get started.</div>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" /> Upload Database
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#B89555]/15">
            {filtered.map((r) => {
              const isOpen = openIds.has(r.id);
              return (
              <div key={r.id} className="min-w-0">
                <div className="px-3 sm:px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleOpen(r.id)}
                    className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md border border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  <FileSpreadsheet className="h-5 w-5 text-[#1A1A1A]/60 shrink-0" />
                  <button
                    type="button"
                    onClick={() => toggleOpen(r.id)}
                    className="flex-1 min-w-[180px] basis-[220px] text-left"
                  >
                    <div className="text-sm font-medium text-[#1A1A1A] truncate">{r.name}</div>
                    <div className="text-[11px] text-[#1A1A1A]/60 truncate">
                      {r.original_filename} · {r.row_count.toLocaleString()} rows · {r.column_headers?.length || 0} cols · {fmtBytes(r.file_size_bytes)}
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => setManageTarget(r)}
                      data-surface="emerald"
                      data-emerald-ok="pill"
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-transparent jj-surface-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/40"
                      title="Manage broker access"
                    >
                      {(grantsByDb[r.id]?.count ?? 0)} {(grantsByDb[r.id]?.count ?? 0) === 1 ? "broker" : "brokers"}
                    </button>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#B89555]/30 bg-[#EFE6D6] text-[#1A1A1A]">
                      {statusLabel[r.status]}
                    </span>
                    <span className="hidden md:inline text-[11px] text-[#1A1A1A]/60 tabular-nums">
                      {formatDate(r.uploaded_at)}
                    </span>
                    <Button
                      size="sm" onClick={() => setGrantTarget(r)}
                      className="h-9 px-3 min-w-[106px]" title="Give Access"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 lg:mr-1" />
                      <span className="hidden lg:inline">Give Access</span>
                    </Button>
                    <Button
                      size="sm" onClick={() => setManageTarget(r)}
                      className="h-9 px-3 min-w-[92px]" title="Manage"
                    >
                      <Settings2 className="h-3.5 w-3.5 lg:mr-1" />
                      <span className="hidden lg:inline">Manage</span>
                    </Button>
                    <Button
                      size="sm" onClick={() => download(r)}
                      className="h-9 px-3 min-w-[104px]" title="Download"
                    >
                      <Download className="h-3.5 w-3.5 lg:mr-1" />
                      <span className="hidden lg:inline">Download</span>
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-3 sm:px-4 pb-3">
                    <DatabaseRowsGrid databaseId={r.id} currentUserId={currentUserId} />
                  </div>
                )}
              </div>
            );})}
          </div>
        )}
      </div>

      <div className="mt-4">
        <LeadPublishQueue />
      </div>

      <UploadDatabaseDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onCreated={() => load()}
      />

      {grantTarget && (
        <GrantBrokerAccessDialog
          open={!!grantTarget}
          onOpenChange={(v) => !v && setGrantTarget(null)}
          sourceDatabaseId={grantTarget.id}
          sourceDatabaseName={grantTarget.name}
          onGranted={() => load()}
        />
      )}

      {manageTarget && (
        <BrokerGrantsManagerDialog
          open={!!manageTarget}
          onOpenChange={(v) => !v && setManageTarget(null)}
          sourceDatabaseId={manageTarget.id}
          sourceDatabaseName={manageTarget.name}
        />
      )}
    </div>
  );
}
