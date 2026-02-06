# Security Phase 5 Changelog

---

## A) Scope

| Field | Value |
|-------|-------|
| **Phase** | 5 |
| **Level** | Data Sensitivity & Admin Boundaries |
| **Tables** | `hr_candidates`, `chat_conversations` |
| **Note** | Frozen after proof verification. |

---

## B) Changes Applied

### Fix #1: `hr_candidates`

**Migration**: `20260206212609_*.sql`

**Finding Resolved**: `hr_candidates_personal_data` (ERROR)

**Privilege Deltas:**
- `REVOKE ALL ON TABLE public.hr_candidates FROM anon;`
- `REVOKE ALL ON TABLE public.hr_candidates FROM public;`

**Before relacl**: `{postgres=arwdDxtm/postgres,anon=Dxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`

**After relacl**: `{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`

**Result**: Anonymous access now returns `42501 permission denied` for all operations.

---

### Fix #2: `chat_conversations`

**Migration**: `20260206212609_*.sql`

**Finding Resolved**: `chat_conversations_admin_only` (WARN)

**Privilege Deltas:**
- `REVOKE ALL ON TABLE public.chat_conversations FROM anon;`
- `REVOKE ALL ON TABLE public.chat_conversations FROM public;`
- `GRANT INSERT ON TABLE public.chat_conversations TO anon;` (minimal for widget)

**Before relacl**: `{postgres=arwdDxtm/postgres,anon=Dxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`

**After relacl**: `{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres,anon=a/postgres}`

**Policy Consolidation:**
- **Before**: 13 overlapping policies with mixed `{public}` and `{authenticated}` roles
- **After**: 6 clear, non-overlapping policies

| Policy | cmd | roles | Purpose |
|--------|-----|-------|---------|
| `chat_conversations_anon_insert` | INSERT | `{anon}` | Widget: rate-limited, valid email, user_id must be NULL |
| `chat_conversations_authenticated_insert` | INSERT | `{authenticated}` | Logged-in users can create own conversations |
| `chat_conversations_admin_select` | SELECT | `{authenticated}` | Admin/owner/CRM admin can view all |
| `chat_conversations_owner_select` | SELECT | `{authenticated}` | Users can view own (user_id = auth.uid()) |
| `chat_conversations_admin_update` | UPDATE | `{authenticated}` | Admin/owner/CRM admin only |
| `chat_conversations_owner_delete` | DELETE | `{authenticated}` | Owner role only |

**Result**: 
- Anonymous SELECT/UPDATE/DELETE return `42501 permission denied`
- Anonymous INSERT succeeds (widget use case) with rate limiting and validation

---

## C) Verification (Proof Function)

| Edge Function | Result |
|---------------|--------|
| `rls-proof-phase5-hr-chat` | ✅ All tests passed |

### Test Results

#### hr_candidates
| Test | Result | Expected |
|------|--------|----------|
| 1A: Anon SELECT | `42501 permission denied` | ✅ |
| 1B: Anon INSERT | `42501 permission denied` | ✅ |

#### chat_conversations
| Test | Result | Expected |
|------|--------|----------|
| 2A: Anon SELECT | `42501 permission denied` | ✅ |
| 2B: Anon INSERT | `insertSucceeded: true` | ✅ (widget use case) |
| 2C: Anon UPDATE | `42501 permission denied` | ✅ |
| 2D: Anon DELETE | `42501 permission denied` | ✅ |

---

## D) Security Findings Updated

| Finding ID | Scanner | Status |
|------------|---------|--------|
| `hr_candidates_personal_data` | supabase_lov | ✅ Marked ignored (fixed) |
| `chat_conversations_admin_only` | supabase_lov | ✅ Marked ignored (fixed) |

---

## E) Artifacts

| Migration File | Purpose |
|----------------|---------|
| `20260206212609_*.sql` | hr_candidates + chat_conversations privilege + policy hardening |

| Edge Function | Purpose |
|---------------|---------|
| `rls-proof-phase5-hr-chat` | Proof: Phase 5 hardening verification |

---

## F) Status

**Phase 5 Complete** — Both active findings resolved and verified.

- `hr_candidates`: Anonymous access blocked at privilege layer
- `chat_conversations`: Consolidated to 6 policies, minimal anon privileges (INSERT only)
- All proof tests passed
