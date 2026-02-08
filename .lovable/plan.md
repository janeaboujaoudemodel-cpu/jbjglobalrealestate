

# Fix: Database Trigger Function for Support Tickets

## Problem Summary

When submitting a new support ticket, the edge function returns a 500 error with:
```
function gen_random_bytes(integer) does not exist
```

The root cause is the `generate_reopen_token()` trigger function, which runs BEFORE INSERT on `support_tickets`. This function calls `gen_random_bytes(32)` but the function is in the `extensions` schema, not `public`.

---

## Current Code (Broken)

```sql
CREATE OR REPLACE FUNCTION public.generate_reopen_token()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'  -- ← Only searches 'public' schema
AS $function$
BEGIN
  IF NEW.reopen_token IS NULL THEN
    NEW.reopen_token := encode(gen_random_bytes(32), 'hex');  -- ← Fails!
  END IF;
  RETURN NEW;
END;
$function$
```

---

## Solution

Update the function to explicitly reference `extensions.gen_random_bytes()`:

```sql
CREATE OR REPLACE FUNCTION public.generate_reopen_token()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reopen_token IS NULL THEN
    NEW.reopen_token := encode(extensions.gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$function$
```

---

## Implementation

| Step | Action |
|------|--------|
| 1 | Run database migration to update `generate_reopen_token()` function |
| 2 | Test by submitting a new support ticket via the edge function |
| 3 | Verify confirmation email is sent from `NOREPLY@JBJ.AE` |

---

## Technical Details

- **Table affected**: `support_tickets`
- **Trigger**: `set_reopen_token` (BEFORE INSERT)
- **Function**: `generate_reopen_token()`
- **Extension**: `pgcrypto` (installed in `extensions` schema)
- **Fix**: Qualify `gen_random_bytes()` with `extensions.` prefix

