/**
 * DATA ROOM EXPORT SYSTEM
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Investor-grade export configuration with full traceability.
 * Exports are read-only, timestamped, and non-editable after generation.
 */

import type { DataRoomId, DataRoomAccessRole } from '@/types/data-rooms';

// ============================================================
// EXPORTABLE DATA ROOMS (LOCKED)
// ============================================================

/**
 * Only these data rooms may have exports generated.
 * Public Market Intelligence is explicitly EXCLUDED.
 */
export const EXPORTABLE_DATA_ROOMS: DataRoomId[] = [
  'corporate',
  'financial_performance',
  'expansion_risk',
] as const;

/**
 * Market Intelligence is NOT exportable - regulatory compliance
 */
export const NON_EXPORTABLE_DATA_ROOMS: DataRoomId[] = [
  'market_intelligence',
] as const;

// ============================================================
// EXPORT TYPES (LOCKED)
// ============================================================

export type ExportFormat = 'pdf' | 'csv';

export const ALLOWED_EXPORT_FORMATS: ExportFormat[] = ['pdf', 'csv'];

// ============================================================
// EXPORT ACCESS RULES
// ============================================================

/**
 * Who can generate exports from each data room
 */
export const EXPORT_ACCESS_BY_ROLE: Record<DataRoomAccessRole, {
  canExport: boolean;
  allowedRooms: DataRoomId[];
  requiresApproval: boolean;
}> = {
  owner_founder: {
    canExport: true,
    allowedRooms: ['corporate', 'financial_performance', 'expansion_risk'],
    requiresApproval: false,
  },
  executive: {
    canExport: true,
    allowedRooms: ['corporate', 'financial_performance'],
    requiresApproval: true,
  },
  investor: {
    canExport: false,
    allowedRooms: [],
    requiresApproval: true,
  },
  partner: {
    canExport: false,
    allowedRooms: [],
    requiresApproval: false,
  },
  internal_staff: {
    canExport: false,
    allowedRooms: [],
    requiresApproval: false,
  },
};

// ============================================================
// EXPORT LOG ENTRY STRUCTURE
// ============================================================

export interface DataRoomExportLogEntry {
  /** Unique export identifier */
  export_id: string;
  /** Export format: PDF or CSV */
  export_type: ExportFormat;
  /** Target data room ID */
  data_room_id: DataRoomId;
  /** Human-readable data room name */
  data_room_name: string;
  /** What was included in the export */
  scope: {
    documents?: string[];
    datasets?: string[];
    sections?: string[];
    date_range?: {
      from: string;
      to: string;
    };
  };
  /** User who generated the export */
  actor_user_id: string;
  /** Role of the actor */
  actor_role: DataRoomAccessRole;
  /** Actor email if available */
  actor_email?: string | null;
  /** Generation timestamp (immutable) */
  generated_at: string;
  /** SHA-256 hash of export content */
  checksum: string;
  /** File size in bytes */
  file_size_bytes: number;
  /** Is export still accessible */
  is_revoked: boolean;
  /** Revocation details if applicable */
  revoked_at?: string | null;
  revoked_by?: string | null;
  revocation_reason?: string | null;
  /** IP address of generator */
  ip_address?: string | null;
  /** User agent of generator */
  user_agent?: string | null;
}

// ============================================================
// EXPORT METADATA (INCLUDED IN EVERY EXPORT)
// ============================================================

export interface ExportMetadata {
  /** Brand attribution */
  brand: 'JBJ GLOBAL REAL ESTATE';
  /** Core activities */
  activities: 'BUY · SELL · RENT';
  /** Source data room */
  source_data_room: string;
  /** Generation timestamp */
  generated_at: string;
  /** Generator identity */
  generated_by: {
    user_id: string;
    role: DataRoomAccessRole;
    email?: string;
  };
  /** Export ID for traceability */
  export_id: string;
  /** Disclaimer */
  disclaimer: string;
  /** Read-only notice */
  read_only_notice: string;
}

// ============================================================
// EXPORT CONFIGURATION
// ============================================================

export const EXPORT_CONFIGURATION = {
  /** Exports are read-only after generation */
  EXPORTS_ARE_READ_ONLY: true,
  /** Exports cannot be edited after generation */
  EXPORTS_ARE_IMMUTABLE: true,
  /** Exports must include source attribution */
  REQUIRE_SOURCE_ATTRIBUTION: true,
  /** Exports must include generation date */
  REQUIRE_GENERATION_DATE: true,
  /** Exports must include actor identity */
  REQUIRE_ACTOR_IDENTITY: true,
  /** Exports can be revoked */
  EXPORTS_ARE_REVOCABLE: true,
  /** Log retention period in days */
  LOG_RETENTION_DAYS: 2555, // ~7 years for compliance
} as const;

// ============================================================
// MANDATORY DISCLAIMERS FOR EXPORTS
// ============================================================

export const EXPORT_DISCLAIMERS = {
  GENERAL: 'This export is generated by JBJ GLOBAL REAL ESTATE for internal use only. Contents are confidential and proprietary.',
  READ_ONLY: 'This document is read-only and cannot be modified after generation.',
  SOURCE_ATTRIBUTION: 'Data sourced from JBJ GLOBAL REAL ESTATE internal data rooms.',
  NO_REDISTRIBUTION: 'Redistribution or sharing outside authorized recipients is prohibited.',
  AUDIT_NOTICE: 'This export is logged and auditable. Export ID is included for traceability.',
} as const;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if a data room is exportable
 */
export function isDataRoomExportable(dataRoomId: DataRoomId): boolean {
  return EXPORTABLE_DATA_ROOMS.includes(dataRoomId);
}

/**
 * Check if a role can export from a specific data room
 */
export function canRoleExportFromRoom(
  role: DataRoomAccessRole,
  dataRoomId: DataRoomId
): boolean {
  const access = EXPORT_ACCESS_BY_ROLE[role];
  if (!access.canExport) return false;
  return access.allowedRooms.includes(dataRoomId);
}

/**
 * Check if export requires approval
 */
export function exportRequiresApproval(role: DataRoomAccessRole): boolean {
  return EXPORT_ACCESS_BY_ROLE[role].requiresApproval;
}

/**
 * Generate a unique export ID
 */
export function generateExportId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `EXP-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create export metadata
 */
export function createExportMetadata(params: {
  source_data_room: string;
  user_id: string;
  role: DataRoomAccessRole;
  email?: string;
  export_id: string;
}): ExportMetadata {
  return {
    brand: 'JBJ GLOBAL REAL ESTATE',
    activities: 'BUY · SELL · RENT',
    source_data_room: params.source_data_room,
    generated_at: new Date().toISOString(),
    generated_by: {
      user_id: params.user_id,
      role: params.role,
      email: params.email,
    },
    export_id: params.export_id,
    disclaimer: EXPORT_DISCLAIMERS.GENERAL,
    read_only_notice: EXPORT_DISCLAIMERS.READ_ONLY,
  };
}

/**
 * Create export log entry
 */
export function createExportLogEntry(params: {
  export_type: ExportFormat;
  data_room_id: DataRoomId;
  data_room_name: string;
  scope: DataRoomExportLogEntry['scope'];
  actor_user_id: string;
  actor_role: DataRoomAccessRole;
  actor_email?: string | null;
  checksum: string;
  file_size_bytes: number;
  ip_address?: string | null;
  user_agent?: string | null;
}): DataRoomExportLogEntry {
  return {
    export_id: generateExportId(),
    export_type: params.export_type,
    data_room_id: params.data_room_id,
    data_room_name: params.data_room_name,
    scope: params.scope,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    actor_email: params.actor_email,
    generated_at: new Date().toISOString(),
    checksum: params.checksum,
    file_size_bytes: params.file_size_bytes,
    is_revoked: false,
    revoked_at: null,
    revoked_by: null,
    revocation_reason: null,
    ip_address: params.ip_address,
    user_agent: params.user_agent,
  };
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate that public users cannot generate exports
 */
export function validateNoPublicExports(): boolean {
  // Partner and internal_staff have no export access
  // Investor has canExport: false
  // Only owner_founder and executive can export
  return (
    EXPORT_ACCESS_BY_ROLE.partner.canExport === false &&
    EXPORT_ACCESS_BY_ROLE.internal_staff.canExport === false &&
    EXPORT_ACCESS_BY_ROLE.investor.canExport === false
  );
}

/**
 * Validate that market intelligence is not exportable
 */
export function validateMarketIntelligenceNotExportable(): boolean {
  return !EXPORTABLE_DATA_ROOMS.includes('market_intelligence');
}

// ============================================================
// EXPORT STATUS
// ============================================================

export const DATA_ROOM_EXPORT_STATUS = {
  priority: 'P4-PART5',
  status: 'IMPLEMENTED',
  exportable_rooms: EXPORTABLE_DATA_ROOMS,
  non_exportable_rooms: NON_EXPORTABLE_DATA_ROOMS,
  allowed_formats: ALLOWED_EXPORT_FORMATS,
  features: {
    read_only: true,
    timestamped: true,
    non_editable: true,
    source_attribution: true,
    actor_identity: true,
    auditable: true,
    revocable: true,
  },
  log_fields: [
    'export_id',
    'export_type',
    'data_room_id',
    'data_room_name',
    'scope',
    'actor_user_id',
    'actor_role',
    'generated_at',
    'checksum',
    'file_size_bytes',
    'is_revoked',
    'ip_address',
    'user_agent',
  ],
  validations: {
    no_public_exports: validateNoPublicExports(),
    market_intelligence_blocked: validateMarketIntelligenceNotExportable(),
  },
} as const;
