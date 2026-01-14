// AI Insight & Decision-Making Layer - React Hook

import { useState, useEffect, useCallback } from 'react';
import { 
  decisionIntelligenceService, 
  DecisionIntelligenceState 
} from '@/services/decision-intelligence-service';
import { ScenarioSimulation } from '@/config/decision-intelligence-engine';

export function useDecisionIntelligence() {
  const [state, setState] = useState<DecisionIntelligenceState>(
    decisionIntelligenceService.getState()
  );
  const [queryResult, setQueryResult] = useState<{
    answer: string;
    insights: any[];
    visualData?: { labels: string[]; values: number[] };
    suggestions?: string[];
  } | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    const unsubscribe = decisionIntelligenceService.subscribe(setState);
    return () => { unsubscribe(); };
  }, []);

  const refreshData = useCallback(async () => {
    await decisionIntelligenceService.refreshData();
  }, []);

  const processQuery = useCallback(async (query: string) => {
    setIsQuerying(true);
    try {
      const result = await decisionIntelligenceService.processQuery(query);
      setQueryResult(result);
      return result;
    } finally {
      setIsQuerying(false);
    }
  }, []);

  const approveRecommendation = useCallback((id: string, approvedBy: string = 'Founder') => {
    decisionIntelligenceService.approveRecommendation(id, approvedBy);
  }, []);

  const rejectRecommendation = useCallback((id: string) => {
    decisionIntelligenceService.rejectRecommendation(id);
  }, []);

  const snoozeRecommendation = useCallback((id: string) => {
    decisionIntelligenceService.snoozeRecommendation(id);
  }, []);

  const executeRecommendation = useCallback(async (id: string) => {
    return await decisionIntelligenceService.executeRecommendation(id);
  }, []);

  const acknowledgeRisk = useCallback((id: string) => {
    decisionIntelligenceService.acknowledgeRisk(id);
  }, []);

  const assignRisk = useCallback((id: string, assignee: string) => {
    decisionIntelligenceService.assignRisk(id, assignee);
  }, []);

  const resolveRisk = useCallback((id: string) => {
    decisionIntelligenceService.resolveRisk(id);
  }, []);

  const dismissRisk = useCallback((id: string) => {
    decisionIntelligenceService.dismissRisk(id);
  }, []);

  const createScenario = useCallback((
    name: string, 
    parameters: ScenarioSimulation['parameters']
  ): ScenarioSimulation => {
    return decisionIntelligenceService.createScenario(name, parameters);
  }, []);

  const deleteScenario = useCallback((id: string) => {
    decisionIntelligenceService.deleteScenario(id);
  }, []);

  const generateDailySummary = useCallback(() => {
    return decisionIntelligenceService.generateDailySummary();
  }, []);

  const getInsightsByCategory = useCallback((category: any) => {
    return decisionIntelligenceService.getInsightsByCategory(category);
  }, []);

  const getKPIsByDepartment = useCallback((department: any) => {
    return decisionIntelligenceService.getKPIsByDepartment(department);
  }, []);

  const getCriticalItemsCount = useCallback(() => {
    return decisionIntelligenceService.getCriticalItemsCount();
  }, []);

  return {
    // State
    insights: state.insights,
    predictions: state.predictions,
    recommendations: state.recommendations,
    scenarios: state.scenarios,
    decisionLog: state.decisionLog,
    riskAlerts: state.riskAlerts,
    kpis: state.kpis,
    lastSync: state.lastSync,
    isProcessing: state.isProcessing,
    
    // Query state
    queryResult,
    isQuerying,
    
    // Actions
    refreshData,
    processQuery,
    approveRecommendation,
    rejectRecommendation,
    snoozeRecommendation,
    executeRecommendation,
    acknowledgeRisk,
    assignRisk,
    resolveRisk,
    dismissRisk,
    createScenario,
    deleteScenario,
    generateDailySummary,
    getInsightsByCategory,
    getKPIsByDepartment,
    getCriticalItemsCount
  };
}
