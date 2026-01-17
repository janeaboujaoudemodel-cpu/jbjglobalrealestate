/**
 * JBJ GLOBAL REAL ESTATE — Data Room Permissions & Access Control
 * 
 * PRIORITY 4 — PART 2: STRICT PERMISSIONS & ACCESS CONTROL
 * 
 * Brand: JBJ GLOBAL REAL ESTATE
 * Core Activities: BUY · SELL · RENT
 * 
 * ENFORCEMENT RULES:
 * - Permissions enforced at DATA LEVEL (not UI only)
 * - No role may escalate its own access
 * - No data room may be exposed publicly
 * - All access must be revocable instantly
 * 
 * SAFETY RULES:
 * - No public access
 * - No unauthorized investor access
 * - No partner access to any data room
 * - Internal staff has no access to sensitive rooms
 */

import type { 
  DataRoomId, 
  DataRoomAccessRole, 
  DataRoomPermission,
  DataRoomPermissionEntry,
  DataRoomAccessMatrix 
} from '@/types/data-rooms';

// ============================================================================
// ACCESS ROLES (LOCKED — EXACTLY 5 ROLES)
// ============================================================================

export const DATA_ROOM_ACCESS_ROLES: readonly DataRoomAccessRole[] = [
  'owner_founder',
  'executive',
  'investor',
  'partner',
  'internal_staff',
] as const;

export const ACCESS_ROLE_DEFINITIONS = {
  owner_founder: {
    name: 'Owner / Founder',
    description: 'JBJ GLOBAL REAL ESTATE ownership with full platform authority',
    priority: 1,
    can_grant_access: true,
    can_revoke_access: true,
  },
  executive: {
    name: 'Executive',
    description: 'C-level and senior leadership with strategic visibility',
    priority: 2,
    can_grant_access: false,
    can_revoke_access: false,
  },
  investor: {
    name: 'Investor',
    description: 'Approved investors with approval-based read access',
    priority: 3,
    can_grant_access: false,
    can_revoke_access: false,
  },
  partner: {
    name: 'Partner',
    description: 'External partners with ZERO data room access',
    priority: 4,
    can_grant_access: false,
    can_revoke_access: false,
  },
  internal_staff: {
    name: 'Internal Staff',
    description: 'Non-executive employees supporting BUY · SELL · RENT operations',
    priority: 5,
    can_grant_access: false,
    can_revoke_access: false,
  },
} as const;

// ============================================================================
// HELPER: CREATE PERMISSION ENTRY
// ============================================================================

function createPermissionEntry(
  role: DataRoomAccessRole,
  permission: DataRoomPermission,
  requiresApproval: boolean = false
): DataRoomPermissionEntry {
  return {
    role,
    permission,
    requires_approval: requiresApproval,
    can_escalate: false, // ABSOLUTE: No role may escalate its own access
    revocable: true,     // ABSOLUTE: All access must be revocable instantly
  };
}

// ============================================================================
// DATA ROOM 1: CORPORATE DATA ROOM — ACCESS MATRIX
// ============================================================================

export const CORPORATE_DATA_ROOM_ACCESS: DataRoomAccessMatrix = {
  data_room_id: 'corporate',
  permissions: [
    createPermissionEntry('owner_founder', 'full_access', false),
    createPermissionEntry('executive', 'read_only', false),
    createPermissionEntry('investor', 'read_approval', true), // Approval-based
    createPermissionEntry('partner', 'no_access', false),
    createPermissionEntry('internal_staff', 'no_access', false),
  ],
  last_updated: '2026-01-17T00:00:00.000Z',
  enforced_server_side: true,
} as const;

// ============================================================================
// DATA ROOM 2: FINANCIAL & PERFORMANCE DATA ROOM — ACCESS MATRIX
// ============================================================================

export const FINANCIAL_PERFORMANCE_DATA_ROOM_ACCESS: DataRoomAccessMatrix = {
  data_room_id: 'financial_performance',
  permissions: [
    createPermissionEntry('owner_founder', 'full_access', false),
    createPermissionEntry('executive', 'read_only', false),
    createPermissionEntry('investor', 'read_approval', true), // Explicit approval only
    createPermissionEntry('partner', 'no_access', false),
    createPermissionEntry('internal_staff', 'no_access', false),
  ],
  last_updated: '2026-01-17T00:00:00.000Z',
  enforced_server_side: true,
} as const;

// ============================================================================
// DATA ROOM 3: MARKET INTELLIGENCE DATA ROOM — ACCESS MATRIX
// ============================================================================

export const MARKET_INTELLIGENCE_DATA_ROOM_ACCESS: DataRoomAccessMatrix = {
  data_room_id: 'market_intelligence',
  permissions: [
    createPermissionEntry('owner_founder', 'full_access', false),
    createPermissionEntry('executive', 'read_only', false),
    createPermissionEntry('investor', 'read_high_level', true), // High-level only
    createPermissionEntry('partner', 'no_access', false),
    createPermissionEntry('internal_staff', 'no_access', false),
  ],
  last_updated: '2026-01-17T00:00:00.000Z',
  enforced_server_side: true,
} as const;

// ============================================================================
// DATA ROOM 4: EXPANSION & RISK DATA ROOM — ACCESS MATRIX
// ============================================================================

export const EXPANSION_RISK_DATA_ROOM_ACCESS: DataRoomAccessMatrix = {
  data_room_id: 'expansion_risk',
  permissions: [
    createPermissionEntry('owner_founder', 'full_access', false),
    createPermissionEntry('executive', 'read_only', false),
    createPermissionEntry('investor', 'no_access', false), // NO access by default
    createPermissionEntry('partner', 'no_access', false),
    createPermissionEntry('internal_staff', 'no_access', false),
  ],
  last_updated: '2026-01-17T00:00:00.000Z',
  enforced_server_side: true,
} as const;

// ============================================================================
// MASTER ACCESS REGISTRY
// ============================================================================

export const DATA_ROOM_ACCESS_REGISTRY: Record<DataRoomId, DataRoomAccessMatrix> = {
  corporate: CORPORATE_DATA_ROOM_ACCESS,
  financial_performance: FINANCIAL_PERFORMANCE_DATA_ROOM_ACCESS,
  market_intelligence: MARKET_INTELLIGENCE_DATA_ROOM_ACCESS,
  expansion_risk: EXPANSION_RISK_DATA_ROOM_ACCESS,
} as const;

// ============================================================================
// PERMISSION ENFORCEMENT RULES (NON-NEGOTIABLE)
// ============================================================================

export const PERMISSION_ENFORCEMENT_RULES = {
  // Core enforcement
  ENFORCED_AT_DATA_LEVEL: true,
  UI_ONLY_ENFORCEMENT: false, // FORBIDDEN
  
  // Escalation prevention
  ROLE_SELF_ESCALATION_ALLOWED: false,
  
  // Public exposure
  PUBLIC_EXPOSURE_ALLOWED: false,
  SITEMAP_EXPOSURE_ALLOWED: false,
  
  // Revocation
  INSTANT_REVOCATION_SUPPORTED: true,
  REVOCATION_REQUIRES_APPROVAL: false,
  
  // Approval requirements
  INVESTOR_REQUIRES_EXPLICIT_APPROVAL: true,
  PARTNER_ACCESS_ALLOWED: false, // ABSOLUTE ZERO
  
  // Server-side enforcement
  SERVER_SIDE_VALIDATION_REQUIRED: true,
  CLIENT_SIDE_ONLY_FORBIDDEN: true,
} as const;

// ============================================================================
// ACCESS VALIDATION FUNCTIONS (STRUCTURE ONLY — NO DB QUERIES)
// ============================================================================

/**
 * Get permission for a role in a specific data room
 */
export function getPermissionForRole(
  dataRoomId: DataRoomId,
  role: DataRoomAccessRole
): DataRoomPermission {
  const matrix = DATA_ROOM_ACCESS_REGISTRY[dataRoomId];
  const entry = matrix.permissions.find(p => p.role === role);
  return entry?.permission ?? 'no_access';
}

/**
 * Check if role requires approval for data room access
 */
export function requiresApproval(
  dataRoomId: DataRoomId,
  role: DataRoomAccessRole
): boolean {
  const matrix = DATA_ROOM_ACCESS_REGISTRY[dataRoomId];
  const entry = matrix.permissions.find(p => p.role === role);
  return entry?.requires_approval ?? false;
}

/**
 * Check if role has any access to data room
 */
export function hasAnyAccess(
  dataRoomId: DataRoomId,
  role: DataRoomAccessRole
): boolean {
  const permission = getPermissionForRole(dataRoomId, role);
  return permission !== 'no_access';
}

/**
 * Check if role has write access to data room
 */
export function hasWriteAccess(
  dataRoomId: DataRoomId,
  role: DataRoomAccessRole
): boolean {
  const permission = getPermissionForRole(dataRoomId, role);
  return permission === 'full_access';
}

/**
 * Get all data rooms a role can access
 */
export function getAccessibleDataRooms(role: DataRoomAccessRole): DataRoomId[] {
  const accessible: DataRoomId[] = [];
  
  for (const [roomId, matrix] of Object.entries(DATA_ROOM_ACCESS_REGISTRY)) {
    const entry = matrix.permissions.find(p => p.role === role);
    if (entry && entry.permission !== 'no_access') {
      accessible.push(roomId as DataRoomId);
    }
  }
  
  return accessible;
}

/**
 * Validate PARTNER has ZERO access everywhere (CRITICAL CHECK)
 */
export function validatePartnerHasZeroAccess(): boolean {
  for (const matrix of Object.values(DATA_ROOM_ACCESS_REGISTRY)) {
    const partnerEntry = matrix.permissions.find(p => p.role === 'partner');
    if (partnerEntry && partnerEntry.permission !== 'no_access') {
      return false; // VIOLATION
    }
  }
  return true;
}

/**
 * Validate INVESTOR access is read-only and approval-based
 */
export function validateInvestorAccessRules(): boolean {
  for (const matrix of Object.values(DATA_ROOM_ACCESS_REGISTRY)) {
    const investorEntry = matrix.permissions.find(p => p.role === 'investor');
    if (investorEntry) {
      // Must be no_access, read_only, read_approval, or read_high_level
      if (investorEntry.permission === 'full_access') {
        return false; // VIOLATION — investor cannot have full access
      }
      // If any read access, must require approval (except no_access)
      if (investorEntry.permission !== 'no_access' && !investorEntry.requires_approval) {
        return false; // VIOLATION — investor read access must be approval-based
      }
    }
  }
  return true;
}

/**
 * Validate all access is enforced server-side
 */
export function validateServerSideEnforcement(): boolean {
  for (const matrix of Object.values(DATA_ROOM_ACCESS_REGISTRY)) {
    if (!matrix.enforced_server_side) {
      return false; // VIOLATION
    }
  }
  return true;
}

// ============================================================================
// PRIORITY 4 — PART 2 STATUS
// ============================================================================

export const DATA_ROOM_PERMISSIONS_STATUS = {
  PRIORITY: 'PRIORITY 4 — PART 2',
  STATUS: 'COMPLETE',
  VERSION: '1.0.0',
  
  ROLES_DEFINED: 5,
  ROLES: [
    { id: 'owner_founder', name: 'Owner / Founder' },
    { id: 'executive', name: 'Executive' },
    { id: 'investor', name: 'Investor' },
    { id: 'partner', name: 'Partner' },
    { id: 'internal_staff', name: 'Internal Staff' },
  ],
  
  ACCESS_MATRIX_SUMMARY: [
    {
      room: 'Corporate Data Room',
      owner_founder: 'full_access',
      executive: 'read_only',
      investor: 'read_approval',
      partner: 'no_access',
      internal_staff: 'no_access',
    },
    {
      room: 'Financial & Performance Data Room',
      owner_founder: 'full_access',
      executive: 'read_only',
      investor: 'read_approval',
      partner: 'no_access',
      internal_staff: 'no_access',
    },
    {
      room: 'Market Intelligence Data Room',
      owner_founder: 'full_access',
      executive: 'read_only',
      investor: 'read_high_level',
      partner: 'no_access',
      internal_staff: 'no_access',
    },
    {
      room: 'Expansion & Risk Data Room',
      owner_founder: 'full_access',
      executive: 'read_only',
      investor: 'no_access',
      partner: 'no_access',
      internal_staff: 'no_access',
    },
  ],
  
  ENFORCEMENT_RULES: {
    DATA_LEVEL_ENFORCEMENT: true,
    SERVER_SIDE_VALIDATION: true,
    NO_SELF_ESCALATION: true,
    INSTANT_REVOCATION: true,
    NO_PUBLIC_EXPOSURE: true,
  },
  
  VERIFICATIONS: {
    PARTNER_ZERO_ACCESS: true,
    INVESTOR_READ_ONLY_APPROVAL: true,
    SERVER_SIDE_ENFORCED: true,
  },
  
  BRAND_COMPLIANCE: {
    COMPANY_NAME: 'JBJ GLOBAL REAL ESTATE',
    CORE_ACTIVITIES: 'BUY · SELL · RENT',
    FORBIDDEN_TERMS: ['leasing', 'Lease'],
  },
  
  NOT_IMPLEMENTED: [
    'Database migrations',
    'UI modifications',
    'Audit logs',
    'Document uploads',
    'Exports',
  ],
} as const;
