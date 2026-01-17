/**
 * PARTNER TYPES CONFIGURATION
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Defines the EXACT partner categories allowed in the platform.
 * No other partner types are permitted.
 */

// ============================================================
// PARTNER TYPES (LOCKED - NO MODIFICATIONS)
// ============================================================

/**
 * The only three partner types allowed in the platform
 */
export type PartnerType = 'execution' | 'data' | 'service';

export const PARTNER_TYPES: PartnerType[] = ['execution', 'data', 'service'];

/**
 * Service partner sub-types
 */
export type ServicePartnerType = 'mortgage' | 'legal' | 'visa' | 'corporate_services';

export const SERVICE_PARTNER_TYPES: ServicePartnerType[] = [
  'mortgage',
  'legal',
  'visa',
  'corporate_services',
];

// ============================================================
// PARTNER TYPE DEFINITIONS
// ============================================================

export interface PartnerTypeDefinition {
  type: PartnerType;
  name: string;
  description: string;
  execution_rights: boolean;
  data_rights: 'read' | 'sync' | 'none';
  client_ownership: false; // ALWAYS false - JBJ owns all clients
  applicable_models: string[];
  license_required: boolean;
  regulatory_scope: string;
}

export const PARTNER_TYPE_DEFINITIONS: Record<PartnerType, PartnerTypeDefinition> = {
  execution: {
    type: 'execution',
    name: 'Execution Partner',
    description: 'Licensed brokerage executing transactions on behalf of JBJ GLOBAL REAL ESTATE',
    execution_rights: true,
    data_rights: 'read',
    client_ownership: false,
    applicable_models: ['B'], // ONLY Expansion Model B
    license_required: true,
    regulatory_scope: 'Must hold valid real estate brokerage license in operating jurisdiction',
  },
  data: {
    type: 'data',
    name: 'Data Partner',
    description: 'Provides listings, datasets, or market feeds to JBJ GLOBAL REAL ESTATE',
    execution_rights: false,
    data_rights: 'sync',
    client_ownership: false,
    applicable_models: ['A', 'B', 'C'],
    license_required: false,
    regulatory_scope: 'Data usage agreement required; no client-facing activities',
  },
  service: {
    type: 'service',
    name: 'Service Partner',
    description: 'Provides Mortgage, Legal, Visa, or Corporate services via introduction only',
    execution_rights: false,
    data_rights: 'none',
    client_ownership: false,
    applicable_models: ['A', 'B', 'C'],
    license_required: true,
    regulatory_scope: 'Must hold valid license for specific service type in operating jurisdiction',
  },
};

// ============================================================
// SERVICE PARTNER DEFINITIONS
// ============================================================

export interface ServicePartnerDefinition {
  type: ServicePartnerType;
  name: string;
  description: string;
  license_required: boolean;
  client_contracts_directly: true; // Clients ALWAYS contract directly with service partners
  jbj_role: 'introduction_only';
}

export const SERVICE_PARTNER_DEFINITIONS: Record<ServicePartnerType, ServicePartnerDefinition> = {
  mortgage: {
    type: 'mortgage',
    name: 'Mortgage Partner',
    description: 'Licensed mortgage broker or bank providing financing services',
    license_required: true,
    client_contracts_directly: true,
    jbj_role: 'introduction_only',
  },
  legal: {
    type: 'legal',
    name: 'Legal Partner',
    description: 'Licensed law firm providing legal services for property transactions',
    license_required: true,
    client_contracts_directly: true,
    jbj_role: 'introduction_only',
  },
  visa: {
    type: 'visa',
    name: 'Visa Partner',
    description: 'Licensed immigration consultant or agency providing visa services',
    license_required: true,
    client_contracts_directly: true,
    jbj_role: 'introduction_only',
  },
  corporate_services: {
    type: 'corporate_services',
    name: 'Corporate Services Partner',
    description: 'Licensed provider for company setup, PRO services, or business registration',
    license_required: true,
    client_contracts_directly: true,
    jbj_role: 'introduction_only',
  },
};

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate that a string is a valid partner type
 */
export function isValidPartnerType(type: string): type is PartnerType {
  return PARTNER_TYPES.includes(type as PartnerType);
}

/**
 * Validate that a string is a valid service partner type
 */
export function isValidServicePartnerType(type: string): type is ServicePartnerType {
  return SERVICE_PARTNER_TYPES.includes(type as ServicePartnerType);
}

/**
 * Get partner type definition
 */
export function getPartnerTypeDefinition(type: PartnerType): PartnerTypeDefinition {
  return PARTNER_TYPE_DEFINITIONS[type];
}

/**
 * Get service partner definition
 */
export function getServicePartnerDefinition(type: ServicePartnerType): ServicePartnerDefinition {
  return SERVICE_PARTNER_DEFINITIONS[type];
}

/**
 * Check if partner type has execution rights
 */
export function hasExecutionRights(type: PartnerType): boolean {
  return PARTNER_TYPE_DEFINITIONS[type].execution_rights;
}

/**
 * Check if partner type requires license
 */
export function requiresLicense(type: PartnerType): boolean {
  return PARTNER_TYPE_DEFINITIONS[type].license_required;
}

/**
 * Validate that client ownership is ALWAYS false for all partner types
 */
export function validateClientOwnershipLocked(): boolean {
  return Object.values(PARTNER_TYPE_DEFINITIONS).every(
    (def) => def.client_ownership === false
  );
}

// ============================================================
// STATUS EXPORT
// ============================================================

export const PARTNER_TYPES_STATUS = {
  priority: 'P5-PART1',
  status: 'IMPLEMENTED',
  partner_types: PARTNER_TYPES,
  service_partner_types: SERVICE_PARTNER_TYPES,
  validations: {
    client_ownership_locked: validateClientOwnershipLocked(),
    execution_only_model_b: PARTNER_TYPE_DEFINITIONS.execution.applicable_models.length === 1 &&
      PARTNER_TYPE_DEFINITIONS.execution.applicable_models[0] === 'B',
  },
  brand_compliance: {
    brand_name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
    prohibited_terms: ['leasing', 'lease'],
  },
} as const;
