/**
 * DATA ROOM EXPORTS HOOK
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * React hook for generating and managing data room exports.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DataRoomId, DataRoomAccessRole } from '@/types/data-rooms';
import {
  type ExportFormat,
  type DataRoomExportLogEntry,
  EXPORTABLE_DATA_ROOMS,
  ALLOWED_EXPORT_FORMATS,
  DATA_ROOM_EXPORT_STATUS,
  isDataRoomExportable,
  canRoleExportFromRoom,
} from '@/config/data-room-exports';
import {
  type ExportRequest,
  type ExportResult,
  generateExport,
  revokeExport,
  getExportLog,
  getExportLogsForDataRoom,
  getExportLogsForUser,
  getExportServiceStatus,
  subscribeToExportState,
} from '@/services/DataRoomExportService';

export interface DataRoomExportState {
  exports: DataRoomExportLogEntry[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

export function useDataRoomExports(actorRole: DataRoomAccessRole = 'owner_founder') {
  const [state, setState] = useState<DataRoomExportState>({
    exports: [],
    isLoading: true,
    isGenerating: false,
    error: null,
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToExportState(() => {
      refreshData();
    });

    // Initial load
    refreshData();

    return unsubscribe;
  }, []);

  const refreshData = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const status = getExportServiceStatus();
      
      setState((prev) => ({
        ...prev,
        exports: [], // Would populate from service
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
    }
  }, []);

  const createExport = useCallback(
    async (params: {
      data_room_id: DataRoomId;
      export_type: ExportFormat;
      scope?: {
        documents?: string[];
        datasets?: string[];
        sections?: string[];
      };
      actor_user_id: string;
      actor_email?: string;
    }): Promise<ExportResult> => {
      setState((prev) => ({ ...prev, isGenerating: true, error: null }));

      try {
        const result = await generateExport({
          ...params,
          scope: params.scope || {},
          actor_role: actorRole,
        });

        setState((prev) => ({ ...prev, isGenerating: false }));

        if (!result.success) {
          setState((prev) => ({ ...prev, error: result.error || 'Export failed' }));
        }

        return result;
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [actorRole]
  );

  const revokeExportById = useCallback(
    (export_id: string, reason: string, revoked_by: string) => {
      return revokeExport(export_id, revoked_by, reason);
    },
    []
  );

  const getExportById = useCallback((export_id: string) => {
    return getExportLog(export_id);
  }, []);

  const getExportsForRoom = useCallback((data_room_id: DataRoomId) => {
    return getExportLogsForDataRoom(data_room_id);
  }, []);

  const getExportsForUser = useCallback((user_id: string) => {
    return getExportLogsForUser(user_id);
  }, []);

  const canExport = useCallback(
    (data_room_id: DataRoomId) => {
      return canRoleExportFromRoom(actorRole, data_room_id);
    },
    [actorRole]
  );

  const isExportable = useCallback((data_room_id: DataRoomId) => {
    return isDataRoomExportable(data_room_id);
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    refreshData,
    createExport,
    revokeExport: revokeExportById,
    getExportById,
    getExportsForRoom,
    getExportsForUser,
    canExport,
    isExportable,

    // Constants
    exportableRooms: EXPORTABLE_DATA_ROOMS,
    allowedFormats: ALLOWED_EXPORT_FORMATS,
    systemStatus: DATA_ROOM_EXPORT_STATUS,
    getServiceStatus: getExportServiceStatus,
  };
}
