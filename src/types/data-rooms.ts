/**
 * JBJ GLOBAL REAL ESTATE — Data Room Type Definitions
 * 
 * STRUCTURE ONLY — No UI, no routes, no permissions logic
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
// ACCESS LEVEL FLAGS
// ============================================================================

export type DataRoomAccessLevel = 
  | 'internal_only'
  | 'executive_only'
  | 'restricted'
  | 'confidential';

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
// VERSION HISTORY
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
