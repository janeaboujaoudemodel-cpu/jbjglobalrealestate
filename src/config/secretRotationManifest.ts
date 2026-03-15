/**
 * Secret Rotation Manifest — Security Layer 4D
 * 
 * Documents all project secrets, their purpose, rotation procedures,
 * and current status. This is a reference file, not executable logic.
 * 
 * Last audited: 2026-03-14
 */

export interface SecretEntry {
  name: string;
  scope: 'runtime' | 'build' | 'connector';
  purpose: string;
  rotatable: boolean;
  managed?: boolean;
  rotationSteps: string;
  status: 'active' | 'unused' | 'duplicate' | 'connector-managed';
  notes?: string;
}

export const SECRET_MANIFEST: SecretEntry[] = [
  {
    name: 'RESEND_API_KEY',
    scope: 'runtime',
    purpose: 'Transactional email sending (welcome, password change, notifications)',
    rotatable: true,
    rotationSteps: '1. Generate new key at resend.com/api-keys → 2. Update via Lovable secrets → 3. Verify email sending works',
    status: 'active',
  },
  {
    name: 'REELLY_API_KEY',
    scope: 'runtime',
    purpose: 'Property data sync from Reelly API',
    rotatable: true,
    rotationSteps: '1. Request new key from Reelly support → 2. Update via Lovable secrets → 3. Run test sync',
    status: 'active',
  },
  {
    name: 'LOVABLE_API_KEY',
    scope: 'runtime',
    purpose: 'Lovable AI model access for AI tools',
    rotatable: false,
    managed: true,
    rotationSteps: 'Managed by Lovable platform — no manual rotation needed',
    status: 'active',
  },
  {
    name: 'BREVO_API_KEY',
    scope: 'runtime',
    purpose: 'Brevo (Sendinblue) email marketing API',
    rotatable: true,
    rotationSteps: '1. Generate new key in Brevo dashboard → 2. Update via Lovable secrets → 3. Test newsletter flow',
    status: 'active',
  },
  {
    name: 'BREVO_LIST_ID',
    scope: 'runtime',
    purpose: 'Brevo mailing list identifier',
    rotatable: false,
    rotationSteps: 'N/A — list ID is not a secret, but stored as one for convenience',
    status: 'active',
  },
  {
    name: 'OWNER_EMAIL',
    scope: 'runtime',
    purpose: 'Owner email for verification and admin notifications',
    rotatable: true,
    rotationSteps: '1. Update secret value → 2. Verify owner login still works',
    status: 'active',
  },
  {
    name: 'LEAD_REF_HMAC_KEY',
    scope: 'runtime',
    purpose: 'HMAC signing for lead referral tokens',
    rotatable: true,
    rotationSteps: '1. Generate new 256-bit key → 2. Update via Lovable secrets → 3. Note: existing signed tokens will become invalid',
    status: 'active',
    notes: 'Rotation invalidates all outstanding referral links',
  },
  {
    name: 'PERPLEXITY_API_KEY',
    scope: 'runtime',
    purpose: 'Perplexity AI search API',
    rotatable: true,
    rotationSteps: '1. Generate new key at perplexity.ai → 2. Update via Lovable secrets',
    status: 'active',
  },
  {
    name: 'VAPI_API_KEY',
    scope: 'runtime',
    purpose: 'Vapi voice AI API',
    rotatable: true,
    rotationSteps: '1. Generate new key in Vapi dashboard → 2. Update via Lovable secrets',
    status: 'active',
  },
  {
    name: 'ELEVENLABS_API_KEY',
    scope: 'runtime',
    purpose: 'ElevenLabs text-to-speech',
    rotatable: true,
    rotationSteps: '1. Generate new key at elevenlabs.io → 2. Update via Lovable secrets',
    status: 'active',
    notes: 'Duplicate of connector-managed ELEVENLABS_API_KEY_1 — consider consolidating',
  },
  {
    name: 'ELEVENLABS_API_KEY_1',
    scope: 'connector',
    purpose: 'ElevenLabs (connector-managed duplicate)',
    rotatable: true,
    managed: true,
    rotationSteps: 'Managed via Lovable connector settings',
    status: 'connector-managed',
  },
  {
    name: 'ELEVENLABS_AGENT_ID',
    scope: 'runtime',
    purpose: 'ElevenLabs agent identifier',
    rotatable: false,
    rotationSteps: 'N/A — identifier, not a credential',
    status: 'active',
  },
  {
    name: 'ELEVENLABS_VOICE_ID',
    scope: 'runtime',
    purpose: 'ElevenLabs voice identifier',
    rotatable: false,
    rotationSteps: 'N/A — identifier, not a credential',
    status: 'active',
  },
  {
    name: 'FIRECRAWL_API_KEY',
    scope: 'connector',
    purpose: 'Firecrawl web scraping (connector-managed)',
    rotatable: true,
    managed: true,
    rotationSteps: 'Managed via Lovable connector settings',
    status: 'connector-managed',
  },
  // ── REMOVED (2026-03-15) ──
  // REELLY_EMAIL — deleted (unused legacy credential)
  // REELLY_PASSWORD — deleted (unused legacy credential)
  // VITE_OWNER_EMAIL — deleted (duplicate, was exposed in client bundle)
];

/**
 * Rotation checklist (general):
 * 1. Generate new credential in the third-party service
 * 2. Update via Lovable secrets (add_secret / update_secret)
 * 3. Test the affected edge function(s)
 * 4. Revoke the old credential in the third-party service
 * 5. Log the rotation in audit_logs table
 */
