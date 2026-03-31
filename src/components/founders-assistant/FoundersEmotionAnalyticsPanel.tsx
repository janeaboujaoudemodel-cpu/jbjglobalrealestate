/**
 * Founders Emotion Analytics Panel — Champagne Gold theme
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Heart, Smile, Frown, Meh,
  Zap, Download, Calendar, BarChart3, PieChart, Users, MessageSquare, Mail, Phone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type EmotionType } from '@/config/emotion-detection-engine';
import { toast } from 'sonner';

interface EmotionStat { emotion: EmotionType; count: number; percentage: number; trend: 'up' | 'down' | 'stable'; }
interface ChannelStat { channel: string; positive: number; negative: number; neutral: number; total: number; }
interface TeamSentiment { teamName: string; sentiment: number; trend: 'up' | 'down' | 'stable'; recentEmotions: EmotionType[]; escalationCount: number; }

export function FoundersEmotionAnalyticsPanel() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [activeView, setActiveView] = useState<'overview' | 'channels' | 'teams'>('overview');

  const emotionStats: EmotionStat[] = [
    { emotion: 'positive', count: 145, percentage: 38, trend: 'up' },
    { emotion: 'neutral', count: 98, percentage: 26, trend: 'stable' },
    { emotion: 'frustrated', count: 45, percentage: 12, trend: 'down' },
    { emotion: 'angry', count: 23, percentage: 6, trend: 'down' },
    { emotion: 'urgent', count: 42, percentage: 11, trend: 'up' },
    { emotion: 'confused', count: 28, percentage: 7, trend: 'stable' },
  ];
  const channelStats: ChannelStat[] = [
    { channel: 'WhatsApp', positive: 65, negative: 15, neutral: 40, total: 120 },
    { channel: 'Email', positive: 48, negative: 22, neutral: 35, total: 105 },
    { channel: 'Chat', positive: 32, negative: 8, neutral: 23, total: 63 },
    { channel: 'Phone', positive: 28, negative: 12, neutral: 18, total: 58 },
  ];
  const teamSentiment: TeamSentiment[] = [
    { teamName: 'Sales', sentiment: 0.72, trend: 'up', recentEmotions: ['positive', 'excited', 'neutral'], escalationCount: 3 },
    { teamName: 'Marketing', sentiment: 0.85, trend: 'up', recentEmotions: ['excited', 'happy', 'positive'], escalationCount: 1 },
    { teamName: 'HR', sentiment: 0.55, trend: 'stable', recentEmotions: ['neutral', 'positive', 'confused'], escalationCount: 5 },
    { teamName: 'Finance', sentiment: 0.42, trend: 'down', recentEmotions: ['neutral', 'frustrated', 'urgent'], escalationCount: 8 },
    { teamName: 'Admin', sentiment: 0.68, trend: 'stable', recentEmotions: ['neutral', 'positive'], escalationCount: 2 },
  ];
  const topTriggers = [
    { trigger: 'Response delay > 24h', count: 18 },
    { trigger: 'Price negotiation conflict', count: 12 },
    { trigger: 'Document processing delay', count: 9 },
    { trigger: 'Scheduling conflicts', count: 7 },
    { trigger: 'Payment issues', count: 5 },
  ];

  const overallSentiment = useMemo(() => {
    const total = emotionStats.reduce((sum, e) => sum + e.count, 0);
    const positive = emotionStats.filter(e => ['positive', 'excited', 'happy', 'satisfied'].includes(e.emotion)).reduce((s, e) => s + e.count, 0);
    const negative = emotionStats.filter(e => ['angry', 'frustrated', 'sad', 'disappointed'].includes(e.emotion)).reduce((s, e) => s + e.count, 0);
    return { positive: Math.round((positive / total) * 100), negative: Math.round((negative / total) * 100), neutral: 100 - Math.round((positive / total) * 100) - Math.round((negative / total) * 100), total };
  }, [emotionStats]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment >= 0.6) return <Smile className="h-5 w-5 text-green-600" />;
    if (sentiment >= 0.4) return <Meh className="h-5 w-5 text-amber-600" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const getEmotionLabel = (emotion: string) => emotion.charAt(0).toUpperCase() + emotion.slice(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Emotion Analytics
          </h2>
          <p className="text-gray-600 text-sm">AI-powered sentiment insights across all communications</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[140px] bg-white border-[#B89555]/30 text-black">
              <Calendar className="h-4 w-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.success('Generating report...')} className="border-[#B89555]/30 text-[#B89555] hover:bg-[#B89555]/10">
            <Download className="h-4 w-4 mr-2" />Export PDF
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600">Positive</p><p className="text-2xl font-bold text-green-600">{overallSentiment.positive}%</p></div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center"><Smile className="h-6 w-6 text-green-600" /></div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600"><TrendingUp className="h-3 w-3" /><span>+5% from last week</span></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600">Negative</p><p className="text-2xl font-bold text-red-500">{overallSentiment.negative}%</p></div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center"><Frown className="h-6 w-6 text-red-500" /></div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600"><TrendingDown className="h-3 w-3" /><span>-3% from last week</span></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600">Escalations</p><p className="text-2xl font-bold text-amber-600">19</p></div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center"><Zap className="h-6 w-6 text-amber-600" /></div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600"><Minus className="h-3 w-3" /><span>Same as last week</span></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600">Total Messages</p><p className="text-2xl font-bold text-blue-600">{overallSentiment.total}</p></div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center"><MessageSquare className="h-6 w-6 text-blue-600" /></div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600"><TrendingUp className="h-3 w-3" /><span>+12% from last week</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList className="bg-white border-2 border-[#B89555]/20 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B89555] data-[state=active]:to-[#A68444] data-[state=active]:text-white"><BarChart3 className="h-4 w-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B89555] data-[state=active]:to-[#A68444] data-[state=active]:text-white"><MessageSquare className="h-4 w-4 mr-2" />Channels</TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B89555] data-[state=active]:to-[#A68444] data-[state=active]:text-white"><Users className="h-4 w-4 mr-2" />Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-2 border-[#B89555]/20">
              <CardHeader><CardTitle className="text-black flex items-center gap-2"><PieChart className="h-5 w-5 text-[#B89555]" />Emotion Distribution</CardTitle><CardDescription className="text-gray-600">Breakdown of detected emotions this {dateRange}</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emotionStats.map(({ emotion, count, percentage, trend }) => (
                    <div key={emotion} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2"><span className="capitalize text-black font-medium">{getEmotionLabel(emotion)}</span></div>
                        <div className="flex items-center gap-2"><span className="text-gray-600">{count} ({percentage}%)</span>{getTrendIcon(trend)}</div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-[#B89555]/20">
              <CardHeader><CardTitle className="text-black flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Top Escalation Triggers</CardTitle><CardDescription className="text-gray-600">Most frequent reasons for escalation</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topTriggers.map(({ trigger, count }, index) => (
                    <motion.div key={trigger} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-[#B89555]/10">
                      <div className="flex items-center gap-3"><span className="text-lg font-bold text-[#B89555]">#{index + 1}</span><span className="text-black text-sm">{trigger}</span></div>
                      <Badge variant="outline" className="border-[#B89555]/30 text-[#B89555]">{count}x</Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <Card className="bg-white border-2 border-[#B89555]/20">
            <CardHeader><CardTitle className="text-black">Channel Performance</CardTitle><CardDescription className="text-gray-600">Sentiment analysis across communication channels</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channelStats.map((ch) => (
                  <div key={ch.channel} className="p-4 rounded-lg bg-gray-50 border border-[#B89555]/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {ch.channel === 'WhatsApp' && <MessageSquare className="h-5 w-5 text-green-600" />}
                        {ch.channel === 'Email' && <Mail className="h-5 w-5 text-blue-600" />}
                        {ch.channel === 'Chat' && <MessageSquare className="h-5 w-5 text-purple-600" />}
                        {ch.channel === 'Phone' && <Phone className="h-5 w-5 text-amber-600" />}
                        <span className="font-semibold text-black">{ch.channel}</span>
                      </div>
                      <Badge variant="outline" className="text-gray-600 border-gray-300">{ch.total} total</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-600 w-16">Positive</span><Progress value={(ch.positive / ch.total) * 100} className="h-2 flex-1" /><span className="text-xs text-green-600 w-8">{Math.round((ch.positive / ch.total) * 100)}%</span></div>
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-600 w-16">Neutral</span><Progress value={(ch.neutral / ch.total) * 100} className="h-2 flex-1" /><span className="text-xs text-gray-600 w-8">{Math.round((ch.neutral / ch.total) * 100)}%</span></div>
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-600 w-16">Negative</span><Progress value={(ch.negative / ch.total) * 100} className="h-2 flex-1" /><span className="text-xs text-red-500 w-8">{Math.round((ch.negative / ch.total) * 100)}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <Card className="bg-white border-2 border-[#B89555]/20">
            <CardHeader><CardTitle className="text-black">Team Sentiment</CardTitle><CardDescription className="text-gray-600">Sentiment analysis by department</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamSentiment.map((team) => (
                  <div key={team.teamName} className="p-4 rounded-lg bg-gray-50 border border-[#B89555]/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getSentimentIcon(team.sentiment)}
                        <div><h4 className="font-semibold text-black">{team.teamName}</h4><p className="text-xs text-gray-600">Sentiment: {(team.sentiment * 100).toFixed(0)}%</p></div>
                      </div>
                      <div className="flex items-center gap-2">{getTrendIcon(team.trend)}{team.escalationCount > 0 && <Badge className="bg-red-50 text-red-600 border border-red-200">{team.escalationCount} escalations</Badge>}</div>
                    </div>
                    <Progress value={team.sentiment * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FoundersEmotionAnalyticsPanel;
