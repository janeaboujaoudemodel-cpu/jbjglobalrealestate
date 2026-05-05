import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bell, Calendar, FileText, Search, MessageSquare, Send, RefreshCw } from "lucide-react";
import { ExportMenu, type ExportFormat } from "@/components/crm/ExportMenu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface ActivityRow {
  id: string;
  brokerage_id: string;
  action_type: string;
  title: string | null;
  body: string | null;
  due_at: string | null;
  created_at: string;
  metadata: any;
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

export default function AgencyActivityLog() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: rows = [], isLoading } = useQuery<ActivityRow[]>({
    queryKey: ["crm-unified-activity"],
    queryFn: async () => {
      const sb = supabase as any;
      const [actionsRes, remindersRes, touchpointsRes] = await Promise.all([
        sb.from("crm_brokerage_actions").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("crm_relationship_reminders").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("crm_outreach_touchpoints").select("*").eq("entity_type", "brokerage").order("occurred_at", { ascending: false }).limit(500),
      ]);

      const merged: ActivityRow[] = [];

      (actionsRes.data || []).forEach((a: any) => merged.push({
        id: `a:${a.id}`,
        brokerage_id: a.brokerage_id,
        action_type: a.action_type,
        title: a.title,
        body: a.body,
        due_at: a.due_at,
        created_at: a.created_at,
        metadata: a.metadata,
      }));

      (remindersRes.data || []).forEach((r: any) => {
        if (!r.brokerage_id) return;
        merged.push({
          id: `r:${r.id}`,
          brokerage_id: r.brokerage_id,
          action_type: "reminder",
          title: r.title,
          body: r.body,
          due_at: r.due_at,
          created_at: r.created_at,
          metadata: { kind: r.kind, is_done: r.is_done },
        });
      });

      (touchpointsRes.data || []).forEach((t: any) => merged.push({
        id: `t:${t.id}`,
        brokerage_id: t.entity_id,
        action_type: t.direction === "inbound" ? "message_sent" : "outreach_sent",
        title: t.subject,
        body: t.body_excerpt,
        due_at: null,
        created_at: t.occurred_at || t.created_at,
        metadata: { channel: t.channel, direction: t.direction },
      }));

      merged.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

      const ids = Array.from(new Set(merged.map((m) => m.brokerage_id).filter(Boolean)));
      let lookup = new Map<string, string>();
      if (ids.length) {
        const { data: brokerages } = await sb
          .from("crm_brokerages")
          .select("id,company_name")
          .in("id", ids);
        lookup = new Map((brokerages || []).map((b: any) => [b.id, b.company_name as string]));
      }
      return merged.map((a) => ({ ...a, brokerage_name: lookup.get(a.brokerage_id) || "Unknown agency" }));
    },
  });

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !ql ||
        [r.brokerage_name, r.title, r.body, r.action_type]
          .filter(Boolean)
          .some((s) => (s as string).toLowerCase().includes(ql));
      const matchesType = typeFilter === "all" || r.action_type === typeFilter;
      return matchesQ && matchesType;
    });
  }, [rows, q, typeFilter]);

  const counts = useMemo(() => {
    const c = { total: rows.length, reminder: 0, note: 0, calendar_event: 0, outreach: 0 };
    rows.forEach((r) => {
      if (r.action_type === "reminder") c.reminder++;
      else if (r.action_type === "note") c.note++;
      else if (r.action_type === "calendar_event") c.calendar_event++;
      else if (r.action_type === "outreach_sent" || r.action_type === "message_sent") c.outreach++;
    });
    return c;
  }, [rows]);

  const handleExport = (format: ExportFormat) => {
    if (!filtered.length) { toast.error("Nothing to export"); return; }
    const data = filtered.map((r) => ({
      Date: new Date(r.created_at).toLocaleString(),
      Agency: r.brokerage_name || "—",
      Type: TYPE_META[r.action_type]?.label || r.action_type,
      Title: r.title || "",
      Details: r.body || "",
      "Due at": r.due_at ? new Date(r.due_at).toLocaleString() : "",
    }));
    if (format === "csv" || format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 30 }, { wch: 50 }, { wch: 20 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Activity");
      XLSX.writeFile(wb, `agency_activity.${format === "csv" ? "csv" : "xlsx"}`);
    } else {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("JBJ GLOBAL REAL ESTATE — Agency Activity Log", 14, 14);
      autoTable(doc, {
        startY: 20,
        head: [["Date", "Agency", "Type", "Title", "Details", "Due at"]],
        body: data.map((d) => [d.Date, d.Agency, d.Type, d.Title, d.Details, d["Due at"]]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 26, 26] },
      });
      doc.save("agency_activity.pdf");
    }
    toast.success(`Exported ${data.length} entries`);
  };

  const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A]">
      <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">{label}</div>
      <div className="font-bold text-lg">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
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
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => qc.invalidateQueries({ queryKey: ["crm-brokerage-actions"] })}>
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>
        <p className="text-sm text-[#1A1A1A]/70">
          Every Remind, calendar event, note and outreach you trigger from the brokerage list lands here. Use it to prove your activity to leadership.
        </p>

        <div className="flex flex-wrap gap-2">
          <Stat label="Total" value={counts.total} />
          <Stat label="Reminders" value={counts.reminder} />
          <Stat label="Notes" value={counts.note} />
          <Stat label="Calendar" value={counts.calendar_event} />
          <Stat label="Outreach sent" value={counts.outreach} />
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

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">
            No activity yet. Click <b>Remind</b> on any agency in Relationships and it will appear here.
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const Meta = TYPE_META[r.action_type] || { label: r.action_type, icon: FileText };
              const Icon = Meta.icon;
              return (
                <Card key={r.id} className="border border-[#B89555]/20">
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#1A1A1A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{r.brokerage_name}</span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7F2EA] border border-[#B89555]/30">
                          {Meta.label}
                        </span>
                        <span className="text-xs text-[#1A1A1A]/60 ml-auto">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      {r.title && <div className="text-sm mt-1 font-medium">{r.title}</div>}
                      {r.body && <div className="text-xs text-[#1A1A1A]/80 mt-1 whitespace-pre-wrap">{r.body}</div>}
                      {r.due_at && (
                        <div className="text-xs text-[#1A1A1A]/70 mt-1">
                          Due: {new Date(r.due_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
