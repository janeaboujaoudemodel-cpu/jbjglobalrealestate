import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_SELECTION_KEY = "jj_role_selected";

export type VisitorRole = 'broker' | 'referral_partner' | 'client' | 'visitor' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<VisitorRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadRole();
  }, [user]);

  const loadRole = async () => {
    setIsLoading(true);
    
    // Check localStorage first
    const storedRole = localStorage.getItem(ROLE_SELECTION_KEY) as VisitorRole;
    if (storedRole) {
      setRole(storedRole);
      setIsLoading(false);
      return;
    }

    // Check database if logged in
    if (user) {
      try {
        const { data } = await supabase
          .from('user_role_selections')
          .select('selected_role')
          .eq('user_id', user.id)
          .single();

        if (data?.selected_role) {
          setRole(data.selected_role as VisitorRole);
          localStorage.setItem(ROLE_SELECTION_KEY, data.selected_role);
        }
      } catch (err) {
        console.log('No role found in database');
      }
    }

    setIsLoading(false);
  };

  const isBroker = role === 'broker';
  const isClient = role === 'client';
  const isReferral = role === 'referral_partner';
  const isVisitor = role === 'visitor';

  const clearRole = () => {
    localStorage.removeItem(ROLE_SELECTION_KEY);
    setRole(null);
  };

  return {
    role,
    isLoading,
    isBroker,
    isClient,
    isReferral,
    isVisitor,
    hasSelectedRole: role !== null,
    clearRole,
    refreshRole: loadRole
  };
};
