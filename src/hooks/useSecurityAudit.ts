import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AuditActionType = 
  | 'read' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'export' 
  | 'approve' 
  | 'reject'
  | 'login'
  | 'logout'
  | 'block';

export type AuditResourceType = 
  | 'lead' 
  | 'project' 
  | 'document' 
  | 'user' 
  | 'settings'
  | 'subscription';

interface AuditLogEntry {
  action_type: AuditActionType;
  resource_type: AuditResourceType;
  resource_id?: string;
  description: string;
  details?: Record<string, unknown>;
}

/**
 * useSecurityAudit - Hook for logging security-relevant actions
 * All admin actions are logged for compliance and traceability
 */
export function useSecurityAudit() {
  const logAction = useCallback(async (entry: AuditLogEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('[Audit] No authenticated user for audit log');
        return;
      }

      const { error } = await supabase.from('audit_logs').insert([{
        user_id: user.id,
        user_email: user.email,
        action_type: entry.action_type as 'read' | 'create' | 'update' | 'delete' | 'export' | 'approve' | 'reject' | 'login' | 'logout' | 'block' | 'import' | 'unblock',
        resource_type: entry.resource_type as 'lead' | 'project' | 'document' | 'user' | 'settings' | 'subscription' | 'discount_code' | 'ip_blocklist' | 'rate_limit' | 'role',
        resource_id: entry.resource_id || null,
        description: entry.description,
        details: (entry.details || {}) as Record<string, never>,
        ip_address: '0.0.0.0',
      }]);

      if (error) {
        console.error('[Audit] Failed to log action:', error);
      }
    } catch (err) {
      console.error('[Audit] Error logging action:', err);
    }
  }, []);

  const logView = useCallback((resourceType: AuditResourceType, resourceId: string, description: string) => {
    return logAction({
      action_type: 'read',
      resource_type: resourceType,
      resource_id: resourceId,
      description,
    });
  }, [logAction]);

  const logCreate = useCallback((resourceType: AuditResourceType, resourceId: string, description: string, details?: Record<string, unknown>) => {
    return logAction({
      action_type: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      description,
      details,
    });
  }, [logAction]);

  const logUpdate = useCallback((resourceType: AuditResourceType, resourceId: string, description: string, details?: Record<string, unknown>) => {
    return logAction({
      action_type: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      description,
      details,
    });
  }, [logAction]);

  const logDelete = useCallback((resourceType: AuditResourceType, resourceId: string, description: string) => {
    return logAction({
      action_type: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
      description,
    });
  }, [logAction]);

  const logApproval = useCallback((resourceType: AuditResourceType, resourceId: string, approved: boolean, details?: Record<string, unknown>) => {
    return logAction({
      action_type: approved ? 'approve' : 'reject',
      resource_type: resourceType,
      resource_id: resourceId,
      description: `${approved ? 'Approved' : 'Rejected'} ${resourceType} ${resourceId}`,
      details,
    });
  }, [logAction]);

  const logSecurityViolation = useCallback((description: string, details?: Record<string, unknown>) => {
    return logAction({
      action_type: 'block',
      resource_type: 'settings',
      description,
      details,
    });
  }, [logAction]);

  return {
    logAction,
    logView,
    logCreate,
    logUpdate,
    logDelete,
    logApproval,
    logSecurityViolation,
  };
}

export default useSecurityAudit;
