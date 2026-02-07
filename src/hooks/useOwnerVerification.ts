import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OwnerVerificationResult {
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useOwnerVerification(): OwnerVerificationResult {
  const { user, loading: authLoading } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyOwner() {
      if (authLoading) return;
      
      if (!user) {
        setIsOwner(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('verify-owner');
        
        if (fnError) {
          console.error('Owner verification error:', fnError);
          setError(fnError.message);
          setIsOwner(false);
        } else {
          setIsOwner(data?.isOwner === true);
          setError(null);
        }
      } catch (err) {
        console.error('Owner verification failed:', err);
        setError('Verification failed');
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    }

    verifyOwner();
  }, [user, authLoading]);

  return { isOwner, isLoading, error };
}

export default useOwnerVerification;
