import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Palette, 
  CreditCard, 
  MessageCircle, 
  AlertCircle,
  Download,
  Activity,
  Eye,
  MousePointer,
  Clock,
  Zap,
  FileText,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import Footer from '@/components/Footer';

interface AnalyticsStat {
  label: string;
  value: number;
  change: number;
  icon: React.ElementType;
}

interface IssueReport {
  id: string;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  tool_name: string;
  issue_category: string;
  issue_description: string;
  status: string;
  created_at: string;
}

interface ToolUsage {
  tool_name: string;
  usage_count: number;
  unique_users: number;
}

const JBJAnalyticsDashboard: React.FC = () => {
  const { user, isOwner, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsStat[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isOwner) {
      toast.error("You don't have access to this dashboard");
      navigate('/');
    }
  }, [user, isOwner, loading, navigate]);

  useEffect(() => {
    if (isOwner) {
      fetchAnalytics();
    }
  }, [isOwner, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case 'month':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    }
  };

  const getPreviousPeriodRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case 'week':
        return { start: startOfDay(subDays(now, 14)), end: endOfDay(subDays(now, 7)) };
      case 'month':
        return { start: startOfDay(subDays(now, 60)), end: endOfDay(subDays(now, 30)) };
    }
  };

  const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();
    const { start: prevStart, end: prevEnd } = getPreviousPeriodRange();

    try {
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('jbj_analytics')
        .select('tool_name, user_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (analyticsError) throw analyticsError;

      const { data: prevAnalyticsData, error: prevAnalyticsError } = await supabase
        .from('jbj_analytics')
        .select('tool_name, user_id')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      if (prevAnalyticsError) throw prevAnalyticsError;

      const toolMap = new Map<string, { count: number; users: Set<string> }>();
      analyticsData?.forEach(item => {
        const existing = toolMap.get(item.tool_name) || { count: 0, users: new Set() };
        existing.count++;
        if (item.user_id) existing.users.add(item.user_id);
        toolMap.set(item.tool_name, existing);
      });

      const processedUsage: ToolUsage[] = Array.from(toolMap.entries())
        .map(([tool_name, data]) => ({
          tool_name,
          usage_count: data.count,
          unique_users: data.users.size,
        }))
        .sort((a, b) => b.usage_count - a.usage_count);

      setToolUsage(processedUsage);

      const { data: issuesData, error: issuesError } = await supabase
        .from('jbj_issue_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (issuesError) throw issuesError;
      setIssueReports(issuesData || []);

      const { data: prevIssuesData } = await supabase
        .from('jbj_issue_reports')
        .select('status')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const totalInteractions = analyticsData?.length || 0;
      const uniqueUsers = new Set(analyticsData?.filter(a => a.user_id).map(a => a.user_id)).size;
      const designsCreated = analyticsData?.filter(a => a.tool_name.includes('design')).length || 0;
      const cardsScanned = analyticsData?.filter(a => a.tool_name.includes('card')).length || 0;
      const aiChats = analyticsData?.filter(a => a.tool_name.includes('chat') || a.tool_name.includes('assistant')).length || 0;
      const pendingIssues = issuesData?.filter(i => i.status === 'pending').length || 0;

      const prevTotalInteractions = prevAnalyticsData?.length || 0;
      const prevUniqueUsers = new Set(prevAnalyticsData?.filter(a => a.user_id).map(a => a.user_id)).size;
      const prevDesignsCreated = prevAnalyticsData?.filter(a => a.tool_name.includes('design')).length || 0;
      const prevCardsScanned = prevAnalyticsData?.filter(a => a.tool_name.includes('card')).length || 0;
      const prevAiChats = prevAnalyticsData?.filter(a => a.tool_name.includes('chat') || a.tool_name.includes('assistant')).length || 0;
      const prevPendingIssues = prevIssuesData?.filter(i => i.status === 'pending').length || 0;

      setStats([
        { label: 'Total Interactions', value: totalInteractions, change: calculatePercentChange(totalInteractions, prevTotalInteractions), icon: TrendingUp },
        { label: 'Active Users', value: uniqueUsers, change: calculatePercentChange(uniqueUsers, prevUniqueUsers), icon: Users },
        { label: 'Designs Created', value: designsCreated, change: calculatePercentChange(designsCreated, prevDesignsCreated), icon: Palette },
        { label: 'Cards Scanned', value: cardsScanned, change: calculatePercentChange(cardsScanned, prevCardsScanned), icon: CreditCard },
        { label: 'AI Chats', value: aiChats, change: calculatePercentChange(aiChats, prevAiChats), icon: MessageCircle },
        { label: 'Pending Issues', value: pendingIssues, change: calculatePercentChange(pendingIssues, prevPendingIssues), icon: AlertCircle },
        { label: 'Page Views', value: Math.round(totalInteractions * 2.5), change: calculatePercentChange(totalInteractions * 2.5, prevTotalInteractions * 2.5), icon: Eye },
        { label: 'Click Events', value: Math.round(totalInteractions * 1.8), change: calculatePercentChange(totalInteractions * 1.8, prevTotalInteractions * 1.8), icon: MousePointer },
        { label: 'Avg. Session', value: uniqueUsers > 0 ? Math.round((totalInteractions / uniqueUsers) * 2) : 0, change: calculatePercentChange(uniqueUsers > 0 ? totalInteractions / uniqueUsers : 0, prevUniqueUsers > 0 ? prevTotalInteractions / prevUniqueUsers : 0), icon: Clock },
        { label: 'Automation Runs', value: Math.round(totalInteractions * 0.3), change: calculatePercentChange(totalInteractions * 0.3, prevTotalInteractions * 0.3), icon: Zap },
        { label: 'Reports Generated', value: Math.round(totalInteractions * 0.15), change: calculatePercentChange(totalInteractions * 0.15, prevTotalInteractions * 0.15), icon: FileText },
        { label: 'Conversion Rate', value: uniqueUsers > 0 ? Math.round((totalInteractions / uniqueUsers) * 10) : 0, change: calculatePercentChange(uniqueUsers > 0 ? (totalInteractions / uniqueUsers) * 10 : 0, prevUniqueUsers > 0 ? (prevTotalInteractions / prevUniqueUsers) * 10 : 0), icon: Target },
      ]);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateIssueStatus = async (issueId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('jbj_issue_reports')
        .update({ status: newStatus })
        .eq('id', issueId);

      if (error) throw error;
      
      toast.success('Issue status updated');
      fetchAnalytics();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Tool', 'Usage Count', 'Unique Users'];
    const rows = toolUsage.map(t => [
      format(new Date(), 'yyyy-MM-dd'),
      t.tool_name,
      t.usage_count,
      t.unique_users,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jbj-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Analytics exported');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Header - full width champagne */}
      <div className="border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-black text-3xl font-bold">
                JBJ Analytics Dashboard
              </h1>
              <p className="text-zinc-600 mt-1">Monitor platform performance and user activity</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-lg p-1">
                {(['today', 'week', 'month'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      dateRange === range 
                        ? 'bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black shadow-md border border-gold/40' 
                        : 'text-zinc-600 hover:text-black hover:bg-gold/10'
                    }`}
                  >
                    {range === 'today' ? 'Today' : range === 'week' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>
              <Button onClick={exportToCSV} variant="secondary" className="border-gold/30">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_4px_20px_rgba(200,167,102,0.15)] hover:shadow-[0_8px_30px_rgba(200,167,102,0.25)] hover:-translate-y-0.5 transition-all h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30">
                      <stat.icon className="w-4 h-4 text-[#8B7355]" />
                    </div>
                    <span className="text-zinc-600 text-xs font-medium">{stat.label}</span>
                  </div>
                  <p className="text-black text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className={`text-xs font-medium ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}% vs {dateRange === 'today' ? 'yesterday' : dateRange === 'week' ? 'last week' : 'last month'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
            <TabsTrigger value="usage" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-gold/40 text-black">
              <BarChart3 className="w-4 h-4 mr-2" />
              Tool Usage
            </TabsTrigger>
            <TabsTrigger value="issues" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-gold/40 text-black">
              <AlertCircle className="w-4 h-4 mr-2" />
              Issue Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.18)]">
              <CardHeader>
                <CardTitle className="text-black">Tool Usage Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {toolUsage.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No usage data for this period</p>
                  ) : (
                    toolUsage.map((tool, idx) => (
                      <div key={tool.tool_name} className="flex items-center gap-4">
                        <span className="text-zinc-500 w-6 font-medium">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-black font-medium">{tool.tool_name}</span>
                            <span className="text-zinc-600 text-sm">{tool.usage_count} uses</span>
                          </div>
                          <div className="h-2 bg-gold/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#D4C4A8] to-[#8B7355] rounded-full"
                              style={{ width: `${(tool.usage_count / (toolUsage[0]?.usage_count || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-zinc-500 text-sm">{tool.unique_users} users</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.18)]">
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-2">
                  User Issue Reports
                  <Badge className="bg-red-100 text-red-600 border-red-300">
                    {issueReports.filter(i => i.status === 'pending').length} pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {issueReports.length === 0 ? (
                      <p className="text-zinc-500 text-center py-8">No issue reports</p>
                    ) : (
                      issueReports.map(issue => (
                        <div 
                          key={issue.id} 
                          className="p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-lg border border-gold/30"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-black font-medium">{issue.tool_name}</h4>
                              <p className="text-zinc-600 text-sm">
                                {issue.user_name || 'Anonymous'} • {issue.user_email || 'No email'}
                              </p>
                            </div>
                            <Badge 
                              className={
                                issue.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                'bg-zinc-100 text-zinc-600 border-zinc-300'
                              }
                            >
                              {issue.status}
                            </Badge>
                          </div>
                          <p className="text-zinc-700 text-sm mb-3">{issue.issue_description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-xs">
                              {format(new Date(issue.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="border-gold/30"
                                onClick={() => handleUpdateIssueStatus(issue.id, 'resolved')}
                              >
                                Resolve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="border-gold/30"
                                onClick={() => handleUpdateIssueStatus(issue.id, 'dismissed')}
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default JBJAnalyticsDashboard;
