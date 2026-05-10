import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Search, RefreshCw, Shield, FileText, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  description: string;
  details: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700 border-green-200",
  read: "bg-blue-100 text-blue-700 border-blue-200",
  update: "bg-yellow-100 text-yellow-700 border-yellow-200",
  delete: "bg-red-100 text-red-700 border-red-200",
  login: "bg-purple-100 text-purple-700 border-purple-200",
  logout: "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30",
  export: "bg-cyan-100 text-cyan-700 border-cyan-200",
  import: "bg-indigo-100 text-indigo-700 border-indigo-200",
  approve: "bg-emerald-100 text-emerald-700 border-emerald-200",
  reject: "bg-orange-100 text-orange-700 border-orange-200",
  block: "bg-red-100 text-red-700 border-red-200",
  unblock: "bg-green-100 text-green-700 border-green-200",
};

const RESOURCE_ICONS: Record<string, string> = {
  user: "👤",
  project: "🏗️",
  subscription: "💳",
  lead: "📧",
  discount_code: "🏷️",
  ip_blocklist: "🚫",
  rate_limit: "⏱️",
  document: "📄",
  settings: "⚙️",
  role: "🔐",
};

export default function AuditLogDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    critical: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (actionFilter !== "all") {
        query = query.eq('action_type', actionFilter as any);
      }
      if (resourceFilter !== "all") {
        query = query.eq('resource_type', resourceFilter as any);
      }
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching audit logs:", error);
        return;
      }

      const typedData = (data || []) as AuditLog[];
      setLogs(typedData);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = typedData.filter(log => 
        log.created_at.startsWith(today)
      );
      const criticalLogs = typedData.filter(log => 
        ['delete', 'block', 'reject'].includes(log.action_type)
      );

      setStats({
        total: typedData.length,
        today: todayLogs.length,
        critical: criticalLogs.length,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter]);

  const handleSearch = () => {
    fetchLogs();
  };

  const exportToCSV = () => {
    const headers = ["Timestamp", "User Email", "Action", "Resource", "Resource ID", "Description"];
    const csvContent = [
      headers.join(","),
      ...logs.map(log => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.user_email || "N/A",
        log.action_type,
        log.resource_type,
        log.resource_id || "N/A",
        `"${log.description.replace(/"/g, '""')}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards - Champagne styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="jj-card-inner">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#1A1A1A]/60">Total Events</CardTitle>
            <FileText className="h-4 w-4 text-[#1A1A1A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</div>
            <p className="text-xs text-[#1A1A1A]/50">Last 200 records</p>
          </CardContent>
        </Card>
        <Card className="jj-card-inner">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#1A1A1A]/60">Today's Activity</CardTitle>
            <Clock className="h-4 w-4 text-[#1A1A1A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.today}</div>
            <p className="text-xs text-[#1A1A1A]/50">Events logged today</p>
          </CardContent>
        </Card>
        <Card className="jj-card-inner">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#1A1A1A]/60">Critical Actions</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-[#1A1A1A]/50">Delete, block, reject</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="jj-card-inner">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Shield className="h-5 w-5 text-[#1A1A1A]" />
            Audit Logs
          </CardTitle>
          <CardDescription className="text-[#1A1A1A]/60">
            Track all admin actions and sensitive data access for compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by description or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40"
              />
              <Button onClick={handleSearch} variant="secondary" className="bg-[#EFE6D6]/20 hover:bg-[#EFE6D6]/30 text-[#1A1A1A]">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px] bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A]">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] border-[#B89555]/20">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="unblock">Unblock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-[150px] bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A]">
                <SelectValue placeholder="Resource type" />
              </SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] border-[#B89555]/20">
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="discount_code">Discount Code</SelectItem>
                <SelectItem value="ip_blocklist">IP Blocklist</SelectItem>
                <SelectItem value="rate_limit">Rate Limit</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="role">Role</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchLogs} variant="outline" className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Logs Table */}
          <ScrollArea className="h-[500px] rounded-md border border-[#B89555]/20">
            <Table>
              <TableHeader>
                <TableRow className="border-[#B89555]/20 hover:bg-[#EFE6D6]/5 bg-gradient-to-r from-[#F7F1E6] to-[#ECE2D2]">
                  <TableHead className="w-[160px] text-[#1A1A1A]/60">Timestamp</TableHead>
                  <TableHead className="w-[180px] text-[#1A1A1A]/60">User</TableHead>
                  <TableHead className="w-[100px] text-[#1A1A1A]/60">Action</TableHead>
                  <TableHead className="w-[120px] text-[#1A1A1A]/60">Resource</TableHead>
                  <TableHead className="text-[#1A1A1A]/60">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="border-[#B89555]/10">
                      <TableCell><Skeleton className="h-4 w-32 bg-[#EFE6D6]/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40 bg-[#EFE6D6]/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 bg-[#EFE6D6]/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 bg-[#EFE6D6]/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-60 bg-[#EFE6D6]/10" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow className="border-[#B89555]/10">
                    <TableCell colSpan={5} className="text-center text-[#1A1A1A]/50 py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-[#B89555]/10 hover:bg-[#EFE6D6]/5">
                      <TableCell className="text-xs text-[#1A1A1A]/60">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-[#1A1A1A]" />
                          <span className="text-sm text-[#1A1A1A] truncate max-w-[140px]">
                            {log.user_email || "System"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={ACTION_COLORS[log.action_type] || "bg-[#F7F2EA] text-[#1A1A1A]/70"}
                        >
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-[#1A1A1A]/70">
                          <span>{RESOURCE_ICONS[log.resource_type] || "📦"}</span>
                          {log.resource_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[#1A1A1A]/70">
                        {log.description}
                        {log.resource_id && (
                          <span className="ml-2 text-xs text-[#1A1A1A]/40">
                            (ID: {log.resource_id.slice(0, 8)}...)
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}