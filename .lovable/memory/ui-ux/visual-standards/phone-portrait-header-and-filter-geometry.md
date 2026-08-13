---
name: Phone Portrait Header & Filter Geometry
description: Phone/tablet-portrait header states (identical in Sun and Moon at page top) and the one-geometry filter segment grid with black CTA ink on champagne.
type: design
---

# Phone / tablet portrait (LOCKED)

## Header
- **Page top — Sun AND Moon are identical**: transparent header, pure white monogram + wordmark + tagline + hamburger bars, one hairline white divider, no highlight/plate behind the wordmark, no emerald circle behind the hamburger.
- **On scroll**: Sun = champagne footer band (black ink, emerald hamburger circle with white bars). Moon = emerald band with pure white identity.
- Band height 74px in both skins.

## Hero filter bar geometry
- Every segment (UAE, Developers, Tiers, Type, Beds, Price, Status, More, currency) uses ONE grid track: `18px | 1fr | 18px` — icon left inset, label centred, chevron right inset. Every field carries an icon so all rows align; all chevrons share the AED inset.
- `sq ft` / `sq m` labels are optically centred on both axes inside their box.
- Sun: the champagne "Show N properties" CTA and active pills read pure black (#1A1A1A). Achieved with specificity, never `data-allow-ink`.
