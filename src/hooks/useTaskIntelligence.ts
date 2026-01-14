// Hook for AI Task Intelligence & Self-Optimization Layer
import { useState, useCallback } from 'react';
import { taskIntelligenceService } from '@/services/task-intelligence-service';
import {
  DepartmentAnalytics,
  EmployeeAnalytics,
  PredictiveAssignment,
  OptimizationInsight,
  SystemHealthCheck,
} from '@/config/task-intelligence-engine';
import { toast } from 'sonner';

interface WeeklySummary {
  totalTasks: number;
  avgCompletionTime: number;
  efficiencyChange: number;
  topDepartment: string;
  bottlenecksFound: number;
  optimizationsApplied: number;
}

interface UseTaskIntelligenceReturn {
  // State
  isLoading: boolean;
  departmentAnalytics: DepartmentAnalytics[];
  employeeAnalytics: EmployeeAnalytics[];
  insights: OptimizationInsight[];
  healthCheck: SystemHealthCheck[];
  weeklySummary: WeeklySummary | null;
  topPerformers: EmployeeAnalytics[];
  
  // Actions
  loadAnalytics: () => Promise<void>;
  predictAssignment: (taskType: string) => Promise<PredictiveAssignment>;
  applyOptimization: (insightId: string) => Promise<boolean>;
  runHealthCheck: () => void;
  generateReport: () => Promise<string>;
  refreshInsights: () => Promise<void>;
}

export function useTaskIntelligence(): UseTaskIntelligenceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [departmentAnalytics, setDepartmentAnalytics] = useState<DepartmentAnalytics[]>([]);
  const [employeeAnalytics, setEmployeeAnalytics] = useState<EmployeeAnalytics[]>([]);
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);
  const [healthCheck, setHealthCheck] = useState<SystemHealthCheck[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [topPerformers, setTopPerformers] = useState<EmployeeAnalytics[]>([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [depts, employees, insightsList, summary, performers] = await Promise.all([
        taskIntelligenceService.getDepartmentAnalytics(),
        taskIntelligenceService.getEmployeeAnalytics(),
        taskIntelligenceService.getOptimizationInsights(),
        taskIntelligenceService.getWeeklySummary(),
        taskIntelligenceService.getTopPerformers(5),
      ]);
      
      setDepartmentAnalytics(depts);
      setEmployeeAnalytics(employees);
      setInsights(insightsList);
      setWeeklySummary(summary);
      setTopPerformers(performers);
      
      // Run health check
      const health = taskIntelligenceService.runHealthCheck();
      setHealthCheck(health);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load task intelligence data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const predictAssignment = useCallback(async (taskType: string): Promise<PredictiveAssignment> => {
    try {
      const prediction = await taskIntelligenceService.predictAssignment(taskType);
      toast.success(`Task assigned to ${prediction.recommendedAssignee} (${prediction.confidenceScore}% confidence)`);
      return prediction;
    } catch (error) {
      console.error('Failed to predict assignment:', error);
      toast.error('Failed to predict task assignment');
      throw error;
    }
  }, []);

  const applyOptimization = useCallback(async (insightId: string): Promise<boolean> => {
    try {
      const success = await taskIntelligenceService.applyOptimization(insightId);
      if (success) {
        toast.success('Optimization applied successfully');
        // Refresh insights
        const newInsights = await taskIntelligenceService.getOptimizationInsights();
        setInsights(newInsights);
      } else {
        toast.error('This optimization requires manual action');
      }
      return success;
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      toast.error('Failed to apply optimization');
      return false;
    }
  }, []);

  const runHealthCheck = useCallback(() => {
    const health = taskIntelligenceService.runHealthCheck();
    setHealthCheck(health);
    
    const operational = health.filter(h => h.status === 'operational').length;
    if (operational === health.length) {
      toast.success(`🧠 AI Health Check Complete — ${operational}/${health.length} Systems Operational`);
    } else {
      toast.warning(`⚠️ Health Check: ${operational}/${health.length} Systems Operational`);
    }
  }, []);

  const generateReport = useCallback(async (): Promise<string> => {
    try {
      const report = await taskIntelligenceService.generateDailyReport();
      return report;
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate optimization report');
      throw error;
    }
  }, []);

  const refreshInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const newInsights = await taskIntelligenceService.getOptimizationInsights();
      setInsights(newInsights);
      toast.success('Insights refreshed');
    } catch (error) {
      console.error('Failed to refresh insights:', error);
      toast.error('Failed to refresh insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    departmentAnalytics,
    employeeAnalytics,
    insights,
    healthCheck,
    weeklySummary,
    topPerformers,
    loadAnalytics,
    predictAssignment,
    applyOptimization,
    runHealthCheck,
    generateReport,
    refreshInsights,
  };
}
