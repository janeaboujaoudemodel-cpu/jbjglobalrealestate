// AI Insight & Decision-Making Layer - Service (Real-time data from database)

import { supabase } from '@/integrations/supabase/client';
import {
  BusinessInsight,
  PredictiveAnalysis,
  AIRecommendation,
  ScenarioSimulation,
  DecisionLogEntry,
  RiskAlert,
  KPIMetric,
  generateInsight,
  generatePrediction,
  detectRisks,
  generateRecommendation,
  simulateScenario
} from '@/config/decision-intelligence-engine';

export interface DecisionIntelligenceState {
  insights: BusinessInsight[];
  predictions: PredictiveAnalysis[];
  recommendations: AIRecommendation[];
  scenarios: ScenarioSimulation[];
  decisionLog: DecisionLogEntry[];
  riskAlerts: RiskAlert[];
  kpis: KPIMetric[];
  lastSync: Date | null;
  isProcessing: boolean;
}

class DecisionIntelligenceService {
  private state: DecisionIntelligenceState = {
    insights: [],
    predictions: [],
    recommendations: [],
    scenarios: [],
    decisionLog: [],
    riskAlerts: [],
    kpis: [],
    lastSync: null,
    isProcessing: false
  };

  private listeners: Set<(state: DecisionIntelligenceState) => void> = new Set();

  constructor() {
    this.loadRealData();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: DecisionIntelligenceState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): DecisionIntelligenceState {
    return this.state;
  }

  private async loadRealData() {
    this.state.isProcessing = true;
    this.notifyListeners();

    try {
      // Fetch real lead data
      const leadsQuery: any = supabase.from('crm_leads').select('*', { count: 'exact', head: true });
      const { count: totalLeads } = await leadsQuery;

      const convertedQuery: any = supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'converted');
      const { count: convertedLeads } = await convertedQuery;

      // Fetch real project data
      const projectsQuery: any = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_published', true);
      const { count: totalProjects } = await projectsQuery;

      // Fetch broker data
      const brokersQuery: any = supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: activeBrokers } = await brokersQuery;

      // Fetch recent tasks
      const tasksQuery: any = supabase.from('admin_tasks').select('*').order('created_at', { ascending: false }).limit(50);
      const { data: recentTasks } = await tasksQuery;

      const completedTasks = recentTasks?.filter(t => t.status === 'completed').length || 0;
      const pendingTasks = recentTasks?.filter(t => t.status === 'pending').length || 0;
      const totalTasks = recentTasks?.length || 0;

      // Build KPIs from real data
      const conversionRate = totalLeads ? ((convertedLeads || 0) / totalLeads) * 100 : 0;
      
      this.state.kpis = [
        {
          id: 'kpi_leads_total',
          name: 'Total Leads',
          category: 'sales',
          currentValue: totalLeads || 0,
          previousValue: 0,
          target: Math.max((totalLeads || 0) * 1.2, 100),
          unit: '',
          trend: (totalLeads || 0) > 0 ? 'up' : 'stable',
          trendPercentage: 0,
          status: (totalLeads || 0) > 0 ? 'on_track' : 'behind',
          lastUpdated: new Date()
        },
        {
          id: 'kpi_conversion',
          name: 'Lead Conversion Rate',
          category: 'sales',
          currentValue: Number(conversionRate.toFixed(1)),
          previousValue: 0,
          target: 20,
          unit: '%',
          trend: conversionRate > 15 ? 'up' : conversionRate > 5 ? 'stable' : 'down',
          trendPercentage: 0,
          status: conversionRate >= 20 ? 'exceeded' : conversionRate >= 10 ? 'on_track' : 'at_risk',
          lastUpdated: new Date()
        },
        {
          id: 'kpi_published_projects',
          name: 'Published Projects',
          category: 'admin',
          currentValue: totalProjects || 0,
          previousValue: 0,
          target: Math.max((totalProjects || 0) * 1.1, 50),
          unit: '',
          trend: (totalProjects || 0) > 0 ? 'up' : 'stable',
          trendPercentage: 0,
          status: (totalProjects || 0) > 20 ? 'on_track' : 'at_risk',
          lastUpdated: new Date()
        },
        {
          id: 'kpi_active_brokers',
          name: 'Active Team Members',
          category: 'hr',
          currentValue: activeBrokers || 0,
          previousValue: 0,
          target: Math.max((activeBrokers || 0) * 1.2, 10),
          unit: '',
          trend: 'stable',
          trendPercentage: 0,
          status: (activeBrokers || 0) > 0 ? 'on_track' : 'behind',
          lastUpdated: new Date()
        },
        {
          id: 'kpi_task_completion',
          name: 'Task Completion Rate',
          category: 'admin',
          currentValue: totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0,
          previousValue: 0,
          target: 80,
          unit: '%',
          trend: completedTasks > pendingTasks ? 'up' : 'down',
          trendPercentage: 0,
          status: totalTasks > 0 && (completedTasks / totalTasks) >= 0.7 ? 'on_track' : 'at_risk',
          lastUpdated: new Date()
        },
        {
          id: 'kpi_pending_tasks',
          name: 'Pending Tasks',
          category: 'admin',
          currentValue: pendingTasks,
          previousValue: 0,
          target: 5,
          unit: '',
          trend: pendingTasks > 10 ? 'up' : 'stable',
          trendPercentage: 0,
          status: pendingTasks <= 5 ? 'on_track' : pendingTasks <= 15 ? 'at_risk' : 'behind',
          lastUpdated: new Date()
        },
      ];

      // Generate insights from real data
      this.state.insights = [];
      if (conversionRate < 10 && (totalLeads || 0) > 0) {
        this.state.insights.push(
          generateInsight('crm', 'Lead Conversion Rate', conversionRate, 0, 20)
        );
      }
      if (pendingTasks > 10) {
        this.state.insights.push(
          generateInsight('admin', 'Pending Tasks', pendingTasks, 0, 5)
        );
      }
      if ((totalProjects || 0) < 20) {
        this.state.insights.push(
          generateInsight('admin', 'Published Projects', totalProjects || 0, 0, 50)
        );
      }

      // Generate predictions from real data
      this.state.predictions = [];
      if ((totalLeads || 0) > 0) {
        this.state.predictions.push(
          generatePrediction('leads', [totalLeads || 0], '1 month')
        );
      }

      // Generate recommendations
      this.state.recommendations = this.state.insights.map(insight => generateRecommendation(insight));

      // Detect risks from KPIs
      this.state.riskAlerts = detectRisks(this.state.kpis);

      // Load real decision log from ai_job_master
      const { data: jobHistory } = await supabase
        .from('ai_job_master')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      this.state.decisionLog = (jobHistory || []).map(job => ({
        id: job.id,
        description: `AI Tool: ${job.tool_name} - ${job.status}`,
        type: 'auto_executed' as const,
        dataSources: [job.tool_name],
        confidence: 90,
        authorizedBy: 'System',
        timestamp: new Date(job.created_at || ''),
        status: job.status === 'completed' ? 'completed' as const : 'active' as const,
        resultTracking: {
          expectedOutcome: `Processing via ${job.tool_name}`,
          actualOutcome: job.status === 'completed' ? 'Completed successfully' : undefined,
          success: job.status === 'completed' ? true : undefined,
        }
      }));

      this.state.lastSync = new Date();
    } catch (error) {
      console.error('Failed to load real data:', error);
    } finally {
      this.state.isProcessing = false;
      this.notifyListeners();
    }
  }

  // Refresh all data
  async refreshData(): Promise<void> {
    await this.loadRealData();
  }

  // Process natural language query
  async processQuery(query: string): Promise<{
    answer: string;
    insights: BusinessInsight[];
    visualData?: { labels: string[]; values: number[] };
    suggestions?: string[];
  }> {
    const queryLower = query.toLowerCase();
    
    // Query real data
    if (queryLower.includes('lead') || queryLower.includes('broker')) {
      const { count: totalLeads } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact', head: true });

      const { count: convertedLeads } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted');

      return {
        answer: `You currently have ${totalLeads || 0} total leads, with ${convertedLeads || 0} converted. ${totalLeads === 0 ? 'No leads data available yet.' : `Conversion rate: ${((convertedLeads || 0) / (totalLeads || 1) * 100).toFixed(1)}%`}`,
        insights: this.state.insights.filter(i => i.dataSource === 'crm'),
        suggestions: ['View all leads', 'Check pending follow-ups', 'Review conversion funnel']
      };
    }

    if (queryLower.includes('task') || queryLower.includes('pending')) {
      const { data: tasks } = await supabase
        .from('admin_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const pending = tasks?.filter(t => t.status === 'pending').length || 0;
      const completed = tasks?.filter(t => t.status === 'completed').length || 0;

      return {
        answer: `You have ${pending} pending tasks and ${completed} completed tasks from the last batch. ${pending > 0 ? 'Review your pending tasks for action items.' : 'All caught up!'}`,
        insights: this.state.insights,
        suggestions: ['View pending tasks', 'Mark tasks complete', 'Create new task']
      };
    }

    if (queryLower.includes('project') || queryLower.includes('listing')) {
      const { count: published } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      const { count: pending } = await supabase
        .from('pending_project_imports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        answer: `You have ${published || 0} published projects and ${pending || 0} pending imports awaiting review.`,
        insights: this.state.insights,
        suggestions: ['Review pending imports', 'Check project quality', 'View published listings']
      };
    }

    // Default
    return {
      answer: `I've analyzed your query. Based on current data, there are ${this.state.kpis.length} KPIs being tracked and ${this.state.riskAlerts.filter(a => a.status === 'new').length} active alerts. What specific area would you like to explore?`,
      insights: this.state.insights.slice(0, 3),
      suggestions: ['Show leads summary', 'Check pending tasks', 'Review project listings']
    };
  }

  // Approve recommendation
  approveRecommendation(recommendationId: string, approvedBy: string): void {
    this.state.recommendations = this.state.recommendations.map(rec => {
      if (rec.id === recommendationId) {
        return { ...rec, status: 'approved' as const, approvedBy, approvedAt: new Date() };
      }
      return rec;
    });

    const rec = this.state.recommendations.find(r => r.id === recommendationId);
    if (rec) {
      this.state.decisionLog.unshift({
        id: `dec_${Date.now()}`,
        description: rec.suggestedAction,
        type: 'human_approved',
        dataSources: rec.dataSource,
        confidence: rec.confidence,
        authorizedBy: approvedBy,
        timestamp: new Date(),
        status: 'active',
        resultTracking: {
          expectedOutcome: rec.resultTracking?.expectedOutcome || 'Improvement in related metrics'
        }
      });
    }
    this.notifyListeners();
  }

  rejectRecommendation(recommendationId: string): void {
    this.state.recommendations = this.state.recommendations.map(rec => {
      if (rec.id === recommendationId) return { ...rec, status: 'rejected' as const };
      return rec;
    });
    this.notifyListeners();
  }

  snoozeRecommendation(recommendationId: string): void {
    this.state.recommendations = this.state.recommendations.map(rec => {
      if (rec.id === recommendationId) return { ...rec, status: 'snoozed' as const };
      return rec;
    });
    this.notifyListeners();
  }

  async executeRecommendation(recommendationId: string): Promise<boolean> {
    const rec = this.state.recommendations.find(r => r.id === recommendationId);
    if (!rec || !rec.autoExecutable) return false;

    this.state.recommendations = this.state.recommendations.map(r => {
      if (r.id === recommendationId) return { ...r, status: 'executed' as const, executedAt: new Date() };
      return r;
    });

    this.state.decisionLog.unshift({
      id: `dec_${Date.now()}`,
      description: rec.suggestedAction,
      type: 'auto_executed',
      dataSources: rec.dataSource,
      confidence: rec.confidence,
      authorizedBy: 'System (Auto)',
      timestamp: new Date(),
      status: 'active',
      resultTracking: { expectedOutcome: 'Automated optimization applied' }
    });

    this.notifyListeners();
    return true;
  }

  acknowledgeRisk(alertId: string): void {
    this.state.riskAlerts = this.state.riskAlerts.map(alert => {
      if (alert.id === alertId) return { ...alert, status: 'acknowledged' as const };
      return alert;
    });
    this.notifyListeners();
  }

  assignRisk(alertId: string, assignee: string): void {
    this.state.riskAlerts = this.state.riskAlerts.map(alert => {
      if (alert.id === alertId) return { ...alert, status: 'assigned' as const, assignedTo: assignee };
      return alert;
    });
    this.notifyListeners();
  }

  resolveRisk(alertId: string): void {
    this.state.riskAlerts = this.state.riskAlerts.map(alert => {
      if (alert.id === alertId) return { ...alert, status: 'resolved' as const };
      return alert;
    });
    this.notifyListeners();
  }

  dismissRisk(alertId: string): void {
    this.state.riskAlerts = this.state.riskAlerts.map(alert => {
      if (alert.id === alertId) return { ...alert, status: 'dismissed' as const };
      return alert;
    });
    this.notifyListeners();
  }

  createScenario(name: string, parameters: ScenarioSimulation['parameters']): ScenarioSimulation {
    const baselineMetrics = this.state.kpis.map(kpi => ({
      name: kpi.name,
      value: kpi.currentValue
    }));
    const scenario = simulateScenario(name, parameters, baselineMetrics);
    this.state.scenarios.unshift(scenario);
    this.notifyListeners();
    return scenario;
  }

  deleteScenario(scenarioId: string): void {
    this.state.scenarios = this.state.scenarios.filter(s => s.id !== scenarioId);
    this.notifyListeners();
  }

  generateDailySummary(): string {
    const leadsKPI = this.state.kpis.find(k => k.name === 'Total Leads');
    const convKPI = this.state.kpis.find(k => k.name === 'Lead Conversion Rate');
    const taskKPI = this.state.kpis.find(k => k.name === 'Task Completion Rate');
    const pendingKPI = this.state.kpis.find(k => k.name === 'Pending Tasks');
    const activeAlerts = this.state.riskAlerts.filter(a => a.status === 'new' || a.status === 'acknowledged');
    const pendingRecs = this.state.recommendations.filter(r => r.status === 'pending');

    return `Daily Intelligence Summary — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Key Metrics:
  Total Leads: ${leadsKPI?.currentValue ?? 'Not yet available'}
  Conversion Rate: ${convKPI?.currentValue ?? 0}%
  Task Completion: ${taskKPI?.currentValue ?? 0}%
  Pending Tasks: ${pendingKPI?.currentValue ?? 0}

Active Alerts: ${activeAlerts.length}
${activeAlerts.length > 0 ? activeAlerts.slice(0, 3).map(a => `  - ${a.title} (${a.severity})`).join('\n') : '  No active alerts'}

Pending Recommendations: ${pendingRecs.length}
${pendingRecs.length > 0 ? pendingRecs.slice(0, 3).map(r => `  - ${r.title}`).join('\n') : '  No pending recommendations'}

Overall Status: ${activeAlerts.filter(a => a.severity === 'critical').length === 0 ? 'Systems operating normally' : 'Attention required — critical alerts detected'}`;
  }

  getInsightsByCategory(category: BusinessInsight['category']): BusinessInsight[] {
    return this.state.insights.filter(i => i.category === category);
  }

  getKPIsByDepartment(department: KPIMetric['category']): KPIMetric[] {
    return this.state.kpis.filter(k => k.category === department);
  }

  getCriticalItemsCount(): number {
    const criticalAlerts = this.state.riskAlerts.filter(a => 
      (a.severity === 'critical' || a.severity === 'high') && 
      (a.status === 'new' || a.status === 'acknowledged')
    ).length;

    const criticalRecs = this.state.recommendations.filter(r => 
      r.impact === 'critical' && r.status === 'pending'
    ).length;

    return criticalAlerts + criticalRecs;
  }
}

export const decisionIntelligenceService = new DecisionIntelligenceService();
