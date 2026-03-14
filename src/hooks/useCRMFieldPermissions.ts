import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FieldPermission {
  field_name: string;
  can_view: boolean;
  can_edit: boolean;
  show_masked: boolean;
}

interface UseCRMFieldPermissionsReturn {
  permissions: FieldPermission[];
  loading: boolean;
  canViewField: (fieldName: string) => boolean;
  canEditField: (fieldName: string) => boolean;
  shouldMask: (fieldName: string) => boolean;
  maskValue: (fieldName: string, value: string | null) => string;
  isOwnerRole: boolean;
}

const OWNER_ROLES = ["owner_admin", "founder"];

export function useCRMFieldPermissions(crmRole: string | null): UseCRMFieldPermissionsReturn {
  const [permissions, setPermissions] = useState<FieldPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnerRole = useMemo(() => 
    crmRole ? OWNER_ROLES.includes(crmRole) : false, 
    [crmRole]
  );

  useEffect(() => {
    if (!crmRole) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("crm_field_permissions")
        .select("field_name, can_view, can_edit, show_masked")
        .eq("crm_role", crmRole);

      if (!error && data) {
        setPermissions(data);
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [crmRole]);

  const canViewField = useCallback((fieldName: string): boolean => {
    if (isOwnerRole) return true;
    const perm = permissions.find(p => p.field_name === fieldName);
    return perm?.can_view ?? false;
  }, [permissions, isOwnerRole]);

  const canEditField = useCallback((fieldName: string): boolean => {
    if (isOwnerRole) return true;
    const perm = permissions.find(p => p.field_name === fieldName);
    return perm?.can_edit ?? false;
  }, [permissions, isOwnerRole]);

  const shouldMask = useCallback((fieldName: string): boolean => {
    if (isOwnerRole) return false;
    const perm = permissions.find(p => p.field_name === fieldName);
    return perm?.show_masked ?? false;
  }, [permissions, isOwnerRole]);

  const maskValue = useCallback((fieldName: string, value: string | null): string => {
    if (!value) return "—";
    if (isOwnerRole) return value;

    const perm = permissions.find(p => p.field_name === fieldName);
    if (!perm) return "••••••";
    if (perm.can_view) return value;
    if (perm.show_masked) {
      // Mask middle of value
      if (fieldName === "phone_e164" && value.length > 6) {
        return value.slice(0, 4) + " ••• " + value.slice(-3);
      }
      if (fieldName === "email_lower" && value.includes("@")) {
        const [local, domain] = value.split("@");
        return local.slice(0, 2) + "•••@" + domain;
      }
      return value.slice(0, 2) + "•••" + value.slice(-2);
    }
    return "••••••";
  }, [permissions, isOwnerRole]);

  return { permissions, loading, canViewField, canEditField, shouldMask, maskValue, isOwnerRole };
}
