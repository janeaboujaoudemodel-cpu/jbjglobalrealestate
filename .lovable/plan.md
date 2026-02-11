

# ProjectCard External Styling Updates

## Changes (single file: `src/components/ProjectCard.tsx`)

### A. Remove gold border from developer logo on external cards (line 197)
- Current: `w-12 h-12 rounded-lg bg-white border-2 border-gold shadow-[0_4px_16px_rgba(200,167,102,0.3)]`
- New: `w-12 h-12 rounded-lg bg-white overflow-hidden` (no border, no gold shadow -- logo sits cleanly)

### B. Make project name gold by default, black on hover (line 291)
- Current: `text-black ... hover:text-gold`
- New: `text-gold ... group-hover:text-black`

### C. Make developer name gold (already gold via DeveloperLink component -- confirmed, no change needed)

### D. Add persistent gold border to the full card (line 172-176)
- Current: `border-2 border-gold/40 ... hover:border-gold/70`
- New: `border-2 border-gold ... hover:border-gold` (full gold border by default, same on hover)

## Summary

| Line | What Changes |
|------|-------------|
| 172-176 | Card border from `border-gold/40` to `border-gold` (always gold) |
| 197 | Developer logo: remove `border-2 border-gold shadow-[...]` |
| 291 | Project name: `text-gold` default, `group-hover:text-black` on hover |

Internal pages (project detail, developer detail) remain untouched.
