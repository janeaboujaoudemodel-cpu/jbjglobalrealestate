import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";
import { logGlobalAudit } from "@/hooks/useGlobalAudit";

type AuditActionType = Database['public']['Enums']['audit_action_type'] extends never 
  ? 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'approve' | 'reject' | 'block' | 'unblock'
  : Database['public']['Enums']['audit_action_type'];

type AuditResourceType = Database['public']['Enums']['audit_resource_type'] extends never
  ? 'user' | 'project' | 'subscription' | 'lead' | 'discount_code' | 'ip_blocklist' | 'rate_limit' | 'document' | 'settings' | 'role'
  : Database['public']['Enums']['audit_resource_type'];

// Export types for external use
export type { AuditActionType, AuditResourceType };

interface AuditLogParams {
  actionType: AuditActionType;
  resourceType: AuditResourceType;
  resourceId?: string;
  description: string;
  details?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = useCallback(async ({
    actionType,
    resourceType,
    resourceId,
    description,
    details = {}
  }: AuditLogParams) => {
    if (!user) {
      console.warn("Cannot log audit action: No authenticated user");
      return { success: false, error: "No authenticated user" };
    }

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          user_email: user.email,
          action_type: actionType,
          resource_type: resourceType,
          resource_id: resourceId,
          description,
          details,
          user_agent: navigator.userAgent
        } as any);

      if (error) {
        console.error("Failed to log audit action:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("Audit log error:", err);
      return { success: false, error: "Unknown error" };
    }
  }, [user]);

  return { logAction };
}

// Standalone function for edge functions or non-hook contexts
export async function logAuditAction(params: AuditLogParams & { userId: string; userEmail?: string }) {
  const { userId, userEmail, actionType, resourceType, resourceId, description, details = {} } = params;

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      user_email: userEmail,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      description,
      details
    } as any);

  if (error) {
    console.error("Failed to log audit action:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
