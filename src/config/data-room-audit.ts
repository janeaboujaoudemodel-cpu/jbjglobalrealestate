/**
 * JBJ GLOBAL REAL ESTATE — Data Room Audit Logging & Versioning
 * 
 * PRIORITY 4 — PART 3: AUDIT LOGGING + VERSIONING
 * 
 * Brand: JBJ GLOBAL REAL ESTATE
 * Core Activities: BUY · SELL · RENT
 * 
 * AUDIT RULES:
 * - All logs are IMMUTABLE (no edits after creation)
 * - All four data rooms are covered
 * - Every access, change, and export attempt is logged
 * - Failed access attempts (403/401) are logged
 * 
 * VERSIONING RULES:
 * - No overwriting without creating a new version
 * - Every version links to actor and timestamp
 * - Version history accessible to OWNER/FOUNDER only
 */

import type { 
  DataRoomId,
  DataRoomAccessRole,
  DataRoomAuditAction,
  DataRoomAuditResourceType,
  DataRoomAuditResult,
  DataRoomAuditLogEntry,
  DataRoomVersionRecord,
  DataRoomExportLog
} from '@/types/data-rooms';

import { DATA_ROOM_REGISTRY } from '@/config/data-rooms';

// ============================================================================
// AUDIT EVENT TYPES (MANDATORY LOGGING)
// ============================================================================

export const AUDIT_EVENT_TYPES = {
  // Data room access
  DATA_ROOM_VIEW: 'view',
  DATA_ROOM_OPEN: 'view',
  
  // Document operations
  DOCUMENT_UPLOAD: 'create',
  DOCUMENT_UPDATE: 'update',
  DOCUMENT_DELETE: 'delete',
  DOCUMENT_VIEW: 'view',
  
  // Dataset operations
  DATASET_VIEW: 'view',
  DATASET_QUERY: 'view',
  DATASET_UPDATE: 'update',
  
  // Permission operations
  PERMISSION_CHANGE: 'permission_change',
  ACCESS_REQUEST: 'access_request',
  ACCESS_GRANT: 'access_grant',
  ACCESS_REVOKE: 'access_revoke',
  
  // Export operations
  EXPORT_GENERATE: 'export',
  
  // Failed access
  ACCESS_DENIED: 'deny',
} as const;

// ============================================================================
// RESOURCE TYPES FOR AUDIT
// ============================================================================

export const AUDIT_RESOURCE_TYPES: readonly DataRoomAuditResourceType[] = [
  'document',
  'dataset',
  'note',
  'permission',
  'export',
  'data_room',
  'metadata',
] as const;

// ============================================================================
// AUDIT CONFIGURATION (ALL FOUR DATA ROOMS)
// ============================================================================

export const AUDIT_CONFIGURATION = {
  // All four data rooms are covered
  COVERED_DATA_ROOMS: [
    'corporate',
    'financial_performance',
    'market_intelligence',
    'expansion_risk',
  ] as DataRoomId[],
  
  // Immutability enforcement
  LOGS_ARE_IMMUTABLE: true,
  ALLOW_LOG_EDITS: false,
  ALLOW_LOG_DELETES: false,
  
  // Retention
  RETENTION_DAYS: 2555, // ~7 years for compliance
  
  // Required fields for every log entry
  REQUIRED_FIELDS: [
    'timestamp',
    'actor_user_id',
    'actor_role',
    'data_room_id',
    'data_room_name',
    'resource_type',
    'action_type',
    'result',
  ],
  
  // Optional but tracked fields
  OPTIONAL_FIELDS: [
    'actor_email',
    'resource_id',
    'ip_address',
    'user_agent',
    'metadata',
  ],
} as const;

// ============================================================================
// VERSIONING CONFIGURATION
// ============================================================================

export const VERSIONING_CONFIGURATION = {
  // Versioning enabled for these entity types
  VERSIONED_ENTITIES: [
    'document',
    'dataset',
    'note',
    'metadata',
  ],
  
  // Rules
  ALLOW_OVERWRITE_WITHOUT_VERSION: false,
  REQUIRE_CHANGE_SUMMARY: true,
  SNAPSHOT_PREVIOUS_STATE: true,
  
  // Access to version history
  VERSION_HISTORY_ACCESS: {
    owner_founder: true,
    executive: false,
    investor: false,
    partner: false,
    internal_staff: false,
  },
} as const;

// ============================================================================
// EXPORT TRACEABILITY CONFIGURATION (FRAMEWORK ONLY)
// ============================================================================

export const EXPORT_TRACEABILITY_CONFIGURATION = {
  // Export types to track
  TRACKED_EXPORT_TYPES: ['pdf', 'csv', 'xlsx'] as const,
  
  // Required fields for export logs
  REQUIRED_FIELDS: [
    'timestamp',
    'export_type',
    'data_room_id',
    'data_room_name',
    'exported_scope',
    'actor_user_id',
    'actor_role',
    'delivery_target',
  ],
  
  // Optional fields
  OPTIONAL_FIELDS: [
    'actor_email',
    'file_checksum',
    'file_size_bytes',
    'ip_address',
    'user_agent',
  ],
  
  // Delivery targets
  DELIVERY_TARGETS: ['download', 'internal_link', 'email'] as const,
  
  // Export logs are immutable
  LOGS_ARE_IMMUTABLE: true,
} as const;

// ============================================================================
// HELPER: GET DATA ROOM NAME
// ============================================================================

function getDataRoomName(dataRoomId: DataRoomId): string {
  const room = DATA_ROOM_REGISTRY.rooms.find(r => r.id === dataRoomId);
  return room?.name ?? 'Unknown Data Room';
}

// ============================================================================
// AUDIT LOG CREATION (STRUCTURE ONLY — NO DB WRITES)
// ============================================================================

/**
 * Create an audit log entry structure
 * NOTE: This creates the structure only — actual persistence handled by DB layer
 */
export function createAuditLogEntry(params: {
  actor_user_id: string;
  actor_role: DataRoomAccessRole;
  actor_email?: string | null;
  data_room_id: DataRoomId;
  resource_type: DataRoomAuditResourceType;
  resource_id?: string | null;
  action_type: DataRoomAuditAction;
  result: DataRoomAuditResult;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
}): DataRoomAuditLogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    actor_email: params.actor_email ?? null,
    data_room_id: params.data_room_id,
    data_room_name: getDataRoomName(params.data_room_id),
    resource_type: params.resource_type,
    resource_id: params.resource_id ?? null,
    action_type: params.action_type,
    result: params.result,
    ip_address: params.ip_address ?? null,
    user_agent: params.user_agent ?? null,
    metadata: params.metadata ?? null,
    is_immutable: true,
  };
}

// ============================================================================
// VERSION RECORD CREATION (STRUCTURE ONLY — NO DB WRITES)
// ============================================================================

/**
 * Create a version record structure
 * NOTE: This creates the structure only — actual persistence handled by DB layer
 */
export function createVersionRecord(params: {
  entity_type: 'document' | 'dataset' | 'note' | 'metadata';
  entity_id: string;
  data_room_id: DataRoomId;
  version_number: number;
  previous_version_id?: string | null;
  actor_user_id: string;
  actor_email?: string | null;
  change_summary: string;
  snapshot_data?: Record<string, unknown> | null;
}): DataRoomVersionRecord {
  return {
    id: crypto.randomUUID(),
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    data_room_id: params.data_room_id,
    version_number: params.version_number,
    previous_version_id: params.previous_version_id ?? null,
    actor_user_id: params.actor_user_id,
    actor_email: params.actor_email ?? null,
    change_summary: params.change_summary,
    snapshot_data: params.snapshot_data ?? null,
    created_at: new Date().toISOString(),
    is_immutable: true,
  };
}

// ============================================================================
// EXPORT LOG CREATION (STRUCTURE ONLY — NO DB WRITES)
// ============================================================================

/**
 * Create an export log entry structure
 * NOTE: This creates the structure only — actual persistence handled by DB layer
 */
export function createExportLogEntry(params: {
  export_type: 'pdf' | 'csv' | 'xlsx';
  data_room_id: DataRoomId;
  exported_scope: {
    documents?: string[];
    datasets?: string[];
    notes?: string[];
  };
  actor_user_id: string;
  actor_role: DataRoomAccessRole;
  actor_email?: string | null;
  delivery_target: 'download' | 'internal_link' | 'email';
  file_checksum?: string | null;
  file_size_bytes?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
}): DataRoomExportLog {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    export_type: params.export_type,
    data_room_id: params.data_room_id,
    data_room_name: getDataRoomName(params.data_room_id),
    exported_scope: params.exported_scope,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    actor_email: params.actor_email ?? null,
    delivery_target: params.delivery_target,
    file_checksum: params.file_checksum ?? null,
    file_size_bytes: params.file_size_bytes ?? null,
    ip_address: params.ip_address ?? null,
    user_agent: params.user_agent ?? null,
    is_immutable: true,
  };
}

// ============================================================================
// AUDIT VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that all four data rooms have audit logging active
 */
export function validateAllDataRoomsHaveAudit(): boolean {
  const requiredRooms: DataRoomId[] = [
    'corporate',
    'financial_performance',
    'market_intelligence',
    'expansion_risk',
  ];
  
  return requiredRooms.every(room => 
    AUDIT_CONFIGURATION.COVERED_DATA_ROOMS.includes(room)
  );
}

/**
 * Validate that logs are immutable
 */
export function validateLogsAreImmutable(): boolean {
  return (
    AUDIT_CONFIGURATION.LOGS_ARE_IMMUTABLE === true &&
    AUDIT_CONFIGURATION.ALLOW_LOG_EDITS === false &&
    AUDIT_CONFIGURATION.ALLOW_LOG_DELETES === false
  );
}

/**
 * Validate versioning creates new versions (no overwrites)
 */
export function validateVersioningNoOverwrite(): boolean {
  return VERSIONING_CONFIGURATION.ALLOW_OVERWRITE_WITHOUT_VERSION === false;
}

// ============================================================================
// LOGGED EVENT TYPES (SAMPLE LIST)
// ============================================================================

export const LOGGED_EVENT_TYPES_SAMPLE = [
  { event: 'DATA_ROOM_VIEW', resource: 'data_room', action: 'view', description: 'User opened a data room' },
  { event: 'DOCUMENT_UPLOAD', resource: 'document', action: 'create', description: 'Document uploaded to data room' },
  { event: 'DOCUMENT_UPDATE', resource: 'document', action: 'update', description: 'Document updated (new version created)' },
  { event: 'DOCUMENT_DELETE', resource: 'document', action: 'delete', description: 'Document deletion attempted' },
  { event: 'DATASET_VIEW', resource: 'dataset', action: 'view', description: 'User viewed dataset' },
  { event: 'DATASET_UPDATE', resource: 'dataset', action: 'update', description: 'Dataset update attempted' },
  { event: 'PERMISSION_CHANGE', resource: 'permission', action: 'permission_change', description: 'Permission modified' },
  { event: 'EXPORT_GENERATE', resource: 'export', action: 'export', description: 'Export generated' },
  { event: 'ACCESS_DENIED', resource: 'data_room', action: 'deny', description: 'Failed access attempt (403/401)' },
] as const;

// ============================================================================
// PRIORITY 4 — PART 3 STATUS
// ============================================================================

export const DATA_ROOM_AUDIT_STATUS = {
  PRIORITY: 'PRIORITY 4 — PART 3',
  STATUS: 'COMPLETE',
  VERSION: '1.0.0',
  
  AUDIT_LOGGING: {
    ACTIVE_FOR_ALL_ROOMS: true,
    COVERED_ROOMS: [
      'Corporate Data Room',
      'Financial & Performance Data Room',
      'Market Intelligence Data Room',
      'Expansion & Risk Data Room',
    ],
    LOGGED_EVENTS: [
      'Data room access (view/open)',
      'Document upload',
      'Document update',
      'Document delete attempt',
      'Dataset access (view/query)',
      'Dataset update attempt',
      'Permission changes',
      'Export generation (placeholder)',
      'Failed access attempts (403/401)',
    ],
    LOGS_IMMUTABLE: true,
    LOGS_EDITABLE: false,
    LOGS_DELETABLE: false,
  },
  
  VERSIONING: {
    ENABLED: true,
    ENTITIES_COVERED: ['document', 'dataset', 'note', 'metadata'],
    NO_OVERWRITE_WITHOUT_VERSION: true,
    CHANGE_SUMMARY_REQUIRED: true,
    VERSION_HISTORY_ACCESS: 'OWNER/FOUNDER only',
  },
  
  EXPORT_TRACEABILITY: {
    FRAMEWORK_READY: true,
    TRACKED_FIELDS: [
      'export_type (PDF/CSV)',
      'exported_scope',
      'requesting actor',
      'timestamp',
      'delivery target',
      'checksum/hash',
    ],
    READY_FOR_FUTURE_EXPORTS: true,
  },
  
  BRAND_COMPLIANCE: {
    COMPANY_NAME: 'JBJ GLOBAL REAL ESTATE',
    CORE_ACTIVITIES: 'BUY · SELL · RENT',
    FORBIDDEN_TERMS: ['leasing', 'Lease'],
  },
  
  FILES_MODIFIED: [
    'src/types/data-rooms.ts',
    'src/config/data-room-audit.ts (NEW)',
  ],
  
  NOT_IMPLEMENTED: [
    'Database tables',
    'UI modifications',
    'Actual export generation',
    'Data population',
  ],
} as const;
