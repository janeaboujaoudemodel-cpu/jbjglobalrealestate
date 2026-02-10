

# Fix Project Card "...more" Link Style

## What Changes

**File:** `src/components/ProjectCard.tsx` (line 348-349)

The current "...more" link at the end of the project description has:
- An underline decoration
- A straight right arrow (`→`)

The requested change:
1. **Remove the underline** from the "...more" text
2. **Replace the straight arrow** (`→`) with an "external link" / "open in new window" icon -- a square box with an arrow pointing up-right from its corner (the standard "external link" icon from Lucide: `ExternalLink` or `ArrowUpRight`)

### Current Code (line 348-349)
```tsx
<span className="text-gold font-bold underline hover:text-gold/80 cursor-pointer ml-1 inline-flex items-center gap-0.5">
  ...more →
</span>
```

### Updated Code
```tsx
<span className="text-gold font-bold hover:text-gold/80 cursor-pointer ml-1 inline-flex items-center gap-1">
  ...more
  <ArrowUpRight className="w-3.5 h-3.5" />
</span>
```

- Remove `underline` from the className
- Replace the text arrow `→` with Lucide's `ArrowUpRight` icon (a square-box style arrow pointing to the upper-right corner, like an "open window" icon)
- Add the `ArrowUpRight` import from `lucide-react` at the top of the file

