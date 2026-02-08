
# Fix All Edge Functions to Use NOREPLY@JBJ.AE Verified Sender

## Issue Summary

Multiple edge functions are using incorrect or unverified sender email domains. This causes email delivery failures with the error: "domain is not verified."

## Current Domain Usage Analysis

### Functions Already Using Correct Domain (NOREPLY@JBJ.AE)
These are correctly configured and need **no changes**:
| Function | Sender |
|----------|--------|
| `submit-support-ticket` | `NOREPLY@JBJ.AE` ✅ |
| `send-ticket-reply-email` | `NOREPLY@JBJ.AE` ✅ |
| `resend-support-ticket-confirmation` | `NOREPLY@JBJ.AE` ✅ |
| `send-email-otp` | `NOREPLY@JBJ.AE` ✅ |

### Functions Using Incorrect Domains (MUST FIX)

| Function | Current Domain | Issue |
|----------|----------------|-------|
| `send-inquiry-email` | `onboarding@resend.dev` | Resend test domain - not branded |
| `send-market-report-email` | `onboarding@resend.dev` | Resend test domain - not branded |
| `send-welcome-email` | `welcome@jbj.ae` | Not verified in Resend |
| `broker-daily-report` | `reports@JBJ.ae` | Not verified in Resend |

### Functions Using security@jbj.ae for Internal Alerts
These send security alerts to internal staff (not customers) - should standardize to NOREPLY@JBJ.AE:
| Function |
|----------|
| `ai-travel-concierge` |
| `rental-index-analysis` |
| `interior-design-generate` |
| `property-measurement` |
| `validate-discount-code` |
| `property-evaluation` |
| `user-registration` |
| `send-inquiry-email` |
| `send-market-report-email` |
| `compare-projects` |
| `generate-property-report` |

---

## Implementation Plan

### Phase 1: Customer-Facing Email Functions (Critical)

#### 1. `send-inquiry-email/index.ts`
- **Line ~198**: Change `from: "JBJ Global Real Estate <onboarding@resend.dev>"` 
- **To**: `from: "JBJ Global Real Estate <NOREPLY@JBJ.AE>"`
- Add `replyTo: "CONTACT@JBJ.AE"` so customer replies go to contact

#### 2. `send-market-report-email/index.ts`
- **Line ~178**: Change `from: "JBJ Global Real Estate <onboarding@resend.dev>"`
- **To**: `from: "JBJ Global Real Estate <NOREPLY@JBJ.AE>"`
- Add `replyTo: "CONTACT@JBJ.AE"`

#### 3. `send-welcome-email/index.ts`
- **Line ~176**: Change `from: "JBJ Global Real Estate <welcome@jbj.ae>"`
- **To**: `from: "JBJ Global Real Estate <NOREPLY@JBJ.AE>"`

#### 4. `broker-daily-report/index.ts`
- **Line ~344**: Change `from: "JBJ Reports <reports@JBJ.ae>"`
- **To**: `from: "JBJ Reports <NOREPLY@JBJ.AE>"`

---

### Phase 2: Security Alert Functions (Internal)

These functions send security alerts when IPs are auto-blocked. Change all to use `NOREPLY@JBJ.AE`:

| Function | Line | Change From | Change To |
|----------|------|-------------|-----------|
| `ai-travel-concierge` | ~192 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `rental-index-analysis` | ~97 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `interior-design-generate` | ~257 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `property-measurement` | ~257 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `validate-discount-code` | ~201 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `property-evaluation` | ~108 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `user-registration` | ~210 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `send-inquiry-email` | ~112 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `send-market-report-email` | ~101 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `compare-projects` | ~170 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |
| `generate-property-report` | ~99 | `security@jbj.ae` | `NOREPLY@JBJ.AE` |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/send-inquiry-email/index.ts` | Fix both customer email and security alert senders |
| `supabase/functions/send-market-report-email/index.ts` | Fix both customer email and security alert senders |
| `supabase/functions/send-welcome-email/index.ts` | Fix welcome email sender |
| `supabase/functions/broker-daily-report/index.ts` | Fix report email sender |
| `supabase/functions/ai-travel-concierge/index.ts` | Fix security alert sender |
| `supabase/functions/rental-index-analysis/index.ts` | Fix security alert sender |
| `supabase/functions/interior-design-generate/index.ts` | Fix security alert sender |
| `supabase/functions/property-measurement/index.ts` | Fix security alert sender |
| `supabase/functions/validate-discount-code/index.ts` | Fix security alert sender |
| `supabase/functions/property-evaluation/index.ts` | Fix security alert sender |
| `supabase/functions/user-registration/index.ts` | Fix security alert sender |
| `supabase/functions/compare-projects/index.ts` | Fix security alert sender |
| `supabase/functions/generate-property-report/index.ts` | Fix security alert sender |

**Total: 13 files to update**

---

## Technical Standard

All outgoing emails will follow this pattern:
```typescript
const VERIFIED_SENDER = "NOREPLY@JBJ.AE";

// For customer-facing emails
from: `JBJ Global Real Estate <${VERIFIED_SENDER}>`,
replyTo: "CONTACT@JBJ.AE"  // or SUPPORT@JBJ.AE for support emails

// For internal security alerts  
from: `JBJ Security <${VERIFIED_SENDER}>`,
to: ["CONTACT@JBJ.AE"]
```

---

## Deployment

After updating all files, the edge functions will be automatically deployed. This ensures all emails will send successfully from the verified JBJ.AE domain.
