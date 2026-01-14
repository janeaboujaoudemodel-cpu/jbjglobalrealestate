/**
 * AI Behavior Hook - JBJ Global Real Estate
 * React hook for integrating AI behavior engine with components
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  processDecision,
  getEscalationTarget,
  formatEscalationLog,
  routeMessage,
  simulateTypingDelay,
  getCapacityStatus,
  canPerformAction,
  createActionLog,
  GLOBAL_BEHAVIOR_RULES,
  REPORT_SCHEDULE,
  type DecisionContext,
  type DecisionAction,
  type ActionLog,
} from '@/config/ai-behavior-engine';
import { getPersonalityById, getTimeBasedGreeting } from '@/config/ai-personalities';
import { toast } from 'sonner';

interface UseAIBehaviorReturn {
  // Decision processing
  processEvent: (event: string, roleId: string, data: Record<string, unknown>) => Promise<DecisionAction | null>;
  
  // Message routing
  routeIncomingMessage: (message: string) => string[];
  
  // Escalation
  escalateIssue: (fromRole: string, reason: string, targetId?: string) => Promise<void>;
  
  // Capacity management
  checkBrokerCapacity: (brokerId: string) => Promise<{ percent: number; status: string; action?: string }>;
  
  // Permissions
  checkPermission: (roleId: string, action: string) => boolean;
  
  // Logging
  logAction: (roleId: string, action: string, details: string, targetId?: string) => Promise<void>;
  
  // Response simulation
  simulateResponse: (isInternal: boolean) => Promise<void>;
  
  // Report generation
  triggerDailyReport: (reportType: 'sales' | 'hr' | 'finance' | 'system') => Promise<void>;
  
  // State
  isProcessing: boolean;
  lastAction: DecisionAction | null;
}

export function useAIBehavior(): UseAIBehaviorReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<DecisionAction | null>(null);

  const processEvent = useCallback(async (
    event: string,
    roleId: string,
    data: Record<string, unknown>
  ): Promise<DecisionAction | null> => {
    setIsProcessing(true);
    
    try {
      const context: DecisionContext = {
        roleId,
        event,
        data,
        timestamp: new Date(),
        leadId: data.leadId as string,
        userId: data.userId as string,
        daysSinceLastContact: data.daysSinceLastContact as number,
        capacityPercent: data.capacityPercent as number,
      };
      
      const action = processDecision(context);
      
      if (action) {
        setLastAction(action);
        
        // Log the decision
        await supabase.from('crm_audit_logs').insert([{
          entity_type: 'ai_decision',
          action: action.type,
          details: JSON.parse(JSON.stringify({
            event,
            roleId,
            actionType: action.type,
            targetRoles: action.targetRoles,
            message: action.message,
            priority: action.priority,
            timestamp: new Date().toISOString(),
          })),
        }]);
        
        // Execute action based on type
        switch (action.type) {
          case 'notify':
            // Handle notification
            for (const targetRole of action.targetRoles) {
              const personality = getPersonalityById(targetRole);
              if (personality) {
                toast.info(`${personality.name}: ${action.message}`);
              }
            }
            break;
            
          case 'escalate':
            await escalateIssue(roleId, action.message, data.targetId as string);
            break;
            
          case 'reassign':
            toast.warning(`Auto-reassignment: ${action.message}`);
            break;
            
          case 'schedule':
            toast.info(`Scheduled: ${action.message}`);
            break;
            
          case 'remind':
            toast.info(`Reminder: ${action.message}`);
            break;
            
          case 'log':
            console.log(`[AI Log] ${action.message}`);
            break;
            
          case 'broadcast':
            toast.success(`Broadcast: ${action.message}`);
            break;
        }
      }
      
      return action;
    } catch (error) {
      console.error('Error processing AI event:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const routeIncomingMessage = useCallback((message: string): string[] => {
    return routeMessage(message);
  }, []);

  const escalateIssue = useCallback(async (
    fromRole: string,
    reason: string,
    targetId?: string
  ): Promise<void> => {
    const escalateTo = getEscalationTarget(fromRole);
    const logMessage = formatEscalationLog(fromRole, escalateTo, reason);
    
    // Log escalation
    await supabase.from('crm_audit_logs').insert([{
      entity_type: 'escalation',
      entity_id: targetId,
      action: 'escalate',
      details: {
        from: fromRole,
        to: escalateTo,
        reason,
        message: logMessage,
        timestamp: new Date().toISOString(),
      },
    }]);
    
    const toPersonality = getPersonalityById(escalateTo);
    toast.warning(`${logMessage}`, {
      description: `Escalated to ${toPersonality?.name || escalateTo}`,
    });
  }, []);

  const checkBrokerCapacity = useCallback(async (
    brokerId: string
  ): Promise<{ percent: number; status: string; action?: string }> => {
    const { data: broker } = await supabase
      .from('ai_brokers')
      .select('current_daily_interactions, daily_interaction_limit')
      .eq('id', brokerId)
      .single();
    
    if (!broker) {
      return { percent: 0, status: 'normal' };
    }
    
    return getCapacityStatus(
      broker.current_daily_interactions || 0,
      broker.daily_interaction_limit || 50
    );
  }, []);

  const checkPermission = useCallback((roleId: string, action: string): boolean => {
    return canPerformAction(roleId, action);
  }, []);

  const logAction = useCallback(async (
    roleId: string,
    action: string,
    details: string,
    targetId?: string
  ): Promise<void> => {
    const log = createActionLog(roleId, action, details, targetId);
    
    await supabase.from('crm_audit_logs').insert([{
      entity_type: 'ai_action',
      entity_id: targetId,
      action,
      details: {
        ...log,
        timestamp: new Date().toISOString(),
      },
    }]);
  }, []);

  const simulateResponse = useCallback(async (isInternal: boolean): Promise<void> => {
    await simulateTypingDelay(isInternal);
  }, []);

  const triggerDailyReport = useCallback(async (
    reportType: 'sales' | 'hr' | 'finance' | 'system'
  ): Promise<void> => {
    const schedule = REPORT_SCHEDULE[reportType];
    
    try {
      // Invoke the daily report edge function
      const { data, error } = await supabase.functions.invoke('broker-daily-report', {
        body: { reportType },
      });
      
      if (error) throw error;
      
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated`, {
        description: `Sent to ${schedule.roles.length} recipients`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  }, []);

  return {
    processEvent,
    routeIncomingMessage,
    escalateIssue,
    checkBrokerCapacity,
    checkPermission,
    logAction,
    simulateResponse,
    triggerDailyReport,
    isProcessing,
    lastAction,
  };
}

export default useAIBehavior;
