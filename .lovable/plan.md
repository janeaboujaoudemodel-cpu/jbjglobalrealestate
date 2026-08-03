## Change

In `src/pages/Index.tsx` (line 326), the hero search bar wrapper currently uses:

```tsx
<motion.div variants={fadeInUp} className="w-full mt-8 sm:mt-10 md:mt-12 lg:mt-14">
```

Replace the responsive top-margin classes with a single fluid clamp:

```tsx
<motion.div variants={fadeInUp} className="w-full mt-[clamp(2rem,39.4vw,35.4rem)]">
```

This scales the push proportionally with viewport width — 2rem minimum on narrow phones, up to 566.4px (35.4rem) at desktop widths.

## Scope guard

- Only that one `className` on the search wrapper changes.
- No edits to `HomeHeroSearch`, the headline, hero container, or any other spacing/layout.
