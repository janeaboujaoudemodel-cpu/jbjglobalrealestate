import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tenancy } from "@/services/tenancy";
import type { OrgPermission, OrgRole, Organization } from "@/types/tenancy";

interface TenancyContextValue {
  loading: boolean;
  organizations: Organization[];
  currentOrgId: string | null;
  currentOrg: Organization | null;
  role: OrgRole | null;
  permissions: Set<OrgPermission>;
  hasPermission: (perm: OrgPermission) => boolean;
  setCurrentOrg: (orgId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const TenancyContext = createContext<TenancyContextValue | undefined>(undefined);

/**
 * Multi-tenancy provider. Loads the user's organizations, current
 * organization selection, role in that organization, and the effective
 * permission set derived from `role_permissions`. Pages that need to
 * gate UI on permission can call `hasPermission("crm.leads.write")`.
 */
export function TenancyProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(null);
  const [role, setRole] = useState<OrgRole | null>(null);
  const [permissions, setPermissions] = useState<Set<OrgPermission>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        setOrganizations([]);
        setCurrentOrgIdState(null);
        setRole(null);
        setPermissions(new Set());
        return;
      }
      const orgs = await tenancy.listMyOrganizations();
      setOrganizations(orgs);
      let currentId = await tenancy.getCurrentOrgId();
      if (!currentId && orgs[0]) {
        currentId = orgs[0].id;
        try { await tenancy.setCurrentOrg(currentId); } catch { /* ignore */ }
      }
      setCurrentOrgIdState(currentId);

      if (currentId) {
        const r = await tenancy.getMyRole(currentId);
        setRole(r);
        if (r) {
          const { data: perms } = await supabase
            .from("role_permissions")
            .select("permission")
            .eq("role", r);
          setPermissions(new Set((perms ?? []).map((p: any) => p.permission as OrgPermission)));
        } else {
          setPermissions(new Set());
        }
      } else {
        setRole(null);
        setPermissions(new Set());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { load(); });
    return () => { sub.subscription.unsubscribe(); };
  }, [load]);

  const setCurrentOrg = useCallback(async (orgId: string) => {
    await tenancy.setCurrentOrg(orgId);
    await load();
  }, [load]);

  const hasPermission = useCallback(
    (perm: OrgPermission) => permissions.has(perm),
    [permissions],
  );

  const value = useMemo<TenancyContextValue>(() => ({
    loading,
    organizations,
    currentOrgId,
    currentOrg: organizations.find((o) => o.id === currentOrgId) ?? null,
    role,
    permissions,
    hasPermission,
    setCurrentOrg,
    refresh: load,
  }), [loading, organizations, currentOrgId, role, permissions, hasPermission, setCurrentOrg, load]);

  return <TenancyContext.Provider value={value}>{children}</TenancyContext.Provider>;
}

export function useTenancy(): TenancyContextValue {
  const ctx = useContext(TenancyContext);
  if (!ctx) throw new Error("useTenancy must be used within <TenancyProvider>");
  return ctx;
}

/**
 * Optional soft accessor for components that render outside the provider.
 * Returns a stubbed context with empty state instead of throwing.
 */
export function useTenancyOptional(): TenancyContextValue | null {
  return useContext(TenancyContext) ?? null;
}
