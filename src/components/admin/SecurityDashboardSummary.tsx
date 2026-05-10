import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { escapeHtml, escapeCsv } from "@/utils/htmlEscape";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStepUpAuth } from "@/hooks/useStepUpAuth";
import ReAuthModal from "@/components/security/ReAuthModal";
import { logExportEvent } from "@/utils/dlpExportLogger";
import { 
  Shield, 
  ShieldBan, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Clock,
  Radio,
  Ban,
  Zap,
  BarChart3,
  Download,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { format, formatDistanceToNow, subDays, subHours, startOfDay, startOfHour } from "date-fns";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface SecurityEvent {
  id: string;
  type: 'rate_limit' | 'ip_blocked' | 'auto_blocked';
  ip_address: string;
  function_name?: string;
  reason?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_at: string;
  is_permanent: boolean;
  block_count: number;
}

interface RateLimitEntry {
  id: string;
  function_name: string;
  rate_key: string;
  request_count: number;
  window_start: string;
}

const RATE_LIMIT_CONFIG: { [key: string]: { limit: number } } = {
  "user-registration": { limit: 5 },
  "ai-chat-support": { limit: 30 },
  "validate-discount-code": { limit: 10 },
  "compare-projects": { limit: 20 },
  "property-evaluation": { limit: 15 },
  "send-inquiry-email": { limit: 5 },
};

export const SecurityDashboardSummary = () => {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const stepUp = useStepUpAuth();
  const fetchData = async () => {
    try {
      const [blockedData, rateLimitData] = await Promise.all([
        supabase
          .from("ip_blocklist")
          .select("*")
          .order("blocked_at", { ascending: false })
          .limit(50),
        supabase
          .from("function_rate_limits")
          .select("*")
          .order("window_start", { ascending: false })
          .limit(100),
      ]);

      if (blockedData.data) setBlockedIPs(blockedData.data);
      if (rateLimitData.data) setRateLimits(rateLimitData.data);

      // Build security events from both sources
      const events: SecurityEvent[] = [];

      // Add blocked IPs as events
      blockedData.data?.forEach((ip) => {
        events.push({
          id: `blocked-${ip.id}`,
          type: ip.reason?.includes("auto-blocked") ? "auto_blocked" : "ip_blocked",
          ip_address: ip.ip_address,
          reason: ip.reason || "Manually blocked",
          timestamp: ip.blocked_at,
          severity: ip.is_permanent ? "critical" : "high",
        });
      });

      // Add rate limit violations as events
      rateLimitData.data?.forEach((entry) => {
        const config = RATE_LIMIT_CONFIG[entry.function_name];
        if (config && entry.request_count >= config.limit) {
          events.push({
            id: `ratelimit-${entry.id}`,
            type: "rate_limit",
            ip_address: entry.rate_key,
            function_name: entry.function_name,
            timestamp: entry.window_start,
            severity: entry.request_count >= config.limit * 2 ? "high" : "medium",
          });
        }
      });

      // Sort by timestamp
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSecurityEvents(events.slice(0, 20));
    } catch (error) {
      console.error("Failed to fetch security data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!isLive) return;

    const blockedChannel = supabase
      .channel('security-blocked-ips')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ip_blocklist' },
        () => fetchData()
      )
      .subscribe();

    const rateLimitChannel = supabase
      .channel('security-rate-limits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'function_rate_limits' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(blockedChannel);
      supabase.removeChannel(rateLimitChannel);
    };
  }, [isLive]);

  // Calculate stats
  const totalBlocked = blockedIPs.length;
  const autoBlocked = blockedIPs.filter(ip => ip.reason?.includes("auto-blocked")).length;
  const blockedToday = blockedIPs.filter(ip => {
    const blockedDate = new Date(ip.blocked_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return blockedDate >= today;
  }).length;

  const rateLimitViolations = rateLimits.filter((entry) => {
    const config = RATE_LIMIT_CONFIG[entry.function_name];
    return config && entry.request_count >= config.limit;
  }).length;

  const totalRequests = rateLimits.reduce((sum, entry) => sum + entry.request_count, 0);
  const uniqueIPs = new Set(rateLimits.map((entry) => entry.rate_key)).size;

  // Chart data: Blocked IPs per day (last 7 days)
  const blockedPerDayData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      const count = blockedIPs.filter(ip => {
        const blockedDate = new Date(ip.blocked_at);
        return blockedDate >= date && blockedDate < nextDate;
      }).length;
      days.push({
        date: format(date, "MMM d"),
        blocked: count,
        autoBlocked: blockedIPs.filter(ip => {
          const blockedDate = new Date(ip.blocked_at);
          return blockedDate >= date && blockedDate < nextDate && ip.reason?.includes("auto-blocked");
        }).length,
      });
    }
    return days;
  }, [blockedIPs]);

  // Chart data: Rate limit violations per hour (last 24 hours)
  const violationsPerHourData = useMemo(() => {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(new Date(), i));
      const nextHour = startOfHour(subHours(new Date(), i - 1));
      const violations = rateLimits.filter(entry => {
        const config = RATE_LIMIT_CONFIG[entry.function_name];
        const entryDate = new Date(entry.window_start);
        return config && entry.request_count >= config.limit && entryDate >= hour && entryDate < nextHour;
      }).length;
      const requests = rateLimits.filter(entry => {
        const entryDate = new Date(entry.window_start);
        return entryDate >= hour && entryDate < nextHour;
      }).reduce((sum, entry) => sum + entry.request_count, 0);
      hours.push({
        hour: format(hour, "HH:mm"),
        violations,
        requests: Math.min(requests, 100), // Cap for visualization
      });
    }
    return hours;
  }, [rateLimits]);

  // Chart data: Violations by function
  const violationsByFunctionData = useMemo(() => {
    const functionViolations: { [key: string]: number } = {};
    rateLimits.forEach(entry => {
      const config = RATE_LIMIT_CONFIG[entry.function_name];
      if (config && entry.request_count >= config.limit) {
        functionViolations[entry.function_name] = (functionViolations[entry.function_name] || 0) + 1;
      }
    });
    return Object.entries(functionViolations).map(([name, value]) => ({
      name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      fullName: name,
    }));
  }, [rateLimits]);

  const CHART_COLORS = ['#ea580c', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Export to CSV
  const doExportCSV = useCallback(() => {
    const reportDate = format(new Date(), "yyyy-MM-dd_HH-mm");
    
    let csvContent = "JBJ Global Real Estate - Security Report\n";
    csvContent += `Generated: ${format(new Date(), "PPpp")}\n\n`;
    
    csvContent += "=== SUMMARY ===\n";
    csvContent += `Total Blocked IPs,${totalBlocked}\n`;
    csvContent += `Auto Blocked,${autoBlocked}\n`;
    csvContent += `Blocked Today,${blockedToday}\n`;
    csvContent += `Rate Limit Violations,${rateLimitViolations}\n`;
    csvContent += `Total Requests Tracked,${totalRequests}\n`;
    csvContent += `Unique IPs,${uniqueIPs}\n\n`;
    
    csvContent += "=== BLOCKED IPS ===\n";
    csvContent += "IP Address,Reason,Blocked At,Is Permanent,Block Count\n";
    blockedIPs.forEach(ip => {
      csvContent += `${escapeCsv(ip.ip_address)},${escapeCsv(ip.reason || 'N/A')},${escapeCsv(format(new Date(ip.blocked_at), "PPpp"))},${ip.is_permanent},${ip.block_count}\n`;
    });
    csvContent += "\n";
    
    csvContent += "=== RATE LIMIT ENTRIES ===\n";
    csvContent += "Function Name,Rate Key,Request Count,Window Start\n";
    rateLimits.forEach(entry => {
      csvContent += `${escapeCsv(entry.function_name)},${escapeCsv(entry.rate_key)},${entry.request_count},${escapeCsv(format(new Date(entry.window_start), "PPpp"))}\n`;
    });
    csvContent += "\n";
    
    csvContent += "=== SECURITY EVENTS ===\n";
    csvContent += "Type,IP Address,Function,Reason,Severity,Timestamp\n";
    securityEvents.forEach(event => {
      csvContent += `${escapeCsv(event.type)},${escapeCsv(event.ip_address)},${escapeCsv(event.function_name || 'N/A')},${escapeCsv(event.reason || 'N/A')},${escapeCsv(event.severity)},${escapeCsv(format(new Date(event.timestamp), "PPpp"))}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `security-report_${reportDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    logExportEvent({
      exportType: "security_report",
      exportFormat: "csv",
      recordCount: blockedIPs.length + securityEvents.length,
      containsPii: false,
      fieldsExported: ["ip_address", "function_name", "severity"],
      requiredStepUp: true,
    });
    
    toast.success("CSV report downloaded successfully");
  }, [blockedIPs, rateLimits, securityEvents, totalBlocked, autoBlocked, blockedToday, rateLimitViolations, totalRequests, uniqueIPs]);

  const exportToCSV = useCallback(() => {
    stepUp.requireStepUp("Export Security Report (CSV)", "normal", doExportCSV);
  }, [stepUp, doExportCSV]);

  // Export to PDF (HTML-based)
  const exportToPDF = useCallback(() => {
    const reportDate = format(new Date(), "yyyy-MM-dd_HH-mm");
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Security Report - JBJ Global Real Estate</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #fff; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
    .header h1 { color: #d4af37; font-size: 28px; margin-bottom: 8px; }
    .header p { color: #888; font-size: 14px; }
    .section { margin-bottom: 32px; }
    .section-title { color: #d4af37; font-size: 18px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #fff; }
    .stat-label { color: #888; font-size: 12px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #18181b; border-radius: 8px; overflow: hidden; }
    th { background: #27272a; color: #d4af37; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #27272a; color: #ccc; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .badge-high { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
    .badge-medium { background: rgba(234, 179, 8, 0.2); color: #fbbf24; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #27272a; color: #666; font-size: 12px; }
    @media print { body { background: #fff; color: #000; } .stat-card, table { background: #f5f5f5; } th { background: #e5e5e5; color: #000; } td { color: #333; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ Security Report</h1>
    <p>JBJ Global Real Estate | Generated: ${format(new Date(), "PPpp")}</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${totalBlocked}</div>
      <div class="stat-label">Total Blocked IPs</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${autoBlocked}</div>
      <div class="stat-label">Auto Blocked</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${blockedToday}</div>
      <div class="stat-label">Blocked Today</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${rateLimitViolations}</div>
      <div class="stat-label">Rate Violations</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalRequests}</div>
      <div class="stat-label">Total Requests</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${uniqueIPs}</div>
      <div class="stat-label">Unique IPs</div>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">🚫 Blocked IPs</h2>
    <table>
      <thead>
        <tr>
          <th>IP Address</th>
          <th>Reason</th>
          <th>Blocked At</th>
          <th>Permanent</th>
          <th>Block Count</th>
        </tr>
      </thead>
      <tbody>
        ${blockedIPs.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: #666;">No blocked IPs</td></tr>' : 
          blockedIPs.map(ip => `
            <tr>
              <td><code>${escapeHtml(ip.ip_address)}</code></td>
              <td>${escapeHtml(ip.reason) || 'N/A'}</td>
              <td>${format(new Date(ip.blocked_at), "PPp")}</td>
              <td>${ip.is_permanent ? '✓ Yes' : 'No'}</td>
              <td>${ip.block_count}</td>
            </tr>
          `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2 class="section-title">⚡ Recent Security Events</h2>
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>IP Address</th>
          <th>Function</th>
          <th>Severity</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${securityEvents.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: #666;">No security events</td></tr>' :
          securityEvents.map(event => `
            <tr>
              <td>${event.type === 'auto_blocked' ? '🤖 Auto Blocked' : event.type === 'ip_blocked' ? '🚫 Manual Block' : '⏱️ Rate Limited'}</td>
              <td><code>${escapeHtml(event.ip_address)}</code></td>
              <td>${escapeHtml(event.function_name) || 'N/A'}</td>
              <td><span class="badge badge-${escapeHtml(event.severity)}">${escapeHtml(event.severity.toUpperCase())}</span></td>
              <td>${format(new Date(event.timestamp), "PPp")}</td>
            </tr>
          `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    <p>Confidential Security Report | JBJ Global Real Estate © ${new Date().getFullYear()}</p>
    <p style="margin-top: 4px;">Use Ctrl+P / Cmd+P to print or save as PDF</p>
  </div>
</body>
</html>`;
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Slight delay to ensure styles are loaded
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
      toast.success("PDF report opened - use Print dialog to save");

      logExportEvent({
        exportType: "security_report",
        exportFormat: "pdf",
        recordCount: blockedIPs.length + securityEvents.length,
        containsPii: false,
        fieldsExported: ["ip_address", "function_name", "severity"],
        requiredStepUp: true,
      });
    } else {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
  }, [blockedIPs, securityEvents, totalBlocked, autoBlocked, blockedToday, rateLimitViolations, totalRequests, uniqueIPs]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-amber-500/20 text-[#1A1A1A] border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ip_blocked': return <ShieldBan className="w-4 h-4" />;
      case 'auto_blocked': return <Zap className="w-4 h-4" />;
      case 'rate_limit': return <Ban className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'ip_blocked': return 'Manual Block';
      case 'auto_blocked': return 'Auto Blocked';
      case 'rate_limit': return 'Rate Limited';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#B89555]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Premium Champagne Theme */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1A1A1A] text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#1A1A1A]" />
            Security Overview
          </h2>
          <p className="text-[#1A1A1A]/70 text-sm mt-1">
            Real-time security monitoring and threat detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:border-[#B89555]"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-[#1A1A1A]" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:border-[#B89555]"
          >
            <FileText className="w-4 h-4 mr-1.5 text-[#1A1A1A]" />
            PDF
          </Button>
          <Badge 
            className={`gap-1.5 cursor-pointer ${isLive ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40' : 'bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30'}`}
            onClick={() => setIsLive(!isLive)}
          >
            <Radio className={`w-3 h-3 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? "Live Updates" : "Paused"}
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid - Premium Champagne Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-[#FDFBF7] border-2 border-red-500/40 p-4 hover:shadow-lg hover:shadow-red-500/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <ShieldBan className="w-4 h-4 text-red-500" />
            <span className="text-[#1A1A1A]/70 text-xs">Total Blocked</span>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-bold">{totalBlocked}</p>
        </Card>
        
        <Card className="bg-[#FDFBF7] border-2 border-amber-500/40 p-4 hover:shadow-lg hover:shadow-amber-500/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[#1A1A1A]/70 text-xs">Auto Blocked</span>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-bold">{autoBlocked}</p>
        </Card>
        
        <Card className="bg-[#FDFBF7] border-2 border-blue-500/40 p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-[#1A1A1A]/70 text-xs">Blocked Today</span>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-bold">{blockedToday}</p>
        </Card>
        
        <Card className="bg-[#FDFBF7] border-2 border-orange-500/40 p-4 hover:shadow-lg hover:shadow-orange-500/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <Ban className="w-4 h-4 text-orange-500" />
            <span className="text-[#1A1A1A]/70 text-xs">Rate Violations</span>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-bold">{rateLimitViolations}</p>
        </Card>
        
        <Card className="bg-[#FDFBF7] border-2 border-emerald-500/40 p-4 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[#1A1A1A]/70 text-xs">Total Requests</span>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-bold">{totalRequests}</p>
        </Card>
        
        <Card className="bg-[#FDFBF7] border-2 border-purple-500/40 p-4 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-[#1A1A1A]/70 text-xs">Unique IPs</span>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-bold">{uniqueIPs}</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocked IPs Over Time */}
        <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 p-6 shadow-lg">
          <h3 className="text-[#1A1A1A] font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-500" />
            Blocked IPs (Last 7 Days)
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={blockedPerDayData}>
                <defs>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAutoBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid rgba(200,167,102,0.4)',
                    borderRadius: '8px',
                    color: '#000'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="blocked" 
                  stroke="#dc2626" 
                  fillOpacity={1} 
                  fill="url(#colorBlocked)"
                  name="Total Blocked"
                />
                <Area 
                  type="monotone" 
                  dataKey="autoBlocked" 
                  stroke="#ea580c" 
                  fillOpacity={1} 
                  fill="url(#colorAutoBlocked)"
                  name="Auto Blocked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Rate Limit Violations Per Hour */}
        <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 p-6 shadow-lg">
          <h3 className="text-[#1A1A1A] font-medium mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            Rate Limit Activity (Last 24 Hours)
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationsPerHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#71717a" 
                  fontSize={10}
                  tickLine={false}
                  interval={3}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid rgba(200,167,102,0.4)',
                    borderRadius: '8px',
                    color: '#000'
                  }}
                />
                <Bar 
                  dataKey="violations" 
                  fill="#ea580c" 
                  radius={[4, 4, 0, 0]}
                  name="Violations"
                />
                <Bar 
                  dataKey="requests" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.5}
                  name="Requests (capped at 100)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Violations by Function Pie Chart */}
      {violationsByFunctionData.length > 0 && (
        <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 p-6 shadow-lg">
          <h3 className="text-[#1A1A1A] font-medium mb-4 flex items-center gap-2">
            <Ban className="w-4 h-4 text-orange-500" />
            Rate Limit Violations by Function
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationsByFunctionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#71717a' }}
                >
                  {violationsByFunctionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid rgba(200,167,102,0.4)',
                    borderRadius: '8px',
                    color: '#000'
                  }}
                  formatter={(value: number) => [`${value} violations`, 'Count']}
                />
                <Legend 
                  wrapperStyle={{ color: '#52525b' }}
                  formatter={(value) => <span style={{ color: '#52525b' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Alert Banner */}
      {(rateLimitViolations > 0 || blockedToday > 0) && (
        <Card className="bg-amber-50 border-2 border-amber-400/60 p-4 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-amber-800 font-medium">Active Security Alerts</h3>
              <p className="text-amber-700 text-sm mt-1">
                {rateLimitViolations > 0 && `${rateLimitViolations} rate limit violation(s) detected. `}
                {blockedToday > 0 && `${blockedToday} IP(s) blocked today.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#B89555]/20 flex items-center justify-between bg-gradient-to-r from-[#FDFBF7] to-white">
          <h3 className="text-[#1A1A1A] font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1A1A1A]" />
            Recent Security Events
          </h3>
          <Badge variant="outline" className="text-[#1A1A1A]/70 border-[#B89555]/40">
            Last 20 events
          </Badge>
        </div>
        
        {securityEvents.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-3" />
            <p className="text-[#1A1A1A]/70">No security events recorded</p>
            <p className="text-[#1A1A1A]/70 text-sm mt-1">
              Events will appear here when threats are detected
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="divide-y divide-gold/10">
              {securityEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="p-4 hover:bg-[#EFE6D6]/5 transition-colors flex items-center gap-4"
                >
                  <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSeverityColor(event.severity)}`}
                      >
                        {getEventLabel(event.type)}
                      </Badge>
                      {event.function_name && (
                        <Badge variant="outline" className="text-xs text-[#1A1A1A]/70 border-[#B89555]/40">
                          {event.function_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[#1A1A1A] text-sm font-mono">
                        {event.ip_address}
                      </code>
                      {event.reason && (
                        <span className="text-[#1A1A1A]/70 text-sm truncate">
                          — {event.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-[#1A1A1A]/70 shrink-0">
                    <div>{format(new Date(event.timestamp), "HH:mm:ss")}</div>
                    <div className="text-xs">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Top Offenders */}
      {blockedIPs.length > 0 && (
        <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 p-4 shadow-lg">
          <h3 className="text-[#1A1A1A] font-medium mb-4 flex items-center gap-2">
            <ShieldBan className="w-4 h-4 text-red-500" />
            Top Blocked IPs
          </h3>
          <div className="flex flex-wrap gap-2">
            {blockedIPs.slice(0, 10).map((ip) => (
              <Badge 
                key={ip.id}
                variant="outline" 
                className="font-mono text-xs bg-red-50 text-red-600 border-red-300"
              >
                {ip.ip_address}
                {ip.block_count > 1 && (
                  <span className="ml-1 text-red-700 font-bold">×{ip.block_count}</span>
                )}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <ReAuthModal
        open={stepUp.modalOpen}
        onOpenChange={stepUp.onModalOpenChange}
        onSuccess={stepUp.onModalSuccess}
        actionLabel={stepUp.modalActionLabel}
        severity={stepUp.modalSeverity}
      />
    </div>
  );
};
