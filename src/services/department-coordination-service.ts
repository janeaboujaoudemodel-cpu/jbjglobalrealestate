/**
 * Department Coordination Service
 * Handles department task routing, coordination, and AI-to-AI communication
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  DEPARTMENTS, 
  DEPARTMENT_SUB_AIS,
  routeTaskToDepartment,
  detectTaskConflict,
  DepartmentTask,
  DepartmentMessage,
  AIMessage,
  CompanyDailySummary,
  DepartmentDailySummary,
  formatCompanySummary,
} from '@/config/department-coordination-engine';

export interface DepartmentStats {
  departmentId: string;
  activeTasks: number;
  completedToday: number;
  pendingTasks: number;
  delayedTasks: number;
  escalations: number;
}

export interface TaskRoutingResult {
  success: boolean;
  taskId?: string;
  department: string;
  departmentName: string;
  assignedTo: string;
  confidence: number;
  message: string;
  conflict?: {
    type: string;
    description: string;
    resolution: string;
  };
}

export interface DepartmentCoordinationLogEntry {
  id: string;
  type: 'task_routed' | 'escalation' | 'ai_communication' | 'conflict_detected' | 'workflow_update' | 'report_generated';
  departmentId: string;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

class DepartmentCoordinationService {
  private coordinationLogs: DepartmentCoordinationLogEntry[] = [];
  private aiMessages: AIMessage[] = [];
  private departmentStats: Map<string, DepartmentStats> = new Map();
  
  constructor() {
    this.initializeDepartmentStats();
  }
  
  private initializeDepartmentStats() {
    for (const deptId of Object.keys(DEPARTMENTS)) {
      this.departmentStats.set(deptId, {
        departmentId: deptId,
        activeTasks: 0,
        completedToday: 0,
        pendingTasks: 0,
        delayedTasks: 0,
        escalations: 0,
      });
    }
  }
  
  /**
   * Route a task to the appropriate department using NLP
   */
  async routeTask(
    taskTitle: string,
    taskDescription: string,
    createdBy: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<TaskRoutingResult> {
    const routing = routeTaskToDepartment(`${taskTitle} ${taskDescription}`);
    const department = DEPARTMENTS[routing.department];
    const subAI = DEPARTMENT_SUB_AIS[department?.subAIId || ''];
    
    if (!department) {
      return {
        success: false,
        department: 'unknown',
        departmentName: 'Unknown',
        assignedTo: 'Amanda Clarke',
        confidence: 0,
        message: 'Unable to determine appropriate department. Task assigned to Amanda Clarke for manual routing.',
      };
    }
    
    // Create the task
    const newTask: DepartmentTask = {
      id: `task_${Date.now()}`,
      title: taskTitle,
      description: taskDescription,
      departmentId: routing.department,
      assignedTo: [department.headId],
      createdBy,
      status: 'pending',
      priority,
      dependencies: [],
      createdAt: new Date(),
      tags: [`#${department.shortName}`, `#Priority${priority.charAt(0).toUpperCase() + priority.slice(1)}`],
    };
    
    // Log the routing
    this.logCoordinationEvent({
      id: `log_${Date.now()}`,
      type: 'task_routed',
      departmentId: routing.department,
      actorId: 'amanda_clarke',
      actorName: 'Amanda Clarke',
      targetId: department.headId,
      targetName: department.headName,
      action: 'Task Routed',
      details: `Task "${taskTitle}" routed to ${department.name} Department — assigned to ${department.headName}${subAI ? ` (${subAI.name})` : ''}.`,
      metadata: { confidence: routing.confidence, suggestions: routing.suggestions },
      timestamp: new Date(),
    });
    
    // Update department stats
    const stats = this.departmentStats.get(routing.department);
    if (stats) {
      stats.pendingTasks++;
      this.departmentStats.set(routing.department, stats);
    }
    
    return {
      success: true,
      taskId: newTask.id,
      department: routing.department,
      departmentName: department.name,
      assignedTo: department.headName,
      confidence: routing.confidence,
      message: `Task routed to ${department.name} Department — assigned to ${department.headName}${subAI ? ` (${subAI.name})` : ''}.`,
    };
  }
  
  /**
   * Send a message to a department
   */
  async sendDepartmentMessage(
    fromId: string,
    toDepartmentId: string,
    content: string,
    type: 'update' | 'request' | 'escalation' | 'report' = 'update',
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<DepartmentMessage> {
    const department = DEPARTMENTS[toDepartmentId];
    const recipients = department ? department.members : [toDepartmentId];
    
    const message: DepartmentMessage = {
      id: `msg_${Date.now()}`,
      from: fromId,
      to: recipients,
      departmentId: toDepartmentId,
      content,
      type,
      priority,
      timestamp: new Date(),
      read: false,
      tags: [`#${department?.shortName || toDepartmentId}`],
    };
    
    this.logCoordinationEvent({
      id: `log_${Date.now()}`,
      type: type === 'escalation' ? 'escalation' : 'task_routed',
      departmentId: toDepartmentId,
      actorId: fromId,
      actorName: fromId,
      targetId: toDepartmentId,
      targetName: department?.name || toDepartmentId,
      action: `Department ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      details: content,
      metadata: { priority },
      timestamp: new Date(),
    });
    
    return message;
  }
  
  /**
   * AI-to-AI communication between department assistants
   */
  async aiToAICommunication(
    fromAIId: string,
    toAIId: string,
    messageType: 'request' | 'confirmation' | 'update' | 'handoff',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<AIMessage> {
    const fromAI = DEPARTMENT_SUB_AIS[fromAIId];
    const toAI = DEPARTMENT_SUB_AIS[toAIId];
    
    const message: AIMessage = {
      id: `ai_msg_${Date.now()}`,
      fromAI: fromAI?.name || fromAIId,
      toAI: toAI?.name || toAIId,
      content,
      type: messageType,
      metadata,
      timestamp: new Date(),
      acknowledged: false,
    };
    
    this.aiMessages.push(message);
    
    // Log to coordination log
    this.logCoordinationEvent({
      id: `log_${Date.now()}`,
      type: 'ai_communication',
      departmentId: fromAI?.department || 'unknown',
      actorId: fromAIId,
      actorName: fromAI?.name || fromAIId,
      targetId: toAIId,
      targetName: toAI?.name || toAIId,
      action: `AI-to-AI ${messageType}`,
      details: content,
      metadata,
      timestamp: new Date(),
    });
    
    return message;
  }
  
  /**
   * Get department statistics
   */
  getDepartmentStats(departmentId?: string): DepartmentStats[] {
    if (departmentId) {
      const stats = this.departmentStats.get(departmentId);
      return stats ? [stats] : [];
    }
    return Array.from(this.departmentStats.values());
  }
  
  /**
   * Update department statistics
   */
  updateDepartmentStats(departmentId: string, updates: Partial<DepartmentStats>): void {
    const currentStats = this.departmentStats.get(departmentId);
    if (currentStats) {
      this.departmentStats.set(departmentId, { ...currentStats, ...updates });
    }
  }
  
  /**
   * Generate daily company summary
   */
  async generateDailySummary(): Promise<CompanyDailySummary> {
    const departmentSummaries: DepartmentDailySummary[] = [];
    
    for (const [deptId, dept] of Object.entries(DEPARTMENTS)) {
      const stats = this.departmentStats.get(deptId) || {
        departmentId: deptId,
        activeTasks: 0,
        completedToday: 0,
        pendingTasks: 0,
        delayedTasks: 0,
        escalations: 0,
      };
      
      departmentSummaries.push({
        departmentId: deptId,
        departmentName: dept.name,
        date: new Date(),
        tasksCompleted: stats.completedToday,
        tasksPending: stats.pendingTasks,
        tasksBlocked: stats.delayedTasks,
        escalations: stats.escalations,
        highlights: this.generateDepartmentHighlights(deptId, stats),
        blockers: [],
        upcomingDeadlines: [],
      });
    }
    
    const summary: CompanyDailySummary = {
      date: new Date(),
      generatedBy: 'Amanda Clarke',
      departments: departmentSummaries,
      overallHighlights: ['System running smoothly'],
      criticalItems: [],
      upcomingMeetings: [],
      teamMorale: 'normal',
    };
    
    // Log the report generation
    this.logCoordinationEvent({
      id: `log_${Date.now()}`,
      type: 'report_generated',
      departmentId: 'all',
      actorId: 'amanda_clarke',
      actorName: 'Amanda Clarke',
      action: 'Daily Summary Generated',
      details: 'Company-wide daily summary report generated and ready for Founder review.',
      timestamp: new Date(),
    });
    
    return summary;
  }
  
  private generateDepartmentHighlights(departmentId: string, stats: DepartmentStats): string[] {
    const highlights: string[] = [];
    
    if (stats.completedToday > 0) {
      highlights.push(`${stats.completedToday} task${stats.completedToday > 1 ? 's' : ''} completed today`);
    }
    if (stats.activeTasks > 0) {
      highlights.push(`${stats.activeTasks} active task${stats.activeTasks > 1 ? 's' : ''} in progress`);
    }
    if (stats.pendingTasks > 0) {
      highlights.push(`${stats.pendingTasks} pending task${stats.pendingTasks > 1 ? 's' : ''}`);
    }
    if (highlights.length === 0) {
      highlights.push('No significant activity');
    }
    
    return highlights;
  }
  
  /**
   * Log a coordination event
   */
  private logCoordinationEvent(entry: DepartmentCoordinationLogEntry): void {
    this.coordinationLogs.unshift(entry);
    
    // Keep only last 1000 entries
    if (this.coordinationLogs.length > 1000) {
      this.coordinationLogs = this.coordinationLogs.slice(0, 1000);
    }
  }
  
  /**
   * Get coordination logs
   */
  getCoordinationLogs(filters?: {
    departmentId?: string;
    type?: string;
    limit?: number;
  }): DepartmentCoordinationLogEntry[] {
    let logs = [...this.coordinationLogs];
    
    if (filters?.departmentId) {
      logs = logs.filter(l => l.departmentId === filters.departmentId);
    }
    if (filters?.type) {
      logs = logs.filter(l => l.type === filters.type);
    }
    
    return logs.slice(0, filters?.limit || 100);
  }
  
  /**
   * Get AI-to-AI messages
   */
  getAIMessages(limit?: number): AIMessage[] {
    return this.aiMessages.slice(0, limit || 50);
  }
  
  /**
   * Schedule cross-department meeting
   */
  async scheduleCrossDepartmentMeeting(
    departments: string[],
    topic: string,
    scheduledAt: Date
  ): Promise<{ meetingId: string; attendees: string[] }> {
    const attendees: string[] = [];
    
    for (const deptId of departments) {
      const dept = DEPARTMENTS[deptId];
      if (dept) {
        attendees.push(dept.headId);
      }
    }
    
    // Always include Amanda Clarke and Founder
    if (!attendees.includes('amanda_clarke')) attendees.unshift('amanda_clarke');
    if (!attendees.includes('founder')) attendees.unshift('founder');
    
    const meetingId = `meeting_${Date.now()}`;
    
    this.logCoordinationEvent({
      id: `log_${Date.now()}`,
      type: 'workflow_update',
      departmentId: 'all',
      actorId: 'amanda_clarke',
      actorName: 'Amanda Clarke',
      action: 'Cross-Department Meeting Scheduled',
      details: `Meeting "${topic}" scheduled for ${scheduledAt.toLocaleString()} with ${departments.map(d => DEPARTMENTS[d]?.name).join(', ')}`,
      metadata: { meetingId, departments, attendees },
      timestamp: new Date(),
    });
    
    return { meetingId, attendees };
  }
}

export const departmentCoordinationService = new DepartmentCoordinationService();
