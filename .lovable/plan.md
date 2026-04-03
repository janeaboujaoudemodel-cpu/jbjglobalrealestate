

# Security Scan Follow-Up — Fix Remaining Findings

## Current Status

After the previous security scan and migrations, **2 actionable findings remain** plus some low-risk warnings.

## Plan

### 1. Fix SVG XSS in Logo Creator (Critical)

**File:** `src/components/corporate-suite/logoCreatorTypes.tsx`

Add DOMPurify sanitization before rendering SVG content via `dangerouslySetInnerHTML`. The pattern already exists in `StampSVGRenderer.tsx` — apply the same approach:

```typescript
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(svgContent, {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script'],
  FORBID_ATTR: ['onload', 'onerror', 'onclick'],
});
```

### 2. Tighten Session UPDATE Policies (Medium)

**Database migration** to replace permissive UPDATE policies on `user_sessions` and `visitor_sessions` with session-ownership checks. These tables currently allow any user to overwrite any session record.

### 3. Tighten Authenticated INSERT Policies (Low Priority)

For `admin_edit_log`, `best_idea_submissions`, `global_audit_events`, and `suspicious_admin_alerts` — add `user_id = auth.uid()` checks to prevent authenticated users from inserting records attributed to other users.

### 4. Update Security Findings Registry

Delete resolved findings and mark intentional policies as ignored in the security scanner.

---

**Files to modify:** `src/components/corporate-suite/logoCreatorTypes.tsx`, plus 1-2 database migrations

**No breaking changes expected.** All fixes tighten existing access without removing legitimate functionality.

