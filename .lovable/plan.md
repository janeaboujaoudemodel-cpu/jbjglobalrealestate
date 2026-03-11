

## Plan: Fix All Email Issues Across All Templates

### Problems Identified

1. **Recommended For You icons disappeared** — Inline SVGs are stripped by Gmail and most email clients. Must revert to hosted PNG images (`ai-tools.png`, `guides.png`, `properties.png` already exist in `public/email-icons/`).

2. **Social media footer icons not rendering** — Same issue: `socialLinksFooter()` loads external `.svg` files via `<img>` tags, but Gmail blocks SVG images entirely. Must switch to hosted `.png` files. Currently missing `social-facebook.png` — need to confirm or create it.

3. **Email split into multiple visual cards** — Several sub-sections (`ticketSupportEmbed`, `readyToGetStartedHtml`, `recommendedActionsHtml`) each have their own `border`, `border-radius`, and `background` styles creating distinct visual boxes. These need to be softened so they sit seamlessly inside the single continuous card.

### Changes (all in `supabase/functions/_shared/email-html.ts`)

#### A. Recommended For You — Revert to PNG hosted images
- Change `recommendedCard()` back to using `iconImg()` with PNG paths
- Remove the `RECOMMENDED_ICONS` inline SVG object
- Ensure circular frame clips the PNG with `overflow:hidden` on the `<td>` to prevent square backgrounds
- Signature: `recommendedCard(title, href, iconPath, alt)` — restore the original parameters

#### B. Social Footer — Switch to PNG with white pearl background
- Replace `socialLinksFooter()` to use the inline `SVG` object icons (instagram, facebook, linkedin, tiktok, youtube) that are already defined at the top of the file — these render as raw HTML inside `<td>` elements, not as `<img>` tags, so they should survive email client processing
- Actually, since Gmail strips ALL SVG (both inline and `<img>`), switch to using the `.png` files: `social-instagram.png`, `social-linkedin.png`, `social-tiktok.png`, `social-youtube.png`
- Create `social-facebook.png` if missing
- Style each icon circle: white/pearl (#FDFBF7) background, gold border, black icon inside

#### C. Single Card Layout — Remove visual fragmentation
- `ticketSupportEmbed()`: Remove the heavy gradient background and red border; make it blend into the card
- `readyToGetStartedHtml()`: Remove the outer border and separate background so it flows within the card
- `inquiryBox()`: Soften its standalone bordered look
- Keep all content inside the single `emailShell` wrapper card with no sub-borders that create separation

#### D. Deploy + Send Test Email
- Deploy the updated edge function
- Immediately send a test welcome email to `janeaboujaoudenails@gmail.com`
- Take a screenshot as proof

### Files Modified
- `supabase/functions/_shared/email-html.ts` — all icon and layout fixes
- `public/email-icons/social-facebook.png` — create if missing (or use existing assets)

