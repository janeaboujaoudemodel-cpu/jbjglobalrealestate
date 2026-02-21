import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Smartphone, Monitor, Tablet, TrendingUp, TrendingDown, Users } from "lucide-react";
import { format, subDays } from "date-fns";
import PageGuide from "./PageGuide";
import { getGuide } from "@/config/page-guides";

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
  const [pwaView, setPwaView] = useState<'device' | 'platform'>('device');

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
    if (eventType === 'button_click') return <Download className="w-5 h-5 text-blue-600" />;
    if (eventType === 'install_accepted') return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (eventType === 'install_dismissed') return <TrendingDown className="w-5 h-5 text-red-500" />;
    if (eventType === 'app_opened') return <Smartphone className="w-5 h-5 text-gold" />;
    return <Users className="w-5 h-5 text-black/60" />;
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-4 h-4 text-gold" />;
    if (deviceType === 'tablet') return <Tablet className="w-4 h-4 text-gold" />;
    return <Monitor className="w-4 h-4 text-gold" />;
  };

  const totalClicks = eventCounts.find(e => e.event_type === 'button_click')?.count || 0;
  const totalInstalls = eventCounts.find(e => e.event_type === 'install_accepted')?.count || 0;
  const conversionRate = totalClicks > 0 ? ((totalInstalls / totalClicks) * 100).toFixed(1) : '0';

  const pwaGuide = getGuide('pwa-analytics');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center border-2 border-gold/30">
            <Smartphone className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">PWA Analytics</h2>
            <p className="text-black/60 text-sm">Track app downloads and user engagement</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pwaGuide && <PageGuide guide={pwaGuide} />}
          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <TabsList className="bg-white/80 border-2 border-gold/30">
              <TabsTrigger value="7d" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black">7 Days</TabsTrigger>
              <TabsTrigger value="30d" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black">30 Days</TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAnalytics}
            disabled={loading}
            className="border-2 border-gold/40 bg-white/80 hover:bg-gold/10 hover:border-gold text-black"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-black/60 flex items-center gap-2">
              <Download className="w-4 h-4 text-gold" />
              Download Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">{totalClicks}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-black/60 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Successful Installs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalInstalls}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-black/60 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">{conversionRate}%</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-black/60 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              App Opens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {eventCounts.find(e => e.event_type === 'app_opened')?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <CardHeader>
            <CardTitle className="text-black">Events Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventCounts.map((event) => (
                <div key={event.event_type} className="flex items-center justify-between p-3 bg-white/60 border border-gold/20 rounded-lg hover:border-gold/40 transition-colors">
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.event_type)}
                    <span className="text-black">{getEventLabel(event.event_type)}</span>
                  </div>
                  <span className="text-gold font-semibold">{event.count}</span>
                </div>
              ))}
              {eventCounts.length === 0 && (
                <p className="text-black/50 text-center py-4">No events recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <CardHeader>
            <CardTitle className="text-black">Device & Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Toggle Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={pwaView === 'device' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPwaView('device')}
                  className={pwaView === 'device' 
                    ? 'bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border-2 border-gold/40 font-semibold' 
                    : 'border-gold/30 text-black hover:bg-gold/10'}
                >
                  <Monitor className="w-3.5 h-3.5 mr-1.5" />
                  By Device
                </Button>
                <Button
                  variant={pwaView === 'platform' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPwaView('platform')}
                  className={pwaView === 'platform' 
                    ? 'bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border-2 border-gold/40 font-semibold' 
                    : 'border-gold/30 text-black hover:bg-gold/10'}
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                  By Platform
                </Button>
              </div>

              {pwaView === 'device' ? (
                <div className="space-y-2">
                  {deviceBreakdown.map((device) => (
                    <div key={device.device_type} className="flex items-center justify-between p-2 bg-white/60 border border-gold/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device_type)}
                        <span className="text-black capitalize">{device.device_type}</span>
                      </div>
                      <span className="text-black/70 font-medium">{device.count}</span>
                    </div>
                  ))}
                  {deviceBreakdown.length === 0 && (
                    <p className="text-black/50 text-center py-4">No device data yet</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {platformBreakdown.map((platform) => (
                    <div key={platform.platform} className="flex items-center justify-between p-2 bg-white/60 border border-gold/20 rounded-lg">
                      <span className="text-black capitalize">{platform.platform}</span>
                      <span className="text-black/70 font-medium">{platform.count}</span>
                    </div>
                  ))}
                  {platformBreakdown.length === 0 && (
                    <p className="text-black/50 text-center py-4">No platform data yet</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
        <CardHeader>
          <CardTitle className="text-black">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gold/20">
                  <th className="text-left text-black/60 py-3 font-medium">Event</th>
                  <th className="text-left text-black/60 py-3 font-medium">Device</th>
                  <th className="text-left text-black/60 py-3 font-medium">Platform</th>
                  <th className="text-left text-black/60 py-3 font-medium">Browser</th>
                  <th className="text-left text-black/60 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.slice(0, 20).map((row) => (
                  <tr key={row.id} className="border-b border-gold/10 hover:bg-white/40 transition-colors">
                    <td className="py-3 text-black font-medium">{getEventLabel(row.event_type)}</td>
                    <td className="py-3 text-black/70 capitalize">{row.device_type || '-'}</td>
                    <td className="py-3 text-black/70 capitalize">{row.platform || '-'}</td>
                    <td className="py-3 text-black/70 capitalize">{row.browser || '-'}</td>
                    <td className="py-3 text-black/50">{format(new Date(row.created_at), 'MMM d, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analytics.length === 0 && (
              <p className="text-black/50 text-center py-8">No analytics data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAAnalyticsDashboard;
