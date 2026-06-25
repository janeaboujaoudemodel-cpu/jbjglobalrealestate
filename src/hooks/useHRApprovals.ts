import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ApprovalRequest {
  id: string;
  request_type: string;
  reference_id: string | null;
  reference_table: string | null;
  requester_id: string;
  requester_name: string;
  department: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  current_stage: number;
  total_stages: number;
  stage1_approver_name: string | null;
  stage1_status: string;
  stage1_decision_at: string | null;
  stage1_notes: string | null;
  stage2_approver_name: string | null;
  stage2_status: string;
  stage2_decision_at: string | null;
  stage2_notes: string | null;
  stage3_approver_name: string | null;
  stage3_status: string;
  stage3_decision_at: string | null;
  stage3_notes: string | null;
  overall_status: string;
  created_at: string;
}

export const useHRApprovals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [myApprovals, setMyApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllApprovals = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hr_approval_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  }, [user]);

  const fetchMyApprovals = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hr_approval_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyApprovals(data || []);
    } catch (error) {
      console.error('Error fetching my approvals:', error);
    }
  }, [user]);

  const submitApprovalRequest = async (request: {
    request_type: 'leave_request' | 'expense_claim' | 'document_request' | 'salary_advance' | 'equipment_request' | 'training_request';
    title: string;
    description?: string;
    amount?: number;
    currency?: string;
  }) => {
    if (!user) return null;

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('crm_users_profile')
        .select('display_name, department')
        .eq('user_id', user.id)
        .single();

      const insertPayload = {
        request_type: request.request_type,
        requester_id: user.id,
        requester_name: profile?.display_name || user.email || 'Unknown',
        department: profile?.department,
        title: request.title,
        description: request.description,
        amount: request.amount,
        currency: request.currency || 'AED',
        current_stage: 1,
        total_stages: 3,
        overall_status: 'pending'
      };

      const { data, error } = await supabase
        .from('hr_approval_requests')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      toast.success('Request submitted for approval');
      await fetchMyApprovals();
      return data;
    } catch (error) {
      console.error('Error submitting approval request:', error);
      toast.error('Failed to submit request');
      return null;
    }
  };

  const processApproval = async (
    requestId: string,
    stage: 1 | 2 | 3,
    approved: boolean,
    notes?: string
  ) => {
    if (!user) return false;

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('crm_users_profile')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const approverName = profile?.display_name || user.email || 'Unknown';
      const stageKey = `stage${stage}`;
      const nextStage = stage + 1;

      const updateData: Record<string, unknown> = {
        [`${stageKey}_approver_id`]: user.id,
        [`${stageKey}_approver_name`]: approverName,
        [`${stageKey}_status`]: approved ? 'approved' : 'rejected',
        [`${stageKey}_decision_at`]: new Date().toISOString(),
        [`${stageKey}_notes`]: notes,
      };

      if (approved) {
        if (stage < 3) {
          updateData.current_stage = nextStage;
        } else {
          updateData.overall_status = 'approved';
        }
      } else {
        updateData.overall_status = 'rejected';
      }

      const { error } = await supabase
        .from('hr_approval_requests')
        .update(updateData as any)
        .eq('id', requestId);

      if (error) throw error;

      toast.success(approved ? 'Request approved' : 'Request rejected');
      // Refresh BOTH lists — the same user can be both requester and approver.
      await Promise.all([fetchAllApprovals(), fetchMyApprovals()]);
      return true;
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAllApprovals(), fetchMyApprovals()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAllApprovals, fetchMyApprovals]);

  // Realtime sync — any INSERT/UPDATE on hr_approval_requests triggers a refresh,
  // so HR inbox, requester's "My requests", and the Approvals dashboard all stay
  // in lockstep without a manual reload.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`hr-approvals-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hr_approval_requests' },
        () => {
          fetchAllApprovals();
          fetchMyApprovals();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchAllApprovals, fetchMyApprovals]);

  return {
    approvals,
    myApprovals,
    loading,
    submitApprovalRequest,
    processApproval,
    refreshData: () => Promise.all([fetchAllApprovals(), fetchMyApprovals()])
  };
};
