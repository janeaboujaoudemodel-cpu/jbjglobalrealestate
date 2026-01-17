/**
 * PARTNER PROFILE TYPES
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Standardized partner record structure for all partner types.
 */

import type { PartnerType, ServicePartnerType } from '@/config/partner-types';

// ============================================================
// PARTNER STATUS
// ============================================================

export type PartnerStatus = 'pending' | 'active' | 'suspended' | 'terminated';

export const PARTNER_STATUSES: PartnerStatus[] = ['pending', 'active', 'suspended', 'terminated'];

// ============================================================
// DATA RIGHTS
// ============================================================

export type PartnerDataRights = 'read' | 'sync' | 'none';

// ============================================================
// LICENSE DETAILS
// ============================================================

export interface PartnerLicenseDetails {
  /** License number */
  license_number: string;
  /** Issuing authority */
  issuing_authority: string;
  /** Issue date */
  issue_date: string;
  /** Expiry date */
  expiry_date: string;
  /** License type/category */
  license_type: string;
  /** Jurisdiction of license */
  jurisdiction: string;
  /** Is license currently valid */
  is_valid: boolean;
  /** Verification status */
  verification_status: 'pending' | 'verified' | 'expired' | 'revoked';
  /** Last verification date */
  last_verified_at?: string;
  /** Verification notes */
  verification_notes?: string;
}

// ============================================================
// PARTNER PROFILE (MANDATORY STRUCTURE)
// ============================================================

export interface PartnerProfile {
  /** Unique partner identifier */
  partner_id: string;
  /** Legal name of partner entity */
  partner_name: string;
  /** Partner type (Execution / Data / Service) */
  partner_type: PartnerType;
  /** Service sub-type if applicable */
  service_type?: ServicePartnerType;
  /** Jurisdiction identifier */
  jurisdiction_id: string;
  /** License details (if applicable) */
  license_details: PartnerLicenseDetails | null;
  /** Regulatory scope description */
  regulatory_scope: string;
  /** Has execution rights (only Execution partners) */
  execution_rights: boolean;
  /** Data access rights */
  data_rights: PartnerDataRights;
  /** Client ownership - ALWAYS FALSE */
  client_ownership: false;
  /** Current status */
  status: PartnerStatus;
  /** Onboarding date */
  onboarding_date: string;
  /** Last review date */
  last_review_date: string;
  /** Governance notes (internal only) */
  governance_notes: string;
  /** Contact information */
  contact: {
    primary_contact_name: string;
    primary_contact_email: string;
    primary_contact_phone?: string;
    company_address: string;
  };
  /** Created timestamp */
  created_at: string;
  /** Updated timestamp */
  updated_at: string;
  /** Created by user ID */
  created_by: string;
  /** Last updated by user ID */
  updated_by: string;
}

// ============================================================
// PARTNER ONBOARDING REQUEST
// ============================================================

export interface PartnerOnboardingRequest {
  partner_name: string;
  partner_type: PartnerType;
  service_type?: ServicePartnerType;
  jurisdiction_id: string;
  license_details?: Omit<PartnerLicenseDetails, 'is_valid' | 'verification_status' | 'last_verified_at' | 'verification_notes'>;
  regulatory_scope: string;
  contact: PartnerProfile['contact'];
  governance_notes?: string;
}

// ============================================================
// PARTNER REVIEW RECORD
// ============================================================

export interface PartnerReviewRecord {
  review_id: string;
  partner_id: string;
  reviewed_by: string;
  reviewed_at: string;
  review_type: 'onboarding' | 'periodic' | 'incident' | 'termination';
  previous_status: PartnerStatus;
  new_status: PartnerStatus;
  findings: string[];
  recommendations: string[];
  notes: string;
}

// ============================================================
// PARTNER AUDIT LOG
// ============================================================

export interface PartnerAuditLogEntry {
  log_id: string;
  partner_id: string;
  action: 'created' | 'updated' | 'status_changed' | 'suspended' | 'terminated' | 'reactivated' | 'reviewed';
  actor_user_id: string;
  actor_role: string;
  timestamp: string;
  previous_values?: Partial<PartnerProfile>;
  new_values?: Partial<PartnerProfile>;
  reason?: string;
  ip_address?: string;
}
