/**
 * Developer Field Protection
 * Defines internal/protected fields that developers must never control.
 * Used to strip unauthorized fields from developer-submitted payloads.
 */

export const PROTECTED_FIELDS = new Set([
  // AI & Analysis
  'ai_score',
  'ai_analysis',
  'ai_summary',
  'ai_description',
  'ai_key_points',
  'enrichment_data',
  'enriched_at',
  
  // Internal Scoring & Ranking
  'quality_score',
  'internal_ranking',
  'score',
  'rank',
  'priority_score',
  
  // Internal Tags & Notes
  'internal_tags',
  'internal_notes',
  'moderation_notes',
  'owner_notes',
  'admin_notes',
  'review_notes',
  
  // Security & Settings
  'security_settings',
  'is_verified',
  'is_featured',
  'is_premium',
  'is_hidden',
  'is_blocked',
  
  // System Fields
  'extraction_status',
  'auto_approved',
  'approved_by',
  'reviewed_by',
  'status', // developers cannot set their own approval status
  
  // Audit
  'audit_trail',
  'last_reviewed_at',
  'last_approved_at',
]);

/**
 * Strips protected fields from a developer submission payload.
 * Returns a clean copy safe for database insertion.
 */
export function sanitizeSubmissionData<T extends Record<string, unknown>>(data: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!PROTECTED_FIELDS.has(key)) {
      clean[key] = value;
    }
  }
  return clean as Partial<T>;
}

/**
 * Returns which protected fields were present in the payload (for logging).
 */
export function detectProtectedFieldAttempts(data: Record<string, unknown>): string[] {
  return Object.keys(data).filter(key => PROTECTED_FIELDS.has(key));
}
