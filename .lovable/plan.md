

# Wrap Company Profile Video with Founder Visibility Toggle

## What Changes

### 1. CompanyProfile.tsx -- Wrap video section with FounderContent (lines 818-849)

The "Company Introduction Video" section (YouTube embed of `lBXXdJ2kAtQ`) contains footage of the founder. It needs to be wrapped with `<FounderContent>` so it hides when founder visibility is toggled off and shows when toggled on.

**Before:**
```
{/* Company Introduction Video */}
<SectionShell>
  <motion.div ...>
    ...video content...
  </motion.div>
</SectionShell>
```

**After:**
```
<FounderContent>
  {/* Company Introduction Video */}
  <SectionShell>
    <motion.div ...>
      ...video content...
    </motion.div>
  </SectionShell>
</FounderContent>
```

`FounderContent` is already imported in this file -- no new imports needed.

### 2. Digital Business Card -- No changes needed

The Digital Card (`/card`) already has its own Company Introduction video (self-hosted MP4 at `jbj-company-intro.mp4`). Per the project memory, the digital card is permanently accessible and decoupled from the Founder Visibility toggle, so it stays as-is.

## Summary

Only one small edit: wrap lines 818-849 in `CompanyProfile.tsx` with `<FounderContent>`.
