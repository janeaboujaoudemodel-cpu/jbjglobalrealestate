/**
 * Hook for Department Coordination functionality
 */

import { useState, useCallback } from 'react';
import { 
  DEPARTMENTS, 
  DEPARTMENT_SUB_AIS,
  routeTaskToDepartment,
  formatCompanySummary,
  type Department,
  type DepartmentSubAI,
} from '@/config/department-coordination-engine';
import { 
  departmentCoordinationService,
  type DepartmentStats,
  type TaskRoutingResult,
  type DepartmentCoordinationLogEntry,
} from '@/services/department-coordination-service';
import { toast } from 'sonner';

export interface UseDepartmentCoordinationReturn {
  // State
  isProcessing: boolean;
  lastRoutedTask: TaskRoutingResult | null;
  
  // Department data
  departments: Department[];
  subAIs: DepartmentSubAI[];
  getDepartment: (id: string) => Department | undefined;
  getSubAI: (id: string) => DepartmentSubAI | undefined;
  
  // Task routing
  routeTask: (title: string, description: string, priority?: 'low' | 'medium' | 'high' | 'critical') => Promise<TaskRoutingResult>;
  
  // Department communication
  sendDepartmentMessage: (toDepartment: string, content: string, type?: 'update' | 'request' | 'escalation') => Promise<void>;
  sendToAllHeads: (content: string) => Promise<void>;
  
  // AI-to-AI communication
  triggerAIHandoff: (fromAI: string, toAI: string, taskDetails: string) => Promise<void>;
  
  // Statistics
  getDepartmentStats: () => DepartmentStats[];
  
  // Logs
  getCoordinationLogs: (departmentId?: string, limit?: number) => DepartmentCoordinationLogEntry[];
  
  // Reports
  generateDailySummary: () => Promise<string>;
  
  // Meetings
  scheduleMeeting: (departments: string[], topic: string, date: Date) => Promise<{ meetingId: string; attendees: string[] }>;
}

export function useDepartmentCoordination(): UseDepartmentCoordinationReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRoutedTask, setLastRoutedTask] = useState<TaskRoutingResult | null>(null);
  
  const departments = Object.values(DEPARTMENTS);
  const subAIs = Object.values(DEPARTMENT_SUB_AIS);
  
  const getDepartment = useCallback((id: string) => DEPARTMENTS[id], []);
  const getSubAI = useCallback((id: string) => DEPARTMENT_SUB_AIS[id], []);
  
  const routeTask = useCallback(async (
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<TaskRoutingResult> => {
    setIsProcessing(true);
    
    try {
      const result = await departmentCoordinationService.routeTask(
        title,
        description,
        'founder',
        priority
      );
      
      setLastRoutedTask(result);
      
      if (result.success) {
        toast.success(`Task routed to ${result.departmentName}`, {
          description: `Assigned to ${result.assignedTo}`,
        });
      } else {
        toast.warning('Task routing uncertain', {
          description: result.message,
        });
      }
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const sendDepartmentMessage = useCallback(async (
    toDepartment: string,
    content: string,
    type: 'update' | 'request' | 'escalation' = 'update'
  ): Promise<void> => {
    setIsProcessing(true);
    
    try {
      await departmentCoordinationService.sendDepartmentMessage(
        'founder',
        toDepartment,
        content,
        type
      );
      
      const dept = DEPARTMENTS[toDepartment];
      toast.success(`Message sent to ${dept?.name || toDepartment}`, {
        description: type === 'escalation' ? 'Escalation logged' : 'Message delivered',
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const sendToAllHeads = useCallback(async (content: string): Promise<void> => {
    setIsProcessing(true);
    
    try {
      for (const dept of Object.values(DEPARTMENTS)) {
        await departmentCoordinationService.sendDepartmentMessage(
          'founder',
          dept.id,
          content,
          'update',
          'high'
        );
      }
      
      toast.success('Message sent to all department heads');
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const triggerAIHandoff = useCallback(async (
    fromAI: string,
    toAI: string,
    taskDetails: string
  ): Promise<void> => {
    setIsProcessing(true);
    
    try {
      await departmentCoordinationService.aiToAICommunication(
        fromAI,
        toAI,
        'handoff',
        taskDetails
      );
      
      const from = DEPARTMENT_SUB_AIS[fromAI];
      const to = DEPARTMENT_SUB_AIS[toAI];
      
      toast.info('AI Handoff Completed', {
        description: `${from?.name || fromAI} → ${to?.name || toAI}`,
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const getDepartmentStats = useCallback(() => {
    return departmentCoordinationService.getDepartmentStats();
  }, []);
  
  const getCoordinationLogs = useCallback((
    departmentId?: string,
    limit?: number
  ) => {
    return departmentCoordinationService.getCoordinationLogs({
      departmentId,
      limit,
    });
  }, []);
  
  const generateDailySummary = useCallback(async (): Promise<string> => {
    setIsProcessing(true);
    
    try {
      const summary = await departmentCoordinationService.generateDailySummary();
      return formatCompanySummary(summary);
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const scheduleMeeting = useCallback(async (
    departments: string[],
    topic: string,
    date: Date
  ): Promise<{ meetingId: string; attendees: string[] }> => {
    setIsProcessing(true);
    
    try {
      const result = await departmentCoordinationService.scheduleCrossDepartmentMeeting(
        departments,
        topic,
        date
      );
      
      toast.success('Meeting Scheduled', {
        description: `${topic} with ${result.attendees.length} attendees`,
      });
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  return {
    isProcessing,
    lastRoutedTask,
    departments,
    subAIs,
    getDepartment,
    getSubAI,
    routeTask,
    sendDepartmentMessage,
    sendToAllHeads,
    triggerAIHandoff,
    getDepartmentStats,
    getCoordinationLogs,
    generateDailySummary,
    scheduleMeeting,
  };
}
