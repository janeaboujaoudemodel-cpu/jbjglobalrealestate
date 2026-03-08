// AI Insights & Optimization Dashboard
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Users,
  BarChart3,
  RefreshCw,
  Activity,
  Target,
  Clock,
  Award,
  Lightbulb,
  Play,
  FileText,
  Bot,
} from 'lucide-react';
import { useTaskIntelligence } from '@/hooks/useTaskIntelligence';
import { cn } from '@/lib/utils';

const FoundersInsightsPanel: React.FC = () => {
  const {
    isLoading,
    departmentAnalytics,
    employeeAnalytics,
    insights,
    healthCheck,
    weeklySummary,
    topPerformers,
    loadAnalytics,
    applyOptimization,
    runHealthCheck,
    generateReport,
    refreshInsights,
  } = useTaskIntelligence();

  const [activeTab, setActiveTab] = useState('overview');
  const [reportContent, setReportContent] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleGenerateReport = async () => {
    const report = await generateReport();
    setReportContent(report);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'bottleneck': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'improvement': return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-primary';
      case 'degraded': return 'text-amber-500';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading && !departmentAnalytics.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Insights & Optimization</h2>
            <p className="text-sm text-muted-foreground">Task intelligence & performance analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshInsights} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" size="sm" onClick={runHealthCheck}>
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
        </div>
      </div>

      {/* Weekly Summary Cards */}
      {weeklySummary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Tasks</span>
              </div>
              <p className="text-2xl font-bold">{weeklySummary.totalTasks}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Avg Time</span>
              </div>
              <p className="text-2xl font-bold">{weeklySummary.avgCompletionTime}m</p>
            </CardContent>
          </Card>
          
          <Card className={weeklySummary.efficiencyChange >= 0 ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30' : 'bg-destructive/5 border-destructive/20'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {weeklySummary.efficiencyChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-[#C9A84C]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs text-zinc-600 font-medium">Efficiency</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                weeklySummary.efficiencyChange >= 0 ? "text-[#C9A84C]" : "text-destructive"
              )}>
                {weeklySummary.efficiencyChange > 0 ? '+' : ''}{weeklySummary.efficiencyChange}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Top Dept</span>
              </div>
              <p className="text-lg font-bold truncate">{weeklySummary.topDepartment}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Bottlenecks</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{weeklySummary.bottlenecksFound}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#C9A84C]/10 border-[#C9A84C]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-[#C9A84C]" />
                <span className="text-xs text-zinc-600 font-medium">Optimized</span>
              </div>
              <p className="text-2xl font-bold text-[#C9A84C]">{weeklySummary.optimizationsApplied}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-white/80 border-2 border-[#C9A84C]/30 p-1 rounded-xl shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="performers" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Top Performers</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2 text-zinc-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Health</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Performance Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Department Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {departmentAnalytics.map(dept => (
                  <div key={dept.departmentId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept.departmentName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{dept.qualityScore}%</span>
                        {dept.weekOverWeekChange >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-primary" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </div>
                    <Progress value={dept.qualityScore} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Optimization Insights Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Recent Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {insights.slice(0, 5).map(insight => (
                      <div 
                        key={insight.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getInsightIcon(insight.type)}
                            <span className="text-sm font-medium">{insight.title}</span>
                          </div>
                          <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Report Modal Content */}
          {reportContent && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Optimization Report
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setReportContent(null)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {reportContent}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentAnalytics.map(dept => (
              <Card key={dept.departmentId} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{dept.departmentName}</CardTitle>
                    <Badge variant="outline" className={
                      dept.weekOverWeekChange >= 0 
                        ? 'bg-primary/10 text-primary border-primary/20' 
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }>
                      {dept.weekOverWeekChange > 0 ? '+' : ''}{dept.weekOverWeekChange}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tasks</p>
                      <p className="font-semibold">{dept.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Time</p>
                      <p className="font-semibold">{dept.averageCompletionTime}m</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quality</p>
                      <p className="font-semibold">{dept.qualityScore}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Delay Rate</p>
                      <p className={cn(
                        "font-semibold",
                        dept.delayRate > 15 ? "text-destructive" : "text-primary"
                      )}>{dept.delayRate}%</p>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Peak Hours</p>
                    <p className="font-medium">
                      {dept.peakProductivityHours.start}:00 - {dept.peakProductivityHours.end}:00
                    </p>
                  </div>
                  
                  {dept.bottlenecks.length > 0 && (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Bottlenecks</p>
                      <div className="flex flex-wrap gap-1">
                        {dept.bottlenecks.map((b, i) => (
                          <Badge key={i} variant="outline" className="bg-destructive/10 text-destructive text-xs">
                            {b}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="performers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Top Performers This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map((emp, index) => (
                    <div 
                      key={emp.employeeId}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                        index === 0 ? "bg-amber-500/20 text-amber-600" :
                        index === 1 ? "bg-slate-300/20 text-slate-500" :
                        index === 2 ? "bg-amber-700/20 text-amber-700" :
                        "bg-muted text-muted-foreground"
                      )}>
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{emp.employeeName}</span>
                          {emp.isAI && (
                            <Bot className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{emp.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{emp.averageScore}%</p>
                        <p className="text-xs text-muted-foreground">{emp.tasksCompleted} tasks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  AI Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeAnalytics.filter(e => e.isAI).map(ai => (
                    <div key={ai.employeeId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{ai.employeeName}</span>
                          <Badge variant="outline" className="text-xs">{ai.department}</Badge>
                        </div>
                        <span className="text-sm font-semibold">{ai.averageScore}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={ai.currentWorkload} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-12">{ai.currentWorkload}% load</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Optimization Insights & Recommendations
                </CardTitle>
                <Button variant="outline" size="sm" onClick={refreshInsights}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {insights.map(insight => (
                    <Card key={insight.id} className="border-l-4" style={{
                      borderLeftColor: insight.priority === 'high' ? 'hsl(var(--destructive))' :
                        insight.priority === 'medium' ? 'hsl(45 93% 47%)' : 'hsl(var(--primary))'
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            {getInsightIcon(insight.type)}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{insight.title}</h4>
                                <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                                  {insight.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.description}</p>
                              <p className="text-sm"><strong>Impact:</strong> {insight.impact}</p>
                              <p className="text-sm text-primary"><strong>Suggested:</strong> {insight.suggestedAction}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {insight.affectedDepartments.map(dept => (
                                  <Badge key={dept} variant="secondary" className="text-xs">
                                    {dept}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          {insight.autoApplicable && (
                            <Button 
                              size="sm" 
                              onClick={() => applyOptimization(insight.id)}
                              className="shrink-0"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Apply
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Check Tab */}
        <TabsContent value="health" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  System Health Check
                </CardTitle>
                <Button variant="outline" size="sm" onClick={runHealthCheck}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Check
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthCheck.map((check, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={cn("h-5 w-5", getHealthStatusColor(check.status))} />
                      <div>
                        <p className="text-sm font-medium">{check.component}</p>
                        {check.latency && (
                          <p className="text-xs text-muted-foreground">{check.latency}ms latency</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      check.status === 'operational' ? 'bg-primary/10 text-primary border-primary/20' :
                      check.status === 'degraded' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-destructive/10 text-destructive border-destructive/20'
                    )}>
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-medium">AI Health Summary</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  🧠 AI Health Check Complete — {healthCheck.filter(h => h.status === 'operational').length}/{healthCheck.length} Systems Operational. 
                  Optimization applied successfully.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FoundersInsightsPanel;
