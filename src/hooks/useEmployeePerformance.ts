import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EmployeeMetrics {
  id: string;
  user_id: string | null;
  employee_id: string | null;
  metric_date: string;
  total_hours_worked: number;
  calls_made: number;
  emails_sent: number;
  chats_handled: number;
  leads_contacted: number;
  tasks_completed: number;
  meetings_attended: number;
  documents_processed: number;
  performance_score: number | null;
  notes: string | null;
}

export interface ActivitySession {
  id: string;
  user_id: string | null;
  employee_id: string | null;
  session_start: string;
  session_end: string | null;
  duration_minutes: number | null;
  pages_visited: string[] | null;
  actions_performed: any;
}

export const useEmployeePerformance = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<EmployeeMetrics[]>([]);
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async (startDate?: string, endDate?: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('employee_daily_metrics')
        .select('*')
        .order('metric_date', { ascending: false });

      if (startDate) {
        query = query.gte('metric_date', startDate);
      }
      if (endDate) {
        query = query.lte('metric_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('employee_activity_sessions')
        .select('*')
        .order('session_start', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
    fetchSessions();
  }, [fetchMetrics, fetchSessions]);

  // Start a new activity session
  const startSession = async (employeeId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('employee_activity_sessions')
        .insert({
          user_id: user.id,
          employee_id: employeeId,
          session_start: new Date().toISOString(),
          pages_visited: [],
          actions_performed: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  };

  // End an activity session
  const endSession = async (sessionId: string) => {
    try {
      const { data: session } = await supabase
        .from('employee_activity_sessions')
        .select('session_start')
        .eq('id', sessionId)
        .single();

      if (!session) return false;

      const start = new Date(session.session_start);
      const end = new Date();
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

      const { error } = await supabase
        .from('employee_activity_sessions')
        .update({
          session_end: end.toISOString(),
          duration_minutes: durationMinutes
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  };

  // Log a page visit
  const logPageVisit = async (sessionId: string, page: string) => {
    try {
      const { data: session } = await supabase
        .from('employee_activity_sessions')
        .select('pages_visited')
        .eq('id', sessionId)
        .single();

      if (!session) return;

      const pages = session.pages_visited || [];
      if (!pages.includes(page)) {
        pages.push(page);
        await supabase
          .from('employee_activity_sessions')
          .update({ pages_visited: pages })
          .eq('id', sessionId);
      }
    } catch (error) {
      console.error('Error logging page visit:', error);
    }
  };

  // Log an action
  const logAction = async (sessionId: string, action: { type: string; details: string; timestamp: string }) => {
    try {
      const { data: session } = await supabase
        .from('employee_activity_sessions')
        .select('actions_performed')
        .eq('id', sessionId)
        .single();

      if (!session) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentActions = (session.actions_performed as any[]) || [];
      const actions = [...currentActions, action];
      
      await supabase
        .from('employee_activity_sessions')
        .update({ actions_performed: actions as any })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Update daily metrics
  const updateDailyMetrics = async (
    employeeId: string,
    updates: Partial<Omit<EmployeeMetrics, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];

    try {
      // Try to update existing record
      const { data: existing } = await supabase
        .from('employee_daily_metrics')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('metric_date', today)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('employee_daily_metrics')
          .update(updates)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employee_daily_metrics')
          .insert({
            user_id: user.id,
            employee_id: employeeId,
            metric_date: today,
            ...updates
          });

        if (error) throw error;
      }

      await fetchMetrics();
      return true;
    } catch (error) {
      console.error('Error updating metrics:', error);
      return false;
    }
  };

  // Get metrics summary for an employee
  const getEmployeeSummary = (employeeId: string) => {
    const employeeMetrics = metrics.filter(m => m.employee_id === employeeId);
    
    if (employeeMetrics.length === 0) return null;

    return {
      totalHours: employeeMetrics.reduce((sum, m) => sum + (m.total_hours_worked || 0), 0),
      totalCalls: employeeMetrics.reduce((sum, m) => sum + (m.calls_made || 0), 0),
      totalEmails: employeeMetrics.reduce((sum, m) => sum + (m.emails_sent || 0), 0),
      totalChats: employeeMetrics.reduce((sum, m) => sum + (m.chats_handled || 0), 0),
      totalLeads: employeeMetrics.reduce((sum, m) => sum + (m.leads_contacted || 0), 0),
      totalTasks: employeeMetrics.reduce((sum, m) => sum + (m.tasks_completed || 0), 0),
      totalMeetings: employeeMetrics.reduce((sum, m) => sum + (m.meetings_attended || 0), 0),
      avgPerformanceScore: employeeMetrics
        .filter(m => m.performance_score !== null)
        .reduce((sum, m, _, arr) => sum + (m.performance_score || 0) / arr.length, 0),
      daysTracked: employeeMetrics.length
    };
  };

  return {
    metrics,
    sessions,
    isLoading,
    startSession,
    endSession,
    logPageVisit,
    logAction,
    updateDailyMetrics,
    getEmployeeSummary,
    refreshMetrics: fetchMetrics,
    refreshSessions: fetchSessions
  };
};
