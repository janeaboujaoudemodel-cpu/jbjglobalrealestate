/**
 * BookHubDashboard - Admin analytics for book downloads.
 * Shows total downloads, source breakdown, device stats, recent downloads table.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Download, Globe, Smartphone, Monitor, TrendingUp, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DownloadRecord {
  id: string;
  book_slug: string;
  book_title: string;
  downloader_email: string;
  downloader_name: string | null;
  page_source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: string | null;
  browser: string | null;
  created_at: string;
}

interface SourceStat {
  source: string;
  count: number;
}

interface DeviceStat {
  device: string;
  count: number;
}

export default function BookHubDashboard() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [uniqueEmails, setUniqueEmails] = useState(0);
  const [sourceStats, setSourceStats] = useState<SourceStat[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStat[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, count } = await supabase
        .from("book_downloads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        setDownloads(data as DownloadRecord[]);
        setTotalCount(count || 0);

        // Unique emails
        const emails = new Set(data.map((d) => d.downloader_email));
        setUniqueEmails(emails.size);

        // Source breakdown
        const sourceCounts: Record<string, number> = {};
        data.forEach((d) => {
          const src = d.page_source || "unknown";
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });
        setSourceStats(
          Object.entries(sourceCounts)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
        );

        // Device breakdown
        const deviceCounts: Record<string, number> = {};
        data.forEach((d) => {
          const dev = d.device_type || "unknown";
          deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
        });
        setDeviceStats(
          Object.entries(deviceCounts)
            .map(([device, count]) => ({ device, count }))
            .sort((a, b) => b.count - a.count)
        );

        // Today count
        const today = new Date().toISOString().split("T")[0];
        setTodayCount(data.filter((d) => d.created_at.startsWith(today)).length);
      }
    } catch (err) {
      console.error("Error fetching book downloads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDeviceIcon = (device: string) => {
    if (device === "mobile") return <Smartphone className="w-4 h-4 text-gold" />;
    return <Monitor className="w-4 h-4 text-gold" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/30">
            <BookOpen className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black tracking-tight">Book Hub</h2>
            <p className="text-sm text-black/50">Download analytics & tracking</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="border-gold/30 hover:bg-gold/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-gold" />
              </div>
              <div>
                <span className="text-black/50 text-sm">Total Downloads</span>
                <p className="text-black text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div>
                <span className="text-black/50 text-sm">Unique Users</span>
                <p className="text-black text-2xl font-bold">{uniqueEmails}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gold" />
              </div>
              <div>
                <span className="text-black/50 text-sm">Today</span>
                <p className="text-black text-2xl font-bold">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-gold" />
              </div>
              <div>
                <span className="text-black/50 text-sm">Sources</span>
                <p className="text-black text-2xl font-bold">{sourceStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source & Device Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-2 border-gold/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceStats.length === 0 ? (
              <p className="text-sm text-black/40 text-center py-4">No downloads yet</p>
            ) : (
              <div className="space-y-3">
                {sourceStats.map((s) => (
                  <div key={s.source} className="flex items-center justify-between">
                    <span className="text-sm text-black/70 capitalize">{s.source.replace(/-/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gold/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full"
                          style={{ width: `${totalCount > 0 ? (s.count / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-black min-w-[24px] text-right">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gold/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
              <Monitor className="w-4 h-4 text-gold" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceStats.length === 0 ? (
              <p className="text-sm text-black/40 text-center py-4">No downloads yet</p>
            ) : (
              <div className="space-y-3">
                {deviceStats.map((d) => (
                  <div key={d.device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(d.device)}
                      <span className="text-sm text-black/70 capitalize">{d.device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gold/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full"
                          style={{ width: `${totalCount > 0 ? (d.count / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-black min-w-[24px] text-right">{d.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Downloads Table */}
      <Card className="bg-white border-2 border-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
            <Download className="w-4 h-4 text-gold" />
            Recent Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {downloads.length === 0 ? (
            <p className="text-sm text-black/40 text-center py-8">No downloads recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gold/20">
                    <th className="text-left py-2 px-3 text-black/50 font-semibold text-xs uppercase">User</th>
                    <th className="text-left py-2 px-3 text-black/50 font-semibold text-xs uppercase">Email</th>
                    <th className="text-left py-2 px-3 text-black/50 font-semibold text-xs uppercase">Source</th>
                    <th className="text-left py-2 px-3 text-black/50 font-semibold text-xs uppercase">UTM</th>
                    <th className="text-left py-2 px-3 text-black/50 font-semibold text-xs uppercase">Device</th>
                    <th className="text-left py-2 px-3 text-black/50 font-semibold text-xs uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map((dl) => (
                    <tr key={dl.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                      <td className="py-2.5 px-3 text-black/80 font-medium">
                        {dl.downloader_name || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-black/70">{dl.downloader_email}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-medium capitalize">
                          {dl.page_source || "direct"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-black/50 text-xs">
                        {dl.utm_source ? `${dl.utm_source}/${dl.utm_medium || "—"}` : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(dl.device_type || "desktop")}
                          <span className="text-xs text-black/50 capitalize">{dl.browser || "—"}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-black/50 text-xs">
                        {format(new Date(dl.created_at), "MMM d, yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
