

## Fix Developer Logo — Remove White Background, Keep Logo Only

### What you want
- No white background behind logos
- Logo displayed at full fit with its original colors (e.g., Bloom in red, not on white)
- Slightly rounded edges on the container
- Applied globally to ALL developer logos across the entire platform

### Change — Single file

**`src/components/ui/DeveloperLogo.tsx`**

Remove `bg-white`, `p-1.5`, and `shadow-md` from the container. Keep `object-contain` so logos are never cropped. Use `rounded-md` for subtle rounding instead of `rounded-xl`.

```tsx
<div className={cn(
  "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center",
  className
)}>
  <img
    src={src}
    alt={alt}
    loading={loading}
    onError={...}
    className="block h-full w-full rounded-md object-contain"
  />
</div>
```

### Result
- Transparent container — no white box behind any logo
- Logos show in their brand colors (Bloom red, Emaar gold, etc.)
- `object-contain` ensures full-fit, no cropping
- Slight `rounded-md` rounding on edges
- Applies everywhere: Handpicked, Continue Searching, Developer Cards, Recommended Developers

