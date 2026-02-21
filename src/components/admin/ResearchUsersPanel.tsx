import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface UserSummary {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  subscribed: boolean | null;
  subscribed_at: string | null;
  last_active_at: string | null;
  device_type: string | null;
  sessions_count: number | null;
  avg_time_on_site: number | null;
  top_areas: string | null;
  top_projects: string | null;
  avg_budget_estimate: string | null;
  preferred_bedrooms: string | null;
  preferred_property_type: string | null;
  viewed_count: number | null;
  saved_count: number | null;
  inquiries_count: number | null;
  tools_used: string | null;
  intent_score: string | null;
  engagement_score: number | null;
  segment_tag: string | null;
  recommended_campaign_tag: string | null;
  ai_summary: string | null;
}

const SEGMENT_OPTIONS = [
  "All Segments",
  "Luxury Buyer",
  "Mid-Market Investor",
  "Off-Plan Focused",
  "Rental Yield Investor",
  "End User Buyer",
  "Passive Browser",
];

const INTENT_OPTIONS = ["All Intent", "high", "medium", "low"];

export default function ResearchUsersPanel() {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("All Segments");
  const [intentFilter, setIntentFilter] = useState("All Intent");

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["research-users", segmentFilter, intentFilter],
    queryFn: async () => {
      let query = supabase
        .from("user_profile_summaries")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (segmentFilter !== "All Segments") {
        query = query.eq("segment_tag", segmentFilter);
      }
      if (intentFilter !== "All Intent") {
        query = query.eq("intent_score", intentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as UserSummary[];
    },
  });

  const filtered = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(s) ||
      u.full_name?.toLowerCase().includes(s) ||
      u.phone?.includes(s)
    );
  });

  const exportExcel = useCallback(async () => {
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("JBJ Global Research Users");

      const cols = [
        "Email", "Full Name", "Phone", "Subscribed", "Subscribed At",
        "Last Active", "Device", "Sessions", "Avg Time (s)",
        "Top Areas", "Top Projects", "Avg Budget", "Bedrooms",
        "Property Type", "Views", "Saved", "Inquiries", "Tools Used",
        "Intent", "Engagement", "Segment", "Campaign Tag", "AI Summary",
      ];
      ws.addRow(cols);
      ws.getRow(1).font = { bold: true };

      filtered.forEach((u) => {
        ws.addRow([
          u.email, u.full_name, u.phone,
          u.subscribed ? "Yes" : "No",
          u.subscribed_at ? new Date(u.subscribed_at).toLocaleDateString() : "",
          u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : "",
          u.device_type, u.sessions_count, u.avg_time_on_site,
          u.top_areas, u.top_projects, u.avg_budget_estimate,
          u.preferred_bedrooms, u.preferred_property_type,
          u.viewed_count, u.saved_count, u.inquiries_count,
          u.tools_used, u.intent_score, u.engagement_score,
          u.segment_tag, u.recommended_campaign_tag, u.ai_summary,
        ]);
      });

      // Auto-width
      ws.columns.forEach((col) => {
        let max = 12;
        col.eachCell?.({ includeEmpty: false }, (cell) => {
          const len = String(cell.value || "").length;
          if (len > max) max = Math.min(len, 40);
        });
        col.width = max + 2;
      });

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JBJ-Global-Research-Users-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} users`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export failed");
    }
  }, [filtered]);

  const exportCSV = useCallback(() => {
    const headers = [
      "email","full_name","phone","subscribed","subscribed_at","last_active_at",
      "device_type","sessions_count","avg_time_on_site","top_areas","top_projects",
      "avg_budget_estimate","preferred_bedrooms","preferred_property_type",
      "viewed_count","saved_count","inquiries_count","tools_used",
      "intent_score","engagement_score","segment_tag","recommended_campaign_tag","ai_summary",
    ];
    const rows = filtered.map((u) =>
      headers.map((h) => {
        const val = u[h as keyof UserSummary];
        if (val === null || val === undefined) return "";
        if (typeof val === "boolean") return val ? "Yes" : "No";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JBJ-Global-Research-Users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} users as CSV`);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">JBJ Global Research Users</h2>
          <p className="text-sm text-zinc-400">{filtered.length} users found</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-zinc-700 text-zinc-300">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-zinc-700 text-zinc-300">
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" onClick={exportExcel} className="bg-gold text-black hover:bg-gold/90">
            <Download className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search by email, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEGMENT_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTENT_OPTIONS.map((i) => (
              <SelectItem key={i} value={i}>{i === "All Intent" ? "All Intent" : `Intent: ${i}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50">
                <TableHead className="text-zinc-400 whitespace-nowrap">Email</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Name</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Subscribed</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Segment</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Intent</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Engagement</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Sessions</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Top Areas</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Budget</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-zinc-500 py-12">Loading...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-zinc-500 py-12">
                    No user summaries yet. Run the profile summarization job to populate data.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id} className="hover:bg-zinc-800/50">
                    <TableCell className="text-white text-sm">{u.email}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{u.full_name || "—"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.subscribed ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-400"}`}>
                        {u.subscribed ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">{u.segment_tag || "—"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.intent_score === "high" ? "bg-gold/20 text-gold" :
                        u.intent_score === "medium" ? "bg-blue-500/20 text-blue-400" :
                        "bg-zinc-700 text-zinc-400"
                      }`}>
                        {u.intent_score || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">{u.engagement_score ?? "—"}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{u.sessions_count ?? "—"}</TableCell>
                    <TableCell className="text-zinc-300 text-sm max-w-[150px] truncate">{u.top_areas || "—"}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{u.avg_budget_estimate || "—"}</TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
