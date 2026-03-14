/**
 * Developer Activity Logging Hook
 * Logs all developer portal actions to developer_activity_log table.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type DevActivityType = 
  | 'upload' | 'edit' | 'duplicate_attempt' | 'failed_upload' 
  | 'session_end' | 'approval' | 'file_rejected' | 'protected_field_attempt';

export type DevEntityType = 'project' | 'event' | 'launch' | 'file' | 'profile';

interface LogActivityParams {
  activityType: DevActivityType;
  entityType: DevEntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
  riskFlags?: string[];
  developerName?: string;
  developerEmail?: string;
}

export function useDeveloperActivityLog() {
  const { user } = useAuth();

  const logActivity = useCallback(async (params: LogActivityParams) => {
    if (!user?.id) return;

    try {
      await (supabase as any).from('developer_activity_log').insert({
        user_id: user.id,
        developer_name: params.developerName || null,
        developer_email: params.developerEmail || user.email || null,
        activity_type: params.activityType,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        entity_name: params.entityName || null,
        details: params.details || {},
        risk_flags: params.riskFlags || [],
      });
    } catch (err) {
      console.warn('Failed to log developer activity:', err);
    }
  }, [user?.id, user?.email]);

  const logFileValidation = useCallback(async (
    fileName: string,
    fileType: string,
    fileSizeBytes: number,
    isValid: boolean,
    rejectionReason: string | null,
    sanitizedName: string,
    uploadId?: string,
  ) => {
    if (!user?.id) return;

    try {
      await (supabase as any).from('developer_file_validations').insert({
        upload_id: uploadId || null,
        user_id: user.id,
        file_name: fileName,
        file_type: fileType,
        file_size_bytes: fileSizeBytes,
        is_valid: isValid,
        rejection_reason: rejectionReason,
        sanitized_name: sanitizedName,
      });
    } catch (err) {
      console.warn('Failed to log file validation:', err);
    }
  }, [user?.id]);

  return { logActivity, logFileValidation };
}
