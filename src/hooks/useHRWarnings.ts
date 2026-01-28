import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Warning {
  id: string;
  user_id: string;
  employee_id: string | null;
  employee_name: string;
  department: string | null;
  warning_type: 'verbal' | 'written' | 'final' | 'termination';
  warning_number: number;
  subject: string;
  description: string;
  incident_date: string | null;
  issued_by_id: string | null;
  issued_by_name: string | null;
  issued_at: string;
  requires_signature: boolean;
  employee_signature_url: string | null;
  employee_signed_at: string | null;
  employee_response: string | null;
  warning_document_url: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
}

export const useHRWarnings = () => {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [myWarnings, setMyWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllWarnings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hr_warnings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWarnings(data || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
    }
  }, [user]);

  const fetchMyWarnings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hr_warnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyWarnings(data || []);
    } catch (error) {
      console.error('Error fetching my warnings:', error);
    }
  }, [user]);

  const issueWarning = async (warning: {
    employee_user_id: string;
    employee_name: string;
    department?: string;
    warning_type: 'verbal' | 'written' | 'final' | 'termination';
    subject: string;
    description: string;
    incident_date?: string;
  }) => {
    if (!user) return null;

    try {
      // Get issuer profile
      const { data: profile } = await supabase
        .from('crm_users_profile')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      // Count existing warnings for this employee
      const { count } = await supabase
        .from('hr_warnings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', warning.employee_user_id)
        .eq('is_active', true);

      const { data, error } = await supabase
        .from('hr_warnings')
        .insert({
          user_id: warning.employee_user_id,
          employee_name: warning.employee_name,
          department: warning.department,
          warning_type: warning.warning_type,
          warning_number: (count || 0) + 1,
          subject: warning.subject,
          description: warning.description,
          incident_date: warning.incident_date,
          issued_by_id: user.id,
          issued_by_name: profile?.display_name || user.email,
          status: 'pending',
          requires_signature: true
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for the employee
      await supabase.from('hr_notifications').insert({
        user_id: warning.employee_user_id,
        notification_type: 'warning',
        title: `New ${warning.warning_type} Warning`,
        message: `You have received a ${warning.warning_type} warning regarding: ${warning.subject}. Please review and acknowledge.`,
        reference_id: data.id,
        reference_type: 'hr_warnings'
      });

      toast.success('Warning issued successfully');
      await fetchAllWarnings();
      return data;
    } catch (error) {
      console.error('Error issuing warning:', error);
      toast.error('Failed to issue warning');
      return null;
    }
  };

  const signWarning = async (warningId: string, signatureUrl: string, response?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('hr_warnings')
        .update({
          employee_signature_url: signatureUrl,
          employee_signed_at: new Date().toISOString(),
          employee_response: response,
          status: 'acknowledged'
        })
        .eq('id', warningId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Warning acknowledged and signed');
      await fetchMyWarnings();
      return true;
    } catch (error) {
      console.error('Error signing warning:', error);
      toast.error('Failed to sign warning');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAllWarnings(), fetchMyWarnings()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAllWarnings, fetchMyWarnings]);

  return {
    warnings,
    myWarnings,
    loading,
    issueWarning,
    signWarning,
    refreshData: () => Promise.all([fetchAllWarnings(), fetchMyWarnings()])
  };
};
