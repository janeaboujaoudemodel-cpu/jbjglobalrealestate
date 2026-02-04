
# Certificate Enhancement Plan

## Changes Requested

1. **More Champagne-Gold Background with 3D Effect**
   - Update the certificate card gradient to be richer champagne-gold
   - Add 3D shadow effects and inner highlights for premium depth

2. **Replace [AUTO] with Actual Certificate Number**
   - Change `JBJ-CERT-[AUTO]` to `JBJ-CERT-2024-001` (sample number format)

3. **Wrap Founder Name in FounderContent Toggle**
   - The "Jane Bou Jaoude, Founder & CEO" section needs to be wrapped with `FounderContent` component
   - When founder visibility is OFF: Hide this section or show generic fallback
   - When founder visibility is ON: Show the full founder details

---

## Implementation Details

### File: `src/pages/services/BrokerCertification.tsx`

**1. Add Import**
```tsx
import { FounderContent } from "@/components/FounderContent";
```

**2. Update Certificate Card Background (Line 468)**

Current:
```tsx
<Card className="jj-card-inner border-4 border-gold/50 pt-8 bg-gradient-to-br from-[#FDFBF7] via-[#F8F4EC] to-[#F0E8D8] shadow-2xl">
```

New - Richer champagne-gold with 3D styling:
```tsx
<Card 
  className="jj-card-inner border-4 border-gold/60 pt-8 shadow-2xl"
  style={{
    background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 25%, #D4C4A8 50%, #E8DCC8 75%, #F5EBD7 100%)',
    boxShadow: `
      0 25px 50px rgba(200,167,102,0.4),
      0 15px 30px rgba(0,0,0,0.2),
      inset 0 2px 10px rgba(255,255,255,0.9),
      inset 0 -3px 10px rgba(200,167,102,0.25),
      0 0 40px rgba(200,167,102,0.2)
    `,
  }}
>
```

**3. Replace Certificate Number (Line 519)**

Current:
```tsx
Certificate No: <span className="font-mono text-black">JBJ-CERT-[AUTO]</span>
```

New:
```tsx
Certificate No: <span className="font-mono text-black">JBJ-CERT-2024-001</span>
```

**4. Wrap Founder Section in FounderContent (Lines 509-513)**

Current:
```tsx
<div className="text-right">
  <p className="text-black font-semibold">Jane Bou Jaoude</p>
  <p className="text-xs text-muted-foreground">Founder & CEO</p>
  <p className="text-gold italic text-xs mt-1">جاين بو جودة</p>
</div>
```

New - Wrapped with FounderContent:
```tsx
<div className="text-right">
  <FounderContent
    fallback={
      <>
        <p className="text-black font-semibold">JBJ Global Real Estate</p>
        <p className="text-xs text-muted-foreground">Executive Leadership</p>
      </>
    }
  >
    <p className="text-black font-semibold">Jane Bou Jaoude</p>
    <p className="text-xs text-muted-foreground">Founder & CEO</p>
    <p className="text-gold italic text-xs mt-1">جاين بو جودة</p>
  </FounderContent>
</div>
```

---

## Visual Result

The certificate will have:
- Richer champagne-gold gradient background
- Premium 3D depth with multiple shadow layers and inner highlights
- Sample certificate number `JBJ-CERT-2024-001`
- Founder name that respects the admin visibility toggle (hidden when toggle is OFF)

---

## Summary

| Change | Location |
|--------|----------|
| Add FounderContent import | Line 1 imports |
| Rich champagne-gold 3D background | Line 468 |
| Certificate number `2024-001` | Line 519 |
| Founder name wrapped in toggle | Lines 509-513 |
