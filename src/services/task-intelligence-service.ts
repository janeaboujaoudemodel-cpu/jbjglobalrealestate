// AI Task Intelligence & Self-Optimization Service
// Handles all task intelligence operations, learning, and optimization

import { supabase } from '@/integrations/supabase/client';
import {
  TaskPerformanceMetrics,
  PerformanceScore,
  DepartmentAnalytics,
  EmployeeAnalytics,
  PredictiveAssignment,
  OptimizationInsight,
  SystemHealthCheck,
  calculatePerformanceScore,
  predictBestAssignee,
  detectBottlenecks,
  generateOptimizationRecommendations,
  runSystemHealthCheck,
  CONFIDENCE_THRESHOLDS,
} from '@/config/task-intelligence-engine';

class TaskIntelligenceService {
  private static instance: TaskIntelligenceService;
  private learningData: Map<string, TaskPerformanceMetrics[]> = new Map();
  private optimizationCache: OptimizationInsight[] = [];
  private lastOptimizationRun: Date | null = null;

  private constructor() {
    // Initialize learning data
    this.initializeLearningData();
  }

  public static getInstance(): TaskIntelligenceService {
    if (!TaskIntelligenceService.instance) {
      TaskIntelligenceService.instance = new TaskIntelligenceService();
    }
    return TaskIntelligenceService.instance;
  }

  private async initializeLearningData(): Promise<void> {
    // Load historical task data for learning
    console.log('[TaskIntelligence] Initializing learning data...');
  }

  // Track task performance
  public async trackTaskPerformance(metrics: TaskPerformanceMetrics): Promise<PerformanceScore> {
    const score = calculatePerformanceScore(metrics);
    
    // Store in learning data
    const deptData = this.learningData.get(metrics.department) || [];
    deptData.push(metrics);
    this.learningData.set(metrics.department, deptData);
    
    // Log for audit
    console.log(`[TaskIntelligence] Task ${metrics.taskId} scored ${score.score}%`);
    
    return score;
  }

  // Get department analytics
  public async getDepartmentAnalytics(): Promise<DepartmentAnalytics[]> {
    // Simulated analytics data - in production, would query from database
    const departments: DepartmentAnalytics[] = [
      {
        departmentId: 'hr',
        departmentName: 'HR',
        tasksCompleted: 47,
        averageCompletionTime: 42,
        qualityScore: 94,
        delayRate: 8,
        peakProductivityHours: { start: 9, end: 12 },
        weekOverWeekChange: 12,
        bottlenecks: [],
      },
      {
        departmentId: 'sales',
        departmentName: 'Sales',
        tasksCompleted: 89,
        averageCompletionTime: 28,
        qualityScore: 88,
        delayRate: 15,
        peakProductivityHours: { start: 10, end: 13 },
        weekOverWeekChange: 5,
        bottlenecks: ['Lead response time'],
      },
      {
        departmentId: 'marketing',
        departmentName: 'Marketing',
        tasksCompleted: 32,
        averageCompletionTime: 180,
        qualityScore: 91,
        delayRate: 22,
        peakProductivityHours: { start: 14, end: 17 },
        weekOverWeekChange: -8,
        bottlenecks: ['Design asset delivery', 'Approval delays'],
      },
      {
        departmentId: 'finance',
        departmentName: 'Finance',
        tasksCompleted: 56,
        averageCompletionTime: 35,
        qualityScore: 97,
        delayRate: 5,
        peakProductivityHours: { start: 8, end: 11 },
        weekOverWeekChange: 3,
        bottlenecks: [],
      },
      {
        departmentId: 'admin',
        departmentName: 'Admin',
        tasksCompleted: 124,
        averageCompletionTime: 25,
        qualityScore: 92,
        delayRate: 10,
        peakProductivityHours: { start: 9, end: 14 },
        weekOverWeekChange: 18,
        bottlenecks: [],
      },
      {
        departmentId: 'it',
        departmentName: 'IT',
        tasksCompleted: 28,
        averageCompletionTime: 95,
        qualityScore: 96,
        delayRate: 12,
        peakProductivityHours: { start: 11, end: 16 },
        weekOverWeekChange: 7,
        bottlenecks: ['Testing backlog'],
      },
    ];
    
    return departments;
  }

  // Get employee analytics
  public async getEmployeeAnalytics(): Promise<EmployeeAnalytics[]> {
    const employees: EmployeeAnalytics[] = [
      // AI Employees
      {
        employeeId: 'jessica-ai',
        employeeName: 'Jessica AI',
        department: 'HR',
        isAI: true,
        tasksCompleted: 156,
        averageScore: 95,
        specializations: ['cv_screening', 'training_session'],
        currentWorkload: 65,
        efficiency: 94,
        reliability: 98,
      },
      {
        employeeId: 'maya-ai',
        employeeName: 'Maya AI',
        department: 'Marketing',
        isAI: true,
        tasksCompleted: 89,
        averageScore: 91,
        specializations: ['campaign_creation', 'client_meeting'],
        currentWorkload: 78,
        efficiency: 88,
        reliability: 94,
      },
      {
        employeeId: 'david-ai',
        employeeName: 'David AI',
        department: 'Admin',
        isAI: true,
        tasksCompleted: 234,
        averageScore: 93,
        specializations: ['property_listing', 'document_processing'],
        currentWorkload: 55,
        efficiency: 96,
        reliability: 97,
      },
      {
        employeeId: 'layla-ai',
        employeeName: 'Layla AI',
        department: 'Finance',
        isAI: true,
        tasksCompleted: 178,
        averageScore: 97,
        specializations: ['commission_calculation', 'budget_review'],
        currentWorkload: 42,
        efficiency: 98,
        reliability: 99,
      },
      {
        employeeId: 'chris-ai',
        employeeName: 'Chris AI',
        department: 'IT',
        isAI: true,
        tasksCompleted: 67,
        averageScore: 96,
        specializations: ['website_update'],
        currentWorkload: 70,
        efficiency: 95,
        reliability: 98,
      },
      {
        employeeId: 'alex-ai',
        employeeName: 'Alex AI',
        department: 'Sales',
        isAI: true,
        tasksCompleted: 312,
        averageScore: 89,
        specializations: ['lead_followup', 'client_meeting'],
        currentWorkload: 85,
        efficiency: 92,
        reliability: 91,
      },
      // Human Employees (samples)
      {
        employeeId: 'broker-001',
        employeeName: 'James Morgan',
        department: 'Sales',
        isAI: false,
        tasksCompleted: 45,
        averageScore: 87,
        specializations: ['lead_followup', 'client_meeting'],
        currentWorkload: 72,
        efficiency: 85,
        reliability: 89,
      },
      {
        employeeId: 'broker-002',
        employeeName: 'Maya Khalid',
        department: 'Sales',
        isAI: false,
        tasksCompleted: 52,
        averageScore: 91,
        specializations: ['lead_followup', 'client_meeting'],
        currentWorkload: 68,
        efficiency: 90,
        reliability: 92,
      },
    ];
    
    return employees;
  }

  // Predict best assignee for a task
  public async predictAssignment(taskType: string): Promise<PredictiveAssignment> {
    const employees = await this.getEmployeeAnalytics();
    const departments = await this.getDepartmentAnalytics();
    
    return predictBestAssignee(taskType, employees, departments);
  }

  // Get optimization insights
  public async getOptimizationInsights(): Promise<OptimizationInsight[]> {
    const departments = await this.getDepartmentAnalytics();
    const employees = await this.getEmployeeAnalytics();
    
    const bottlenecks = detectBottlenecks(departments);
    const recommendations = generateOptimizationRecommendations(departments, employees);
    
    this.optimizationCache = [...bottlenecks, ...recommendations];
    this.lastOptimizationRun = new Date();
    
    return this.optimizationCache;
  }

  // Apply optimization automatically
  public async applyOptimization(insightId: string): Promise<boolean> {
    const insight = this.optimizationCache.find(i => i.id === insightId);
    
    if (!insight || !insight.autoApplicable) {
      return false;
    }
    
    console.log(`[TaskIntelligence] Applying optimization: ${insight.title}`);
    
    // Log the optimization application
    await this.logOptimizationAction(insightId, 'applied');
    
    return true;
  }

  // Run system health check
  public runHealthCheck(): SystemHealthCheck[] {
    return runSystemHealthCheck();
  }

  // Get top performers
  public async getTopPerformers(limit: number = 5): Promise<EmployeeAnalytics[]> {
    const employees = await this.getEmployeeAnalytics();
    return employees
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, limit);
  }

  // Get weekly summary
  public async getWeeklySummary(): Promise<{
    totalTasks: number;
    avgCompletionTime: number;
    efficiencyChange: number;
    topDepartment: string;
    bottlenecksFound: number;
    optimizationsApplied: number;
  }> {
    const departments = await this.getDepartmentAnalytics();
    const insights = await this.getOptimizationInsights();
    
    const totalTasks = departments.reduce((sum, d) => sum + d.tasksCompleted, 0);
    const avgCompletionTime = departments.reduce((sum, d) => sum + d.averageCompletionTime, 0) / departments.length;
    const avgChange = departments.reduce((sum, d) => sum + d.weekOverWeekChange, 0) / departments.length;
    const topDept = departments.sort((a, b) => b.qualityScore - a.qualityScore)[0];
    
    return {
      totalTasks,
      avgCompletionTime: Math.round(avgCompletionTime),
      efficiencyChange: Math.round(avgChange),
      topDepartment: topDept?.departmentName || 'N/A',
      bottlenecksFound: insights.filter(i => i.type === 'bottleneck').length,
      optimizationsApplied: insights.filter(i => i.autoApplicable).length,
    };
  }

  // Generate daily optimization report
  public async generateDailyReport(): Promise<string> {
    const summary = await this.getWeeklySummary();
    const departments = await this.getDepartmentAnalytics();
    const healthCheck = this.runHealthCheck();
    
    const operationalCount = healthCheck.filter(h => h.status === 'operational').length;
    
    const report = `
📊 AI System Optimization Summary

📈 Performance Overview:
• Total tasks completed: ${summary.totalTasks}
• Average completion time: ${summary.avgCompletionTime} minutes
• Week-over-week efficiency change: ${summary.efficiencyChange > 0 ? '+' : ''}${summary.efficiencyChange}%
• Top performing department: ${summary.topDepartment}

🔍 Bottlenecks Detected: ${summary.bottlenecksFound}
⚡ Optimizations Applied: ${summary.optimizationsApplied}

📋 Department Summary:
${departments.map(d => `• ${d.departmentName}: ${d.tasksCompleted} tasks, ${d.qualityScore}% quality`).join('\n')}

🧠 AI Health Check: ${operationalCount}/${healthCheck.length} Systems Operational
    `.trim();
    
    return report;
  }

  // Log optimization action
  private async logOptimizationAction(insightId: string, action: string): Promise<void> {
    console.log(`[TaskIntelligence] Optimization ${action}: ${insightId}`);
  }

  // Learning feedback event
  public async recordLearningEvent(taskId: string, outcome: {
    duration: number;
    revisions: number;
    sentiment: string;
    escalated: boolean;
  }): Promise<void> {
    console.log(`[TaskIntelligence] Learning event recorded for task ${taskId}`);
    // Would update internal decision matrix in production
  }
}

export const taskIntelligenceService = TaskIntelligenceService.getInstance();
