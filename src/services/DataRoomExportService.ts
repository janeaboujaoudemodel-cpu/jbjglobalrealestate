/**
 * DATA ROOM EXPORT SERVICE
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Service for generating and managing data room exports.
 * Exports are read-only, timestamped, auditable, and revocable.
 */

import type { DataRoomId, DataRoomAccessRole } from '@/types/data-rooms';
import {
  type ExportFormat,
  type DataRoomExportLogEntry,
  type ExportMetadata,
  EXPORTABLE_DATA_ROOMS,
  EXPORT_ACCESS_BY_ROLE,
  EXPORT_CONFIGURATION,
  EXPORT_DISCLAIMERS,
  isDataRoomExportable,
  canRoleExportFromRoom,
  exportRequiresApproval,
  generateExportId,
  createExportMetadata,
  createExportLogEntry,
} from '@/config/data-room-exports';
import { getDataRoomById } from '@/config/data-rooms';

// ============================================================
// EXPORT STATE
// ============================================================

interface ExportServiceState {
  exports: Map<string, DataRoomExportLogEntry>;
  pendingExports: Map<string, string>; // export_id -> status
}

let state: ExportServiceState = {
  exports: new Map(),
  pendingExports: new Map(),
};

// ============================================================
// STATE OBSERVERS
// ============================================================

type StateObserver = (state: ExportServiceState) => void;
const observers: Set<StateObserver> = new Set();

function notifyObservers() {
  observers.forEach((observer) => observer(state));
}

export function subscribeToExportState(observer: StateObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

// ============================================================
// CHECKSUM GENERATION (SHA-256 simulation)
// ============================================================

async function generateChecksum(content: string): Promise<string> {
  // In browser, use SubtleCrypto API
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// ============================================================
// EXPORT GENERATION
// ============================================================

export interface ExportRequest {
  data_room_id: DataRoomId;
  export_type: ExportFormat;
  scope: {
    documents?: string[];
    datasets?: string[];
    sections?: string[];
  };
  actor_user_id: string;
  actor_role: DataRoomAccessRole;
  actor_email?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ExportResult {
  success: boolean;
  export_id?: string;
  export_log?: DataRoomExportLogEntry;
  metadata?: ExportMetadata;
  content?: string; // Base64 or string content
  error?: string;
}

/**
 * Generate an export from a data room
 */
export async function generateExport(request: ExportRequest): Promise<ExportResult> {
  // Validate data room is exportable
  if (!isDataRoomExportable(request.data_room_id)) {
    return {
      success: false,
      error: `Data room '${request.data_room_id}' is not exportable. Only corporate, financial_performance, and expansion_risk data rooms allow exports.`,
    };
  }

  // Validate role has export access
  if (!canRoleExportFromRoom(request.actor_role, request.data_room_id)) {
    return {
      success: false,
      error: `Role '${request.actor_role}' does not have permission to export from '${request.data_room_id}'.`,
    };
  }

  // Check if approval is required
  if (exportRequiresApproval(request.actor_role)) {
    return {
      success: false,
      error: `Role '${request.actor_role}' requires explicit approval before generating exports.`,
    };
  }

  // Get data room info
  const dataRoom = getDataRoomById(request.data_room_id);
  if (!dataRoom) {
    return {
      success: false,
      error: 'Data room not found',
    };
  }

  // Generate export content (placeholder - in real implementation, fetch actual data)
  const exportContent = generateExportContent(request);
  const checksum = await generateChecksum(exportContent);
  const fileSizeBytes = new TextEncoder().encode(exportContent).length;

  // Create export metadata
  const export_id = generateExportId();
  const metadata = createExportMetadata({
    source_data_room: dataRoom.name,
    user_id: request.actor_user_id,
    role: request.actor_role,
    email: request.actor_email,
    export_id,
  });

  // Create export log entry
  const exportLog = createExportLogEntry({
    export_type: request.export_type,
    data_room_id: request.data_room_id,
    data_room_name: dataRoom.name,
    scope: request.scope,
    actor_user_id: request.actor_user_id,
    actor_role: request.actor_role,
    actor_email: request.actor_email,
    checksum,
    file_size_bytes: fileSizeBytes,
    ip_address: request.ip_address,
    user_agent: request.user_agent,
  });

  // Store in state
  state.exports.set(exportLog.export_id, exportLog);
  notifyObservers();

  return {
    success: true,
    export_id: exportLog.export_id,
    export_log: exportLog,
    metadata,
    content: exportContent,
  };
}

/**
 * Generate export content (placeholder implementation)
 */
function generateExportContent(request: ExportRequest): string {
  const dataRoom = getDataRoomById(request.data_room_id);
  const timestamp = new Date().toISOString();

  if (request.export_type === 'csv') {
    return [
      '# JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT',
      `# Export from: ${dataRoom?.name || request.data_room_id}`,
      `# Generated: ${timestamp}`,
      `# Export ID: ${generateExportId()}`,
      '# This document is read-only and cannot be modified after generation.',
      '',
      'Category,Item,Value,Date',
      // Placeholder data rows would be populated from actual data room content
      '"Placeholder","Data export placeholder","[DATA]","' + timestamp + '"',
    ].join('\n');
  }

  // PDF content placeholder (would use pdf-lib in real implementation)
  return JSON.stringify({
    brand: 'JBJ GLOBAL REAL ESTATE',
    activities: 'BUY · SELL · RENT',
    source: dataRoom?.name || request.data_room_id,
    generated_at: timestamp,
    disclaimer: EXPORT_DISCLAIMERS.GENERAL,
    read_only: true,
    scope: request.scope,
  }, null, 2);
}

/**
 * Revoke an export
 */
export function revokeExport(
  export_id: string,
  revoked_by: string,
  reason: string
): { success: boolean; error?: string } {
  const exportLog = state.exports.get(export_id);

  if (!exportLog) {
    return { success: false, error: 'Export not found' };
  }

  if (exportLog.is_revoked) {
    return { success: false, error: 'Export is already revoked' };
  }

  // Update the export log
  const updatedLog: DataRoomExportLogEntry = {
    ...exportLog,
    is_revoked: true,
    revoked_at: new Date().toISOString(),
    revoked_by,
    revocation_reason: reason,
  };

  state.exports.set(export_id, updatedLog);
  notifyObservers();

  return { success: true };
}

/**
 * Get export log by ID
 */
export function getExportLog(export_id: string): DataRoomExportLogEntry | undefined {
  return state.exports.get(export_id);
}

/**
 * Get all export logs for a data room
 */
export function getExportLogsForDataRoom(data_room_id: DataRoomId): DataRoomExportLogEntry[] {
  return Array.from(state.exports.values()).filter(
    (log) => log.data_room_id === data_room_id
  );
}

/**
 * Get all export logs for a user
 */
export function getExportLogsForUser(user_id: string): DataRoomExportLogEntry[] {
  return Array.from(state.exports.values()).filter(
    (log) => log.actor_user_id === user_id
  );
}

/**
 * Get service status
 */
export function getExportServiceStatus(): {
  configuration: typeof EXPORT_CONFIGURATION;
  total_exports: number;
  active_exports: number;
  revoked_exports: number;
  exports_by_room: Record<DataRoomId, number>;
  exports_by_type: Record<ExportFormat, number>;
} {
  const exports = Array.from(state.exports.values());

  const exportsByRoom: Record<string, number> = {};
  const exportsByType: Record<string, number> = { pdf: 0, csv: 0 };

  exports.forEach((log) => {
    exportsByRoom[log.data_room_id] = (exportsByRoom[log.data_room_id] || 0) + 1;
    exportsByType[log.export_type] = (exportsByType[log.export_type] || 0) + 1;
  });

  return {
    configuration: EXPORT_CONFIGURATION,
    total_exports: exports.length,
    active_exports: exports.filter((e) => !e.is_revoked).length,
    revoked_exports: exports.filter((e) => e.is_revoked).length,
    exports_by_room: exportsByRoom as Record<DataRoomId, number>,
    exports_by_type: exportsByType as Record<ExportFormat, number>,
  };
}

/**
 * Reset service state (for testing)
 */
export function resetExportServiceState(): void {
  state = {
    exports: new Map(),
    pendingExports: new Map(),
  };
  notifyObservers();
}
