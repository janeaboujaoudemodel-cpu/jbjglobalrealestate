import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Bell, Calendar, FileText, Search, MessageSquare, Send, RefreshCw,
  CheckCircle2, RotateCcw, Trash2, X, Circle,
} from "lucide-react";
import { ExportMenu, type ExportFormat } from "@/components/crm/ExportMenu";
import QuickActivityDialog, { type QuickActivityType } from "@/components/crm/QuickActivityDialog";
import { Plus } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

type Source = "reminder" | "action" | "touchpoint";

interface ActivityRow {
  id: string;          // prefixed (r:/a:/t:)
  raw_id: string;      // db row id
  source: Source;
  brokerage_id: string;
  action_type: string;
  title: string | null;
  body: string | null;
  due_at: string | null;
  created_at: string;
  metadata: any;
  is_done: boolean;
  deleted_at: string | null;
  brokerage_name?: string;
}

const TYPE_META: Record<string, { label: string; icon: any }> = {
  reminder: { label: "Reminder", icon: Bell },
  calendar_event: { label: "Calendar event", icon: Calendar },
  note: { label: "Note", icon: FileText },
  outreach_sent: { label: "Outreach sent", icon: Send },
  message_sent: { label: "Message sent", icon: Send },
  call: { label: "Call", icon: MessageSquare },
  status_change: { label: "Status change", icon: FileText },
};

type ViewMode = "active" | "done" | "all" | "trash";

export default function AgencyActivityLog() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClickedId = useRef<string | null>(null);

  const { data: rows = [], isLoading } = useQuery<ActivityRow[]>({
    queryKey: ["crm-unified-activity"],
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const sb = supabase as any;
      const [actionsRes, remindersRes, touchpointsRes] = await Promise.all([
        sb.from("crm_brokerage_actions").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("crm_relationship_reminders").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("crm_outreach_touchpoints").select("*").eq("entity_type", "brokerage").order("occurred_at", { ascending: false }).limit(500),
      ]);

      const merged: ActivityRow[] = [];

      (actionsRes.data || []).forEach((a: any) => merged.push({
        id: `a:${a.id}`, raw_id: a.id, source: "action",
        brokerage_id: a.brokerage_id,
        action_type: a.action_type,
        title: a.title, body: a.body, due_at: a.due_at,
        created_at: a.created_at,
        metadata: a.metadata || {},
        is_done: !!a.metadata?.is_done,
        deleted_at: a.metadata?.deleted_at || null,
      }));

      (remindersRes.data || []).forEach((r: any) => {
        if (!r.brokerage_id) return;
        merged.push({
          id: `r:${r.id}`, raw_id: r.id, source: "reminder",
          brokerage_id: r.brokerage_id,
          action_type: "reminder",
          title: r.title, body: r.body, due_at: r.due_at,
          created_at: r.created_at,
          metadata: { kind: r.kind, ...(r.metadata || {}) },
          is_done: !!r.is_done,
          deleted_at: r.metadata?.deleted_at || null,
        });
      });

      (touchpointsRes.data || []).forEach((t: any) => merged.push({
        id: `t:${t.id}`, raw_id: t.id, source: "touchpoint",
        brokerage_id: t.entity_id,
        action_type: t.direction === "inbound" ? "message_sent" : "outreach_sent",
        title: t.subject, body: t.body_excerpt, due_at: null,
        created_at: t.occurred_at || t.created_at,
        metadata: { channel: t.channel, direction: t.direction },
        is_done: false,
        deleted_at: null,
      }));

      merged.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

      const ids = Array.from(new Set(merged.map((m) => m.brokerage_id).filter(Boolean)));
      let lookup = new Map<string, string>();
      if (ids.length) {
        const { data: brokerages } = await sb
          .from("crm_brokerages").select("id,company_name").in("id", ids);
        lookup = new Map((brokerages || []).map((b: any) => [b.id, b.company_name as string]));
      }
      return merged.map((a) => ({ ...a, brokerage_name: lookup.get(a.brokerage_id) || "Unknown agency" }));
    },
  });

  // View filter
  const viewed = useMemo(() => {
    return rows.filter((r) => {
      if (view === "trash") return !!r.deleted_at;
      if (r.deleted_at) return false;
      if (view === "done") return r.is_done;
      if (view === "active") return !r.is_done;
      return true; // all (excludes trash)
    });
  }, [rows, view]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return viewed.filter((r) => {
      const matchesQ = !ql || [r.brokerage_name, r.title, r.body, r.action_type]
        .filter(Boolean).some((s) => (s as string).toLowerCase().includes(ql));
      const matchesType = typeFilter === "all" || r.action_type === typeFilter;
      return matchesQ && matchesType;
    });
  }, [viewed, q, typeFilter]);

  const counts = useMemo(() => {
    const live = rows.filter((r) => !r.deleted_at);
    const c = { total: live.length, reminder: 0, note: 0, calendar_event: 0, outreach: 0,
                active: 0, done: 0, trash: 0 };
    rows.forEach((r) => {
      if (r.deleted_at) { c.trash++; return; }
      if (r.is_done) c.done++; else c.active++;
      if (r.action_type === "reminder") c.reminder++;
      else if (r.action_type === "note") c.note++;
      else if (r.action_type === "calendar_event") c.calendar_event++;
      else if (r.action_type === "outreach_sent" || r.action_type === "message_sent") c.outreach++;
    });
    return c;
  }, [rows]);

  // Clear selection when view changes
  useEffect(() => { setSelected(new Set()); }, [view]);

  // Keyboard: Esc clears selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected.size) setSelected(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected.size]);

  const selectableRows = useMemo(() => filtered.filter((r) => r.source !== "touchpoint"), [filtered]);
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectableRows.map((r) => r.id)));
  };

  const toggleOne = (row: ActivityRow, e?: React.MouseEvent) => {
    if (row.source === "touchpoint") return;
    const next = new Set(selected);
    if (e?.shiftKey && lastClickedId.current) {
      const ids = selectableRows.map((r) => r.id);
      const a = ids.indexOf(lastClickedId.current);
      const b = ids.indexOf(row.id);
      if (a !== -1 && b !== -1) {
        const [s, e2] = a < b ? [a, b] : [b, a];
        for (let i = s; i <= e2; i++) next.add(ids[i]);
        setSelected(next);
        lastClickedId.current = row.id;
        return;
      }
    }
    if (next.has(row.id)) next.delete(row.id); else next.add(row.id);
    setSelected(next);
    lastClickedId.current = row.id;
  };

  // ---- Mutations ----
  const findRow = (id: string) => rows.find((r) => r.id === id);

  const applyChange = async (
    ids: string[],
    updater: (r: ActivityRow) => Promise<void> | void,
  ) => {
    const targets = ids.map(findRow).filter(Boolean) as ActivityRow[];
    const editable = targets.filter((r) => r.source !== "touchpoint");
    const skipped = targets.length - editable.length;
    await Promise.all(editable.map((r) => Promise.resolve(updater(r))));
    if (skipped) toast.info(`${skipped} history entr${skipped === 1 ? "y" : "ies"} skipped (read-only)`);
    return { count: editable.length, skipped };
  };

  const updateRow = async (r: ActivityRow, patch: Record<string, any>) => {
    const sb = supabase as any;
    if (r.source === "reminder") {
      const newMeta = { ...(r.metadata || {}), ...(patch.metadata || {}) };
      const data: any = {};
      if ("is_done" in patch) data.is_done = patch.is_done;
      if (patch.metadata) data.metadata = newMeta;
      await sb.from("crm_relationship_reminders").update(data).eq("id", r.raw_id);
    } else if (r.source === "action") {
      const newMeta = { ...(r.metadata || {}) };
      if ("is_done" in patch) newMeta.is_done = patch.is_done;
      if (patch.metadata) Object.assign(newMeta, patch.metadata);
      await sb.from("crm_brokerage_actions").update({ metadata: newMeta }).eq("id", r.raw_id);
    }
  };

  const purgeRow = async (r: ActivityRow) => {
    const sb = supabase as any;
    if (r.source === "reminder") await sb.from("crm_relationship_reminders").delete().eq("id", r.raw_id);
    else if (r.source === "action") await sb.from("crm_brokerage_actions").delete().eq("id", r.raw_id);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ["crm-unified-activity"] });

  const markDone = useMutation({
    mutationFn: async (ids: string[]) => applyChange(ids, (r) => updateRow(r, { is_done: true })),
    onSuccess: ({ count }) => { invalidate(); setSelected(new Set()); toast.success(`Marked ${count} as done`); },
  });
  const markUndone = useMutation({
    mutationFn: async (ids: string[]) => applyChange(ids, (r) => updateRow(r, { is_done: false })),
    onSuccess: ({ count }) => { invalidate(); setSelected(new Set()); toast.success(`Reopened ${count}`); },
  });
  const softDelete = useMutation({
    mutationFn: async (ids: string[]) =>
      applyChange(ids, (r) => updateRow(r, { metadata: { deleted_at: new Date().toISOString() } })),
    onSuccess: ({ count }, ids) => {
      invalidate(); setSelected(new Set());
      toast.success(`Moved ${count} to trash`, {
        action: { label: "Undo", onClick: () => restore.mutate(ids) },
      });
    },
  });
  const restore = useMutation({
    mutationFn: async (ids: string[]) =>
      applyChange(ids, (r) => updateRow(r, { metadata: { deleted_at: null } })),
    onSuccess: ({ count }) => { invalidate(); setSelected(new Set()); toast.success(`Restored ${count}`); },
  });
  const purge = useMutation({
    mutationFn: async (ids: string[]) => {
      const targets = ids.map(findRow).filter(Boolean) as ActivityRow[];
      const editable = targets.filter((r) => r.source !== "touchpoint");
      await Promise.all(editable.map((r) => purgeRow(r)));
      return { count: editable.length };
    },
    onSuccess: ({ count }) => { invalidate(); setSelected(new Set()); toast.success(`Permanently deleted ${count}`); },
  });

  const handleExport = (format: ExportFormat) => {
    const source = selected.size ? filtered.filter((r) => selected.has(r.id)) : filtered;
    if (!source.length) { toast.error("Nothing to export"); return; }
    const data = source.map((r) => ({
      Date: new Date(r.created_at).toLocaleString(),
      Agency: r.brokerage_name || "—",
      Type: TYPE_META[r.action_type]?.label || r.action_type,
      Status: r.deleted_at ? "Trash" : r.is_done ? "Done" : "Active",
      Title: r.title || "",
      Details: r.body || "",
      "Due at": r.due_at ? new Date(r.due_at).toLocaleString() : "",
    }));
    if (format === "csv" || format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 10 }, { wch: 30 }, { wch: 50 }, { wch: 20 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Activity");
      XLSX.writeFile(wb, `agency_activity.${format === "csv" ? "csv" : "xlsx"}`);
    } else {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("JBJ GLOBAL REAL ESTATE — Agency Activity Log", 14, 14);
      autoTable(doc, {
        startY: 20,
        head: [["Date", "Agency", "Type", "Status", "Title", "Details", "Due at"]],
        body: data.map((d) => [d.Date, d.Agency, d.Type, d.Status, d.Title, d.Details, d["Due at"]]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 26, 26] },
      });
      doc.save("agency_activity.pdf");
    }
    toast.success(`Exported ${data.length} entries`);
  };

  const [quickOpen, setQuickOpen] = useState<QuickActivityType | null>(null);

  const Stat = ({
    label, value, typeKey, addType,
  }: {
    label: string; value: number;
    typeKey?: string; // typeFilter value to set on click; undefined => "all"
    addType?: QuickActivityType; // if set, show + to create
  }) => {
    const isActive = typeKey ? typeFilter === typeKey : typeFilter === "all";
    return (
      <div className={`flex items-stretch rounded-lg border overflow-hidden transition-all ${
        isActive ? "border-[#B89555] bg-[#EFE6D6]" : "border-[#B89555]/30 bg-[#FDFBF7] hover:bg-[#F7F2EA]"
      }`}>
        <button
          type="button"
          onClick={() => { setTypeFilter(typeKey || "all"); setView("all"); }}
          className="px-3 py-2 text-left cursor-pointer text-[#1A1A1A]"
        >
          <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">{label}</div>
          <div className="font-bold text-lg">{value}</div>
        </button>
        {addType && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setQuickOpen(addType); }}
            className="px-2 border-l border-[#B89555]/30 hover:bg-[#F7F2EA] text-[#1A1A1A]"
            title={`Add ${label.toLowerCase()}`}
            aria-label={`Add ${label.toLowerCase()}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const busy = markDone.isPending || markUndone.isPending || softDelete.isPending || restore.isPending || purge.isPending;

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] pb-24">
      <SEOHead
        title="Agency Activity Log | JBJ Global"
        description="Every reminder, calendar event, note and outreach logged against UAE real estate agencies."
        canonicalPath="/owner/crm/relationships/activity"
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate("/owner/crm/relationships")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Relationships
          </Button>
          <h1 className="text-2xl font-bold">Agency Activity Log</h1>
          <Button variant="outline" size="sm" className="ml-auto" onClick={invalidate}>
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>
        <p className="text-sm text-[#1A1A1A]/70">
          Every reminder, calendar event, note and outreach you trigger from the brokerage list lands here.
          Tick rows to mark done, restore, or send to trash in bulk.
        </p>

        {/* View tabs */}
        <div className="flex flex-wrap gap-2">
          {([
            ["active", "Active", counts.active],
            ["done", "Done", counts.done],
            ["all", "All", counts.total],
            ["trash", "Trash", counts.trash],
          ] as [ViewMode, string, number][]).map(([m, label, n]) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                view === m
                  ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
                  : "bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]/80 hover:bg-[#F7F2EA]"
              }`}
            >
              {label} <span className="ml-1 text-xs text-[#1A1A1A]/60">{n}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Stat label="Total" value={counts.total} />
          <Stat label="Reminders" value={counts.reminder} typeKey="reminder" addType="reminder" />
          <Stat label="Notes" value={counts.note} typeKey="note" addType="note" />
          <Stat label="Calendar" value={counts.calendar_event} typeKey="calendar_event" addType="calendar_event" />
          <Stat label="Outreach sent" value={counts.outreach} typeKey="outreach_sent" />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/60" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agency, title, note…" className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activity types</SelectItem>
              {Object.entries(TYPE_META).map(([v, m]) => (
                <SelectItem key={v} value={v}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportMenu onExport={handleExport} disabled={!filtered.length} />
        </div>

        {/* Select-all bar */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#B89555]/30 bg-[#F7F2EA]">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              aria-label="Select all visible"
            />
            <span className="text-sm text-[#1A1A1A]/80">
              {selected.size > 0
                ? `${selected.size} selected`
                : `Select all visible (${selectableRows.length})`}
            </span>
            {selected.size > 0 && (
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}>
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">
            {view === "trash"
              ? "Trash is empty."
              : view === "done"
              ? "No completed items yet."
              : <>No activity yet. Click <b>Remind</b> on any agency in Relationships and it will appear here.</>}
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const Meta = TYPE_META[r.action_type] || { label: r.action_type, icon: FileText };
              const Icon = Meta.icon;
              const isSelected = selected.has(r.id);
              const readOnly = r.source === "touchpoint";
              return (
                <Card
                  key={r.id}
                  className={`border transition-all ${
                    isSelected ? "border-[#B89555] bg-[#F7F2EA]" : "border-[#B89555]/20"
                  } ${r.is_done ? "opacity-70" : ""}`}
                >
                  <CardContent className="p-4 flex gap-3 items-start">
                    <div className="pt-1">
                      {readOnly ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div><Checkbox checked={false} disabled aria-label="Read-only history" /></div>
                          </TooltipTrigger>
                          <TooltipContent>History entries can't be modified</TooltipContent>
                        </Tooltip>
                      ) : (
                        <div onClick={(e) => { e.stopPropagation(); toggleOne(r, e); }}>
                          <Checkbox checked={isSelected} aria-label="Select row" />
                        </div>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#1A1A1A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{r.brokerage_name}</span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7F2EA] border border-[#B89555]/30">
                          {Meta.label}
                        </span>
                        {r.is_done && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-[#1A1A1A] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                        {r.deleted_at && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A]/70">
                            Trashed
                          </span>
                        )}
                        <span className="text-xs text-[#1A1A1A]/60 ml-auto whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      {r.title && <div className={`text-sm mt-1 font-medium ${r.is_done ? "line-through" : ""}`}>{r.title}</div>}
                      {r.body && <div className="text-xs text-[#1A1A1A]/80 mt-1 whitespace-pre-wrap">{r.body}</div>}
                      {r.due_at && (
                        <div className="text-xs text-[#1A1A1A]/70 mt-1">
                          Due: {new Date(r.due_at).toLocaleString()}
                        </div>
                      )}

                      {/* Per-row actions */}
                      {!readOnly && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {r.deleted_at ? (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => restore.mutate([r.id])} disabled={busy}>
                                <RotateCcw className="w-3 h-3 mr-1" /> Restore
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => purge.mutate([r.id])} disabled={busy}>
                                <Trash2 className="w-3 h-3 mr-1" /> Delete forever
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => (r.is_done ? markUndone : markDone).mutate([r.id])} disabled={busy}>
                                {r.is_done ? <><Circle className="w-3 h-3 mr-1" /> Reopen</> : <><CheckCircle2 className="w-3 h-3 mr-1" /> Mark done</>}
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => softDelete.mutate([r.id])} disabled={busy}>
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                      {readOnly && (
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-[#1A1A1A]/50">history — read only</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg bg-[#F7F2EA] border border-[#B89555] text-[#1A1A1A]">
            <span className="text-sm font-semibold mr-2">{selected.size} selected</span>
            {view !== "trash" ? (
              <>
                <Button size="sm" variant="outline" onClick={() => markDone.mutate(selectedIds)} disabled={busy}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark done
                </Button>
                <Button size="sm" variant="outline" onClick={() => markUndone.mutate(selectedIds)} disabled={busy}>
                  <Circle className="w-3.5 h-3.5 mr-1" /> Reopen
                </Button>
                <Button size="sm" variant="outline" onClick={() => softDelete.mutate(selectedIds)} disabled={busy}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => restore.mutate(selectedIds)} disabled={busy}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  if (confirm(`Permanently delete ${selectedIds.length} item(s)? This cannot be undone.`))
                    purge.mutate(selectedIds);
                }} disabled={busy}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete forever
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
