import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LeavePolicy {
  id: string;
  policy_name: string;
  leave_type: string;
  days_per_year: number;
  accrual_rate_per_month: number;
  carry_forward_days: number;
  min_service_days: number;
  requires_document: boolean;
  max_consecutive_days: number;
  is_active: boolean;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  employee_id: string | null;
  employee_name: string;
  department: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  supporting_document_url: string | null;
  status: string;
  current_stage: string;
  manager_name: string | null;
  manager_decision: string | null;
  manager_decision_at: string | null;
  manager_notes: string | null;
  hr_name: string | null;
  hr_decision: string | null;
  hr_decision_at: string | null;
  hr_notes: string | null;
  owner_name: string | null;
  owner_decision: string | null;
  owner_decision_at: string | null;
  owner_notes: string | null;
  created_at: string;
}

export interface LeaveBalance {
  leave_type: string;
  entitled_days: number;
  accrued_days: number;
  taken_days: number;
  remaining_days: number;
}

export const useHRLeave = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hr_leave_policy')
        .select('*')
        .eq('is_active', true)
        .order('policy_name');

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error fetching leave policies:', error);
    }
  }, []);

  const fetchAllRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hr_leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  }, [user]);

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hr_leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error('Error fetching my leave requests:', error);
    }
  }, [user]);

  const calculateLeaveBalance = useCallback(async (leaveType: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'emergency' | 'bereavement' | 'public_holiday'): Promise<LeaveBalance | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase.rpc('calculate_leave_eligibility', {
        p_user_id: user.id,
        p_leave_type: leaveType
      });

      if (error) throw error;
      if (data && data.length > 0) {
        return {
          leave_type: leaveType,
          entitled_days: data[0].entitled_days || 0,
          accrued_days: data[0].accrued_days || 0,
          taken_days: data[0].taken_days || 0,
          remaining_days: data[0].remaining_days || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error calculating leave balance:', error);
      return null;
    }
  }, [user]);

  const submitLeaveRequest = async (request: {
    leave_type: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'emergency' | 'bereavement' | 'public_holiday';
    start_date: string;
    end_date: string;
    reason?: string;
    supporting_document_url?: string;
  }) => {
    if (!user) return null;

    try {
      // Get user profile for employee info
      const { data: profile } = await supabase
        .from('crm_users_profile')
        .select('display_name, department')
        .eq('user_id', user.id)
        .single();

      // Calculate total days
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const insertPayload = {
        user_id: user.id,
        employee_name: profile?.display_name || user.email || 'Unknown',
        department: profile?.department,
        leave_type: request.leave_type,
        start_date: request.start_date,
        end_date: request.end_date,
        total_days: totalDays,
        reason: request.reason,
        supporting_document_url: request.supporting_document_url,
        status: 'pending' as const,
        current_stage: 'manager'
      };

      const { data, error } = await supabase
        .from('hr_leave_requests')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      toast.success('Leave request submitted successfully');
      await fetchMyRequests();
      await fetchAllRequests();
      return data;
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error('Failed to submit leave request');
      return null;
    }
  };

  const approveLeaveRequest = async (
    requestId: string, 
    stage: 'manager' | 'hr' | 'owner',
    approved: boolean,
    notes?: string
  ) => {
    if (!user) return false;

    try {
      // Get user profile for approver info
      const { data: profile } = await supabase
        .from('crm_users_profile')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const approverName = profile?.display_name || user.email || 'Unknown';
      const decision = approved ? `${stage}_approved` : 'rejected';
      const nextStage = stage === 'manager' ? 'hr' : stage === 'hr' ? 'owner' : 'completed';

      const updateData: Record<string, unknown> = {
        [`${stage}_id`]: user.id,
        [`${stage}_name`]: approverName,
        [`${stage}_decision`]: decision,
        [`${stage}_decision_at`]: new Date().toISOString(),
        [`${stage}_notes`]: notes,
        current_stage: approved ? nextStage : 'rejected',
        status: approved ? (stage === 'owner' ? 'owner_approved' : decision) : 'rejected'
      };

      const { error } = await supabase
        .from('hr_leave_requests')
        .update(updateData as any)
        .eq('id', requestId);

      if (error) throw error;

      toast.success(approved ? 'Leave request approved' : 'Leave request rejected');
      await fetchAllRequests();
      return true;
    } catch (error) {
      console.error('Error processing leave request:', error);
      toast.error('Failed to process leave request');
      return false;
    }
  };

  const cancelLeaveRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('hr_leave_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Leave request cancelled');
      await fetchMyRequests();
      return true;
    } catch (error) {
      console.error('Error cancelling leave request:', error);
      toast.error('Failed to cancel leave request');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPolicies(), fetchAllRequests(), fetchMyRequests()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPolicies, fetchAllRequests, fetchMyRequests]);

  return {
    policies,
    requests,
    myRequests,
    loading,
    submitLeaveRequest,
    approveLeaveRequest,
    cancelLeaveRequest,
    calculateLeaveBalance,
    refreshData: () => Promise.all([fetchPolicies(), fetchAllRequests(), fetchMyRequests()])
  };
};
