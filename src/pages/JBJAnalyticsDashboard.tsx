import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Palette, 
  CreditCard, 
  Home, 
  MessageCircle, 
  Share2,
  AlertCircle,
  Download,
  Calendar,
  Clock,
  FileSpreadsheet,
  FileText
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
  color: string;
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
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsStat[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isAdmin) {
      toast.error("You don't have access to this dashboard");
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, dateRange]);

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

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();

    try {
      // Fetch tool usage analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('jbj_analytics')
        .select('tool_name, user_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (analyticsError) throw analyticsError;

      // Process tool usage
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

      // Fetch issue reports
      const { data: issuesData, error: issuesError } = await supabase
        .from('jbj_issue_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (issuesError) throw issuesError;
      setIssueReports(issuesData || []);

      // Calculate stats
      const totalInteractions = analyticsData?.length || 0;
      const uniqueUsers = new Set(analyticsData?.filter(a => a.user_id).map(a => a.user_id)).size;
      const designsCreated = analyticsData?.filter(a => a.tool_name.includes('design')).length || 0;
      const cardsScanned = analyticsData?.filter(a => a.tool_name.includes('card')).length || 0;
      const pendingIssues = issuesData?.filter(i => i.status === 'pending').length || 0;

      setStats([
        {
          label: 'Total Interactions',
          value: totalInteractions,
          change: 12,
          icon: TrendingUp,
          color: 'text-green-400',
        },
        {
          label: 'Active Users',
          value: uniqueUsers,
          change: 8,
          icon: Users,
          color: 'text-blue-400',
        },
        {
          label: 'Designs Created',
          value: designsCreated,
          change: 15,
          icon: Palette,
          color: 'text-purple-400',
        },
        {
          label: 'Cards Scanned',
          value: cardsScanned,
          change: 5,
          icon: CreditCard,
          color: 'text-gold',
        },
        {
          label: 'AI Chats',
          value: analyticsData?.filter(a => a.tool_name.includes('chat') || a.tool_name.includes('assistant')).length || 0,
          change: 20,
          icon: MessageCircle,
          color: 'text-fuchsia-400',
        },
        {
          label: 'Pending Issues',
          value: pendingIssues,
          change: -3,
          icon: AlertCircle,
          color: 'text-red-400',
        },
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-white text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                JBJ Analytics Dashboard
              </h1>
              <p className="text-zinc-400 mt-1">Monitor platform performance and user activity</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-zinc-800 rounded-lg p-1">
                {(['today', 'week', 'month'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      dateRange === range 
                        ? 'bg-gold text-black' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {range === 'today' ? 'Today' : range === 'week' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>
              <Button onClick={exportToCSV} variant="outline" className="border-zinc-700">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-zinc-400 text-xs">{stat.label}</span>
                  </div>
                  <p className="text-white text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className={`text-xs ${stat.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change >= 0 ? '+' : ''}{stat.change}% vs last period
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="usage" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <BarChart3 className="w-4 h-4 mr-2" />
              Tool Usage
            </TabsTrigger>
            <TabsTrigger value="issues" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <AlertCircle className="w-4 h-4 mr-2" />
              Issue Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Tool Usage Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {toolUsage.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No usage data for this period</p>
                  ) : (
                    toolUsage.map((tool, idx) => (
                      <div key={tool.tool_name} className="flex items-center gap-4">
                        <span className="text-zinc-500 w-6">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-medium">{tool.tool_name}</span>
                            <span className="text-zinc-400 text-sm">{tool.usage_count} uses</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full"
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
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  User Issue Reports
                  <Badge variant="outline" className="border-red-400 text-red-400">
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
                          className="p-4 bg-zinc-800 rounded-lg border border-zinc-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-white font-medium">{issue.tool_name}</h4>
                              <p className="text-zinc-400 text-sm">
                                {issue.user_name || 'Anonymous'} • {issue.user_email || 'No email'}
                              </p>
                            </div>
                            <Badge 
                              variant="outline"
                              className={
                                issue.status === 'pending' ? 'border-yellow-400 text-yellow-400' :
                                issue.status === 'resolved' ? 'border-green-400 text-green-400' :
                                'border-zinc-400 text-zinc-400'
                              }
                            >
                              {issue.status}
                            </Badge>
                          </div>
                          <p className="text-zinc-300 text-sm mb-3">{issue.issue_description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-xs">
                              {format(new Date(issue.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-green-400 text-green-400 hover:bg-green-400/10"
                                onClick={() => handleUpdateIssueStatus(issue.id, 'resolved')}
                              >
                                Resolve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-zinc-600 text-zinc-400"
                                onClick={() => handleUpdateIssueStatus(issue.id, 'in_progress')}
                              >
                                In Progress
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
