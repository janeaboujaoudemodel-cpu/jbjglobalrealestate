/**
 * JBJ GLOBAL REAL ESTATE — Data Room Architecture
 * 
 * PRIORITY 4 — PART 1: STRUCTURE ONLY
 * 
 * Brand: JBJ GLOBAL REAL ESTATE
 * Core Activities: BUY · SELL · RENT
 * 
 * SAFETY RULES ENFORCED:
 * - No public access
 * - No investor access
 * - No partner access
 * - Internal-only visibility
 * - Not exposed in sitemap or public routes
 * 
 * This file defines STRUCTURE ONLY:
 * - No UI changes
 * - No route changes
 * - No permission logic
 * - No data population
 * - No metrics
 * - No exports
 */

import type { 
  DataRoomDefinition, 
  DataRoomRegistry,
  DataRoomId,
  DataRoomAccessLevel 
} from '@/types/data-rooms';

// ============================================================================
// DATA ROOM 1: CORPORATE DATA ROOM
// ============================================================================

export const CORPORATE_DATA_ROOM: DataRoomDefinition = {
  id: 'corporate',
  internal_id: 'JBJ_DR_CORP_001',
  name: 'Corporate Data Room',
  description: 'JBJ GLOBAL REAL ESTATE corporate governance, legal documents, organizational structure, and compliance records. Internal use only.',
  access_level: 'internal_only',
  created_at: '2026-01-17T00:00:00.000Z',
  versioning_enabled: true,
  is_active: true,
  
  supports: {
    documents: true,
    datasets: true,
    internal_notes: true,
    version_history: true,
    export_pdf: true,
    export_csv: true,
  },
} as const;

// ============================================================================
// DATA ROOM 2: FINANCIAL & PERFORMANCE DATA ROOM
// ============================================================================

export const FINANCIAL_PERFORMANCE_DATA_ROOM: DataRoomDefinition = {
  id: 'financial_performance',
  internal_id: 'JBJ_DR_FIN_002',
  name: 'Financial & Performance Data Room',
  description: 'JBJ GLOBAL REAL ESTATE financial records, performance metrics, revenue tracking, and operational KPIs. Executive and internal access only.',
  access_level: 'executive_only',
  created_at: '2026-01-17T00:00:00.000Z',
  versioning_enabled: true,
  is_active: true,
  
  supports: {
    documents: true,
    datasets: true,
    internal_notes: true,
    version_history: true,
    export_pdf: true,
    export_csv: true,
  },
} as const;

// ============================================================================
// DATA ROOM 3: MARKET INTELLIGENCE DATA ROOM
// ============================================================================

export const MARKET_INTELLIGENCE_DATA_ROOM: DataRoomDefinition = {
  id: 'market_intelligence',
  internal_id: 'JBJ_DR_MKT_003',
  name: 'Market Intelligence Data Room',
  description: 'JBJ GLOBAL REAL ESTATE market research, area intelligence, trend analysis, and data source documentation. Supports BUY · SELL · RENT operations.',
  access_level: 'restricted',
  created_at: '2026-01-17T00:00:00.000Z',
  versioning_enabled: true,
  is_active: true,
  
  supports: {
    documents: true,
    datasets: true,
    internal_notes: true,
    version_history: true,
    export_pdf: true,
    export_csv: true,
  },
} as const;

// ============================================================================
// DATA ROOM 4: EXPANSION & RISK DATA ROOM
// ============================================================================

export const EXPANSION_RISK_DATA_ROOM: DataRoomDefinition = {
  id: 'expansion_risk',
  internal_id: 'JBJ_DR_EXP_004',
  name: 'Expansion & Risk Data Room',
  description: 'JBJ GLOBAL REAL ESTATE global expansion planning, country readiness assessments, risk registers, and regulatory compliance tracking.',
  access_level: 'confidential',
  created_at: '2026-01-17T00:00:00.000Z',
  versioning_enabled: true,
  is_active: true,
  
  supports: {
    documents: true,
    datasets: true,
    internal_notes: true,
    version_history: true,
    export_pdf: true,
    export_csv: true,
  },
} as const;

// ============================================================================
// DATA ROOM REGISTRY (MASTER)
// ============================================================================

export const DATA_ROOM_REGISTRY: DataRoomRegistry = {
  rooms: [
    CORPORATE_DATA_ROOM,
    FINANCIAL_PERFORMANCE_DATA_ROOM,
    MARKET_INTELLIGENCE_DATA_ROOM,
    EXPANSION_RISK_DATA_ROOM,
  ],
  total_count: 4,
  last_updated: '2026-01-17T00:00:00.000Z',
  version: '1.0.0',
} as const;

// ============================================================================
// UTILITY FUNCTIONS (STRUCTURE ONLY — NO LOGIC)
// ============================================================================

/**
 * Get data room by ID
 * Structure placeholder — no permission checks implemented
 */
export function getDataRoomById(id: DataRoomId): DataRoomDefinition | undefined {
  return DATA_ROOM_REGISTRY.rooms.find(room => room.id === id);
}

/**
 * Get data room by internal ID
 * Structure placeholder — no permission checks implemented
 */
export function getDataRoomByInternalId(internalId: string): DataRoomDefinition | undefined {
  return DATA_ROOM_REGISTRY.rooms.find(room => room.internal_id === internalId);
}

/**
 * Get all data rooms
 * Structure placeholder — no permission filtering implemented
 */
export function getAllDataRooms(): DataRoomDefinition[] {
  return DATA_ROOM_REGISTRY.rooms;
}

/**
 * Get data rooms by access level
 * Structure placeholder — no permission validation implemented
 */
export function getDataRoomsByAccessLevel(level: DataRoomAccessLevel): DataRoomDefinition[] {
  return DATA_ROOM_REGISTRY.rooms.filter(room => room.access_level === level);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate data room ID
 */
export function isValidDataRoomId(id: string): id is DataRoomId {
  return ['corporate', 'financial_performance', 'market_intelligence', 'expansion_risk'].includes(id);
}

/**
 * Get internal IDs for all data rooms
 */
export function getDataRoomInternalIds(): string[] {
  return DATA_ROOM_REGISTRY.rooms.map(room => room.internal_id);
}

// ============================================================================
// STRUCTURE STATUS
// ============================================================================

export const DATA_ROOM_STRUCTURE_STATUS = {
  PRIORITY: 'PRIORITY 4 — PART 1',
  STATUS: 'COMPLETE',
  VERSION: '1.0.0',
  
  ROOMS_CREATED: 4,
  ROOMS: [
    { id: 'corporate', internal_id: 'JBJ_DR_CORP_001', name: 'Corporate Data Room' },
    { id: 'financial_performance', internal_id: 'JBJ_DR_FIN_002', name: 'Financial & Performance Data Room' },
    { id: 'market_intelligence', internal_id: 'JBJ_DR_MKT_003', name: 'Market Intelligence Data Room' },
    { id: 'expansion_risk', internal_id: 'JBJ_DR_EXP_004', name: 'Expansion & Risk Data Room' },
  ],
  
  STRUCTURE_SUPPORTS: [
    'Documents',
    'Tables / datasets',
    'Internal notes',
    'Version history',
    'Export placeholders (PDF / CSV)',
  ],
  
  SAFETY_RULES_ENFORCED: [
    'No public access',
    'No investor access',
    'No partner access',
    'Internal-only visibility',
    'Not exposed in sitemap or public routes',
  ],
  
  BRAND_COMPLIANCE: {
    COMPANY_NAME: 'JBJ GLOBAL REAL ESTATE',
    CORE_ACTIVITIES: 'BUY · SELL · RENT',
    FORBIDDEN_TERMS: ['leasing', 'Lease'],
  },
  
  NOT_IMPLEMENTED: [
    'UI components',
    'Routes',
    'Permissions logic',
    'Data population',
    'Metrics',
    'Export functionality',
    'Audit trails',
  ],
} as const;
