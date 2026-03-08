// Market Intelligence React Hook
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { marketIntelligenceService } from '@/services/market-intelligence-service';
import {
  MarketPrediction,
  MarketOpportunity,
  MarketAlert,
  InvestorBehaviorInsight,
  EconomicIndicator,
  MarketBriefing,
  ProjectAIScore,
  MarketAlertPriority,
  OpportunityStatus,
} from '@/config/market-intelligence-engine';

export interface MarketIntelligenceState {
  predictions: MarketPrediction[];
  opportunities: MarketOpportunity[];
  alerts: MarketAlert[];
  investorInsights: InvestorBehaviorInsight[];
  economicIndicators: EconomicIndicator[];
  briefings: MarketBriefing[];
  projectScores: ProjectAIScore[];
  isLoading: boolean;
  error: string | null;
  dashboardSummary: {
    totalPredictions: number;
    newOpportunities: number;
    unreadAlerts: number;
    avgSentiment: number;
    trendingAreas: string[];
    topProjects: ProjectAIScore[];
  } | null;
}

export function useMarketIntelligence() {
  const { toast } = useToast();
  const [state, setState] = useState<MarketIntelligenceState>({
    predictions: [],
    opportunities: [],
    alerts: [],
    investorInsights: [],
    economicIndicators: [],
    briefings: [],
    projectScores: [],
    isLoading: false,
    error: null,
    dashboardSummary: null,
  });

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [
        predictions,
        opportunities,
        alerts,
        investorInsights,
        economicIndicators,
        briefings,
        projectScores,
        dashboardSummary,
      ] = await Promise.all([
        marketIntelligenceService.getPredictions({ validOnly: true, limit: 20 }),
        marketIntelligenceService.getOpportunities({ limit: 20 }),
        marketIntelligenceService.getAlerts({ limit: 50 }),
        marketIntelligenceService.getInvestorInsights({ limit: 20 }),
        marketIntelligenceService.getEconomicIndicators({ limit: 20 }),
        marketIntelligenceService.getBriefings({ limit: 10 }),
        marketIntelligenceService.getProjectScores({ limit: 20 }),
        marketIntelligenceService.getDashboardSummary(),
      ]);
      
      setState({
        predictions,
        opportunities,
        alerts,
        investorInsights,
        economicIndicators,
        briefings,
        projectScores,
        isLoading: false,
        error: null,
        dashboardSummary,
      });
    } catch (error) {
      console.error('Error fetching market intelligence data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch market intelligence data',
      }));
      toast({
        title: 'Error',
        description: 'Failed to fetch market intelligence data',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to new alerts
    const unsubscribeAlerts = marketIntelligenceService.subscribeToAlerts((alert) => {
      setState(prev => ({
        ...prev,
        alerts: [alert, ...prev.alerts],
      }));
      
      // Show toast for high priority alerts
      if (alert.priority === 'critical' || alert.priority === 'high') {
        toast({
          title: `[ALERT] ${alert.title}`,
          description: alert.message,
          variant: 'destructive',
        });
      }
    });
    
    // Subscribe to new opportunities
    const unsubscribeOpportunities = marketIntelligenceService.subscribeToOpportunities((opportunity) => {
      setState(prev => ({
        ...prev,
        opportunities: [opportunity, ...prev.opportunities],
      }));
      
      // Show toast for high-score opportunities
      if (opportunity.ai_score && opportunity.ai_score >= 8) {
        toast({
          title: `💎 New Opportunity: ${opportunity.title}`,
          description: `AI Score: ${opportunity.ai_score}/10`,
        });
      }
    });
    
    return () => {
      unsubscribeAlerts();
      unsubscribeOpportunities();
    };
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Action handlers
  const markAlertAsRead = useCallback(async (alertId: string) => {
    const success = await marketIntelligenceService.markAlertAsRead(alertId);
    if (success) {
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.map(a =>
          a.id === alertId ? { ...a, is_read: true } : a
        ),
      }));
    }
    return success;
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string, userId: string) => {
    const success = await marketIntelligenceService.acknowledgeAlert(alertId, userId);
    if (success) {
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.map(a =>
          a.id === alertId ? { ...a, is_acknowledged: true, acknowledged_by: userId } : a
        ),
      }));
      toast({
        title: 'Alert Acknowledged',
        description: 'The alert has been acknowledged.',
      });
    }
    return success;
  }, [toast]);

  const updateOpportunityStatus = useCallback(async (opportunityId: string, status: OpportunityStatus) => {
    const success = await marketIntelligenceService.updateOpportunityStatus(opportunityId, status);
    if (success) {
      setState(prev => ({
        ...prev,
        opportunities: prev.opportunities.map(o =>
          o.id === opportunityId ? { ...o, status } : o
        ),
      }));
      toast({
        title: 'Opportunity Updated',
        description: `Status changed to ${status}.`,
      });
    }
    return success;
  }, [toast]);

  // Filtered getters
  const getUnreadAlerts = useCallback(() => {
    return state.alerts.filter(a => !a.is_read);
  }, [state.alerts]);

  const getCriticalAlerts = useCallback(() => {
    return state.alerts.filter(a => a.priority === 'critical' && !a.is_acknowledged);
  }, [state.alerts]);

  const getNewOpportunities = useCallback(() => {
    return state.opportunities.filter(o => o.status === 'new');
  }, [state.opportunities]);

  const getTopOpportunities = useCallback((count: number = 5) => {
    return state.opportunities
      .filter(o => o.ai_score !== undefined)
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
      .slice(0, count);
  }, [state.opportunities]);

  const getLatestBriefing = useCallback(() => {
    return state.briefings[0] || null;
  }, [state.briefings]);

  const getPredictionsByLocation = useCallback((location: string) => {
    return state.predictions.filter(p => p.location === location);
  }, [state.predictions]);

  const getProjectsByRisk = useCallback((riskLevel: 'low' | 'medium' | 'high') => {
    return state.projectScores.filter(p => p.risk_level === riskLevel);
  }, [state.projectScores]);

  return {
    // State
    ...state,
    
    // Actions
    refreshData: fetchAllData,
    markAlertAsRead,
    acknowledgeAlert,
    updateOpportunityStatus,
    
    // Filtered getters
    getUnreadAlerts,
    getCriticalAlerts,
    getNewOpportunities,
    getTopOpportunities,
    getLatestBriefing,
    getPredictionsByLocation,
    getProjectsByRisk,
  };
}
