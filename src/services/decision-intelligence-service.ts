// AI Insight & Decision-Making Layer - Service

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
    this.initializeMockData();
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

  private initializeMockData() {
    // Initialize KPIs
    this.state.kpis = [
      {
        id: 'kpi_sales_1',
        name: 'Monthly Revenue',
        category: 'sales',
        currentValue: 4250000,
        previousValue: 3800000,
        target: 4500000,
        unit: 'AED',
        trend: 'up',
        trendPercentage: 11.8,
        status: 'on_track',
        lastUpdated: new Date()
      },
      {
        id: 'kpi_sales_2',
        name: 'Lead Conversion Rate',
        category: 'sales',
        currentValue: 18.5,
        previousValue: 16.2,
        target: 20,
        unit: '%',
        trend: 'up',
        trendPercentage: 14.2,
        status: 'on_track',
        lastUpdated: new Date()
      },
      {
        id: 'kpi_marketing_1',
        name: 'Campaign ROI',
        category: 'marketing',
        currentValue: 3.2,
        previousValue: 2.8,
        target: 3.5,
        unit: 'x',
        trend: 'up',
        trendPercentage: 14.3,
        status: 'on_track',
        lastUpdated: new Date()
      },
      {
        id: 'kpi_marketing_2',
        name: 'Cost Per Lead',
        category: 'marketing',
        currentValue: 285,
        previousValue: 320,
        target: 250,
        unit: 'AED',
        trend: 'down',
        trendPercentage: 10.9,
        status: 'on_track',
        lastUpdated: new Date()
      },
      {
        id: 'kpi_hr_1',
        name: 'Employee Satisfaction',
        category: 'hr',
        currentValue: 78,
        previousValue: 82,
        target: 85,
        unit: '%',
        trend: 'down',
        trendPercentage: 4.9,
        status: 'at_risk',
        lastUpdated: new Date()
      },
      {
        id: 'kpi_hr_2',
        name: 'Recruitment Success Rate',
        category: 'hr',
        currentValue: 72,
        previousValue: 68,
        target: 75,
        unit: '%',
        trend: 'up',
        trendPercentage: 5.9,
        status: 'on_track',
        lastUpdated: new Date()
      },
      {
        id: 'kpi_finance_1',
        name: 'Commission Payout Time',
        category: 'finance',
        currentValue: 4.2,
        previousValue: 3.5,
        target: 3,
        unit: 'days',
        trend: 'up',
        trendPercentage: 20,
        status: 'behind',
        lastUpdated: new Date()
      },
      {
        id: 'kpi_admin_1',
        name: 'Property Listing Speed',
        category: 'admin',
        currentValue: 1.5,
        previousValue: 2.1,
        target: 1,
        unit: 'days',
        trend: 'down',
        trendPercentage: 28.6,
        status: 'on_track',
        lastUpdated: new Date()
      }
    ];

    // Generate initial insights
    this.state.insights = [
      generateInsight('crm', 'Lead Conversion Rate', 18.5, 16.2, 20),
      generateInsight('marketing', 'Campaign ROI', 3.2, 2.8, 3.5),
      generateInsight('hr', 'Employee Satisfaction', 78, 82, 85),
      generateInsight('finance', 'Commission Payout Time', 4.2, 3.5, 3),
      generateInsight('admin', 'Property Listing Speed', 1.5, 2.1, 1)
    ];

    // Generate predictions
    this.state.predictions = [
      generatePrediction('revenue', [3200000, 3400000, 3600000, 3800000, 4000000, 4100000, 4250000], '1 month'),
      generatePrediction('leads', [120, 135, 142, 158, 165, 172, 180], '1 month'),
      generatePrediction('conversions', [22, 25, 23, 28, 30, 32, 34], '1 month')
    ];

    // Generate recommendations
    this.state.recommendations = this.state.insights.map(insight => generateRecommendation(insight));

    // Detect risks
    this.state.riskAlerts = detectRisks(this.state.kpis);

    // Add sample decision log entries
    this.state.decisionLog = [
      {
        id: 'dec_1',
        description: 'Increased lead allocation to Broker Omar based on performance data',
        type: 'ai_generated',
        dataSources: ['crm', 'hr'],
        confidence: 91,
        authorizedBy: 'Olivia AI',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        resultTracking: {
          expectedOutcome: '15% increase in conversion rate',
          actualOutcome: '17% increase in conversion rate',
          measuredAt: new Date(),
          success: true,
          deviation: 2
        }
      },
      {
        id: 'dec_2',
        description: 'Adjusted marketing budget for Downtown properties',
        type: 'human_approved',
        dataSources: ['marketing', 'finance'],
        confidence: 88,
        authorizedBy: 'Founder',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'active',
        resultTracking: {
          expectedOutcome: '12% increase in leads from Downtown area',
          success: undefined
        }
      }
    ];

    this.state.lastSync = new Date();
    this.notifyListeners();
  }

  // Refresh all data
  async refreshData(): Promise<void> {
    this.state.isProcessing = true;
    this.notifyListeners();

    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Regenerate insights with slightly varied data
    const variationFactor = 0.95 + Math.random() * 0.1;
    
    this.state.kpis = this.state.kpis.map(kpi => ({
      ...kpi,
      previousValue: kpi.currentValue,
      currentValue: kpi.currentValue * variationFactor,
      lastUpdated: new Date()
    }));

    this.state.insights = [
      generateInsight('crm', 'Lead Conversion Rate', 18.5 * variationFactor, 18.5, 20),
      generateInsight('marketing', 'Campaign ROI', 3.2 * variationFactor, 3.2, 3.5),
      generateInsight('hr', 'Employee Satisfaction', 78 * variationFactor, 78, 85),
      generateInsight('finance', 'Commission Payout Time', 4.2 * variationFactor, 4.2, 3),
      generateInsight('admin', 'Property Listing Speed', 1.5 * variationFactor, 1.5, 1)
    ];

    this.state.riskAlerts = detectRisks(this.state.kpis);
    this.state.lastSync = new Date();
    this.state.isProcessing = false;
    this.notifyListeners();
  }

  // Process natural language query
  async processQuery(query: string): Promise<{
    answer: string;
    insights: BusinessInsight[];
    visualData?: { labels: string[]; values: number[] };
    suggestions?: string[];
  }> {
    const queryLower = query.toLowerCase();
    
    // Determine query type and generate response
    if (queryLower.includes('top') && queryLower.includes('broker')) {
      return {
        answer: 'Based on current performance data, your top-performing brokers are: Sarah (16 clients, 92% satisfaction), Omar (12 clients, 89% satisfaction), and David (9 clients, 87% satisfaction).',
        insights: this.state.insights.filter(i => i.dataSource === 'crm'),
        visualData: {
          labels: ['Sarah', 'Omar', 'David', 'Maya', 'Khalid'],
          values: [16, 12, 9, 7, 6]
        },
        suggestions: ['View detailed broker analytics', 'Compare performance trends', 'Allocate more leads to top performers']
      };
    }

    if (queryLower.includes('campaign') || queryLower.includes('marketing')) {
      return {
        answer: 'The Downtown Off-Plan campaign generated the highest value leads this month with 45 qualified prospects. Campaign ROI is at 3.2x, up 14% from last month.',
        insights: this.state.insights.filter(i => i.dataSource === 'marketing'),
        visualData: {
          labels: ['Downtown', 'Marina', 'JBR', 'Business Bay', 'Palm'],
          values: [45, 32, 28, 22, 18]
        },
        suggestions: ['Scale Downtown campaign', 'Optimize underperforming areas', 'Review ad spend allocation']
      };
    }

    if (queryLower.includes('revenue') || queryLower.includes('sales')) {
      const currentRevenue = this.state.kpis.find(k => k.name === 'Monthly Revenue')?.currentValue || 4250000;
      return {
        answer: `Current monthly revenue is AED ${currentRevenue.toLocaleString()}, representing an 11.8% increase from last month. Projected revenue for next month: AED 4.8M based on current pipeline.`,
        insights: this.state.insights.filter(i => i.dataSource === 'crm'),
        visualData: {
          labels: ['Oct', 'Nov', 'Dec', 'Jan'],
          values: [3200000, 3600000, 3800000, currentRevenue]
        },
        suggestions: ['Review February targets', 'Analyze top revenue sources', 'Optimize conversion funnel']
      };
    }

    if (queryLower.includes('recommend') || queryLower.includes('suggest') || queryLower.includes('improve')) {
      return {
        answer: 'Based on comprehensive analysis, I recommend: 1) Increase marketing budget for Downtown by 20% (ROI: 3.2x), 2) Address HR satisfaction decline with team feedback session, 3) Streamline commission payout process to reduce delays.',
        insights: this.state.insights,
        suggestions: this.state.recommendations.slice(0, 5).map(r => r.suggestedAction)
      };
    }

    // Default response
    return {
      answer: `I've analyzed your query "${query}". Based on current data, all systems are performing within expected parameters. Would you like me to provide specific insights on any department or metric?`,
      insights: this.state.insights.slice(0, 3),
      suggestions: ['View KPI dashboard', 'Check recent alerts', 'Generate detailed report']
    };
  }

  // Approve recommendation
  approveRecommendation(recommendationId: string, approvedBy: string): void {
    this.state.recommendations = this.state.recommendations.map(rec => {
      if (rec.id === recommendationId) {
        return {
          ...rec,
          status: 'approved' as const,
          approvedBy,
          approvedAt: new Date()
        };
      }
      return rec;
    });

    // Add to decision log
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

  // Reject recommendation
  rejectRecommendation(recommendationId: string): void {
    this.state.recommendations = this.state.recommendations.map(rec => {
      if (rec.id === recommendationId) {
        return { ...rec, status: 'rejected' as const };
      }
      return rec;
    });
    this.notifyListeners();
  }

  // Snooze recommendation
  snoozeRecommendation(recommendationId: string): void {
    this.state.recommendations = this.state.recommendations.map(rec => {
      if (rec.id === recommendationId) {
        return { ...rec, status: 'snoozed' as const };
      }
      return rec;
    });
    this.notifyListeners();
  }

  // Execute recommendation (auto-executable only)
  async executeRecommendation(recommendationId: string): Promise<boolean> {
    const rec = this.state.recommendations.find(r => r.id === recommendationId);
    if (!rec || !rec.autoExecutable) return false;

    this.state.recommendations = this.state.recommendations.map(r => {
      if (r.id === recommendationId) {
        return { ...r, status: 'executed' as const, executedAt: new Date() };
      }
      return r;
    });

    // Add to decision log
    this.state.decisionLog.unshift({
      id: `dec_${Date.now()}`,
      description: rec.suggestedAction,
      type: 'auto_executed',
      dataSources: rec.dataSource,
      confidence: rec.confidence,
      authorizedBy: 'Olivia AI (Auto)',
      timestamp: new Date(),
      status: 'active',
      resultTracking: {
        expectedOutcome: 'Automated optimization applied'
      }
    });

    this.notifyListeners();
    return true;
  }

  // Acknowledge risk alert
  acknowledgeRisk(alertId: string): void {
    this.state.riskAlerts = this.state.riskAlerts.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, status: 'acknowledged' as const };
      }
      return alert;
    });
    this.notifyListeners();
  }

  // Assign risk alert
  assignRisk(alertId: string, assignee: string): void {
    this.state.riskAlerts = this.state.riskAlerts.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, status: 'assigned' as const, assignedTo: assignee };
      }
      return alert;
    });
    this.notifyListeners();
  }

  // Resolve risk alert
  resolveRisk(alertId: string): void {
    this.state.riskAlerts = this.state.riskAlerts.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, status: 'resolved' as const };
      }
      return alert;
    });
    this.notifyListeners();
  }

  // Dismiss risk alert
  dismissRisk(alertId: string): void {
    this.state.riskAlerts = this.state.riskAlerts.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, status: 'dismissed' as const };
      }
      return alert;
    });
    this.notifyListeners();
  }

  // Create scenario simulation
  createScenario(
    name: string,
    parameters: ScenarioSimulation['parameters']
  ): ScenarioSimulation {
    const baselineMetrics = this.state.kpis.map(kpi => ({
      name: kpi.name,
      value: kpi.currentValue
    }));

    const scenario = simulateScenario(name, parameters, baselineMetrics);
    this.state.scenarios.unshift(scenario);
    this.notifyListeners();
    return scenario;
  }

  // Delete scenario
  deleteScenario(scenarioId: string): void {
    this.state.scenarios = this.state.scenarios.filter(s => s.id !== scenarioId);
    this.notifyListeners();
  }

  // Generate daily summary
  generateDailySummary(): string {
    const salesKPI = this.state.kpis.find(k => k.name === 'Monthly Revenue');
    const leadKPI = this.state.kpis.find(k => k.name === 'Lead Conversion Rate');
    const hrKPI = this.state.kpis.find(k => k.name === 'Employee Satisfaction');
    const activeAlerts = this.state.riskAlerts.filter(a => a.status === 'new' || a.status === 'acknowledged');
    const pendingRecs = this.state.recommendations.filter(r => r.status === 'pending');

    return `📅 Daily AI Intelligence Summary — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

📊 Key Metrics:
• Revenue: AED ${salesKPI?.currentValue.toLocaleString() || 'N/A'} (${salesKPI?.trend === 'up' ? '↑' : '↓'}${salesKPI?.trendPercentage.toFixed(1)}%)
• Lead Conversion: ${leadKPI?.currentValue.toFixed(1)}% (${leadKPI?.trend === 'up' ? '↑' : '↓'}${leadKPI?.trendPercentage.toFixed(1)}%)
• Team Satisfaction: ${hrKPI?.currentValue.toFixed(0)}% (${hrKPI?.trend === 'up' ? '↑' : '↓'}${hrKPI?.trendPercentage.toFixed(1)}%)

⚠️ Active Alerts: ${activeAlerts.length}
${activeAlerts.slice(0, 3).map(a => `• ${a.title} (${a.severity})`).join('\n')}

💡 Pending Recommendations: ${pendingRecs.length}
${pendingRecs.slice(0, 3).map(r => `• ${r.title}`).join('\n')}

🔮 Prediction: Revenue projected to reach AED ${(salesKPI?.currentValue || 4250000 * 1.12).toLocaleString()} next month.

📈 Overall Status: ${activeAlerts.filter(a => a.severity === 'critical').length === 0 ? '✅ Systems operating normally' : '⚠️ Attention required'}`;
  }

  // Get insights by category
  getInsightsByCategory(category: BusinessInsight['category']): BusinessInsight[] {
    return this.state.insights.filter(i => i.category === category);
  }

  // Get KPIs by department
  getKPIsByDepartment(department: KPIMetric['category']): KPIMetric[] {
    return this.state.kpis.filter(k => k.category === department);
  }

  // Get critical items count
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
