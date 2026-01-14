/**
 * Emotion Analytics Dashboard Component
 * Displays daily emotion summaries and team sentiment overview
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Heart, Smile, Frown, Meh, Zap } from 'lucide-react';
import { type EmotionType, type UrgencyLevel, getEmotionIcon, getUrgencyLabel } from '@/config/emotion-detection-engine';
import { type EscalationEvent, type NotificationItem } from '@/services/smart-escalation-service';

interface EmotionSummary {
  emotion: EmotionType;
  count: number;
  percentage: number;
}

interface TriggerSummary {
  trigger: string;
  count: number;
}

interface TeamMood {
  teamName: string;
  sentiment: number; // -1 to +1
  trend: 'up' | 'down' | 'stable';
  recentEmotions: EmotionType[];
}

interface EmotionAnalyticsDashboardProps {
  escalationEvents?: EscalationEvent[];
  notifications?: NotificationItem[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function EmotionAnalyticsDashboard({
  escalationEvents = [],
  notifications = [],
}: EmotionAnalyticsDashboardProps) {
  // Calculate emotion distribution
  const emotionSummary = useMemo((): EmotionSummary[] => {
    const counts: Record<EmotionType, number> = {
      angry: 0,
      frustrated: 0,
      urgent: 0,
      positive: 0,
      excited: 0,
      sad: 0,
      disappointed: 0,
      confused: 0,
      neutral: 0,
      happy: 0,
      satisfied: 0,
    };

    escalationEvents.forEach(event => {
      counts[event.emotionAnalysis.emotion]++;
    });

    const total = escalationEvents.length || 1;
    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion: emotion as EmotionType,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [escalationEvents]);

  // Calculate positive vs negative ratio
  const sentimentBreakdown = useMemo(() => {
    const positive = escalationEvents.filter(e => 
      ['positive', 'excited', 'happy', 'satisfied'].includes(e.emotionAnalysis.emotion)
    ).length;
    
    const negative = escalationEvents.filter(e =>
      ['angry', 'frustrated', 'sad', 'disappointed'].includes(e.emotionAnalysis.emotion)
    ).length;
    
    const neutral = escalationEvents.filter(e =>
      ['neutral', 'confused', 'urgent'].includes(e.emotionAnalysis.emotion)
    ).length;

    const total = positive + negative + neutral || 1;
    
    return {
      positive: Math.round((positive / total) * 100),
      negative: Math.round((negative / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      trend: positive > negative ? 'up' : positive < negative ? 'down' : 'stable',
    };
  }, [escalationEvents]);

  // Most frequent escalation triggers
  const topTriggers = useMemo((): TriggerSummary[] => {
    const triggerCounts: Record<string, number> = {};
    
    escalationEvents.forEach(event => {
      const reason = event.emotionAnalysis.escalationReason || 'General escalation';
      triggerCounts[reason] = (triggerCounts[reason] || 0) + 1;
    });

    return Object.entries(triggerCounts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [escalationEvents]);

  // Mock team sentiment data (in production, this would come from real data)
  const teamSentiment: TeamMood[] = useMemo(() => {
    return [
      { teamName: 'Sales', sentiment: 0.65, trend: 'up', recentEmotions: ['positive', 'excited', 'neutral'] },
      { teamName: 'HR', sentiment: 0.45, trend: 'stable', recentEmotions: ['neutral', 'positive'] },
      { teamName: 'Marketing', sentiment: 0.72, trend: 'up', recentEmotions: ['excited', 'happy', 'positive'] },
      { teamName: 'Finance', sentiment: 0.35, trend: 'down', recentEmotions: ['neutral', 'frustrated'] },
    ];
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment >= 0.5) return <Smile className="h-5 w-5 text-green-500" />;
    if (sentiment >= 0) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Positive Communications */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Positive</p>
                <p className="text-2xl font-bold text-green-600">{sentimentBreakdown.positive}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Smile className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Negative Communications */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Negative</p>
                <p className="text-2xl font-bold text-red-600">{sentimentBreakdown.negative}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <Frown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Escalations */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escalations</p>
                <p className="text-2xl font-bold">{escalationEvents.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Alerts */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {escalationEvents.filter(e => e.status === 'pending').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Emotion Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of detected emotions today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emotionSummary.length > 0 ? (
                emotionSummary.slice(0, 6).map(({ emotion, count, percentage }) => (
                  <div key={emotion} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getEmotionIcon(emotion)}</span>
                        <span className="capitalize">{emotion}</span>
                      </div>
                      <span className="text-muted-foreground">{count} ({percentage}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No emotion data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Escalation Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Top Escalation Triggers
            </CardTitle>
            <CardDescription>
              Most frequent reasons for escalation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTriggers.length > 0 ? (
                topTriggers.map(({ trigger, count }, index) => (
                  <div
                    key={trigger}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm">{trigger}</span>
                    </div>
                    <Badge variant="outline">{count}x</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No escalations recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Sentiment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Team Sentiment Overview
          </CardTitle>
          <CardDescription>
            Overall mood trends across departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamSentiment.map(team => (
              <div
                key={team.teamName}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{team.teamName}</h4>
                  {getTrendIcon(team.trend)}
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  {getSentimentIcon(team.sentiment)}
                  <span className="text-lg font-bold">
                    {Math.round(team.sentiment * 100)}%
                  </span>
                  <span className="text-xs text-muted-foreground">positive</span>
                </div>

                <div className="flex gap-1">
                  {team.recentEmotions.map((emotion, i) => (
                    <span key={i} className="text-sm">
                      {getEmotionIcon(emotion)}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {team.trend === 'up' ? 'Trending positively' : 
                   team.trend === 'down' ? 'Needs attention' : 'Stable mood'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmotionAnalyticsDashboard;
