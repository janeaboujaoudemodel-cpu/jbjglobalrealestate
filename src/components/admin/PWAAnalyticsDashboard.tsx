import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Smartphone, Monitor, Tablet, TrendingUp, TrendingDown, Users } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AnalyticsRow {
  id: string;
  event_type: string;
  device_type: string | null;
  platform: string | null;
  browser: string | null;
  created_at: string;
  session_id: string | null;
}

interface EventCount {
  event_type: string;
  count: number;
}

interface DeviceBreakdown {
  device_type: string;
  count: number;
}

interface PlatformBreakdown {
  platform: string;
  count: number;
}

const PWAAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [eventCounts, setEventCounts] = useState<EventCount[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([]);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformBreakdown[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pwa_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateRange === '7d') {
        query = query.gte('created_at', subDays(new Date(), 7).toISOString());
      } else if (dateRange === '30d') {
        query = query.gte('created_at', subDays(new Date(), 30).toISOString());
      }

      const { data, error } = await query.limit(1000);
      
      if (error) throw error;
      
      setAnalytics(data || []);
      
      // Calculate event counts
      const counts: Record<string, number> = {};
      const devices: Record<string, number> = {};
      const platforms: Record<string, number> = {};
      
      (data || []).forEach((row: AnalyticsRow) => {
        counts[row.event_type] = (counts[row.event_type] || 0) + 1;
        if (row.device_type) {
          devices[row.device_type] = (devices[row.device_type] || 0) + 1;
        }
        if (row.platform) {
          platforms[row.platform] = (platforms[row.platform] || 0) + 1;
        }
      });
      
      setEventCounts(Object.entries(counts).map(([event_type, count]) => ({ event_type, count })));
      setDeviceBreakdown(Object.entries(devices).map(([device_type, count]) => ({ device_type, count })));
      setPlatformBreakdown(Object.entries(platforms).map(([platform, count]) => ({ platform, count })));
      
    } catch (err) {
      console.error('Failed to fetch PWA analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      button_click: 'Download Button Clicks',
      prompt_shown: 'Install Prompts Shown',
      install_accepted: 'Installs Completed',
      install_dismissed: 'Installs Dismissed',
      app_opened: 'App Opens (PWA)',
      app_uninstalled: 'Uninstalls',
    };
    return labels[eventType] || eventType;
  };

  const getEventIcon = (eventType: string) => {
    if (eventType === 'button_click') return <Download className="w-5 h-5 text-blue-400" />;
    if (eventType === 'install_accepted') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (eventType === 'install_dismissed') return <TrendingDown className="w-5 h-5 text-red-400" />;
    if (eventType === 'app_opened') return <Smartphone className="w-5 h-5 text-gold" />;
    return <Users className="w-5 h-5 text-zinc-400" />;
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-4 h-4" />;
    if (deviceType === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const totalClicks = eventCounts.find(e => e.event_type === 'button_click')?.count || 0;
  const totalInstalls = eventCounts.find(e => e.event_type === 'install_accepted')?.count || 0;
  const conversionRate = totalClicks > 0 ? ((totalInstalls / totalClicks) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">PWA Analytics</h2>
          <p className="text-zinc-400 text-sm">Track app downloads and user engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <TabsList className="bg-zinc-800">
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAnalytics}
            disabled={loading}
            className="border-zinc-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Download Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalClicks}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Successful Installs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{totalInstalls}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">{conversionRate}%</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">App Opens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {eventCounts.find(e => e.event_type === 'app_opened')?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Events Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventCounts.map((event) => (
                <div key={event.event_type} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.event_type)}
                    <span className="text-white">{getEventLabel(event.event_type)}</span>
                  </div>
                  <span className="text-gold font-semibold">{event.count}</span>
                </div>
              ))}
              {eventCounts.length === 0 && (
                <p className="text-zinc-500 text-center py-4">No events recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Device & Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-zinc-400 text-sm mb-2">By Device</h4>
                <div className="space-y-2">
                  {deviceBreakdown.map((device) => (
                    <div key={device.device_type} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device_type)}
                        <span className="text-white capitalize">{device.device_type}</span>
                      </div>
                      <span className="text-zinc-400">{device.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-zinc-400 text-sm mb-2">By Platform</h4>
                <div className="flex flex-wrap gap-2">
                  {platformBreakdown.map((platform) => (
                    <div key={platform.platform} className="px-3 py-1 bg-zinc-800 rounded-full text-sm">
                      <span className="text-white capitalize">{platform.platform}</span>
                      <span className="text-zinc-500 ml-2">({platform.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-400 py-2">Event</th>
                  <th className="text-left text-zinc-400 py-2">Device</th>
                  <th className="text-left text-zinc-400 py-2">Platform</th>
                  <th className="text-left text-zinc-400 py-2">Browser</th>
                  <th className="text-left text-zinc-400 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.slice(0, 20).map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800/50">
                    <td className="py-2 text-white">{getEventLabel(row.event_type)}</td>
                    <td className="py-2 text-zinc-400 capitalize">{row.device_type || '-'}</td>
                    <td className="py-2 text-zinc-400 capitalize">{row.platform || '-'}</td>
                    <td className="py-2 text-zinc-400 capitalize">{row.browser || '-'}</td>
                    <td className="py-2 text-zinc-500">{format(new Date(row.created_at), 'MMM d, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analytics.length === 0 && (
              <p className="text-zinc-500 text-center py-8">No analytics data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAAnalyticsDashboard;
