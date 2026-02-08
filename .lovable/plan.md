
# Fix Owner Access & Podcast Visibility Issues

## Root Cause Analysis

I found **TWO critical configuration issues** preventing your Owner access:

### Issue 1: Missing VITE_OWNER_EMAIL in .env File

The `.env` file currently contains ONLY:
```
VITE_SUPABASE_PROJECT_ID="mdafrewypkkrildjgtey"
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="https://mdafrewypkkrildjgtey.supabase.co"
```

**`VITE_OWNER_EMAIL` is NOT present!**

The AuthContext checks:
```typescript
const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL;
// ... later ...
if (nextSession?.user?.email && OWNER_EMAIL) {
  setIsOwner(userEmail === ownerEmail);
} else {
  setIsOwner(false);  // ← This is happening because OWNER_EMAIL is undefined
}
```

Without `VITE_OWNER_EMAIL` in the .env file, the frontend cannot recognize you as the Owner, so `isOwner` is always `false`.

### Issue 2: Podcast Visibility Set to FALSE

The database shows:
```
podcast_visibility: { enabled: false }
```

The `PodcastVisibilityGate` component should still show the podcast for the Owner:
```typescript
if (isOwner) {
  return <>{children}</>;  // Owner always sees podcast
}
```

But because of Issue 1, `isOwner` is `false`, so you're treated as a visitor, and the podcast is hidden since `enabled: false`.

---

## Solution

### Step 1: Add VITE_OWNER_EMAIL to .env File

Add your email to the `.env` file:

```
VITE_SUPABASE_PROJECT_ID="mdafrewypkkrildjgtey"
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="https://mdafrewypkkrildjgtey.supabase.co"
VITE_OWNER_EMAIL="janeaboujaoudenails@gmail.com"
```

**Note**: Vite requires frontend environment variables to start with `VITE_` to be exposed to the browser. The secret `VITE_OWNER_EMAIL` exists in Lovable Cloud secrets (for edge functions), but it also needs to be in `.env` for the frontend React code.

### Step 2: Verify Owner Recognition

After adding to .env:
1. The AuthContext will read `VITE_OWNER_EMAIL = "janeaboujaoudenails@gmail.com"`
2. When you log in with `janeaboujaoudenails@gmail.com`, the comparison will match
3. `isOwner` will be set to `true`
4. `PodcastVisibilityGate` will show the podcast section for you
5. All Owner-guarded routes will work

---

## Files to Modify

| File | Change |
|------|--------|
| `.env` | Add `VITE_OWNER_EMAIL="janeaboujaoudenails@gmail.com"` |

---

## After Implementation

Once the .env is updated:
- Owner access will work correctly
- Podcast section will show on homepage (for you only, since `enabled: false` in database)
- All /owner/* routes will be accessible
- The "You don't have owner access" error will be resolved

---

## Technical Notes

- The `.env` file is auto-managed by Lovable Cloud for Supabase variables
- Custom frontend variables like `VITE_OWNER_EMAIL` need to be manually added
- Backend edge functions can access secrets via `Deno.env.get("OWNER_EMAIL")`
- Frontend React code can only access variables prefixed with `VITE_` from `.env`
