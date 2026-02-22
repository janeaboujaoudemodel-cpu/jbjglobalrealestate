import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityStats } from "@/hooks/useActivityStats";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, ArrowLeft, Activity, Calendar, Flame, TrendingUp, Clock, Smartphone, Monitor, Tablet, Zap, BarChart3, Crown, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "framer-motion";

const EVENT_LABELS: Record<string, string> = {
  page_view: "Viewed a page",
  click: "Interaction",
  login: "Logged in",
  search: "Searched",
  listing_view: "Viewed listing",
  property_view: "Viewed property",
  community_view: "Viewed community",
  favorite: "Saved to favorites",
  lead_submit: "Submitted inquiry",
  ai_tool_used: "Used AI tool",
  tool_use: "Used a tool",
  form_submission: "Submitted a form",
  filter_change: "Applied filter",
  compare_used: "Used compare tool",
  download: "Downloaded document",
  click_call: "Clicked call",
  click_whatsapp: "Clicked WhatsApp",
  click_email: "Clicked email",
};

const EVENT_COLORS: Record<string, string> = {
  page_view: "text-blue-500",
  click: "text-zinc-500",
  login: "text-emerald-500",
  search: "text-purple-500",
  listing_view: "text-gold",
  property_view: "text-gold",
  favorite: "text-red-500",
  lead_submit: "text-emerald-600",
  ai_tool_used: "text-purple-600",
};

const DeviceIcon = ({ device }: { device: string }) => {
  if (device === 'mobile') return <Smartphone className="w-4 h-4" />;
  if (device === 'tablet') return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
};

const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplayed(0); return; }
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayed(value); clearInterval(interval); }
      else setDisplayed(Math.round(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);
  return <span>{displayed.toLocaleString()}</span>;
};

const MyDashboardActivity = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading } = useActivityStats();
  const [chartMode, setChartMode] = useState<'events' | 'points'>('events');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?redirect=/my-dashboard/activity');
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!user || !stats) return null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  return (
    <>
      <SEOHead 
        title="My Activity | JBJ Global Real Estate"
        description="View your activity history and engagement on the platform."
      />
      
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)' }}>
        <div className="mx-3 md:mx-4 lg:mx-6 my-6 rounded-2xl border border-gold/30 overflow-hidden"
          style={{ background: 'linear-gradient(145deg, rgba(20,18,14,0.95) 0%, rgba(30,26,20,0.9) 50%, rgba(15,13,10,0.95) 100%)' }}
        >
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => navigate('/my-dashboard')} className="mb-6 text-gold hover:text-gold/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', background: 'linear-gradient(135deg, #FFFFFF 0%, #F5EBD7 40%, #C8A766 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                My Activity Intelligence
              </h1>
              <p className="text-zinc-400 mt-2">Real-time behavioral analytics and engagement tracking.</p>
            </div>

            {/* Stats Cards — 4 columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Calendar, label: 'Days Active (30d)', value: stats.daysActive30d, color: 'from-blue-500/20 to-blue-600/10' },
                { icon: Flame, label: 'Day Streak', value: stats.currentStreak, color: 'from-orange-500/20 to-red-500/10' },
                { icon: TrendingUp, label: 'Points This Week', value: stats.pointsThisWeek, color: 'from-emerald-500/20 to-emerald-600/10' },
                { icon: Activity, label: 'Activities (30d)', value: stats.totalActivities30d, color: 'from-gold/20 to-gold/10' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className={`border-gold/20 bg-gradient-to-br ${stat.color} backdrop-blur-sm`}>
                    <CardContent className="p-4 text-center">
                      <stat.icon className="w-6 h-6 text-gold mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white"><AnimatedCounter value={stat.value} /></p>
                      <p className="text-xs text-zinc-400">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="border-gold/20 bg-white/5">
                <CardContent className="p-4 text-center">
                  <Zap className="w-5 h-5 text-gold mx-auto mb-1" />
                  <p className="text-xl font-bold text-white"><AnimatedCounter value={stats.totalPoints} /></p>
                  <p className="text-xs text-zinc-400">Total Points</p>
                </CardContent>
              </Card>
              <Card className="border-gold/20 bg-white/5">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="w-5 h-5 text-gold mx-auto mb-1" />
                  <p className="text-xl font-bold text-white"><AnimatedCounter value={stats.totalSessions} /></p>
                  <p className="text-xs text-zinc-400">Total Sessions</p>
                </CardContent>
              </Card>
              <Card className="border-gold/20 bg-white/5">
                <CardContent className="p-4 text-center">
                  <Clock className="w-5 h-5 text-gold mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{formatDuration(stats.avgSessionDuration)}</p>
                  <p className="text-xs text-zinc-400">Avg Session</p>
                </CardContent>
              </Card>
            </div>

            {/* VIP Tier & Scores */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="border-gold/20 bg-gradient-to-r from-gold/5 via-white/5 to-gold/5 mb-8">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* VIP Badge */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/50 flex items-center justify-center">
                        <Crown className="w-7 h-7 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">VIP Status</p>
                        <p className="text-xl font-bold text-gold">{stats.vipTier}</p>
                      </div>
                    </div>

                    {/* Score bars */}
                    <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                      {[
                        { label: 'Intent', value: stats.intentScore, icon: Target, color: 'from-purple-500 to-purple-600' },
                        { label: 'Engagement', value: stats.engagementScore, icon: Shield, color: 'from-blue-500 to-blue-600' },
                        { label: 'Confidence', value: stats.confidenceScore, icon: Zap, color: 'from-emerald-500 to-emerald-600' },
                      ].map(score => (
                        <div key={score.label} className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <score.icon className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-xs text-zinc-400">{score.label}</span>
                          </div>
                          <p className="text-lg font-bold text-white">{score.value}<span className="text-xs text-zinc-500">/100</span></p>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                            <div className={`h-full bg-gradient-to-r ${score.color} rounded-full transition-all duration-1000`} style={{ width: `${score.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {stats.dailyActivity.length > 0 && (
              <Card className="border-gold/20 bg-white/5 mb-8">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-gold" />
                      Daily Activity
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button size="sm" variant={chartMode === 'events' ? 'default' : 'ghost'}
                        className={chartMode === 'events' ? 'bg-gold text-black hover:bg-gold/90 h-7 text-xs' : 'text-zinc-400 h-7 text-xs'}
                        onClick={() => setChartMode('events')}>Events</Button>
                      <Button size="sm" variant={chartMode === 'points' ? 'default' : 'ghost'}
                        className={chartMode === 'points' ? 'bg-gold text-black hover:bg-gold/90 h-7 text-xs' : 'text-zinc-400 h-7 text-xs'}
                        onClick={() => setChartMode('points')}>Points</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={stats.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,167,102,0.1)" />
                      <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fill: '#999', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(200,167,102,0.3)', borderRadius: 8, color: '#fff' }}
                        labelFormatter={l => `Date: ${l}`}
                      />
                      <Area
                        type="monotone"
                        dataKey={chartMode}
                        stroke="#C8A766"
                        fill="url(#goldGradient)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C8A766" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#C8A766" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Device Mix + Recent Activity side by side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Device Mix */}
              {stats.deviceMix.length > 0 && (
                <Card className="border-gold/20 bg-white/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Device Mix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.deviceMix.map(d => {
                        const total = stats.deviceMix.reduce((s, x) => s + x.count, 0);
                        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                        return (
                          <div key={d.device} className="flex items-center gap-3">
                            <DeviceIcon device={d.device} />
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-300 capitalize">{d.device}</span>
                                <span className="text-gold font-semibold">{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-gold to-gold/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity Timeline */}
              <Card className="border-gold/20 bg-white/5 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gold" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentEvents.length > 0 ? (
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-2">
                        {stats.recentEvents
                          .filter(e => e.event_name !== 'click') // filter out noise
                          .slice(0, 30)
                          .map((event, index) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 ${EVENT_COLORS[event.event_name] || 'text-gold'}`}>
                              <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-200 truncate">
                                {EVENT_LABELS[event.event_name] || event.event_name}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">
                                {event.page_path} · {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {event.points_awarded > 0 && (
                              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs shrink-0">
                                +{event.points_awarded} pts
                              </Badge>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400">Activity is being recorded live.</p>
                      <p className="text-sm text-zinc-500 mt-1">Browse the platform to see your activity appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyDashboardActivity;
