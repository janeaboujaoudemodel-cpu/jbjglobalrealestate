import { ReactNode, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useBrokerSessionTracking } from "@/hooks/useBrokerSessionTracking";

interface BrokerGuardProps {
  children: ReactNode;
  /** If true, shows loading spinner while checking auth. Default: true */
  showLoading?: boolean;
}

/**
 * BrokerGuard - Restricts routes to authenticated users with broker role
 * 
 * Identity model:
 * - BROKER (verified via profiles table role) → allowed
 * - OWNER (always has broker access) → allowed
 * - VISITOR (no session) → redirect to /auth with redirect-back
 * - AUTHENTICATED but NOT BROKER → redirect to /403 (AccessDenied)
 * 
 * NOTE: This is UI-layer protection only.
 * Server-side enforcement is mandatory in Edge Functions + RLS.
 */
const BrokerGuard = ({ children, showLoading = true }: BrokerGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isBroker, setIsBroker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function checkBrokerStatus() {
      if (authLoading) return;
      
      if (!user) {
        setIsBroker(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is owner (owner has all broker privileges)
        const { data: ownerData } = await supabase.functions.invoke('verify-owner');
        if (ownerData?.isOwner) {
          setIsBroker(true);
          setIsLoading(false);
          return;
        }

        // Check for active broker subscription (primary broker indicator)
        const { data: subscriptionData } = await supabase
          .from('broker_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        // User is a broker if they have an active subscription
        const hasBrokerRole = !!subscriptionData;
        setIsBroker(hasBrokerRole);
      } catch (err) {
        console.error('Broker verification failed:', err);
        setIsBroker(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkBrokerStatus();
  }, [user, authLoading]);

  // Show loading state while checking auth or broker status
  if ((authLoading || isLoading) && showLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // VISITOR (no session) → redirect to auth with redirect-back
  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  // AUTHENTICATED but NOT BROKER → AccessDenied
  if (!isBroker) {
    return <Navigate to="/403" replace />;
  }

  // BROKER → allowed
  return <>{children}</>;
};

export default BrokerGuard;

/**
 * Hook to check if current user is a Broker
 * Use this for conditional rendering in components
 */
export function useIsBroker(): { isBroker: boolean; isLoading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [isBroker, setIsBroker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBrokerStatus() {
      if (authLoading) return;
      
      if (!user) {
        setIsBroker(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is owner
        const { data: ownerData } = await supabase.functions.invoke('verify-owner');
        if (ownerData?.isOwner) {
          setIsBroker(true);
          setIsLoading(false);
          return;
        }

        // Check for active broker subscription
        const { data: subscriptionData } = await supabase
          .from('broker_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        setIsBroker(!!subscriptionData);
      } catch (err) {
        console.error('Broker check failed:', err);
        setIsBroker(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkBrokerStatus();
  }, [user, authLoading]);

  return { isBroker, isLoading };
}
