import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Clock, CheckCircle2, XCircle, TrendingUp, Zap, RefreshCw, BarChart3 } from 'lucide-react';
import { format, subDays, subHours, startOfDay, endOfDay } from 'date-fns';
import PageGuide from './PageGuide';
import { getGuide } from '@/config/page-guides';

interface UsageLog {
  id: string;
  function_name: string;
  model: string;
  success: boolean;
  response_time_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  error_type: string | null;
  created_at: string;
  user_id: string | null;
}

interface AggregatedStats {
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  errorCount: number;
  byFunction: Record<string, { calls: number; success: number; avgTime: number }>;
  byModel: Record<string, { calls: number; tokens: number }>;
  recentErrors: UsageLog[];
}

const AIAnalyticsDashboard = () => {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const fetchLogs = async () => {
    setIsLoading(true);
    
    let startDate: Date;
    switch (timeRange) {
      case '1h':
        startDate = subHours(new Date(), 1);
        break;
      case '24h':
        startDate = subDays(new Date(), 1);
        break;
      case '7d':
        startDate = subDays(new Date(), 7);
        break;
      case '30d':
        startDate = subDays(new Date(), 30);
        break;
      default:
        startDate = subDays(new Date(), 1);
    }

    try {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const typedLogs = data as UsageLog[];
      setLogs(typedLogs);
      calculateStats(typedLogs);
    } catch (error) {
      console.error('Error fetching AI logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (logsData: UsageLog[]) => {
    if (!logsData.length) {
      setStats({
        totalCalls: 0,
        successRate: 0,
        avgResponseTime: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        errorCount: 0,
        byFunction: {},
        byModel: {},
        recentErrors: [],
      });
      return;
    }

    const successCount = logsData.filter(l => l.success).length;
    const responseTimes = logsData.filter(l => l.response_time_ms).map(l => l.response_time_ms!);
    
    const byFunction: Record<string, { calls: number; success: number; avgTime: number; times: number[] }> = {};
    const byModel: Record<string, { calls: number; tokens: number }> = {};
    
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    logsData.forEach(log => {
      // By function
      if (!byFunction[log.function_name]) {
        byFunction[log.function_name] = { calls: 0, success: 0, avgTime: 0, times: [] };
      }
      byFunction[log.function_name].calls++;
      if (log.success) byFunction[log.function_name].success++;
      if (log.response_time_ms) byFunction[log.function_name].times.push(log.response_time_ms);

      // By model
      if (!byModel[log.model]) {
        byModel[log.model] = { calls: 0, tokens: 0 };
      }
      byModel[log.model].calls++;
      byModel[log.model].tokens += (log.prompt_tokens || 0) + (log.completion_tokens || 0);

      totalPromptTokens += log.prompt_tokens || 0;
      totalCompletionTokens += log.completion_tokens || 0;
    });

    // Calculate avg times
    const cleanedByFunction: Record<string, { calls: number; success: number; avgTime: number }> = {};
    Object.entries(byFunction).forEach(([key, val]) => {
      cleanedByFunction[key] = {
        calls: val.calls,
        success: val.success,
        avgTime: val.times.length ? val.times.reduce((a, b) => a + b, 0) / val.times.length : 0,
      };
    });

    const recentErrors = logsData.filter(l => !l.success).slice(0, 10);

    setStats({
      totalCalls: logsData.length,
      successRate: (successCount / logsData.length) * 100,
      avgResponseTime: responseTimes.length ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      totalPromptTokens,
      totalCompletionTokens,
      errorCount: logsData.length - successCount,
      byFunction: cleanedByFunction,
      byModel,
      recentErrors,
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [timeRange]);

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens < 1000) return tokens.toString();
    if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
    return `${(tokens / 1000000).toFixed(2)}M`;
  };

  const aiGuide = getGuide('ai-analytics');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/15 to-amber-500/10 flex items-center justify-center border-2 border-gold/30">
            <Brain className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h2 className="text-black text-xl font-semibold">AI Analytics</h2>
            <p className="text-black/60 text-sm">Usage metrics and performance insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {aiGuide && <PageGuide guide={aiGuide} />}
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32 bg-white/80 border-2 border-gold/30 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="border-2 border-gold/40 bg-white/80 hover:bg-gold/10 hover:border-gold text-black"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-4 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <div className="flex items-center gap-2 text-black/60 text-xs mb-2">
            <BarChart3 className="w-4 h-4 text-gold" />
            Total Calls
          </div>
          <p className="text-black text-2xl font-bold">{stats?.totalCalls || 0}</p>
        </Card>

        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-4 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <div className="flex items-center gap-2 text-black/60 text-xs mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Success Rate
          </div>
          <p className="text-black text-2xl font-bold">
            {stats?.successRate.toFixed(1) || 0}%
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-4 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <div className="flex items-center gap-2 text-black/60 text-xs mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Avg Response
          </div>
          <p className="text-black text-2xl font-bold">
            {formatMs(stats?.avgResponseTime || 0)}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-4 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <div className="flex items-center gap-2 text-black/60 text-xs mb-2">
            <Zap className="w-4 h-4 text-gold" />
            Input Tokens
          </div>
          <p className="text-black text-2xl font-bold">
            {formatTokens(stats?.totalPromptTokens || 0)}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-4 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <div className="flex items-center gap-2 text-black/60 text-xs mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Output Tokens
          </div>
          <p className="text-black text-2xl font-bold">
            {formatTokens(stats?.totalCompletionTokens || 0)}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-4 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <div className="flex items-center gap-2 text-black/60 text-xs mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            Errors
          </div>
          <p className="text-red-500 text-2xl font-bold">
            {stats?.errorCount || 0}
          </p>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Function */}
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-6 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <h3 className="text-black font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            Usage by Function
          </h3>
          {stats && Object.keys(stats.byFunction).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byFunction)
                .sort((a, b) => b[1].calls - a[1].calls)
                .map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-white/60 border border-gold/20 rounded-lg hover:border-gold/40 transition-colors">
                    <div>
                      <p className="text-black text-sm font-medium">{name}</p>
                      <p className="text-black/50 text-xs">
                        {data.success}/{data.calls} successful • {formatMs(data.avgTime)} avg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-black font-semibold">{data.calls}</p>
                      <p className={`text-xs ${data.success === data.calls ? 'text-green-600' : 'text-amber-600'}`}>
                        {((data.success / data.calls) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-black/50 text-sm">No data available</p>
          )}
        </Card>

        {/* By Model */}
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-6 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
          <h3 className="text-black font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" />
            Usage by Model
          </h3>
          {stats && Object.keys(stats.byModel).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byModel)
                .sort((a, b) => b[1].calls - a[1].calls)
                .map(([model, data]) => (
                  <div key={model} className="flex items-center justify-between p-3 bg-white/60 border border-gold/20 rounded-lg hover:border-gold/40 transition-colors">
                    <div>
                      <p className="text-black text-sm font-medium">{model}</p>
                      <p className="text-black/50 text-xs">{formatTokens(data.tokens)} tokens used</p>
                    </div>
                    <p className="text-black font-semibold">{data.calls} calls</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-black/50 text-sm">No data available</p>
          )}
        </Card>
      </div>

      {/* Recent Errors */}
      {stats && stats.recentErrors.length > 0 && (
        <Card className="bg-gradient-to-br from-red-50 via-[#FFF5F5] to-red-50 border-2 border-red-300/50 p-6 shadow-[0_4px_20px_rgba(239,68,68,0.1)]">
          <h3 className="text-black font-semibold mb-4 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            Recent Errors
          </h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {stats.recentErrors.map((error) => (
                <div key={error.id} className="flex items-center justify-between p-3 bg-red-100/50 border border-red-200 rounded-lg">
                  <div>
                    <p className="text-black text-sm font-medium">{error.function_name}</p>
                    <p className="text-red-600 text-xs">{error.error_type || 'Unknown error'}</p>
                  </div>
                  <p className="text-black/50 text-xs">
                    {format(new Date(error.created_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Recent Logs */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-6 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
        <h3 className="text-black font-semibold mb-4">Recent Logs</h3>
        <ScrollArea className="h-[300px]">
          <table className="w-full text-sm">
            <thead className="text-black/60 text-xs uppercase border-b-2 border-gold/20">
              <tr>
                <th className="text-left pb-3 font-medium">Function</th>
                <th className="text-left pb-3 font-medium">Model</th>
                <th className="text-center pb-3 font-medium">Status</th>
                <th className="text-right pb-3 font-medium">Response Time</th>
                <th className="text-right pb-3 font-medium">Tokens</th>
                <th className="text-right pb-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 50).map((log) => (
                <tr key={log.id} className="border-b border-gold/10 hover:bg-white/40 transition-colors">
                  <td className="py-2 text-black font-medium">{log.function_name}</td>
                  <td className="py-2 text-black/70">{log.model}</td>
                  <td className="py-2 text-center">
                    {log.success ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 inline" />
                    )}
                  </td>
                  <td className="py-2 text-right text-black/70">
                    {log.response_time_ms ? formatMs(log.response_time_ms) : '—'}
                  </td>
                  <td className="py-2 text-right text-black/70">
                    {(log.prompt_tokens || 0) + (log.completion_tokens || 0)}
                  </td>
                  <td className="py-2 text-right text-black/50">
                    {format(new Date(log.created_at), 'HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && !isLoading && (
            <p className="text-black/50 text-center py-8">No AI usage logs found in this time range</p>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default AIAnalyticsDashboard;
