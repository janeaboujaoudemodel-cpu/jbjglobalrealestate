import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_SELECTION_KEY = "jj_role_selected";

export type VisitorRole = 'broker' | 'investor' | 'visitor' | 'owner' | 'broker_partner' | 'broker_jbj' | 'client' | null;

let roleCache: { userId: string; role: VisitorRole } | null = null;
let rolePromise: Promise<VisitorRole> | null = null;
let rolePromiseUserId: string | null = null;

export const useUserRole = () => {
  const [role, setRole] = useState<VisitorRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadRole = useCallback(async () => {
    setIsLoading(true);
    
    // Use localStorage as fast initial fallback only
    const storedRole = localStorage.getItem(ROLE_SELECTION_KEY) as VisitorRole;
    if (storedRole) {
      setRole(storedRole);
    }

    // Always refresh from backend when authenticated (don't exit early)
    if (user) {
      try {
        if (roleCache?.userId === user.id) {
          if (roleCache.role) {
            setRole(roleCache.role);
            localStorage.setItem(ROLE_SELECTION_KEY, roleCache.role);
          } else if (!storedRole) {
            setRole(null);
          }
          setIsLoading(false);
          return;
        }

        if (!rolePromise || rolePromiseUserId !== user.id) {
          rolePromiseUserId = user.id;
          rolePromise = (async () => {
            // First check user_role_selections table
            const { data: roleSelection } = await supabase
              .from('user_role_selections')
              .select('selected_role')
              .eq('user_id', user.id)
              .maybeSingle();

            if (roleSelection?.selected_role) {
              return roleSelection.selected_role as VisitorRole;
            }

            // Check if user is a JBJ employee (has crm_users_profile)
            const { data: crmProfile } = await supabase
              .from('crm_users_profile')
              .select('crm_role, is_active')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .maybeSingle();

            if (crmProfile) return 'broker_jbj';

            // Check broker_profiles for partner brokers
            const { data: brokerProfile } = await supabase
              .from('broker_profiles')
              .select('broker_type')
              .eq('user_id', user.id)
              .maybeSingle();

            if (brokerProfile) {
              return brokerProfile.broker_type === 'internal' ? 'broker_jbj' : 'broker_partner';
            }

            return null;
          })();
        }

        const backendRole = await rolePromise;
        roleCache = { userId: user.id, role: backendRole };

        if (backendRole) {
          setRole(backendRole);
          localStorage.setItem(ROLE_SELECTION_KEY, backendRole);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.log('Error loading role from database:', err);
      } finally {
        if (rolePromiseUserId === user.id) {
          rolePromise = null;
          rolePromiseUserId = null;
        }
      }
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  // Helper flags
  const isBroker = role === 'broker' || role === 'broker_jbj' || role === 'broker_partner';
  const isJBJBroker = role === 'broker_jbj';
  const isPartnerBroker = role === 'broker_partner';
  const isInvestor = role === 'investor';
  const isOwner = role === 'owner';
  const isClient = role === 'client' || role === 'investor' || role === 'owner';
  const isVisitor = role === 'visitor';

  const clearRole = () => {
    localStorage.removeItem(ROLE_SELECTION_KEY);
    if (user?.id && roleCache?.userId === user.id) roleCache = null;
    setRole(null);
  };

  const setUserRole = useCallback(async (newRole: VisitorRole) => {
    if (!newRole) return;
    
    // Optimistic update
    setRole(newRole);
    localStorage.setItem(ROLE_SELECTION_KEY, newRole);
    if (user?.id) roleCache = { userId: user.id, role: newRole };

    // Persist to database if logged in
    if (user?.id) {
      try {
        await supabase
          .from('user_role_selections')
          .upsert({
            user_id: user.id,
            selected_role: newRole as any,
            confirmed_accurate: true
          }, {
            onConflict: 'user_id'
          });
      } catch (err) {
        console.error('Error saving role:', err);
      }
    }
  }, [user?.id]);

  return {
    role,
    isLoading,
    isBroker,
    isJBJBroker,
    isPartnerBroker,
    isInvestor,
    isOwner,
    isClient,
    isVisitor,
    hasSelectedRole: role !== null,
    clearRole,
    setRole: setUserRole,
    refreshRole: loadRole
  };
};
