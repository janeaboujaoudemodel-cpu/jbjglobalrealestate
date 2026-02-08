/**
 * Founders Emotion Analytics Panel
 * Comprehensive emotion analytics dashboard for the Founder
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Heart,
  Smile,
  Frown,
  Meh,
  Zap,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Users,
  MessageSquare,
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type EmotionType,
  type UrgencyLevel,
  getEmotionIcon,
} from '@/config/emotion-detection-engine';
import { type EscalationEvent } from '@/services/smart-escalation-service';
import { toast } from 'sonner';

interface EmotionStat {
  emotion: EmotionType;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface ChannelStat {
  channel: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

interface TeamSentiment {
  teamName: string;
  sentiment: number;
  trend: 'up' | 'down' | 'stable';
  recentEmotions: EmotionType[];
  escalationCount: number;
}

export function FoundersEmotionAnalyticsPanel() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [activeView, setActiveView] = useState<'overview' | 'channels' | 'teams'>('overview');

  // Mock data - in production, this comes from the database
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
    { 
      teamName: 'Sales', 
      sentiment: 0.72, 
      trend: 'up', 
      recentEmotions: ['positive', 'excited', 'neutral'],
      escalationCount: 3,
    },
    { 
      teamName: 'Marketing', 
      sentiment: 0.85, 
      trend: 'up', 
      recentEmotions: ['excited', 'happy', 'positive'],
      escalationCount: 1,
    },
    { 
      teamName: 'HR', 
      sentiment: 0.55, 
      trend: 'stable', 
      recentEmotions: ['neutral', 'positive', 'confused'],
      escalationCount: 5,
    },
    { 
      teamName: 'Finance', 
      sentiment: 0.42, 
      trend: 'down', 
      recentEmotions: ['neutral', 'frustrated', 'urgent'],
      escalationCount: 8,
    },
    { 
      teamName: 'Admin', 
      sentiment: 0.68, 
      trend: 'stable', 
      recentEmotions: ['neutral', 'positive'],
      escalationCount: 2,
    },
  ];

  const topTriggers = [
    { trigger: 'Response delay > 24h', count: 18 },
    { trigger: 'Price negotiation conflict', count: 12 },
    { trigger: 'Document processing delay', count: 9 },
    { trigger: 'Scheduling conflicts', count: 7 },
    { trigger: 'Payment issues', count: 5 },
  ];

  // Calculated metrics
  const overallSentiment = useMemo(() => {
    const total = emotionStats.reduce((sum, e) => sum + e.count, 0);
    const positive = emotionStats
      .filter(e => ['positive', 'excited', 'happy', 'satisfied'].includes(e.emotion))
      .reduce((sum, e) => sum + e.count, 0);
    const negative = emotionStats
      .filter(e => ['angry', 'frustrated', 'sad', 'disappointed'].includes(e.emotion))
      .reduce((sum, e) => sum + e.count, 0);
    
    return {
      positive: Math.round((positive / total) * 100),
      negative: Math.round((negative / total) * 100),
      neutral: 100 - Math.round((positive / total) * 100) - Math.round((negative / total) * 100),
      total,
    };
  }, [emotionStats]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment >= 0.6) return <Smile className="h-5 w-5 text-green-500" />;
    if (sentiment >= 0.4) return <Meh className="h-5 w-5 text-amber-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const handleExportReport = () => {
    toast.success('Generating report...', {
      description: 'Your emotion analytics report will be downloaded shortly.',
    });
    // In production, this would trigger actual PDF generation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Emotion Analytics
          </h2>
          <p className="text-gray-400 text-sm">AI-powered sentiment insights across all communications</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[140px] bg-[#1A1A1A] border-gold/20 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleExportReport}
            className="border-gold/20 text-gold hover:bg-gold/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0E0E0E] border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Positive</p>
                <p className="text-2xl font-bold text-green-400">{overallSentiment.positive}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Smile className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span>+5% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0E0E0E] border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Negative</p>
                <p className="text-2xl font-bold text-red-400">{overallSentiment.negative}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Frown className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <TrendingDown className="h-3 w-3" />
              <span>-3% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0E0E0E] border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Escalations</p>
                <p className="text-2xl font-bold text-amber-400">19</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
              <Minus className="h-3 w-3" />
              <span>Same as last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0E0E0E] border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold text-blue-400">{overallSentiment.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
              <TrendingUp className="h-3 w-3" />
              <span>+12% from last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList className="bg-[#1A1A1A] border border-gold/20 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
            <MessageSquare className="h-4 w-4 mr-2" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
            <Users className="h-4 w-4 mr-2" />
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotion Distribution */}
            <Card className="bg-[#0E0E0E] border-gold/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-gold" />
                  Emotion Distribution
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Breakdown of detected emotions this {dateRange}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emotionStats.map(({ emotion, count, percentage, trend }) => (
                    <div key={emotion} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getEmotionIcon(emotion)}</span>
                          <span className="capitalize text-white">{emotion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{count} ({percentage}%)</span>
                          {getTrendIcon(trend)}
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Escalation Triggers */}
            <Card className="bg-[#0E0E0E] border-gold/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Top Escalation Triggers
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Most frequent reasons for escalation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topTriggers.map(({ trigger, count }, index) => (
                    <motion.div
                      key={trigger}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gold">#{index + 1}</span>
                        <span className="text-white text-sm">{trigger}</span>
                      </div>
                      <Badge variant="outline" className="border-gold/30 text-gold">
                        {count}x
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <Card className="bg-[#0E0E0E] border-gold/20">
            <CardHeader>
              <CardTitle className="text-white">Channel Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Sentiment analysis across communication channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channelStats.map((channel) => (
                  <div
                    key={channel.channel}
                    className="p-4 rounded-lg bg-[#1A1A1A] border border-gold/10"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {channel.channel === 'WhatsApp' && <MessageSquare className="h-5 w-5 text-green-500" />}
                        {channel.channel === 'Email' && <Mail className="h-5 w-5 text-blue-500" />}
                        {channel.channel === 'Chat' && <MessageSquare className="h-5 w-5 text-purple-500" />}
                        {channel.channel === 'Phone' && <Phone className="h-5 w-5 text-amber-500" />}
                        <span className="font-semibold text-white">{channel.channel}</span>
                      </div>
                      <Badge variant="outline" className="text-gray-400 border-gray-600">
                        {channel.total} total
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-16">Positive</span>
                        <Progress value={(channel.positive / channel.total) * 100} className="h-2 flex-1" />
                        <span className="text-xs text-green-400 w-8">{Math.round((channel.positive / channel.total) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-16">Neutral</span>
                        <Progress value={(channel.neutral / channel.total) * 100} className="h-2 flex-1" />
                        <span className="text-xs text-gray-400 w-8">{Math.round((channel.neutral / channel.total) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-16">Negative</span>
                        <Progress value={(channel.negative / channel.total) * 100} className="h-2 flex-1" />
                        <span className="text-xs text-red-400 w-8">{Math.round((channel.negative / channel.total) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <Card className="bg-[#0E0E0E] border-gold/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Team Sentiment Overview
              </CardTitle>
              <CardDescription className="text-gray-400">
                Overall mood trends across departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamSentiment.map((team) => (
                  <motion.div
                    key={team.teamName}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-lg bg-[#1A1A1A] border border-gold/10 hover:border-gold/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{team.teamName}</h4>
                      {getTrendIcon(team.trend)}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      {getSentimentIcon(team.sentiment)}
                      <span className="text-2xl font-bold text-white">
                        {Math.round(team.sentiment * 100)}%
                      </span>
                      <span className="text-xs text-gray-400">positive</span>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      {team.recentEmotions.map((emotion, i) => (
                        <span key={i} className="text-lg">
                          {getEmotionIcon(emotion)}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {team.trend === 'up' ? 'Trending positively' : 
                         team.trend === 'down' ? 'Needs attention' : 'Stable mood'}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={team.escalationCount > 5 ? 'border-red-500/50 text-red-400' : 'border-gold/30 text-gold'}
                      >
                        {team.escalationCount} escalations
                      </Badge>
                    </div>
                  </motion.div>
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
