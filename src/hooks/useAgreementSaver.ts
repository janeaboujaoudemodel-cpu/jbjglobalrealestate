import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SaveAgreementParams {
  agreementType: string;
  agreementVersion?: string;
  agreementSnapshot: Record<string, any>;
  consentDetails?: Record<string, any>;
}

export const useAgreementSaver = () => {
  const { user } = useAuth();

  const saveAgreement = useCallback(async ({
    agreementType,
    agreementVersion = '1.0',
    agreementSnapshot,
    consentDetails,
  }: SaveAgreementParams) => {
    if (!user?.id) {
      console.warn('Cannot save agreement: user not authenticated');
      return false;
    }

    try {
      const { error } = await supabase.from('user_agreements').insert({
        user_id: user.id,
        agreement_type: agreementType,
        agreement_version: agreementVersion,
        agreement_snapshot: agreementSnapshot,
        consent_details: consentDetails || null,
        user_agent: navigator.userAgent,
        accepted_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to save agreement:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Failed to save agreement:', e);
      return false;
    }
  }, [user?.id]);

  return { saveAgreement, isAuthenticated: !!user };
};
