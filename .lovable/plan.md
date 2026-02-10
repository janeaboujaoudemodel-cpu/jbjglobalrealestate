
# Fix Digital Business Card Route (/card)

## Problem

The digital business card at `jbj.ae/card` redirects to the homepage because it is tied to the "Founder Visibility" toggle, which is currently set to `false`. Line 219 of `DigitalCard.tsx` does:

```typescript
if (!isFounderVisible) return <Navigate to="/" replace />;
```

This means whenever founder visibility is OFF, the card becomes inaccessible -- breaking QR code scans and direct links.

## Solution

Remove the founder visibility dependency from the digital card page. The card should **always** be accessible regardless of the founder visibility setting.

**File: `src/pages/DigitalCard.tsx`**

1. Remove the `useFounderVisibility` import and hook call (line 3, line 153)
2. Remove the redirect logic on line 219: `if (!isFounderVisible) return <Navigate to="/" replace />;`
3. Remove the `isFounderVisible` guard on line 161 inside the `useEffect`
4. Keep all other functionality (meta tags, video, contact info, share/download) intact

This is a ~5 line deletion with no other files affected. The `/card` route will work for anyone with the link or QR code, as it did before.

## Files to Modify

| File | Change |
|---|---|
| `src/pages/DigitalCard.tsx` | Remove founder visibility check and redirect |

## Memory Update

The project memory note `features/digital-card/master-spec-v2` documents the redirect behavior. After this fix, the card will no longer redirect when founder visibility is off.
