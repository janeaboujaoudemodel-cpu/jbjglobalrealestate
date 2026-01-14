// AI Insight & Decision-Making Layer - Core Engine Configuration

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  dataSource: 'crm' | 'hr' | 'finance' | 'marketing' | 'admin' | 'knowledge_graph';
  keyMetric: string;
  metricValue: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  confidence: number;
  timestamp: Date;
  category: 'performance' | 'risk' | 'opportunity' | 'trend' | 'anomaly';
}

export interface PredictiveAnalysis {
  id: string;
  title: string;
  forecastType: 'revenue' | 'leads' | 'conversions' | 'performance' | 'costs';
  currentValue: number;
  predictedValue: number;
  changePercentage: number;
  timeframe: string;
  drivers: string[];
  confidence: number;
  methodology: string;
  generatedAt: Date;
}

export interface AIRecommendation {
  id: string;
  title: string;
  reasoning: string;
  dataSource: string[];
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'normal' | 'high' | 'immediate';
  suggestedAction: string;
  autoExecutable: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'snoozed';
  approvedBy?: string;
  approvedAt?: Date;
  executedAt?: Date;
  resultTracking?: {
    expectedOutcome: string;
    actualOutcome?: string;
    success?: boolean;
  };
}

export interface ScenarioSimulation {
  id: string;
  name: string;
  description: string;
  parameters: {
    name: string;
    currentValue: number;
    simulatedValue: number;
    unit: string;
  }[];
  projectedResults: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    changePercentage: number;
    impact: string;
  }[];
  summary: string;
  riskAssessment: string;
  createdAt: Date;
}

export interface DecisionLogEntry {
  id: string;
  description: string;
  type: 'ai_generated' | 'human_approved' | 'auto_executed';
  dataSources: string[];
  confidence: number;
  authorizedBy: string;
  timestamp: Date;
  status: 'pending' | 'active' | 'completed' | 'failed';
  resultTracking: {
    expectedOutcome: string;
    actualOutcome?: string;
    measuredAt?: Date;
    success?: boolean;
    deviation?: number;
  };
}

export interface RiskAlert {
  id: string;
  title: string;
  description: string;
  riskType: 'revenue_drop' | 'employee_inactivity' | 'low_roi' | 'missed_tasks' | 'client_churn' | 'process_delay';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedArea: string;
  detectedAt: Date;
  metrics: {
    name: string;
    value: number;
    threshold: number;
    deviation: number;
  }[];
  suggestedActions: string[];
  status: 'new' | 'acknowledged' | 'assigned' | 'resolved' | 'dismissed';
  assignedTo?: string;
}

export interface KPIMetric {
  id: string;
  name: string;
  category: 'sales' | 'marketing' | 'hr' | 'finance' | 'admin' | 'operations';
  currentValue: number;
  previousValue: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'exceeded';
  lastUpdated: Date;
}

// Insight generation rules
export const INSIGHT_RULES = {
  performance_thresholds: {
    excellent: 90,
    good: 75,
    average: 60,
    poor: 40,
    critical: 20
  },
  trend_significance: {
    major: 15,
    moderate: 8,
    minor: 3
  },
  risk_detection: {
    revenue_drop_threshold: -10,
    inactivity_days: 5,
    roi_minimum: 1.5,
    task_completion_minimum: 80,
    churn_probability_warning: 0.6
  },
  confidence_weights: {
    data_quality: 0.3,
    sample_size: 0.25,
    recency: 0.25,
    consistency: 0.2
  }
};

// Predictive model parameters
export const PREDICTION_CONFIG = {
  forecast_horizons: ['1_week', '1_month', '3_months', '6_months'],
  model_types: ['linear_regression', 'time_series', 'moving_average', 'weighted_average'],
  confidence_minimum: 0.7,
  data_points_minimum: 30,
  seasonality_check: true,
  outlier_detection: true
};

// Recommendation categories
export const RECOMMENDATION_CATEGORIES = {
  resource_allocation: {
    label: 'Resource Allocation',
    autoExecutable: false,
    approvalRequired: true
  },
  process_optimization: {
    label: 'Process Optimization',
    autoExecutable: true,
    approvalRequired: false
  },
  budget_adjustment: {
    label: 'Budget Adjustment',
    autoExecutable: false,
    approvalRequired: true
  },
  team_management: {
    label: 'Team Management',
    autoExecutable: false,
    approvalRequired: true
  },
  marketing_strategy: {
    label: 'Marketing Strategy',
    autoExecutable: false,
    approvalRequired: true
  },
  risk_mitigation: {
    label: 'Risk Mitigation',
    autoExecutable: true,
    approvalRequired: false
  }
};

// Generate business insight from data
export function generateInsight(
  dataSource: BusinessInsight['dataSource'],
  metric: string,
  currentValue: number,
  previousValue: number,
  threshold?: number
): BusinessInsight {
  const change = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  const trend: BusinessInsight['trend'] = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
  
  let impactLevel: BusinessInsight['impactLevel'] = 'low';
  if (Math.abs(change) >= INSIGHT_RULES.trend_significance.major) impactLevel = 'critical';
  else if (Math.abs(change) >= INSIGHT_RULES.trend_significance.moderate) impactLevel = 'high';
  else if (Math.abs(change) >= INSIGHT_RULES.trend_significance.minor) impactLevel = 'medium';

  let category: BusinessInsight['category'] = 'trend';
  if (change < -10) category = 'risk';
  else if (change > 15) category = 'opportunity';
  else if (Math.abs(change) > 20) category = 'anomaly';

  const confidence = calculateConfidence(currentValue, previousValue, threshold);

  return {
    id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `${metric} ${trend === 'up' ? 'Increased' : trend === 'down' ? 'Decreased' : 'Stable'}`,
    description: generateInsightDescription(dataSource, metric, change, currentValue),
    dataSource,
    keyMetric: metric,
    metricValue: currentValue,
    trend,
    trendPercentage: Math.abs(change),
    impactLevel,
    recommendedAction: generateRecommendedAction(dataSource, metric, trend, change),
    confidence,
    timestamp: new Date(),
    category
  };
}

function generateInsightDescription(
  dataSource: string,
  metric: string,
  change: number,
  value: number
): string {
  const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'remained stable';
  const magnitude = Math.abs(change) > 15 ? 'significantly' : Math.abs(change) > 5 ? 'moderately' : 'slightly';
  
  return `${metric} from ${dataSource} has ${magnitude} ${direction} by ${Math.abs(change).toFixed(1)}%. Current value: ${value.toLocaleString()}.`;
}

function generateRecommendedAction(
  dataSource: string,
  metric: string,
  trend: string,
  change: number
): string {
  const actions: Record<string, Record<string, string>> = {
    crm: {
      up: 'Capitalize on momentum by increasing lead allocation to top performers.',
      down: 'Review lead quality and broker assignment strategy.',
      stable: 'Maintain current strategy while exploring growth opportunities.'
    },
    hr: {
      up: 'Recognize team performance and document successful practices.',
      down: 'Schedule performance review and identify improvement areas.',
      stable: 'Continue monitoring and consider skill development programs.'
    },
    finance: {
      up: 'Optimize cash flow allocation for expansion opportunities.',
      down: 'Review expense categories and identify cost optimization areas.',
      stable: 'Maintain budget discipline and prepare for upcoming quarters.'
    },
    marketing: {
      up: 'Scale successful campaigns and document winning strategies.',
      down: 'Analyze campaign performance and adjust targeting.',
      stable: 'Test new channels while maintaining proven approaches.'
    },
    admin: {
      up: 'Streamline processes to handle increased workload.',
      down: 'Review workflow bottlenecks and automation opportunities.',
      stable: 'Document processes and prepare for scalability.'
    }
  };

  return actions[dataSource]?.[trend] || 'Review data and determine appropriate action.';
}

function calculateConfidence(current: number, previous: number, threshold?: number): number {
  let confidence = 70; // Base confidence
  
  // Adjust for data completeness
  if (current > 0 && previous > 0) confidence += 10;
  
  // Adjust for threshold relevance
  if (threshold && current > threshold) confidence += 10;
  
  // Adjust for consistency
  const variance = Math.abs(current - previous) / Math.max(current, previous, 1);
  if (variance < 0.5) confidence += 10;
  
  return Math.min(confidence, 98);
}

// Generate prediction
export function generatePrediction(
  forecastType: PredictiveAnalysis['forecastType'],
  historicalData: number[],
  timeframe: string
): PredictiveAnalysis {
  // Simple moving average prediction
  const recentData = historicalData.slice(-7);
  const average = recentData.reduce((a, b) => a + b, 0) / recentData.length;
  const trend = recentData[recentData.length - 1] - recentData[0];
  const predicted = average + (trend * 0.5);
  const current = historicalData[historicalData.length - 1];
  const change = ((predicted - current) / current) * 100;

  return {
    id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `${forecastType.charAt(0).toUpperCase() + forecastType.slice(1)} Forecast`,
    forecastType,
    currentValue: current,
    predictedValue: predicted,
    changePercentage: change,
    timeframe,
    drivers: identifyDrivers(forecastType, change),
    confidence: calculatePredictionConfidence(historicalData),
    methodology: 'Weighted Moving Average with Trend Analysis',
    generatedAt: new Date()
  };
}

function identifyDrivers(type: string, change: number): string[] {
  const drivers: Record<string, string[]> = {
    revenue: ['New property listings', 'Market demand', 'Campaign performance', 'Broker activity'],
    leads: ['Marketing campaigns', 'Website traffic', 'Referral programs', 'Market conditions'],
    conversions: ['Lead quality', 'Broker responsiveness', 'Property availability', 'Pricing strategy'],
    performance: ['Team capacity', 'Process efficiency', 'Technology adoption', 'Training effectiveness'],
    costs: ['Marketing spend', 'Operational expenses', 'Staff costs', 'Technology investments']
  };

  return drivers[type] || ['Multiple contributing factors identified'];
}

function calculatePredictionConfidence(data: number[]): number {
  if (data.length < 7) return 60;
  if (data.length < 14) return 70;
  if (data.length < 30) return 80;
  return 85;
}

// Detect risks
export function detectRisks(metrics: KPIMetric[]): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  metrics.forEach(metric => {
    // Check for significant drops
    if (metric.trendPercentage < -10 && metric.trend === 'down') {
      alerts.push({
        id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${metric.name} Decline Detected`,
        description: `${metric.name} has dropped by ${Math.abs(metric.trendPercentage).toFixed(1)}% compared to previous period.`,
        riskType: 'revenue_drop',
        severity: metric.trendPercentage < -20 ? 'critical' : metric.trendPercentage < -15 ? 'high' : 'medium',
        affectedArea: metric.category,
        detectedAt: new Date(),
        metrics: [{
          name: metric.name,
          value: metric.currentValue,
          threshold: metric.target,
          deviation: ((metric.currentValue - metric.target) / metric.target) * 100
        }],
        suggestedActions: [
          `Review ${metric.category} department performance`,
          `Schedule immediate team briefing`,
          `Analyze root causes and corrective actions`
        ],
        status: 'new'
      });
    }

    // Check for missed targets
    if (metric.status === 'behind' || metric.status === 'at_risk') {
      const deviation = ((metric.currentValue - metric.target) / metric.target) * 100;
      if (deviation < -20) {
        alerts.push({
          id: `risk_target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${metric.name} Below Target`,
          description: `${metric.name} is ${Math.abs(deviation).toFixed(1)}% below target.`,
          riskType: 'missed_tasks',
          severity: deviation < -30 ? 'high' : 'medium',
          affectedArea: metric.category,
          detectedAt: new Date(),
          metrics: [{
            name: metric.name,
            value: metric.currentValue,
            threshold: metric.target,
            deviation
          }],
          suggestedActions: [
            `Reassess target achievability`,
            `Allocate additional resources`,
            `Identify and remove blockers`
          ],
          status: 'new'
        });
      }
    }
  });

  return alerts;
}

// Generate recommendation
export function generateRecommendation(
  insight: BusinessInsight,
  context?: { budget?: number; teamSize?: number; priority?: string }
): AIRecommendation {
  const isHighImpact = insight.impactLevel === 'high' || insight.impactLevel === 'critical';
  
  return {
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `Recommendation: ${insight.title}`,
    reasoning: `Based on analysis of ${insight.dataSource} data, ${insight.description}`,
    dataSource: [insight.dataSource],
    confidence: insight.confidence,
    impact: insight.impactLevel,
    urgency: isHighImpact ? 'high' : 'normal',
    suggestedAction: insight.recommendedAction,
    autoExecutable: !isHighImpact,
    status: 'pending'
  };
}

// Simulate scenario
export function simulateScenario(
  name: string,
  parameters: ScenarioSimulation['parameters'],
  baselineMetrics: { name: string; value: number }[]
): ScenarioSimulation {
  const projectedResults = baselineMetrics.map(metric => {
    // Simple linear projection based on parameter changes
    const impactFactor = parameters.reduce((total, param) => {
      const change = (param.simulatedValue - param.currentValue) / param.currentValue;
      return total + (change * 0.3); // 30% sensitivity factor
    }, 1);

    const projectedValue = metric.value * impactFactor;
    const changePercentage = ((projectedValue - metric.value) / metric.value) * 100;

    return {
      metric: metric.name,
      currentValue: metric.value,
      projectedValue,
      changePercentage,
      impact: changePercentage > 10 ? 'Positive' : changePercentage < -10 ? 'Negative' : 'Neutral'
    };
  });

  const overallChange = projectedResults.reduce((sum, r) => sum + r.changePercentage, 0) / projectedResults.length;

  return {
    id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: `Simulation based on ${parameters.length} parameter adjustments`,
    parameters,
    projectedResults,
    summary: `Overall projected impact: ${overallChange > 0 ? '+' : ''}${overallChange.toFixed(1)}%`,
    riskAssessment: overallChange < -5 ? 'High risk - proceed with caution' : overallChange < 0 ? 'Moderate risk - monitor closely' : 'Low risk - favorable outlook',
    createdAt: new Date()
  };
}
