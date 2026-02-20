
# Emoji Removal, Protected Brand Namespace, Logo Kit Downloads & Brand Asset UX

## Scope of Work (Full Audit Results)

### Issue 1 — Emoji Removal Across All Tools

**Files with emojis to fix:**

**`src/components/corporate-suite/LogoCreator.tsx`** (lines 18–27):
- `INDUSTRIES` array: Each industry has an `emoji` field (`🏢`, `💻`, `👗`, `🏥`, `💰`, `👤`, `⚖️`, `🎨`, `🍽️`)
- These are rendered as `<div className="text-xl mb-1">{ind.emoji}</div>` in the button grid
- Fix: Remove `emoji` field from all industry objects, remove the emoji `<div>` from the button, replace with a small lucide icon per industry

**`src/components/corporate-suite/BusinessCardDesigner.tsx`**:
- Line 76: `badge: "✨"` on the AI Design template
- Line 1191: `icon: <span className="text-[10px]">👤</span>` on the Full Name field — replace with a lucide `User` icon
- Lines 1782–1785: Tone selector buttons have `emoji: "⚡"`, `"✦"`, `"◈"`, `"○"` rendered inside buttons
- Lines 1808–1815: Industry labels contain `"🏙 Real Estate"`, `"💻 Technology"`, `"👗 Fashion"`, `"📈 Finance"`, `"⚕ Healthcare"`, `"🎨 Creative"`, `"⚖ Law"`, `"🏨 Hospitality"` — strip the emoji prefix
- Lines 2121–2124: Tips section uses `🎨`, `🖼️`, `📱`, `✨` prefixes — remove all

**`src/components/corporate-suite/CoverLetterGenerator.tsx`**:
- Lines 84–88: `TONES` array has emoji per tone (`🎯`, `💪`, `✨`, `👔`, `😊`)
- Line 632: Renders `{t.emoji}` in tone buttons
- Line 836: "💡 Tips for Best Results" heading uses emoji
- Fix: Remove emoji property, use a lucide icon per tone type, or just text labels

**`src/components/corporate-suite/LandingPageBuilder.tsx`**:
- Lines 68–70: Contact footer preview uses `📞`, `✉`, `📍` inline text
- Lines 136–138: Same emojis in HTML string template for generated page
- Fix: Replace with plain text labels (Phone:, Email:, Address:) both in preview and in generated HTML

**`src/components/corporate-suite/BusinessCardDesigner.tsx`** badge `"✨"` on AI Design template card — replace with text "AI" or a `Sparkles` icon.

---

### Issue 2 — Placeholder "JBJ Global Real Estate" Must Be Replaced

**Files to fix:**
- `src/components/corporate-suite/LogoCreator.tsx` line 271: `placeholder="e.g. JBJ Global Real Estate"` → change to `"e.g. Acme Corporation"`
- `src/components/corporate-suite/CoverLetterGenerator.tsx` line 686: `placeholder="JBJ Global"` → change to `"e.g. Acme Corp"`
- `src/components/corporate-suite/LandingPageBuilder.tsx` line 194: `placeholder="JBJ Global Real Estate"` → change to `"e.g. Acme Corporation"`
- `src/pages/toolkit/BrochureGeneratorPage.tsx` lines 349, 378: `'JBJ Global Real Estate'` hardcoded in the PDF footer — replace with the user's actual `agentProfile.company` or a generic fallback `"Your Company"`
- `src/pages/toolkit/ToolkitLanding.tsx` line 260: disclaimer text mentions "JBJ Global Real Estate" → replace with generic "the platform operator"
- `src/pages/toolkit/RoyalToolsHub.tsx` line 292: same disclaimer → replace the same way

---

### Issue 3 — Protected Brand Namespace (Company Name + Logo Locking)

This is a new backend feature. The concept:
- When a user generates/saves a logo or business card, a fingerprint is stored
- The company name "JBJ Global Real Estate" (and variants) is LOCKED to the Owner only — server-side
- Other users who try to use that name get a clear rejection
- Each generated logo gets a unique license code issued to the generating user
- Users who upload their trade license can claim exclusive ownership of their company name

**Database migration required — new table:**
```sql
CREATE TABLE public.design_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_type text NOT NULL,         -- 'logo', 'business_card', 'stamp'
  company_name text NOT NULL,       -- normalized (lowercase, trimmed)
  license_code text NOT NULL UNIQUE DEFAULT 'LIC-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  trade_license_verified boolean NOT NULL DEFAULT false,
  trade_license_url text,           -- storage path to uploaded proof
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_name, asset_type)  -- one owner per company per asset type
);
ALTER TABLE public.design_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own licenses" ON public.design_licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create licenses" ON public.design_licenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner reads all licenses" ON public.design_licenses FOR SELECT USING (auth.jwt() ->> 'email' = (SELECT value FROM app_settings WHERE key = 'owner_email'));
```

**Protected name enforcement:** A `SECURITY DEFINER` function checks if a company name is already licensed by another user before insert:
```sql
CREATE OR REPLACE FUNCTION public.check_name_available(
  _company_name text, _asset_type text, _requesting_user uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM design_licenses
    WHERE company_name = lower(trim(_company_name))
    AND asset_type = _asset_type
    AND user_id <> _requesting_user
  );
$$;
```

**Owner name hard-lock:** A database trigger blocks any user other than the owner from licensing "JBJ Global Real Estate" or its variants:
```sql
CREATE OR REPLACE FUNCTION public.enforce_owner_brand_protection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  owner_email text;
  requesting_email text;
  protected_names text[] := ARRAY['jbj global real estate','jbj global','jbj','jane bou jaoude'];
BEGIN
  SELECT value INTO owner_email FROM app_settings WHERE key = 'owner_email';
  SELECT auth.jwt() ->> 'email' INTO requesting_email;
  IF lower(trim(NEW.company_name)) = ANY(protected_names) AND requesting_email <> owner_email THEN
    RAISE EXCEPTION 'This company name is protected and reserved for its verified owner.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_owner_brand_protection
BEFORE INSERT ON public.design_licenses
FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_brand_protection();
```

**Frontend changes in `LogoCreator.tsx`:**
1. After logo generation, call `check_name_available` via `supabase.rpc()` before allowing Save
2. If name is taken, show: "This company name already has a registered license. Please verify ownership to proceed."
3. On save success, display the license code prominently: "Your logo is licensed under code: **LIC-XXXXXXXX**"
4. Add a collapsible "Verify Ownership" section with a file upload for trade license (stored in `brand-assets` bucket, path `licenses/{user_id}/`)

---

### Issue 4 — Logo Background Variants Not Clickable

**Current bug:** The three background variant boxes (white, black `#111`, and primary color) display the logo but have no click handler.

**Fix:** Wrap each variant box in a `<button>` that sets a `previewBg` state. The active background gets a ring highlight. This also helps users understand they can view the logo on different backgrounds before downloading.

---

### Issue 5 — "Save to Brand Assets" — User Doesn't Know Where to Find It

**Current behavior:** Save toast says "Saved to Brand Assets! It will appear in the Brand Asset Library." — but the user doesn't know where the Brand Asset Library is.

**Fix:**
1. After successful save, add a navigation link in the toast: use `sonner`'s `action` option:
```typescript
toast.success("Logo saved!", {
  description: "Find it in the Corporate Suite → Brand Assets panel",
  action: { label: "Go there", onClick: () => navigate("/toolkit/corporate-suite") }
});
```
2. In `LogoCreator.tsx`, add a small "View in Brand Assets" link below the "Save to Brand Assets" button (only shown when a logo has been saved in this session), using a `justSaved` state boolean.
3. In `BrandAssetLibrary.tsx`, the grid already shows saved assets — but the panel title should be more visible. No change needed there.

---

### Issue 6 — Download Kit (Not Just SVG/PNG)

**Current:** Only single SVG (vector) and PNG (512px) downloads exist.

**New: "Download Full Kit" feature** — a ZIP package containing:
- `logo-transparent.svg` — SVG on transparent background
- `logo-white-bg.svg` — SVG with white rect background
- `logo-black-bg.svg` — SVG with black rect background
- `logo-512.png` — 512×512 PNG (transparent bg)
- `logo-1024.png` — 1024×1024 PNG
- `logo-256.png` — 256×256 PNG
- `logo-favicon-32.png` — 32×32 PNG (favicon size)

**Implementation:** Use `JSZip` (already installed as `jszip`) to bundle all files into a `.zip` download. PNG generation uses canvas, similar to existing `downloadPNG()`.

The UI change: Replace the current 2-button row (SVG + PNG) with a 3-button row:
- "SVG" (single, transparent)
- "PNG 512px" (single)
- "Download Full Kit" (ZIP with all sizes + all backgrounds)

---

### Issue 7 — Auto-Regenerate on Style/Industry/Font Change

**Current behavior:** User must manually click "Generate Logo" or "Regenerate" every time they change a setting.

**Fix:** Add a `useEffect` that watches `style`, `industry`, `font`, and `colorPreset` changes. If a logo already exists (`logo !== null`), auto-call `generate()` with a debounce of 800ms (to avoid spamming on rapid clicks).

```typescript
useEffect(() => {
  if (!logo || !name.trim()) return;
  const timer = setTimeout(() => generate(), 800);
  return () => clearTimeout(timer);
}, [style, industry, font, colorPreset]);
```

Note: This only fires after the first manual generation. First-time generation always requires the button click (since the user needs to enter a name first).

---

### Issue 8 — Full-Screen Logo Preview (Fullscreen Modal)

**Request:** Click the logo to see it full-screen on different backgrounds, including business card mockup.

**Implementation:** Add a `fullscreenOpen` state. When the main preview area is clicked (or via a maximize button), open a Dialog/modal overlay containing:
- Large logo preview (400×400 centered)
- Background switcher tabs: White / Black / Brand Color / Transparent
- A business card mockup: render the logo centered on a simple 350×200 card shape
- An A4 letterhead mockup: logo in top-left of a white page with the company name and a gold line

Use the existing Radix `Dialog` component from `@radix-ui/react-dialog`.

---

## Summary of All Files Changed

| File | Changes |
|---|---|
| `src/components/corporate-suite/LogoCreator.tsx` | Remove industry emojis; fix placeholder; auto-regenerate on param change; save toast with nav link; download kit with JSZip; fullscreen modal; license check on save; license code display |
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | Remove emojis from industry labels, tone buttons, Full Name icon, AI badge, tips section |
| `src/components/corporate-suite/CoverLetterGenerator.tsx` | Remove emojis from TONES array and tips heading |
| `src/components/corporate-suite/LandingPageBuilder.tsx` | Replace phone/email/address emojis with text labels |
| `src/pages/toolkit/BrochureGeneratorPage.tsx` | Replace hardcoded "JBJ Global Real Estate" in PDF footer with user's company name |
| `src/pages/toolkit/ToolkitLanding.tsx` | Replace "JBJ Global Real Estate" in disclaimer |
| `src/pages/toolkit/RoyalToolsHub.tsx` | Replace "JBJ Global Real Estate" in disclaimer |
| **Database migration** | Create `design_licenses` table, `check_name_available()` RPC function, owner brand protection trigger |

## Implementation Order

1. Database migration — create `design_licenses` table and functions
2. Emoji removal across all 4 files — quick sweep
3. Placeholder fixes (JBJ Global → Acme Corporation)
4. LogoCreator: save toast improvement + "View in Brand Assets" link
5. LogoCreator: download full kit (JSZip)
6. LogoCreator: auto-regenerate on param change
7. LogoCreator: fullscreen preview modal
8. LogoCreator: license check + license code display on save
9. BrochureGeneratorPage: dynamic company name in PDF footer

## What is NOT included (Deferred)

- Trade license upload for brand ownership transfer — this is an operations/verification workflow that needs email verification and manual review; can be a phase 2 feature
- Full gradient/opacity controls per element in Business Card (already deferred from previous plan)
