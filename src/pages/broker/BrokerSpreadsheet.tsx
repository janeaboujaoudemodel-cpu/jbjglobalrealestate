import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrokerScopedDatabases } from "@/hooks/useBrokerScopedDatabases";
import { ArrowLeft, Loader2, Lock, Search, Download } from "lucide-react";

type Row = {
  id: string;
  full_name: string | null;
  email_lower: string | null;
  phone_e164: string | null;
  status: string | null;
  source: string | null;
  source_database_id: string | null;
  updated_at: string;
};

const COLUMNS: { key: keyof Row; label: string; type: "text" | "status" }[] = [
  { key: "full_name", label: "Name", type: "text" },
  { key: "email_lower", label: "Email", type: "text" },
  { key: "phone_e164", label: "Phone", type: "text" },
  { key: "status", label: "Status", type: "status" },
  { key: "source", label: "Source", type: "text" },
];

const STATUS_OPTIONS = ["new","contacted","qualified","proposal","negotiation","closed_won","closed_lost"];

export default function BrokerSpreadsheet() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const dbs = useBrokerScopedDatabases();
  const grant = dbs.data?.find((d) => d.database_id === id);
  const canEdit = grant?.permission_level === "edit";

  const [search, setSearch] = useState("");

  const meta = useQuery({
    queryKey: ["broker-db-meta", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_source_databases")
        .select("id, name, row_count")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
  });

  const rowsQ = useQuery({
    queryKey: ["broker-db-rows", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("id, full_name, email_lower, phone_e164, status, source, source_database_id, updated_at")
        .eq("source_database_id", id!)
        .order("updated_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return rowsQ.data ?? [];
    return (rowsQ.data ?? []).filter((r) =>
      [r.full_name, r.email_lower, r.phone_e164, r.status, r.source]
        .filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [rowsQ.data, search]);

  const update = useMutation({
    mutationFn: async (patch: { id: string; field: keyof Row; value: string | null }) => {
      const { error } = await supabase
        .from("crm_leads")
        .update({ [patch.field]: patch.value })
        .eq("id", patch.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-db-rows", id] }),
  });

  const exportCsv = () => {
    const head = ["Name","Email","Phone","Status","Source"];
    const lines = [head.join(",")];
    filtered.forEach((r) => lines.push(
      [r.full_name, r.email_lower, r.phone_e164, r.status, r.source]
        .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")
    ));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${meta.data?.name ?? "database"}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (rowsQ.isLoading) {
    return (
      <div className="p-12 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading rows…
      </div>
    );
  }

  return (
    <div>
      <Link to="/broker/crm/databases" className="inline-flex items-center gap-1.5 text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to databases
      </Link>

      <header className="mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{meta.data?.name ?? "Database"}</h1>
          <p className="text-xs text-[#1A1A1A]/70 mt-1">
            {filtered.length.toLocaleString()} rows visible · {canEdit ? "Edit access" : "View only"}
            {!canEdit && <Lock className="inline h-3 w-3 ml-1" />}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1A1A1A]/50" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-1.5 text-sm bg-white border border-[#B89555]/20 rounded-md focus:outline-none focus:border-[#B89555]/60"
            />
          </div>
          <button onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#B89555]/30 text-sm hover:bg-[#EFE6D6]/50">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </header>

      <div className="rounded-xl bg-white border border-[#B89555]/20 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#EFE6D6]/60 sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 w-10">#</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 border-l border-[#B89555]/10">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={COLUMNS.length + 1} className="p-10 text-center text-[#1A1A1A]/60">
                  No rows in your scope.
                </td></tr>
              )}
              {filtered.map((r, i) => (
                <tr key={r.id} className="border-t border-[#B89555]/10 hover:bg-[#F7F2EA]/50">
                  <td className="px-3 py-1.5 text-[11px] text-[#1A1A1A]/50 tabular-nums">{i + 1}</td>
                  {COLUMNS.map((c) => (
                    <Cell key={c.key} row={r} col={c} canEdit={canEdit}
                      onSave={(value) => update.mutate({ id: r.id, field: c.key, value })} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Cell({ row, col, canEdit, onSave }: {
  row: Row; col: { key: keyof Row; type: "text" | "status" };
  canEdit: boolean; onSave: (v: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>((row[col.key] as string) ?? "");
  useEffect(() => { setValue((row[col.key] as string) ?? ""); }, [row, col.key]);

  if (col.type === "status" && canEdit) {
    return (
      <td className="px-3 py-1 border-l border-[#B89555]/10">
        <select
          value={value} onChange={(e) => { setValue(e.target.value); onSave(e.target.value || null); }}
          className="text-xs bg-transparent border border-transparent hover:border-[#B89555]/30 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#B89555]/60"
        >
          <option value="">—</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
    );
  }

  return (
    <td
      className="px-3 py-1.5 border-l border-[#B89555]/10"
      onDoubleClick={() => canEdit && setEditing(true)}
    >
      {editing ? (
        <input
          autoFocus value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => { setEditing(false); if (value !== (row[col.key] ?? "")) onSave(value || null); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { setEditing(false); if (value !== (row[col.key] ?? "")) onSave(value || null); }
            if (e.key === "Escape") { setEditing(false); setValue((row[col.key] as string) ?? ""); }
          }}
          className="w-full bg-white border border-[#B89555]/40 rounded px-1.5 py-0.5 text-sm focus:outline-none"
        />
      ) : (
        <span className={`${!canEdit ? "" : "cursor-text"} ${!value ? "text-[#1A1A1A]/40" : ""}`}>
          {value || "—"}
        </span>
      )}
    </td>
  );
}
