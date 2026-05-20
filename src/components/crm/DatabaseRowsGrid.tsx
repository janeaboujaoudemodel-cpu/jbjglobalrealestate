import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, UserCheck, Ban, RotateCcw, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type Row = {
  row_id: string;
  source_database_id: string;
  row_index: number;
  raw: Record<string, any>;
  merged_lead_id: string | null;
  lead_id: string | null;
  full_name: string | null;
  email_lower: string | null;
  phone_e164: string | null;
  is_junk: boolean | null;
  pipeline_stage: string | null;
  assigned_to_user_id: string | null;
};

const PAGE_SIZE = 200;

function pickField(raw: Record<string, any>, patterns: RegExp): string | null {
  if (!raw) return null;
  for (const [k, v] of Object.entries(raw)) {
    if (patterns.test(k.toLowerCase())) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
  }
  return null;
}

export default function DatabaseRowsGrid({
  databaseId,
  currentUserId,
}: {
  databaseId: string;
  currentUserId: string | null;
}) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await supabase
      .from("vw_crm_database_row_status" as any)
      .select("*", { count: "exact" })
      .eq("source_database_id", databaseId)
      .order("row_index", { ascending: true })
      .range(from, to);
    if (error) toast.error(error.message);
    setRows(((data as any) || []) as Row[]);
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [databaseId, page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = (r.full_name || pickField(r.raw, /(name)/) || "").toLowerCase();
      const email = (r.email_lower || pickField(r.raw, /mail/) || "").toLowerCase();
      const phone = (r.phone_e164 || pickField(r.raw, /(phone|mobile|whatsapp|tel)/) || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [rows, search]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.row_id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) filtered.forEach((r) => next.delete(r.row_id));
    else filtered.forEach((r) => next.add(r.row_id));
    setSelected(next);
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
    qc.invalidateQueries({ queryKey: ["crm-section-counts"] });
  };

  const assignToMe = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("assign_database_rows_to_me" as any, {
      row_ids: Array.from(selected),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const r = data as any;
    const skipped = Array.isArray(r?.skipped) ? r.skipped.length : 0;
    toast.success(`Linked ${r?.linked ?? 0} · Created ${r?.created ?? 0} · Reused ${r?.reused ?? 0}${skipped ? ` · Skipped ${skipped} (no contact)` : ""}`);
    setSelected(new Set());
    invalidate();
    await load();
  };

  const setJunk = async (junk: boolean) => {
    if (selected.size === 0) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("set_database_rows_junk" as any, {
      row_ids: Array.from(selected),
      junk,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${junk ? "Marked" : "Unmarked"} ${(data as any)?.updated ?? 0} as ${junk ? "Junk" : "active"}`);
    setSelected(new Set());
    invalidate();
    await load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mt-2 rounded-lg border border-[#B89555]/30 bg-[#F7F2EA]">
      {/* Toolbar */}
      <div className="px-3 py-2 flex flex-wrap items-center gap-2 border-b border-[#B89555]/20 bg-[#EFE6D6]/60">
        <Input
          placeholder="Search this database…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 max-w-[260px] bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
        />
        <div className="text-[11px] text-[#1A1A1A]/70">
          {selected.size} selected · {total.toLocaleString()} rows
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button
            size="sm" variant="outline" disabled={busy || selected.size === 0}
            onClick={assignToMe}
            className="h-8 border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]"
            title="Link to canonical leads and assign to me"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1" /> Assign to me
          </Button>
          <Button
            size="sm" variant="outline" disabled={busy || selected.size === 0}
            onClick={() => setJunk(true)}
            className="h-8 border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]"
          >
            <Ban className="h-3.5 w-3.5 mr-1" /> Mark Junk
          </Button>
          <Button
            size="sm" variant="outline" disabled={busy || selected.size === 0}
            onClick={() => setJunk(false)}
            className="h-8 border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Unmark Junk
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[60vh] overflow-auto overscroll-contain">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#1A1A1A]/70 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading rows…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#1A1A1A]/70">No rows.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#EFE6D6] text-[#1A1A1A] text-[11px] uppercase tracking-wide">
              <tr className="border-b border-[#B89555]/30">
                <th className="px-3 py-2 w-8">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Owner</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const name = r.full_name || pickField(r.raw, /(name)/) || "—";
                const email = r.email_lower || pickField(r.raw, /mail/) || "";
                const phone = r.phone_e164 || pickField(r.raw, /(phone|mobile|whatsapp|tel)/) || "";
                const noContact = !email && !phone;
                const isMine = r.assigned_to_user_id && r.assigned_to_user_id === currentUserId;
                return (
                  <tr
                    key={r.row_id}
                    className={`border-b border-[#B89555]/15 hover:bg-[#FDFBF7] ${
                      r.is_junk ? "opacity-70" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected.has(r.row_id)}
                        onCheckedChange={() => toggle(r.row_id)}
                      />
                    </td>
                    <td className="px-3 py-2 text-[#1A1A1A] font-medium">{name}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80 tabular-nums">{phone || "—"}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80 truncate max-w-[260px]">{email || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {r.is_junk && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold border border-red-300 bg-red-50 text-red-700">
                            JUNK
                          </span>
                        )}
                        {r.lead_id && !r.is_junk && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold border border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A]">
                            {r.pipeline_stage || "LEAD"}
                          </span>
                        )}
                        {!r.lead_id && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            noContact
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : "border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A]/70"
                          }`}>
                            {noContact ? "NO CONTACT" : "UNLINKED"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">
                      {isMine ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold border border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A]">
                          Me
                        </span>
                      ) : r.assigned_to_user_id ? (
                        <span className="text-[11px]">Assigned</span>
                      ) : (
                        <span className="text-[11px] text-[#1A1A1A]/50">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {r.lead_id && (
                        <a
                          href={`/owner/crm?entity=leads&view=all&lead=${r.lead_id}`}
                          className="inline-flex items-center text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                          title="Open in Lead Hub"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-[#B89555]/20 bg-[#EFE6D6]/40">
          <div className="text-[11px] text-[#1A1A1A]/70">
            Page {page + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm" variant="outline" disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="h-7 border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]"
            >Prev</Button>
            <Button
              size="sm" variant="outline" disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]"
            >Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
