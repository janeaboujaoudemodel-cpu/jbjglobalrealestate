// AI Insight & Decision-Making Layer - Founder's Dashboard Component

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useDecisionIntelligence } from '@/hooks/useDecisionIntelligence';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Send, 
  RefreshCw,
  Lightbulb,
  Target,
  BarChart3,
  FileText,
  Zap,
  Shield,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Timer,
  Play,
  History,
  Sparkles,
  LineChart,
  PieChart,
  Activity
} from 'lucide-react';

export function FoundersDecisionPanel() {
  const {
    insights,
    predictions,
    recommendations,
    scenarios,
    decisionLog,
    riskAlerts,
    kpis,
    lastSync,
    isProcessing,
    queryResult,
    isQuerying,
    refreshData,
    processQuery,
    approveRecommendation,
    rejectRecommendation,
    snoozeRecommendation,
    acknowledgeRisk,
    resolveRisk,
    dismissRisk,
    generateDailySummary,
    getCriticalItemsCount
  } = useDecisionIntelligence();

  const [queryInput, setQueryInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showSummary, setShowSummary] = useState(false);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    await processQuery(queryInput);
  };

  const criticalCount = getCriticalItemsCount();

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-green-500';
      case 'exceeded': return 'text-emerald-500';
      case 'at_risk': return 'text-amber-500';
      case 'behind': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center">
            <Brain className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">Business Intelligence</h2>
            <p className="text-zinc-500 text-sm">
              Real-time insights, predictions & strategic recommendations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {criticalCount} Critical
            </Badge>
          )}
          <Button 
            className="bg-white text-black border-2 border-gold/30 hover:bg-black hover:text-gold hover:border-gold transition-all"
            size="sm" 
            onClick={() => setShowSummary(!showSummary)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Daily Summary
          </Button>
          <Button 
            className="bg-white text-black border-2 border-gold/30 hover:bg-black hover:text-gold hover:border-gold transition-all"
            size="sm" 
            onClick={refreshData}
            disabled={isProcessing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Daily Summary Modal */}
      {showSummary && (
        <Card className="bg-white border-2 border-gold/30 shadow-[0_0_20px_rgba(200,167,102,0.15)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-black">
                <Sparkles className="h-5 w-5 text-gold" />
                AI Daily Summary
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSummary(false)} className="text-zinc-500 hover:text-black">
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm font-mono bg-zinc-50 p-4 rounded-lg text-black border border-zinc-200">
              {generateDailySummary()}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Natural Language Query */}
      <Card className="bg-white border-2 border-gold/30 shadow-[0_0_15px_rgba(200,167,102,0.1)]">
        <CardContent className="pt-4">
          <form onSubmit={handleQuery} className="flex gap-2">
            <div className="relative flex-1">
              <Brain className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
              <Input
                placeholder="Ask Amanda anything... (e.g., 'Who's my top broker?' or 'How can I improve revenue?')"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="pl-10 bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400"
              />
            </div>
            <Button type="submit" disabled={isQuerying} className="bg-black text-gold hover:bg-zinc-900 border border-gold/30">
              {isQuerying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Query Result */}
          {queryResult && (
            <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-black">{queryResult.answer}</p>
                  {queryResult.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {queryResult.suggestions.map((suggestion, idx) => (
                        <Button 
                          key={idx} 
                          size="sm"
                          className="bg-white text-gold border border-gold/30 hover:bg-black hover:text-gold"
                          onClick={() => {
                            setQueryInput(suggestion);
                            processQuery(suggestion);
                          }}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full bg-white/80 border-2 border-[#C9A84C]/30 p-1 rounded-xl shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Predictions</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline whitespace-nowrap">Recommendations</span>
            {recommendations.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] p-0 px-1 justify-center text-xs">
                {recommendations.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Risks</span>
            {riskAlerts.filter(a => a.status === 'new').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] p-0 px-1 justify-center text-xs">
                {riskAlerts.filter(a => a.status === 'new').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Decisions</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.slice(0, 8).map((kpi) => (
              <Card key={kpi.id} className="relative overflow-hidden">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {kpi.category}
                      </p>
                      <p className="font-medium text-sm mt-1">{kpi.name}</p>
                    </div>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">
                      {typeof kpi.currentValue === 'number' && kpi.currentValue >= 1000 
                        ? kpi.currentValue.toLocaleString() 
                        : kpi.currentValue.toFixed(1)}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {kpi.unit}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {kpi.trend === 'up' ? '+' : kpi.trend === 'down' ? '-' : ''}{kpi.trendPercentage.toFixed(1)}%
                      </span>
                      <span className={`text-xs ${getStatusColor(kpi.status)}`}>
                        {kpi.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min((kpi.currentValue / kpi.target) * 100, 100)} 
                    className="h-1 mt-3"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Latest Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {insights.slice(0, 5).map((insight) => (
                      <div 
                        key={insight.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`h-2 w-2 rounded-full mt-2 ${
                          insight.impactLevel === 'critical' ? 'bg-red-500' :
                          insight.impactLevel === 'high' ? 'bg-orange-500' :
                          insight.impactLevel === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{insight.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {insight.description}
                          </p>
                        </div>
                        {getTrendIcon(insight.trend)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {riskAlerts.filter(a => a.status !== 'resolved' && a.status !== 'dismissed').slice(0, 5).map((alert) => (
                      <div 
                        key={alert.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`h-2 w-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.affectedArea} • {alert.severity}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {alert.status}
                        </Badge>
                      </div>
                    ))}
                    {riskAlerts.filter(a => a.status !== 'resolved' && a.status !== 'dismissed').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Shield className="h-8 w-8 mb-2" />
                        <p className="text-sm">No active alerts</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        insight.category === 'opportunity' ? 'bg-green-500/10' :
                        insight.category === 'risk' ? 'bg-red-500/10' :
                        insight.category === 'anomaly' ? 'bg-purple-500/10' : 'bg-blue-500/10'
                      }`}>
                        {insight.category === 'opportunity' ? <TrendingUp className="h-5 w-5 text-green-500" /> :
                         insight.category === 'risk' ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
                         insight.category === 'anomaly' ? <Activity className="h-5 w-5 text-purple-500" /> :
                         <BarChart3 className="h-5 w-5 text-blue-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge variant="outline" className={getImpactColor(insight.impactLevel)}>
                            {insight.impactLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {insight.dataSource}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(insight.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {insight.confidence}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getTrendIcon(insight.trend)}
                        {insight.trendPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Recommended:</span>{' '}
                      {insight.recommendedAction}
                    </p>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="mt-4">
          <div className="grid gap-4">
            {predictions.map((prediction) => (
              <Card key={prediction.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 flex items-center justify-center">
                        <LineChart className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{prediction.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Timeframe: {prediction.timeframe} • {prediction.methodology}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {prediction.confidence}% confidence
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="text-lg font-bold">{prediction.currentValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Predicted</p>
                      <p className="text-lg font-bold text-purple-500">
                        {prediction.predictedValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Change</p>
                      <p className={`text-lg font-bold ${prediction.changePercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {prediction.changePercentage >= 0 ? '+' : ''}{prediction.changePercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Key Drivers:</p>
                    <div className="flex flex-wrap gap-2">
                      {prediction.drivers.map((driver, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {driver}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-4">
          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className={rec.status !== 'pending' ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        rec.status === 'approved' ? 'bg-green-500/10' :
                        rec.status === 'rejected' ? 'bg-red-500/10' :
                        rec.status === 'executed' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                      }`}>
                        {rec.status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                         rec.status === 'rejected' ? <ThumbsDown className="h-5 w-5 text-red-500" /> :
                         rec.status === 'executed' ? <Play className="h-5 w-5 text-blue-500" /> :
                         <Lightbulb className="h-5 w-5 text-amber-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rec.title}</h3>
                          <Badge variant="outline" className={getImpactColor(rec.impact)}>
                            {rec.impact} impact
                          </Badge>
                          {rec.autoExecutable && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto-executable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{rec.reasoning}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{rec.confidence}% confidence</span>
                          <span>Urgency: {rec.urgency}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      rec.status === 'approved' ? 'default' :
                      rec.status === 'executed' ? 'secondary' :
                      rec.status === 'rejected' ? 'destructive' : 'outline'
                    }>
                      {rec.status}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Suggested Action:</span> {rec.suggestedAction}
                    </p>
                  </div>

                  {rec.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => snoozeRecommendation(rec.id)}
                      >
                        <Timer className="h-4 w-4 mr-2" />
                        Snooze
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => rejectRecommendation(rec.id)}
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => approveRecommendation(rec.id)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="mt-4">
          <div className="grid gap-4">
            {riskAlerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        alert.severity === 'critical' ? 'bg-red-500/10' :
                        alert.severity === 'high' ? 'bg-orange-500/10' :
                        alert.severity === 'medium' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                      }`}>
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'high' ? 'text-orange-500' :
                          alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Area: {alert.affectedArea}</span>
                          <span>Detected: {new Date(alert.detectedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{alert.status}</Badge>
                  </div>

                  {alert.metrics.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                      {alert.metrics.map((metric, idx) => (
                        <div key={idx}>
                          <p className="text-xs text-muted-foreground">{metric.name}</p>
                          <p className="font-semibold">{metric.value.toFixed(1)}</p>
                          <p className="text-xs text-red-500">{metric.deviation.toFixed(1)}% deviation</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Suggested Actions:</p>
                    <ul className="text-sm space-y-1">
                      {alert.suggestedActions.map((action, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(alert.status === 'new' || alert.status === 'acknowledged') && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => dismissRisk(alert.id)}
                      >
                        Dismiss
                      </Button>
                      {alert.status === 'new' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => acknowledgeRisk(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        onClick={() => resolveRisk(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions" className="mt-4">
          <div className="grid gap-4">
            {decisionLog.map((decision) => (
              <Card key={decision.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        decision.type === 'auto_executed' ? 'bg-blue-500/10' :
                        decision.type === 'human_approved' ? 'bg-green-500/10' : 'bg-purple-500/10'
                      }`}>
                        {decision.type === 'auto_executed' ? <Zap className="h-5 w-5 text-blue-500" /> :
                         decision.type === 'human_approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                         <Brain className="h-5 w-5 text-purple-500" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{decision.description}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Authorized by: {decision.authorizedBy}</span>
                          <span>{new Date(decision.timestamp).toLocaleString()}</span>
                          <span>{decision.confidence}% confidence</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {decision.dataSources.map((source, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        decision.status === 'completed' ? 'default' :
                        decision.status === 'active' ? 'secondary' : 'outline'
                      }>
                        {decision.status}
                      </Badge>
                      {decision.resultTracking.success !== undefined && (
                        <Badge variant={decision.resultTracking.success ? 'default' : 'destructive'}>
                          {decision.resultTracking.success ? 'Successful' : 'Failed'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Expected Outcome</p>
                        <p className="text-sm">{decision.resultTracking.expectedOutcome}</p>
                      </div>
                      {decision.resultTracking.actualOutcome && (
                        <div>
                          <p className="text-xs text-muted-foreground">Actual Outcome</p>
                          <p className="text-sm text-green-600">{decision.resultTracking.actualOutcome}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Sync Info */}
      <div className="text-center text-xs text-muted-foreground">
        Last synchronized: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
        {isProcessing && <span className="ml-2 animate-pulse">• Updating...</span>}
      </div>
    </div>
  );
}
