import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type EmployeeSalaryRow = Database['public']['Tables']['employee_salaries']['Row'];
type EmployeeCommissionRow = Database['public']['Tables']['employee_commissions']['Row'];
type PaymentHistoryRow = Database['public']['Tables']['employee_payment_history']['Row'];
type EarningsSummaryRow = Database['public']['Tables']['employee_earnings_summary']['Row'];

export type EmployeeSalary = EmployeeSalaryRow;
export type EmployeeCommission = EmployeeCommissionRow;
export type PaymentHistory = PaymentHistoryRow;
export type EarningsSummary = EarningsSummaryRow;

export function useEmployeeSalaries() {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [commissions, setCommissions] = useState<EmployeeCommission[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [summaries, setSummaries] = useState<EarningsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSalaries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employee_salaries')
        .select('*')
        .order('employee_name', { ascending: true });

      if (error) throw error;
      setSalaries(data || []);
      
      // Log access for security audit (fire and forget)
      if (data && data.length > 0) {
        void (async () => {
          try {
            await supabase.rpc('log_hr_access', {
              _resource_type: 'employee_salaries',
              _access_type: 'view',
              _records_accessed: data.length,
            });
          } catch {}
        })();
      }
    } catch (error: any) {
      console.error('Error fetching salaries:', error);
    }
  }, []);

  const fetchCommissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('*')
        .order('deal_closed_date', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
      // Log access for security audit (fire and forget)
      if (data && data.length > 0) {
        void (async () => {
          try {
            await supabase.rpc('log_hr_access', {
              _resource_type: 'employee_commissions',
              _access_type: 'view',
              _records_accessed: data.length,
            });
          } catch {}
        })();
      }
    } catch (error: any) {
      console.error('Error fetching commissions:', error);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employee_payment_history')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
      // Log access for security audit (fire and forget)
      if (data && data.length > 0) {
        void (async () => {
          try {
            await supabase.rpc('log_hr_access', {
              _resource_type: 'employee_payment_history',
              _access_type: 'view',
              _records_accessed: data.length,
            });
          } catch {}
        })();
      }
    } catch (error: any) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  const fetchSummaries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employee_earnings_summary')
        .select('*')
        .order('net_earnings', { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
      // Log access for security audit (fire and forget)
      if (data && data.length > 0) {
        void (async () => {
          try {
            await supabase.rpc('log_hr_access', {
              _resource_type: 'employee_earnings_summary',
              _access_type: 'view',
              _records_accessed: data.length,
            });
          } catch {}
        })();
      }
    } catch (error: any) {
      console.error('Error fetching summaries:', error);
    }
  }, []);

  const approveCommission = useCallback(async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('employee_commissions')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', commissionId);

      if (error) throw error;
      
      toast({ title: 'Commission Approved' });
      await fetchCommissions();
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [fetchCommissions, toast]);

  const markCommissionPaid = useCallback(async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('employee_commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() } as any)
        .eq('id', commissionId);

      if (error) throw error;
      
      toast({ title: 'Commission Paid' });
      await fetchCommissions();
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [fetchCommissions, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSalaries(), fetchCommissions(), fetchPayments(), fetchSummaries()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSalaries, fetchCommissions, fetchPayments, fetchSummaries]);

  return {
    salaries,
    commissions,
    payments,
    summaries,
    loading,
    fetchSalaries,
    fetchCommissions,
    fetchPayments,
    fetchSummaries,
    approveCommission,
    markCommissionPaid,
  };
}
