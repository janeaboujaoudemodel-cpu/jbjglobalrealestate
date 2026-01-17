/**
 * JBJ GLOBAL REAL ESTATE — Data Room Type Definitions
 * 
 * PRIORITY 4 — PART 3: AUDIT LOGGING & VERSIONING TYPES
 * Brand: JBJ GLOBAL REAL ESTATE
 * Core Activities: BUY · SELL · RENT
 */

// ============================================================================
// DATA ROOM IDENTIFIERS
// ============================================================================

export type DataRoomId = 
  | 'corporate'
  | 'financial_performance'
  | 'market_intelligence'
  | 'expansion_risk';

// ============================================================================
// ACCESS ROLES (LOCKED — EXACTLY 5 ROLES)
// ============================================================================

export type DataRoomAccessRole = 
  | 'owner_founder'
  | 'executive'
  | 'investor'
  | 'partner'
  | 'internal_staff';

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export type DataRoomPermission = 
  | 'full_access'      // read/write/version
  | 'read_only'        // read only
  | 'read_approval'    // read-only with explicit approval required
  | 'read_high_level'  // read-only, high-level data only
  | 'no_access';       // zero access

// ============================================================================
// ACCESS LEVEL FLAGS
// ============================================================================

export type DataRoomAccessLevel = 
  | 'internal_only'
  | 'executive_only'
  | 'restricted'
  | 'confidential';

// ============================================================================
// ACCESS APPROVAL STATUS
// ============================================================================

export type AccessApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'denied'
  | 'revoked'
  | 'expired';

// ============================================================================
// AUDIT ACTION TYPES
// ============================================================================

export type DataRoomAuditAction = 
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'deny'
  | 'permission_change'
  | 'access_request'
  | 'access_grant'
  | 'access_revoke';

// ============================================================================
// AUDIT RESOURCE TYPES
// ============================================================================

export type DataRoomAuditResourceType = 
  | 'document'
  | 'dataset'
  | 'note'
  | 'permission'
  | 'export'
  | 'data_room'
  | 'metadata';

// ============================================================================
// AUDIT RESULT TYPES
// ============================================================================

export type DataRoomAuditResult = 
  | 'success'
  | 'blocked'
  | 'denied'
  | 'error';

// ============================================================================
// AUDIT LOG ENTRY (IMMUTABLE)
// ============================================================================

export interface DataRoomAuditLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly actor_user_id: string;
  readonly actor_role: DataRoomAccessRole;
  readonly actor_email: string | null;
  readonly data_room_id: DataRoomId;
  readonly data_room_name: string;
  readonly resource_type: DataRoomAuditResourceType;
  readonly resource_id: string | null;
  readonly action_type: DataRoomAuditAction;
  readonly result: DataRoomAuditResult;
  readonly ip_address: string | null;
  readonly user_agent: string | null;
  readonly metadata: Record<string, unknown> | null;
  // IMMUTABLE: No edits allowed after creation
  readonly is_immutable: true;
}

// ============================================================================
// VERSION ENTRY (FOR DOCUMENTS & METADATA)
// ============================================================================

export interface DataRoomVersionRecord {
  readonly id: string;
  readonly entity_type: 'document' | 'dataset' | 'note' | 'metadata';
  readonly entity_id: string;
  readonly data_room_id: DataRoomId;
  readonly version_number: number;
  readonly previous_version_id: string | null;
  readonly actor_user_id: string;
  readonly actor_email: string | null;
  readonly change_summary: string;
  readonly snapshot_data: Record<string, unknown> | null;
  readonly created_at: string;
  // IMMUTABLE: No edits allowed after creation
  readonly is_immutable: true;
}

// ============================================================================
// EXPORT TRACEABILITY LOG (FRAMEWORK)
// ============================================================================

export interface DataRoomExportLog {
  readonly id: string;
  readonly timestamp: string;
  readonly export_type: 'pdf' | 'csv' | 'xlsx';
  readonly data_room_id: DataRoomId;
  readonly data_room_name: string;
  readonly exported_scope: {
    documents?: string[];
    datasets?: string[];
    notes?: string[];
  };
  readonly actor_user_id: string;
  readonly actor_role: DataRoomAccessRole;
  readonly actor_email: string | null;
  readonly delivery_target: 'download' | 'internal_link' | 'email';
  readonly file_checksum: string | null;
  readonly file_size_bytes: number | null;
  readonly ip_address: string | null;
  readonly user_agent: string | null;
  // IMMUTABLE: No edits allowed after creation
  readonly is_immutable: true;
}

// ============================================================================
// PERMISSION ENTRY (PER ROLE PER DATA ROOM)
// ============================================================================

export interface DataRoomPermissionEntry {
  role: DataRoomAccessRole;
  permission: DataRoomPermission;
  requires_approval: boolean;
  approval_status?: AccessApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  expires_at?: string;
  can_escalate: false; // ALWAYS FALSE — no role may escalate its own access
  revocable: true;     // ALWAYS TRUE — all access must be revocable instantly
}

// ============================================================================
// ACCESS MATRIX (PER DATA ROOM)
// ============================================================================

export interface DataRoomAccessMatrix {
  data_room_id: DataRoomId;
  permissions: DataRoomPermissionEntry[];
  last_updated: string;
  enforced_server_side: true; // ALWAYS TRUE
}

// ============================================================================
// ACCESS REQUEST
// ============================================================================

export interface DataRoomAccessRequest {
  id: string;
  user_id: string;
  data_room_id: DataRoomId;
  requested_role: DataRoomAccessRole;
  request_reason: string;
  status: AccessApprovalStatus;
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  denial_reason?: string;
}

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export interface DataRoomDocument {
  id: string;
  data_room_id: DataRoomId;
  name: string;
  description: string | null;
  file_type: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'other';
  file_path: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  is_archived: boolean;
}

// ============================================================================
// DATASET / TABLE TYPES
// ============================================================================

export interface DataRoomDataset {
  id: string;
  data_room_id: DataRoomId;
  name: string;
  description: string | null;
  schema_definition: Record<string, unknown> | null;
  row_count: number;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  is_archived: boolean;
}

// ============================================================================
// INTERNAL NOTES
// ============================================================================

export interface DataRoomNote {
  id: string;
  data_room_id: DataRoomId;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

// ============================================================================
// VERSION HISTORY (LEGACY — KEPT FOR COMPATIBILITY)
// ============================================================================

export interface DataRoomVersionEntry {
  id: string;
  data_room_id: DataRoomId;
  entity_type: 'document' | 'dataset' | 'note' | 'configuration';
  entity_id: string;
  version_number: number;
  change_description: string;
  changed_by: string | null;
  changed_at: string;
  snapshot: Record<string, unknown> | null;
}

// ============================================================================
// EXPORT PLACEHOLDERS
// ============================================================================

export interface DataRoomExportConfig {
  id: string;
  data_room_id: DataRoomId;
  export_type: 'pdf' | 'csv' | 'xlsx';
  template_name: string;
  is_enabled: boolean;
  created_at: string;
}

// ============================================================================
// CORE DATA ROOM DEFINITION
// ============================================================================

export interface DataRoomDefinition {
  id: DataRoomId;
  internal_id: string;
  name: string;
  description: string;
  access_level: DataRoomAccessLevel;
  created_at: string;
  versioning_enabled: boolean;
  is_active: boolean;
  
  // Structure placeholders (no data yet)
  supports: {
    documents: boolean;
    datasets: boolean;
    internal_notes: boolean;
    version_history: boolean;
    export_pdf: boolean;
    export_csv: boolean;
  };
}

// ============================================================================
// DATA ROOM REGISTRY
// ============================================================================

export interface DataRoomRegistry {
  rooms: DataRoomDefinition[];
  total_count: number;
  last_updated: string;
  version: string;
}
