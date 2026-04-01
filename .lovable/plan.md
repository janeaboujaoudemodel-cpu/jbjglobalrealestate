

## Add White Background to Developer Logo Containers

### What you want
- Transparent logos (e.g., Emaar, DAMAC) get a white square background so they're visible and consistent
- Logos that already have their own colored background (e.g., Bloom's red square) stay the same — the white won't show because the logo image fills the container
- All logos maintain the same size box with rounded edges for visual consistency

### Change — Single file

**`src/components/ui/DeveloperLogo.tsx`**

Add `bg-white` back to the container div. Since the img uses `object-contain` and fills the full container, logos with built-in colored backgrounds (like Bloom) will cover the white completely, while transparent logos will show the white behind them.

```tsx
<div className={cn(
  "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-white",
  className
)}>
```

One line change. Applies globally to all sections: Handpicked For You, Continue Searching, Developer Cards, Recommended Developers.

### Technical note
- `bg-white` is only visible when the logo PNG/WebP has transparency
- Logos with opaque colored backgrounds (Bloom red, etc.) naturally cover the white — no conditional logic needed

