/**
 * USE SCHEDULED REPORTS HOOK
 * Hook for managing automated email scheduling for PDF analytics reports
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface ScheduledReport {
  id: string;
  user_id: string;
  report_name: string;
  report_type: string;
  frequency: 'weekly' | 'monthly';
  recipients: string[];
  next_send_at: string;
  last_sent_at: string | null;
  is_active: boolean;
  report_config: Json;
  created_at: string;
  updated_at: string;
}

export interface ReportDeliveryLog {
  id: string;
  scheduled_report_id: string;
  sent_at: string;
  recipients: string[];
  status: string;
  error_message: string | null;
  pdf_url: string | null;
  metadata: Json;
}

export interface CreateScheduledReportRequest {
  report_name: string;
  report_type?: string;
  frequency: 'weekly' | 'monthly';
  recipients: string[];
  report_config?: Json;
}

export function useScheduledReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<ReportDeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all scheduled reports for the current user
  const fetchReports = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReports(data as ScheduledReport[] || []);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error('Failed to fetch scheduled reports');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new scheduled report
  const createReport = useCallback(async (request: CreateScheduledReportRequest) => {
    if (!user) {
      toast.error('You must be logged in to create reports');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextSendAt = new Date();
      if (request.frequency === 'weekly') {
        nextSendAt.setDate(nextSendAt.getDate() + 7);
      } else {
        nextSendAt.setMonth(nextSendAt.getMonth() + 1);
      }

      const { data, error: createError } = await supabase
        .from('scheduled_reports')
        .insert([{
          user_id: user.id,
          report_name: request.report_name,
          report_type: request.report_type || 'analytics',
          frequency: request.frequency,
          recipients: request.recipients,
          next_send_at: nextSendAt.toISOString(),
          report_config: request.report_config || {},
        }])
        .select()
        .single();

      if (createError) throw createError;

      setReports(prev => [data as ScheduledReport, ...prev]);
      toast.success('Scheduled report created successfully');
      return data as ScheduledReport;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error('Failed to create scheduled report');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update a scheduled report
  const updateReport = useCallback(async (
    reportId: string,
    updates: { 
      report_name?: string;
      report_type?: string;
      frequency?: 'weekly' | 'monthly';
      recipients?: string[];
      report_config?: Json;
      is_active?: boolean;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();

      if (updateError) throw updateError;

      setReports(prev => prev.map(r => r.id === reportId ? data as ScheduledReport : r));
      toast.success('Report updated successfully');
      return data as ScheduledReport;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error('Failed to update report');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a scheduled report
  const deleteReport = useCallback(async (reportId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', reportId);

      if (deleteError) throw deleteError;

      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success('Report deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error('Failed to delete report');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle report active status
  const toggleReportStatus = useCallback(async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    return updateReport(reportId, { is_active: !report.is_active });
  }, [reports, updateReport]);

  // Send report immediately
  const sendReportNow = useCallback(async (reportId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: sendError } = await supabase.functions.invoke('send-scheduled-report', {
        body: { reportId, sendNow: true },
      });

      if (sendError) throw sendError;

      if (data.success) {
        toast.success(data.message);
        await fetchReports(); // Refresh to get updated last_sent_at
      } else {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error('Failed to send report');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchReports]);

  // Fetch delivery logs for a specific report
  const fetchDeliveryLogs = useCallback(async (reportId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('report_delivery_logs')
        .select('*')
        .eq('scheduled_report_id', reportId)
        .order('sent_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDeliveryLogs(data as ReportDeliveryLog[] || []);
      return data as ReportDeliveryLog[];
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      return [];
    }
  }, []);

  // Load reports on mount
  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, fetchReports]);

  return {
    reports,
    deliveryLogs,
    isLoading,
    error,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    toggleReportStatus,
    sendReportNow,
    fetchDeliveryLogs,
  };
}
